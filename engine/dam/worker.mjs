// Worker — the pipeline as a set of small idempotent jobs over a durable queue:
//   discover (per source)  → probe (per asset) → analyze (per asset, paid) → embed (per asset, paid)
// plus a longpoll watcher that turns Dropbox changes into discover jobs, and periodic ugc-profile
// and link-kg jobs. Nothing paid runs unless config.approved is true and the spend cap allows it.
import fs from "node:fs";
import path from "node:path";
import { loadGraph, resolveBrand } from "../knowledge/graph.mjs";
import { damConfig, DEFAULT_SCOPES, estimateUsd, brandForPath } from "./config.mjs";
import { DamDb } from "./db.mjs";
import { DropboxClient, DropboxApiError } from "./dropbox.mjs";
import { analyzeImageFile, analyzeVideoFile, analyzeVideoLight, brandCards, shotsFromMeasured } from "./analyze.mjs";
import { makeThumb, makeVideoProxy, probeFile, ratioLabel } from "./probe.mjs";
import { embed } from "./providers/embed.mjs";
import { ProxyStore } from "./storage.mjs";
import { dropboxEntryToDiscovery, materialize, walkLocal, relativeToRoot } from "./sources.mjs";
import { isAnalyzableKind } from "./taxonomy.mjs";
import { isRenderCandidate, renderPathFacts, brandForSource } from "./product-refs.mjs";
import { sleep } from "../core/http.mjs";

export class DamWorker {
  constructor(root, { config = damConfig(root), log = (...args) => console.error("[dam]", ...args), db = null, dropbox = null, graph = null, sleepImpl = sleep } = {}) {
    this.root = root;
    this.config = config;
    this.log = log;
    this.db = db || new DamDb(config.databaseUrl);
    this.graph = graph || loadGraph(root);
    this.cards = brandCards(root, this.graph);
    this.store = new ProxyStore({ ...config.storage, localRoot: config.workDir });
    this.dropbox = dropbox;
    this.stopped = false;
    this.lastProgressAt = Date.now();
    this.sleep = sleepImpl;
    fs.mkdirSync(config.workDir, { recursive: true });
  }

  dbx() {
    if (!this.dropbox) this.dropbox = DropboxClient.fromEnv();
    return this.dropbox;
  }

  brandName(brandId) { return this.graph.nodes.find((node) => node.id === brandId)?.name || brandId; }

  // ---------- sources ----------
  async registerDefaultScopes() {
    // ensureSource, not upsertSource: a hosted restart must not revert a root discover re-resolved or re-enable
    // a source it disabled (root missing) — that is how 1,706 dead discover jobs piled up.
    for (const scope of DEFAULT_SCOPES) await this.db.ensureSource({ id: scope.id, kind: "dropbox", root: scope.root, brandHint: scope.brand });
    return this.db.listSources();
  }

  async addLocalSource(id, directory, brandHint = null) {
    const absolute = path.resolve(directory);
    if (!fs.existsSync(absolute)) throw new Error(`directory not found: ${absolute}`);
    const brandNode = brandHint ? resolveBrand(this.graph, brandHint) : null;
    return this.db.upsertSource({ id, kind: "local", root: absolute, brandHint: brandNode?.id || null });
  }

  async addDropboxSource(id, dropboxPath, brandHint = null) {
    const brandNode = brandHint ? resolveBrand(this.graph, brandHint) : null;
    return this.db.upsertSource({ id, kind: "dropbox", root: dropboxPath.replace(/\/+$/, ""), brandHint: brandNode?.id || null });
  }

  // ---------- discover ----------
  /**
   * Walk a source (full, or incremental from its cursor) and upsert every media file; queue probes.
   *
   * Recovery, so a source never produces dead jobs forever:
   *  - an invalid cursor (`reset`) or a cursor whose root vanished (`path/not_found` on list_folder/continue)
   *    drops the cursor and lists the root from scratch;
   *  - a COMPLETE full listing tombstones every asset it did not see (deleted-file reconciliation without a
   *    cursor's delete entries);
   *  - a root that no longer exists is re-resolved (renamed in place, case/punctuation-insensitive, or moved:
   *    Dropbox search by its name); a unique match outside every other source becomes the new root, else the
   *    source is disabled with last_error "root missing: …" and its files are tombstoned.
   */
  async discover(sourceId, { full = false } = {}) {
    let source = await this.db.getSource(sourceId);
    if (!source) throw new Error(`unknown source ${sourceId}`);
    if (!source.enabled) { this.log(`discover ${source.id}: source disabled (${source.last_error || "no reason recorded"}); skipped`); return { skipped: "source disabled", lastError: source.last_error || null }; }
    const counts = { seen: 0, new: 0, changed: 0, deleted: 0, queued: 0 };
    let buffer = [];
    let deleted = [];
    let seen = new Set();
    const flush = async () => {
      if (deleted.length) { await this.db.markDeletedBatch(source.id, deleted.splice(0)); }
      if (!buffer.length) return;
      const chunk = buffer.splice(0, buffer.length);
      const rows = await this.db.upsertDiscoveredBatch(source.id, chunk.map((item) => ({ externalId: item.externalId || null, relativePath: item.path, name: item.name, extension: path.extname(item.name).slice(1).toLowerCase(), kind: item.kind, bytes: item.bytes, modifiedAt: item.modifiedAt, contentHashHint: item.contentHashHint || null, media: item.media || null, brand: brandForPath(source, item.path) })));
      const images = [];
      const videos = [];
      const candidates = [];
      for (const row of rows) {
        if (row.inserted) counts.new += 1; else if (row.status === "discovered" && isAnalyzableKind(row.kind)) counts.changed += 1;
        if (row.status === "discovered" && isAnalyzableKind(row.kind, row.path.split(".").pop())) {
          if (row.kind === "image" && isRenderCandidate(row.path)) candidates.push(row); else (row.kind === "video" ? videos : images).push(row.id);
        }
      }
      // Product renders are the priority: flag them at discovery so every later stage puts them first.
      if (candidates.length) {
        await this.db.query("update dam.assets a set flags = a.flags || t.f::jsonb from unnest($1::uuid[], $2::text[]) as t(id, f) where a.id = t.id", [candidates.map((row) => row.id), candidates.map((row) => JSON.stringify({ candidate: "product-ref", render: renderPathFacts(row.path), brand_hint: brandForPath(source, row.path) || brandForSource(source) }))]);
        counts.candidates = (counts.candidates || 0) + candidates.length;
      }
      // New uploads found by an incremental (cursor) scan jump the backfill queue: the library is live.
      const live = source.kind === "dropbox" && Boolean(source.cursor) && !full;
      counts.queued += await this.db.enqueueBatch("probe", source.id, candidates.map((row) => row.id), live ? 1 : 20);
      counts.queued += await this.db.enqueueBatch("probe", source.id, images, live ? 5 : 50);
      counts.queued += await this.db.enqueueBatch("probe", source.id, videos, live ? 6 : 60);
    };
    const handle = async (item) => {
      if (!item) return;
      if (item.type === "deleted") { deleted.push(item.path); counts.deleted += 1; return; }
      counts.seen += 1;
      buffer.push(item);
      if (buffer.length >= 200) await flush();
    };
    if (source.kind === "local") {
      for (const item of walkLocal(source.root)) { seen.add(item.path); await handle(item); }
      await flush();
      counts.reconciled = await this.db.reconcileDeleted(source.id, seen);
      await this.db.setSourceCursor(source.id, null);
      this.log(`discover ${source.id}: ${JSON.stringify(counts)}`);
      return counts;
    }

    const dbx = this.dbx();
    /** One walk. A full walk (no cursor) records every listed path and reconciles deletions at the end. */
    const walk = async (cursor) => {
      const isFull = !cursor;
      buffer = []; deleted = []; seen = new Set();
      for await (const entry of dbx.walk({ path: source.root, cursor })) {
        if (entry.type === "cursor") { await flush(); await this.db.setSourceCursor(source.id, entry.cursor); source.cursor = entry.cursor; this.log(`discover ${source.id}: ${counts.seen} seen so far`); continue; }
        if (isFull && entry.type === "file") seen.add(relativeToRoot(entry.path, source.root));
        await handle(dropboxEntryToDiscovery(entry, source.root));
      }
      await flush();
      if (isFull) counts.reconciled = await this.db.reconcileDeleted(source.id, seen);
    };
    const relist = async () => {
      try { await walk(undefined); return true; }
      catch (error) {
        if (!(error instanceof DropboxApiError && error.notFound)) throw error;
        // The root itself is gone: renamed or moved by the team.
        const resolved = await this.resolveRoot(source);
        if (resolved.root) {
          const note = `root moved: ${source.root} → ${resolved.root} (re-resolved ${new Date().toISOString().slice(0, 10)})`;
          this.log(`discover ${source.id}: ${note}`);
          source = await this.db.moveSourceRoot(source.id, resolved.root, note);
          counts.rootMovedTo = resolved.root;
          await walk(undefined);
          await this.db.setSourceError(source.id, note); // keep the note visible after setSourceCursor cleared it
          return true;
        }
        const where = resolved.coveredBy.length ? `; it now lives at ${resolved.coveredBy.map((hit) => `${hit.path} (already covered by ${hit.source})`).join(", ")}` : resolved.candidates.length ? `; ambiguous matches: ${resolved.candidates.slice(0, 5).join(", ")}` : "; no folder with that name exists any more";
        const message = `root missing: ${source.root}${where}. Source disabled; fix with: npm run content -- dam add-source ${source.id} --dropbox "<new root>"`;
        this.log(`discover ${source.id}: ${message}`);
        counts.tombstoned = await this.db.reconcileDeleted(source.id, []);
        await this.db.disableSource(source.id, message);
        counts.disabled = message;
        return false;
      }
    };
    const startCursor = full ? undefined : source.cursor || undefined;
    if (!startCursor) await relist();
    else {
      try { await walk(startCursor); }
      catch (error) {
        if (!(error instanceof DropboxApiError && (error.reset || error.notFound))) throw error;
        const reason = `cursor invalid (${error.summary || error.status}); listing the root again`;
        this.log(`discover ${source.id}: ${reason}`);
        await this.db.clearSourceCursor(source.id, reason);
        source.cursor = null;
        counts.cursorReset = error.summary || String(error.status);
        await relist();
      }
    }
    this.log(`discover ${source.id}: ${JSON.stringify(counts)}`);
    return counts;
  }

  /**
   * Find where a vanished Dropbox root went. Candidates: a folder in the same parent with the same name
   * ignoring case and punctuation (renamed in place), else Dropbox search hits with that name (moved).
   * A candidate inside (or containing) another enabled source's root is already covered and is not adopted.
   */
  async resolveRoot(source) {
    const dbx = this.dbx();
    const root = String(source.root).replace(/\/+$/, "");
    const name = root.split("/").pop();
    const parent = root.slice(0, root.length - name.length).replace(/\/+$/, "") || "/";
    const key = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
    const candidates = new Set();
    try { for (const child of await dbx.children(parent)) if (key(child.name) === key(name)) candidates.add(child.path); }
    catch (error) { if (!(error instanceof DropboxApiError && error.notFound)) throw error; }
    if (!candidates.size) for (const hit of await dbx.searchFolders(name)) if (key(hit.name) === key(name)) candidates.add(hit.path);
    const others = (await this.db.listSources()).filter((other) => other.id !== source.id && other.kind === "dropbox" && other.enabled);
    const inside = (child, ancestor) => { const a = String(ancestor).toLowerCase().replace(/\/+$/, ""); const c = String(child).toLowerCase(); return c === a || c.startsWith(`${a}/`); };
    const coveredBy = [];
    const free = [];
    for (const candidate of candidates) {
      const owner = others.find((other) => inside(candidate, other.root) || inside(other.root, candidate));
      if (owner) coveredBy.push({ path: candidate, source: owner.id }); else free.push(candidate);
    }
    return { root: free.length === 1 ? free[0] : null, candidates: [...candidates], coveredBy };
  }

  /** Queue a discover unless one is already pending or running for the source (never pile them up). */
  async enqueueDiscover(sourceId, { full = false, reason = null, priority = 10 } = {}) {
    if (await this.db.hasOpenDiscover(sourceId)) return null;
    return this.db.enqueue("discover", { sourceId, payload: { ...(full ? { full: true } : {}), ...(reason ? { reason } : {}) }, priority });
  }

  // ---------- probe ----------
  /**
   * Dropbox files are probed WITHOUT downloading the original: Dropbox's media_info gives dimensions and
   * duration, its 1024px thumbnail gives the perceptual hash, colours and our thumb, and its content_hash
   * stands in for sha256 (deterministic per content). The original is fetched once, at analyze time.
   */
  async probeRemote(asset, source) {
    const dbx = this.dbx();
    const dropboxPath = `${source.root}/${asset.path}`;
    const media = asset.flags?.media || null;
    const stem = (asset.flags?.source_hash || asset.id).slice(0, 16);
    let thumbPath = null;
    try {
      const jpeg = await dbx.thumbnail(dropboxPath, "w1024h768");
      thumbPath = path.join(this.config.workDir, "probe", `${stem}_dbx.jpg`);
      fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
      fs.writeFileSync(thumbPath, jpeg);
    } catch (error) {
      this.log(`no Dropbox thumbnail for ${asset.path} (${error.message.slice(0, 80)}); will probe from the original at analyze time`);
    }
    let phash = null; let colors = null; let thumbDims = null;
    if (thumbPath) {
      const { default: sharp } = await import("sharp");
      const { perceptualHash, dominantColors } = await import("./probe.mjs");
      const image = sharp(thumbPath);
      const meta = await image.metadata();
      thumbDims = { width: meta.width, height: meta.height };
      [phash, colors] = await Promise.all([perceptualHash(image), dominantColors(image)]);
    }
    const width = media?.width || null;
    const height = media?.height || null;
    const probe = {
      contentHash: asset.flags?.source_hash || null, phash, dominantColors: colors,
      width, height, orientation: width && height ? ratioLabel(width, height) : (thumbDims ? ratioLabel(thumbDims.width, thumbDims.height) : null),
      durationS: media?.durationS || null, hasAudio: asset.kind === "video" ? null : null, hasAlpha: null, fps: null,
      mime: mimeFor(asset.extension), probeMode: "remote",
    };
    await this.db.saveProbe(asset.id, probe);
    await this.db.query("update dam.assets set flags = flags || '{\"probe_mode\":\"remote\"}'::jsonb where id = $1", [asset.id]);
    const exact = probe.contentHash ? await this.db.findByHash(probe.contentHash, asset.id) : null;
    if (exact) await this.db.setDuplicate(asset.id, exact.id);
    else if (phash) {
      const near = await this.db.findNearPhash(phash, asset.id, 4);
      if (near.length) await this.db.query("update dam.assets set flags = flags || jsonb_build_object('near_duplicates', $2::jsonb) where id = $1", [asset.id, JSON.stringify(near.map((row) => ({ id: row.id, path: row.path, distance: Number(row.distance) })))]);
    }
    if (thumbPath) {
      try {
        const thumb = await makeThumb(thumbPath, path.join(this.config.workDir, "thumbs", `${stem}.jpg`), this.config.thumbWidth);
        await this.db.saveProxies(asset.id, { thumb: await this.store.put(thumb, `thumbs/${stem}.jpg`) });
      } catch (error) { this.log(`thumb failed for ${asset.path}: ${error.message}`); }
    }
    if (!exact) await this.enqueuePaid("analyze", asset, source);
    else await this.db.setStatus(asset.id, "skipped", `duplicate of ${exact.path}`);
    return { ok: true, duplicate: Boolean(exact), remote: true };
  }

  async probe(assetId) {
    const asset = await this.db.getAsset(assetId);
    const source = await this.db.getSource(asset.source_id);
    if (source.kind === "dropbox") return this.probeRemote(asset, source);
    const { localPath, cleanup } = await materialize({ source, asset, dropbox: source.kind === "dropbox" ? this.dbx() : null, workDir: this.config.workDir, maxBytes: asset.kind === "video" ? this.config.maxVideoBytes : this.config.maxImageBytes });
    try {
      const probe = await probeFile(localPath, this.config.workDir);
      await this.db.saveProbe(assetId, { ...probe, mime: mimeFor(asset.extension) });
      if (probe.error) return { ok: false, error: probe.error };
      // exact + near duplicates
      const exact = probe.contentHash ? await this.db.findByHash(probe.contentHash, assetId) : null;
      if (exact) await this.db.setDuplicate(assetId, exact.id);
      else if (probe.phash) {
        const near = await this.db.findNearPhash(probe.phash, assetId, 4);
        if (near.length) await this.db.query("update dam.assets set flags = flags || jsonb_build_object('near_duplicates', $2::jsonb) where id = $1", [assetId, JSON.stringify(near.map((row) => ({ id: row.id, path: row.path, distance: Number(row.distance) })))]);
      }
      // proxies: thumb for both; a short preview for video
      const stem = probe.contentHash.slice(0, 16);
      const proxies = {};
      const thumbSource = asset.kind === "video" ? probe.firstFrame : asset.kind === "document" ? probe.pdfRender : localPath;
      if (thumbSource) {
        try {
          const thumb = await makeThumb(thumbSource, path.join(this.config.workDir, "thumbs", `${stem}.jpg`), this.config.thumbWidth);
          proxies.thumb = await this.store.put(thumb, `thumbs/${stem}.jpg`);
        } catch (error) { this.log(`thumb failed for ${asset.path}: ${error.message}`); }
      }
      if (asset.kind === "video" && probe.durationS) {
        try {
          const preview = await makeVideoProxy(localPath, path.join(this.config.workDir, "previews", `${stem}.mp4`), { height: this.config.proxyHeight, maxSeconds: 90 });
          proxies.preview = await this.store.put(preview, `previews/${stem}.mp4`, "video/mp4");
        } catch (error) { this.log(`preview failed for ${asset.path}: ${error.message}`); }
      }
      await this.db.saveProxies(assetId, proxies);
      // keep the fetched original around for the analyze stage when it is a Dropbox file
      if (source.kind === "dropbox") await this.db.saveProxies(assetId, { fetched: localPath });
      if (!exact) await this.enqueuePaid("analyze", asset, source);
      else await this.db.setStatus(assetId, "skipped", `duplicate of ${exact.path}`);
      return { ok: true, duplicate: Boolean(exact) };
    } finally {
      if (source.kind !== "dropbox") cleanup();
    }
  }

  /** Paid stages queue behind the product-render candidates: they run first and carry the auto tag. */
  async enqueuePaid(kind, asset, source) {
    const candidate = asset.flags?.candidate === "product-ref";
    const priority = candidate ? 0 : kind === "embed" ? 90 : asset.kind === "image" ? 70 : 80;
    await this.db.enqueue(kind, { assetId: asset.id, sourceId: source.id, priority, payload: candidate ? { auto: "product-ref" } : {} });
  }

  // ---------- analyze (paid) ----------
  async guardSpend(estimateUsdNext, { auto = null } = {}) {
    if (!this.config.approved) {
      if (!(auto && this.config.autoProductRefs)) throw new SpendNotApproved("Paid analysis is locked. Set DAM_APPROVED=1 (or pass --approve) after confirming scope and cost.");
      const spentAuto = await this.db.spendSince(24);
      if (spentAuto + estimateUsdNext > this.config.autoCapUsd) throw new SpendCapReached(`auto-intake 24h spend ${spentAuto.toFixed(2)} + ${estimateUsdNext.toFixed(3)} would pass the ${this.config.autoCapUsd} USD auto cap (DAM_AUTO_CAP_USD).`);
      return;
    }
    const spent = await this.db.spendSince(24);
    if (spent + estimateUsdNext > this.config.spendCapUsd) throw new SpendCapReached(`24h spend ${spent.toFixed(2)} + ${estimateUsdNext.toFixed(3)} would pass the ${this.config.spendCapUsd} USD cap.`);
  }

  async analyze(assetId, { auto = null } = {}) {
    const asset = await this.db.getAsset(assetId);
    const source = await this.db.getSource(asset.source_id);
    await this.guardSpend(estimateUsd(this.config.vision.model, asset.kind === "video" ? "vision-video" : "vision-image"), { auto });
    const oversize = asset.kind === "video" && source.kind === "dropbox" && Number(asset.bytes) > this.config.maxVideoBytes;
    if (oversize) return this.analyzeLight(asset, source);
    let localPath = asset.proxies?.fetched && fs.existsSync(asset.proxies.fetched) ? asset.proxies.fetched : null;
    let cleanup = () => {};
    if (!localPath) ({ localPath, cleanup } = await materialize({ source, asset, dropbox: source.kind === "dropbox" ? this.dbx() : null, workDir: this.config.workDir, maxBytes: asset.kind === "video" ? this.config.maxVideoBytes : this.config.maxImageBytes }));
    let probe = { contentHash: asset.content_hash, width: asset.width, height: asset.height, hasAlpha: asset.has_alpha, orientation: asset.orientation, durationS: asset.duration_s, hasAudio: asset.has_audio, fps: asset.fps, format: asset.extension };
    if (asset.flags?.probe_mode === "remote" || !probe.contentHash || (asset.kind === "video" && probe.hasAudio === null)) {
      // Remote-probed: now that the original is here, take the real measurements once and keep them.
      const full = await probeFile(localPath, this.config.workDir);
      if (!full.error) {
        probe = { ...probe, ...full, contentHash: full.contentHash };
        await this.db.saveProbe(assetId, { ...full, mime: mimeFor(asset.extension) });
        await this.db.query("update dam.assets set status = 'probed', flags = flags - 'probe_mode' where id = $1", [assetId]);
        if (asset.kind === "video" && full.durationS) {
          try {
            const stem = full.contentHash.slice(0, 16);
            const preview = await makeVideoProxy(localPath, path.join(this.config.workDir, "previews", `${stem}.mp4`), { height: this.config.proxyHeight, maxSeconds: 90 });
            await this.db.saveProxies(assetId, { preview: await this.store.put(preview, `previews/${stem}.mp4`, "video/mp4") });
          } catch (error) { this.log(`preview failed for ${asset.path}: ${error.message}`); }
        }
      }
    }
    const brandHint = source.brand_hint;
    const common = { filePath: localPath, relativePath: `${source.kind === "dropbox" ? source.root : path.basename(source.root)}/${asset.path}`, probe, brandHint, cards: this.cards, config: this.config, workDir: this.config.workDir, brandName: brandHint ? this.brandName(brandHint) : null };
    try {
      if (asset.kind === "image" || (asset.kind === "document" && asset.extension === "pdf")) {
        if (asset.kind === "document") {
          const { renderPdfFirstPage } = await import("./probe.mjs");
          const rendered = await renderPdfFirstPage(localPath, path.join(this.config.workDir, "pdf", `${(asset.content_hash || asset.id).slice(0, 16)}.jpg`));
          if (!rendered) throw new Error("pdf render failed (needs pdftoppm or sips)");
          common.filePath = rendered;
          common.relativePath = `${common.relativePath} (PDF page 1 of a print/label file)`;
        }
        const result = await analyzeImageFile(common);
        await this.db.recordSpend({ assetId, provider: result.analyzer.vision.provider, model: result.analyzer.vision.model, kind: "vision", usd: result.usd, tokensIn: result.usage?.tokensIn, tokensOut: result.usage?.tokensOut });
        await this.db.saveAnalysis(assetId, { record: result.record, analyzer: result.analyzer, searchDoc: result.searchDoc, ocrText: result.ocrText, subclass: result.record.subclass || null });
        await this.db.saveProxies(assetId, { model: await this.store.put(result.modelImage, `model/${probe.contentHash.slice(0, 16)}.jpg`) });
      } else if (asset.kind === "video") {
        const result = await analyzeVideoFile({ ...common, onSpend: (spend) => this.db.recordSpend({ assetId, ...spend }) });
        await this.db.saveAnalysis(assetId, { record: result.record, analyzer: result.analyzer, searchDoc: result.searchDoc, ocrText: result.ocrText, subclass: result.record.form });
        const keyframes = [];
        for (const frame of result.frames) keyframes.push({ t: frame.t, url: await this.store.put(frame.path, `frames/${probe.contentHash.slice(0, 16)}/${path.basename(frame.path)}`) });
        const sheet = result.sheet ? await this.store.put(result.sheet, `sheets/${probe.contentHash.slice(0, 16)}.jpg`) : null;
        await this.db.saveVideoAnalysis(assetId, { schemaVersion: result.analyzer.schema_version, measured: result.measured, transcript: result.transcript, read: result.record, keyframes });
        await this.db.saveProxies(assetId, { contact: sheet, keyframes });
        await this.db.saveShots(assetId, shotsFromMeasured(result.measured, result.frames).map((shot) => ({ ...shot, keyframe: keyframes.find((frame) => frame.t >= shot.start && frame.t < shot.end)?.url || null })));
      } else {
        await this.db.setStatus(assetId, "skipped", `kind ${asset.kind} is not analysed yet`);
        return { ok: true, skipped: true };
      }
      await this.enqueuePaid("embed", asset, source);
      return { ok: true };
    } finally {
      cleanup();
    }
  }

  /** Oversize Dropbox video: keyframes via ranged seeks on a temporary link; no full download. */
  async analyzeLight(asset, source) {
    const url = await this.dbx().temporaryLink(`${source.root}/${asset.path}`);
    const media = asset.flags?.media || {};
    const probe = { contentHash: asset.content_hash || asset.flags?.source_hash || null, width: asset.width || media.width || null, height: asset.height || media.height || null, durationS: asset.duration_s || media.durationS || null, orientation: asset.orientation, hasAudio: null, fps: null, format: asset.extension };
    const brandHint = source.brand_hint;
    const result = await analyzeVideoLight({ url, relativePath: `${source.root}/${asset.path}`, probe, brandHint, cards: this.cards, config: this.config, workDir: this.config.workDir, brandName: brandHint ? this.brandName(brandHint) : null, onSpend: (spend) => this.db.recordSpend({ assetId: asset.id, ...spend }) });
    await this.db.saveAnalysis(asset.id, { record: result.record, analyzer: result.analyzer, searchDoc: result.searchDoc, ocrText: result.ocrText, subclass: result.record.form });
    const stem = (probe.contentHash || asset.id).slice(0, 16);
    const keyframes = [];
    for (const frame of result.frames) keyframes.push({ t: frame.t, url: await this.store.put(frame.path, `frames/${stem}/${path.basename(frame.path)}`) });
    const sheet = result.sheet ? await this.store.put(result.sheet, `sheets/${stem}.jpg`) : null;
    await this.db.saveVideoAnalysis(asset.id, { schemaVersion: result.analyzer.schema_version, measured: result.measured, transcript: null, read: result.record, keyframes });
    await this.db.saveProxies(asset.id, { contact: sheet, keyframes });
    await this.db.query("update dam.assets set flags = flags || '{\"analysis_depth\":\"light\"}'::jsonb where id = $1", [asset.id]);
    await this.enqueuePaid("embed", asset, source);
    return { ok: true, light: true };
  }

  // ---------- embed (paid, cheap) ----------
  async embedAsset(assetId, { auto = null } = {}) {
    const asset = await this.db.getAsset(assetId);
    if (!asset.search_doc) throw new Error("asset has no search document yet");
    await this.guardSpend(estimateUsd(this.config.embed.model, "embed", 2), { auto });
    const visualSource = asset.proxies?.model || asset.proxies?.contact || asset.proxies?.thumb;
    const localVisual = visualSource && !/^https?:/.test(visualSource) ? visualSource : visualSource ? await this.downloadProxy(visualSource) : null;
    const text = await embed({ provider: this.config.embed.provider, model: this.config.embed.model, dimensions: this.config.embed.dimensions, text: asset.search_doc, taskType: "RETRIEVAL_DOCUMENT" });
    let visual = null;
    if (localVisual && this.config.embed.provider === "gemini") {
      try { visual = await embed({ provider: "gemini", model: this.config.embed.model, dimensions: this.config.embed.dimensions, imagePath: localVisual, text: asset.title || undefined, taskType: "RETRIEVAL_DOCUMENT" }); }
      catch (error) { this.log(`visual embedding failed for ${asset.path}: ${error.message}`); }
    }
    await this.db.recordSpend({ assetId, provider: this.config.embed.provider, model: text.model, kind: "embed", usd: estimateUsd(text.model, "embed", visual ? 2 : 1) });
    await this.db.saveEmbeddings(assetId, { text: text.vector, visual: visual?.vector || null, analyzer: { embed: { provider: this.config.embed.provider, model: text.model, visual: visual?.kind || null } } });
    if (asset.proxies?.fetched) { try { fs.unlinkSync(asset.proxies.fetched); } catch { /* gone */ } await this.db.query("update dam.assets set proxies = proxies - 'fetched' where id = $1", [assetId]); }
    return { ok: true, visual: Boolean(visual) };
  }

  async downloadProxy(url) {
    const destination = path.join(this.config.workDir, "proxy-cache", path.basename(new URL(url).pathname));
    if (fs.existsSync(destination)) return destination;
    const response = await fetch(url);
    if (!response.ok) return null;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
    return destination;
  }

  // ---------- queue loop ----------
  async runJob(job) {
    switch (job.kind) {
      case "discover": return this.discover(job.source_id, { full: Boolean(job.payload?.full) });
      case "probe": return this.probe(job.asset_id);
      case "analyze": return this.analyze(job.asset_id, { auto: job.payload?.auto || null });
      case "embed": return this.embedAsset(job.asset_id, { auto: job.payload?.auto || null });
      case "ugc-profile": { const { computeUgcProfiles } = await import("./ugc-profile.mjs"); return computeUgcProfiles(this.db, this.graph, { brand: job.payload?.brand }); }
      case "link-kg": { const { syncDamToKnowledge } = await import("./kg-bridge.mjs"); return syncDamToKnowledge(this.root, this.db, this.graph, { brand: job.payload?.brand }); }
      default: throw new Error(`unknown job kind ${job.kind}`);
    }
  }

  /** Process jobs until the queue is empty (once=true) or forever. Paid jobs that hit the lock are parked, not failed. */
  async runQueue({ once = false, kinds = undefined, maxJobs = Infinity, sourcePrefix = undefined, autoOnly: onlyAuto = false } = {}) {
    let processed = 0;
    let parked = 0;
    // In auto-intake mode (DAM_AUTO_PRODUCT_REFS=1) it also takes paid jobs tagged auto: the product-render
    // candidates, under the auto cap.
    let autoOnly = Boolean(onlyAuto);
    if (!this.config.approved) {
      if (this.config.autoProductRefs) autoOnly = true;
      else {
        kinds = (kinds || ["discover", "probe", "analyze", "embed"]).filter((kind) => FREE_KINDS.has(kind));
        if (!kinds.length) return { processed, parked, skipped: "no free kinds requested and paid work is locked" };
      }
    }
    // A sliding pool: a slot is refilled the moment its job ends, so one slow download never idles the
    // others, and a job that exceeds jobTimeoutMs is abandoned (the queue's stale sweep requeues it).
    const active = new Set();
    const jobTimeoutMs = this.config.jobTimeoutMs;
    let claimed = 0;
    let idleSince = null;
    const labels = new Map();
    let lastBeat = 0;
    const runOne = async (job) => {
      labels.set(job.id, `${job.kind}:${job.asset_id || job.source_id}`);
      await this.beat(`${job.kind}:${job.asset_id || job.source_id}`);
      lastBeat = Date.now();
      let timer = null;
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`job timed out after ${Math.round(jobTimeoutMs / 1000)}s`)), jobTimeoutMs); });
      try {
        await Promise.race([this.runJob(job), timeout]);
        await this.db.finishJob(job.id);
        processed += 1;
      } catch (error) {
        if (error instanceof SpendNotApproved || error instanceof SpendCapReached) {
          // park: back to pending an hour from now so the queue keeps its shape
          await this.db.query("update dam.jobs set status = 'pending', locked_by = null, attempts = attempts - 1, run_after = now() + interval '1 hour', error = $2 where id = $1", [job.id, error.message]);
          parked += 1;
          this.log(`parked ${job.kind} ${job.asset_id || job.source_id}: ${error.message}`);
          if (once && parked >= this.config.concurrency) { this.stopped = true; }
          return;
        }
        const dead = await this.db.retryOrFail(job, error);
        if (job.asset_id) await this.db.setStatus(job.asset_id, dead ? "failed" : (await this.db.getAsset(job.asset_id))?.status || "failed", error.message);
        this.log(`${dead ? "DEAD" : "retry"} ${job.kind} ${job.asset_id || job.source_id}: ${error.message}`);
      } finally { clearTimeout(timer); labels.delete(job.id); }
    };
    while (!this.stopped && claimed < maxJobs) {
     try {
      // Liveness: the loop writes a heartbeat at least once a minute, busy or idle; the watchdog reads it.
      if (Date.now() - lastBeat > 60_000) { await this.beat(active.size ? `busy ${[...labels.values()].slice(0, 3).join(", ")}` : "idle", { announce: true, active: active.size, processed }); lastBeat = Date.now(); }
      const free = this.config.concurrency - active.size;
      if (free > 0) {
        if (!idleSince || Date.now() - idleSince > 5_000) {
          await this.db.requeueStale(45);
          const jobs = await this.db.claimJobs(this.config.workerId, Math.min(free, maxJobs - claimed), kinds || null, sourcePrefix || null, autoOnly);
          if (jobs.length) {
            idleSince = null;
            claimed += jobs.length;
            for (const job of jobs) { const task = runOne(job).finally(() => active.delete(task)); active.add(task); }
            continue;
          }
          if (!active.size) {
            if (once) break;
            await this.beat("idle");
            lastBeat = Date.now();
          }
          idleSince = Date.now();
        }
      }
      if (active.size) await Promise.race([...active, sleep(1_000)]); else await sleep(5_000);
     } catch (error) {
      // A database blip (pooler restart, timeout) must not end the hosted loop; a persistent hang is the
      // watchdog's job.
      this.log(`queue loop error: ${error.message}; retrying in 10s`);
      await sleep(10_000);
     }
    }
    if (active.size) await Promise.allSettled([...active]);
    return { processed, parked };
  }

  /** Heartbeat row + in-process progress mark (the watchdog trusts only heartbeats that reached the database). */
  async beat(activity, { announce = false, active = 0, processed = 0 } = {}) {
    await this.db.heartbeat(this.config.workerId, activity);
    this.lastProgressAt = Date.now();
    // One log line per loop heartbeat (≤ 1/min): a hosted deployment whose logs go silent is hung, visibly.
    if (announce) this.log(`heartbeat ${new Date(this.lastProgressAt).toISOString()} worker=${this.config.workerId} active=${active} processed=${processed} ${activity}`);
  }

  /**
   * Liveness watchdog for the hosted worker: when the queue loop has not written a heartbeat for `minutes`, log
   * loudly and exit 1 so the platform restarts the container (deploy/dam/start.sh prints the status). Covers a
   * hung HTTP call, a hung database client and a wedged loop alike.
   */
  startWatchdog({ minutes = this.config.watchdogMinutes, exit = (code) => process.exit(code), now = () => Date.now() } = {}) {
    if (!minutes) return null;
    this.lastProgressAt = now();
    this.log(`watchdog armed: exit 1 after ${minutes} min without a heartbeat`);
    let warned = false;
    const check = () => {
      const stale = now() - this.lastProgressAt;
      if (stale > (minutes * 60_000) / 2 && !warned) { warned = true; this.log(`WATCHDOG: stalled — no heartbeat for ${Math.round(stale / 60_000)} min (exit at ${minutes})`); }
      if (stale <= (minutes * 60_000) / 2) warned = false;
      if (stale > minutes * 60_000) {
        this.log(`WATCHDOG: no heartbeat for ${Math.round(stale / 60_000)} min (limit ${minutes}); the worker loop is hung. Exiting 1 so the platform restarts it.`);
        exit(1);
        return true;
      }
      return false;
    };
    const timer = setInterval(check, Math.min(60_000, Math.max(1_000, (minutes * 60_000) / 4)));
    timer.unref?.();
    return { timer, check, stop: () => clearInterval(timer) };
  }

  /**
   * Safety net: an incremental discover for every enabled Dropbox source whose last sync is older than
   * config.rescanHours, longpoll or not. Catches changes a dead or reset longpoll missed.
   */
  async safetyNetOnce() {
    const hours = this.config.rescanHours;
    if (!hours) return [];
    const { rows } = await this.db.query("select id from dam.sources where enabled and kind = 'dropbox' and (last_sync_at is null or last_sync_at < now() - ($1::float * interval '1 hour'))", [hours]);
    const queued = [];
    for (const row of rows) if (await this.enqueueDiscover(row.id, { reason: `safety-net rescan (> ${hours}h since last sync)`, priority: 15 })) queued.push(row.id);
    if (queued.length) this.log(`safety net: queued discover for ${queued.join(", ")}`);
    return queued;
  }

  async safetyNet({ everyMs = 10 * 60_000 } = {}) {
    await this.sleep(Math.min(everyMs, 2 * 60_000));
    while (!this.stopped) {
      try { await this.safetyNetOnce(); } catch (error) { this.log(`safety net: ${error.message}`); }
      await this.sleep(everyMs);
    }
  }

  /**
   * Long-running Dropbox watcher: one longpoll per source, each change → one discover job (never a second
   * while one is open). A 409/400 from longpoll means the cursor is dead: drop it and queue a full listing
   * (discover then re-resolves a moved root or disables the source). Disabled sources are left alone.
   */
  async watch({ sources: only = null } = {}) {
    const sources = only || (await this.db.listSources()).filter((source) => source.enabled && source.kind === "dropbox");
    const dbx = this.dbx();
    const loops = sources.map(async (source) => {
      let backoff = 5;
      while (!this.stopped) {
        try {
          const current = await this.db.getSource(source.id);
          if (!current || !current.enabled) { this.log(`watch ${source.id}: source disabled (${current?.last_error || "removed"}); not watching it`); return; }
          if (!current.cursor) { await this.enqueueDiscover(source.id, { full: true, reason: "no cursor" }); await this.sleep(60_000); continue; }
          const { changes, backoff: serverBackoff } = await dbx.longpoll(current.cursor, this.config.longpollSeconds);
          if (changes) await this.enqueueDiscover(source.id, { reason: "longpoll changes" });
          if (serverBackoff) await this.sleep(serverBackoff * 1000);
          backoff = 5;
        } catch (error) {
          if (error instanceof DropboxApiError && (error.reset || error.status === 409 || error.status === 400)) {
            const reason = `longpoll: cursor invalid (${error.summary || error.status}); listing the root again`;
            this.log(`watch ${source.id}: ${reason}`);
            await this.db.clearSourceCursor(source.id, reason);
            await this.enqueueDiscover(source.id, { full: true, reason: "cursor reset" });
            await this.sleep(backoff * 1000);
            backoff = Math.min(backoff * 2, 300);
            continue;
          }
          this.log(`watch ${source.id}: ${error.message}; retry in ${backoff}s`);
          try { await this.db.setSourceError(source.id, error.message); } catch { /* the database may be the problem */ }
          await this.sleep(backoff * 1000);
          backoff = Math.min(backoff * 2, 300);
        }
      }
    });
    await Promise.all(loops);
  }

  async close() { this.stopped = true; await this.db.end(); }
}

const FREE_KINDS = new Set(["discover", "probe"]);

export class SpendNotApproved extends Error {}
export class SpendCapReached extends Error {}

function mimeFor(extension) {
  return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", heic: "image/heic", tif: "image/tiff", tiff: "image/tiff", mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm", pdf: "application/pdf" }[extension] || null;
}
