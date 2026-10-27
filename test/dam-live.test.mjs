// Offline tests for the live DAM: Dropbox deadlines and error parsing, discover recovery (stale cursor, moved or
// missing root, deletion reconciliation), brand at discovery, watcher cursor reset, discover dedupe, the liveness
// watchdog, the similarAssets self-join, the per-brand catalog configs — and Muha's catalog behaviour unchanged.
// A fake Dropbox (fetch / client) and a fake DamDb stand in for the network and Postgres.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DropboxClient, DropboxApiError, DropboxTimeout } from "../engine/dam/dropbox.mjs";
import { DamWorker } from "../engine/dam/worker.mjs";
import { damConfig, brandForPath } from "../engine/dam/config.mjs";
import { similarAssets, pathPassAllowed, pathQueryWords } from "../engine/dam/search.mjs";
import { folderBrandSql } from "../engine/dam/recover.mjs";
import { relativeToRoot } from "../engine/dam/sources.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const graph = { nodes: [{ id: "brand.muha", type: "brand", name: "Muha Meds", aliases: ["muha"] }, { id: "brand.dialed-labs", type: "brand", name: "Dialed Labs", aliases: ["dialed labs"] }, { id: "brand.dialed-health", type: "brand", name: "Dialed Health", aliases: ["dialed health"] }], edges: [] };
const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, headers: new Map(), json: async () => body, text: async () => JSON.stringify(body) });

// ---------- Dropbox client ----------
test("dropbox: every request has a deadline; a hung call becomes a retried timeout, never a hang", async () => {
  let calls = 0;
  const hang = (url, init) => { calls += 1; return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason))); };
  const dbx = new DropboxClient({ accessToken: "t", fetchImpl: hang, timeouts: { rpcMs: 20 }, sleepImpl: async () => {} });
  await assert.rejects(dbx.rpc("/files/list_folder", { path: "/x" }, { attempts: 2 }), (error) => error instanceof DropboxTimeout);
  assert.equal(calls, 2, "a timeout is retried like a 5xx");
  const poll = new DropboxClient({ accessToken: "t", fetchImpl: hang, timeouts: { longpollMarginS: -29.97 } });
  await assert.rejects(poll.longpoll("c", 30), (error) => error instanceof DropboxTimeout); // deadline = timeout + margin
});

test("dropbox: 409 summaries parse into reset / not_found; longpoll 409 surfaces as reset", async () => {
  const reset = new DropboxApiError("/files/list_folder/continue", 409, JSON.stringify({ error_summary: "reset/..", error: { ".tag": "reset" } }));
  assert.equal(reset.reset, true); assert.equal(reset.notFound, false);
  const missing = new DropboxApiError("/files/list_folder/continue", 409, JSON.stringify({ error_summary: "path/not_found/", error: {} }));
  assert.equal(missing.notFound, true); assert.equal(missing.reset, false);
  const dbx = new DropboxClient({ accessToken: "t", fetchImpl: async () => jsonResponse(409, { error_summary: "reset/" }) });
  await assert.rejects(dbx.longpoll("c", 30), (error) => error instanceof DropboxApiError && error.reset);
  const meta = new DropboxClient({ accessToken: "t", fetchImpl: async () => jsonResponse(409, { error_summary: "path/not_found/" }) });
  assert.equal(await meta.getMetadata("/gone"), null);
});

test("sources: relative paths strip the root case-insensitively and only at a folder boundary", () => {
  assert.equal(relativeToRoot("/2025 Full Ops/MUHA MEDS/Renders/x.png", "/2025 full ops/muha meds"), "Renders/x.png");
  assert.equal(relativeToRoot("/rootX/file.png", "/root"), "rootX/file.png");
});

// ---------- fake DB + fake Dropbox for the worker ----------
function fakeDb(sources, assets = []) {
  const state = { sources: new Map(sources.map((s) => [s.id, { enabled: true, cursor: null, last_error: null, ...s }])), assets: new Map(assets.map((a) => [`${a.source_id}|${a.path}`, { deleted_at: null, brand: null, ...a }])), jobs: [], log: [] };
  const db = {
    state,
    async getSource(id) { const s = state.sources.get(id); return s ? { ...s } : null; },
    async listSources() { return [...state.sources.values()].map((s) => ({ ...s })); },
    async setSourceCursor(id, cursor) { Object.assign(state.sources.get(id), { cursor, last_error: null, last_sync_at: new Date() }); },
    async setSourceError(id, error) { state.sources.get(id).last_error = error; },
    async clearSourceCursor(id, reason) { Object.assign(state.sources.get(id), { cursor: null, last_error: reason }); state.log.push(`clear ${id}`); },
    async moveSourceRoot(id, rootPath, note) { Object.assign(state.sources.get(id), { root: rootPath, cursor: null, last_error: note }); return { ...state.sources.get(id) }; },
    async disableSource(id, error) { Object.assign(state.sources.get(id), { enabled: false, last_error: error }); },
    async upsertDiscoveredBatch(sourceId, items) {
      return items.map((item) => {
        const key = `${sourceId}|${item.relativePath}`;
        const existing = state.assets.get(key);
        const row = existing || { id: `id-${state.assets.size + 1}`, source_id: sourceId, path: item.relativePath, kind: item.kind, brand: null, flags: {} };
        if (!row.brand && item.brand) { row.brand = item.brand; row.flags = { ...row.flags, brand_basis: "folder" }; }
        row.deleted_at = null;
        state.assets.set(key, row);
        return { id: row.id, path: row.path, kind: row.kind, status: "discovered", inserted: !existing };
      });
    },
    async markDeletedBatch(sourceId, paths) { for (const p of paths) { const a = state.assets.get(`${sourceId}|${p}`); if (a) a.deleted_at = new Date(); } },
    async reconcileDeleted(sourceId, seen) { let n = 0; for (const a of state.assets.values()) if (a.source_id === sourceId && !a.deleted_at && !seen.has?.(a.path) && !(Array.isArray(seen) && seen.includes(a.path))) { a.deleted_at = new Date(); n += 1; } return n; },
    async enqueueBatch(kind, sourceId, ids) { for (const id of ids) state.jobs.push({ kind, source_id: sourceId, asset_id: id, status: "pending" }); return ids.length; },
    async hasOpenDiscover(sourceId) { return state.jobs.some((j) => j.kind === "discover" && j.source_id === sourceId && ["pending", "running"].includes(j.status)); },
    async enqueue(kind, { sourceId = null, payload = {} } = {}) { state.jobs.push({ kind, source_id: sourceId, payload, status: "pending" }); return state.jobs.length; },
    async heartbeat() { state.log.push("beat"); },
    async query() { return { rows: [], rowCount: 0 }; },
    async end() {},
  };
  return db;
}

/** Fake Dropbox tree: folders map path → [{name, path, size}] files (recursive listing = files under the root). */
function fakeDropbox(tree, { continueError = null, longpollError = null } = {}) {
  const calls = [];
  const exists = (p) => Object.keys(tree).some((folder) => folder.toLowerCase() === p.toLowerCase() || folder.toLowerCase().startsWith(p.toLowerCase() + "/"));
  return {
    calls,
    async *walk({ path: rootPath, cursor }) {
      calls.push(cursor ? `continue ${cursor}` : `list ${rootPath}`);
      if (cursor && continueError) throw continueError;
      if (!cursor && !exists(rootPath)) throw new DropboxApiError("/files/list_folder", 409, JSON.stringify({ error_summary: "path/not_found/" }));
      for (const [folder, files] of Object.entries(tree)) if (folder.toLowerCase().startsWith(rootPath.toLowerCase())) for (const file of files) yield { type: "file", id: `id:${file}`, path: `${folder}/${file}`, name: file, bytes: 10, modifiedAt: "2026-10-01T00:00:00Z", contentHash: file };
      yield { type: "cursor", cursor: `cur:${rootPath}`, hasMore: false };
    },
    async children(parent) { const seen = new Map(); for (const folder of Object.keys(tree)) { if (!folder.toLowerCase().startsWith(parent.toLowerCase() + "/")) continue; const name = folder.slice(parent.length + 1).split("/")[0]; seen.set(name, { name, path: `${parent}/${name}` }); } return [...seen.values()]; },
    async searchFolders(name) { const out = []; for (const folder of Object.keys(tree)) { const parts = folder.split("/"); parts.forEach((part, index) => { if (part.toLowerCase() === name.toLowerCase()) out.push({ name: part, path: parts.slice(0, index + 1).join("/") }); }); } return [...new Map(out.map((o) => [o.path, o])).values()]; },
    async longpoll() { if (longpollError) throw longpollError; return { changes: false, backoff: 0 }; },
  };
}

function makeWorker(db, dropbox) {
  const config = { ...damConfig(root, {}), workDir: fs.mkdtempSync(path.join(os.tmpdir(), "dam-live-")), databaseUrl: "postgres://fake" };
  const logs = [];
  const worker = new DamWorker(root, { config, db, dropbox, graph, log: (...args) => logs.push(args.join(" ")), sleepImpl: async () => {} });
  return { worker, logs };
}

test("discover: a stale cursor (reset) relists the root and reconciles deletions; brand comes from the folder", async () => {
  const db = fakeDb([{ id: "dropbox:media:dialed-health", kind: "dropbox", root: "/MEDIA Team/Dialed-Health", brand_hint: "brand.dialed-health", cursor: "old" }],
    [{ id: "gone", source_id: "dropbox:media:dialed-health", path: "Photos/deleted-long-ago.jpg", kind: "image" }]);
  const dbx = fakeDropbox({ "/MEDIA Team/Dialed-Health/Photos": ["a.jpg"], "/MEDIA Team/Dialed-Health/Dialed-and-Defend/Photos": ["gala.jpg"] }, { continueError: new DropboxApiError("/files/list_folder/continue", 409, JSON.stringify({ error_summary: "reset/" })) });
  const { worker } = makeWorker(db, dbx);
  const counts = await worker.discover("dropbox:media:dialed-health");
  assert.equal(counts.cursorReset, "reset/");
  assert.deepEqual(dbx.calls, ["continue old", "list /MEDIA Team/Dialed-Health"]);
  assert.equal(db.state.sources.get("dropbox:media:dialed-health").cursor, "cur:/MEDIA Team/Dialed-Health");
  assert.ok(db.state.assets.get("dropbox:media:dialed-health|Photos/deleted-long-ago.jpg").deleted_at, "a full listing tombstones what it did not see");
  assert.equal(counts.reconciled, 1);
  const a = db.state.assets.get("dropbox:media:dialed-health|Photos/a.jpg");
  assert.equal(a.brand, "brand.dialed-health"); assert.equal(a.flags.brand_basis, "folder");
  assert.equal(db.state.assets.get("dropbox:media:dialed-health|Dialed-and-Defend/Photos/gala.jpg").brand, "brand.dialed-labs", "BRAND_PATH_RULES beat the source hint");
});

test("discover: a root moved elsewhere is re-resolved and adopted; one moved INTO another source disables the source", async () => {
  const sources = [
    { id: "dropbox:dialed-health:master", kind: "dropbox", root: "/2025 Full Ops/DIALED HEALTH: Master", brand_hint: "brand.dialed-health", cursor: "c1" },
    { id: "dropbox:media:dialed-and-defend", kind: "dropbox", root: "/MEDIA Team/Dialed-and-Defend", brand_hint: "brand.dialed-labs", cursor: "c2" },
    { id: "dropbox:media:dialed-health", kind: "dropbox", root: "/MEDIA Team/Dialed-Health", brand_hint: "brand.dialed-health", cursor: "c3" },
  ];
  const db = fakeDb(sources, [{ id: "old1", source_id: "dropbox:media:dialed-and-defend", path: "Photos/x.jpg", kind: "image" }]);
  const notFound = new DropboxApiError("/files/list_folder/continue", 409, JSON.stringify({ error_summary: "path/not_found/" }));
  const dbx = fakeDropbox({ "/CM Headquarters/DIALED HEALTH: Master/Logo": ["logo.png"], "/MEDIA Team/Dialed-Health/Dialed-and-Defend/Photos": ["x.jpg"] }, { continueError: notFound });
  const { worker } = makeWorker(db, dbx);

  const moved = await worker.discover("dropbox:dialed-health:master");
  assert.equal(moved.rootMovedTo, "/CM Headquarters/DIALED HEALTH: Master");
  assert.equal(db.state.sources.get("dropbox:dialed-health:master").root, "/CM Headquarters/DIALED HEALTH: Master");
  assert.ok(db.state.assets.has("dropbox:dialed-health:master|Logo/logo.png"), "relative paths are kept under the new root");

  const nested = await worker.discover("dropbox:media:dialed-and-defend");
  assert.match(nested.disabled, /^root missing: \/MEDIA Team\/Dialed-and-Defend; it now lives at \/MEDIA Team\/Dialed-Health\/Dialed-and-Defend \(already covered by dropbox:media:dialed-health\)/);
  const source = db.state.sources.get("dropbox:media:dialed-and-defend");
  assert.equal(source.enabled, false);
  assert.ok(db.state.assets.get("dropbox:media:dialed-and-defend|Photos/x.jpg").deleted_at, "its files are tombstoned so the live copies are not skipped as duplicates");
  const again = await worker.discover("dropbox:media:dialed-and-defend");
  assert.equal(again.skipped, "source disabled", "a disabled source finishes its job instead of dying");
});

test("watch: a longpoll 409 reset drops the cursor and queues exactly one full discover", async () => {
  const db = fakeDb([{ id: "dropbox:muha:2025", kind: "dropbox", root: "/2025 Full Ops/MUHA MEDS", brand_hint: "brand.muha", cursor: "c" }]);
  const dbx = fakeDropbox({}, { longpollError: new DropboxApiError("/files/list_folder/longpoll", 409, JSON.stringify({ error_summary: "reset/" })) });
  const { worker } = makeWorker(db, dbx);
  let rounds = 0;
  worker.sleep = async () => { rounds += 1; if (rounds >= 3) worker.stopped = true; };
  await worker.watch({ sources: [{ id: "dropbox:muha:2025" }] });
  const discovers = db.state.jobs.filter((job) => job.kind === "discover");
  assert.equal(discovers.length, 1, "dedupe: never a second discover while one is open");
  assert.equal(discovers[0].payload.full, true);
  assert.equal(db.state.sources.get("dropbox:muha:2025").cursor, null);
  assert.equal(await worker.enqueueDiscover("dropbox:muha:2025"), null);
});

test("watchdog: exits 1 when the loop stops heartbeating, logs a stall first, stays quiet while beats arrive", async () => {
  const db = fakeDb([]);
  const { worker, logs } = makeWorker(db, null);
  let clock = 0; const exits = [];
  const dog = worker.startWatchdog({ minutes: 10, exit: (code) => exits.push(code), now: () => clock });
  dog.stop();
  clock = 4 * 60_000; assert.equal(dog.check(), false);
  await worker.beat("idle", { announce: true });
  assert.ok(logs.some((line) => /^heartbeat /.test(line)), "every loop heartbeat is logged");
  worker.lastProgressAt = 0;
  clock = 6 * 60_000; dog.check(); assert.ok(logs.some((line) => /stalled/.test(line)));
  clock = 11 * 60_000; assert.equal(dog.check(), true);
  assert.deepEqual(exits, [1]);
});

test("similarAssets qualifies every column of the self-join (GET /api/asset/:id was HTTP 500: id is ambiguous)", async () => {
  let sql = "";
  await similarAssets({ query: async (text) => { sql = text; return { rows: [] }; } }, "00000000-0000-0000-0000-000000000000");
  const list = sql.slice(sql.indexOf("select") + 6, sql.indexOf(" from dam.assets a")).split(",").map((column) => column.trim());
  for (const column of list) assert.match(column, /^(a\.|1 - \(a\.)/, `unqualified column in similarAssets: ${column}`);
  await assert.rejects(similarAssets({ query: async () => ({ rows: [] }) }, "x", { column: "id; drop" }));
});

test("brand at discovery: folder rules, backfill SQL and the un-analysed search pass", () => {
  assert.equal(brandForPath({ brand_hint: "brand.dialed-health" }, "Renders/Syringe Bottle/NuLumin/v3/a.png"), "brand.nulumin");
  assert.equal(brandForPath({ brand_hint: "brand.dialed-health" }, "Dialed-and-Defend/x.jpg"), "brand.dialed-labs");
  assert.equal(brandForPath({ brand_hint: "brand.muha" }, "Renders/x.png"), "brand.muha");
  assert.match(folderBrandSql(), /^case when a\.path ~\* .* else s\.brand_hint end$/);
  assert.equal(pathPassAllowed({ brand: "brand.muha", kind: "image" }), true);
  assert.equal(pathPassAllowed({ brand: "brand.muha", class: "logo" }), false);
  assert.deepEqual(pathQueryWords("the Steve Jobs draft videos"), ["steve", "jobs", "draft"]);
});

// ---------- per-brand catalogs ----------
test("brand configs: keys, Dialed Labs folder → product with the folder's model code, Dialed Health containers", async () => {
  const { catalogKeyOf, brandCatalogConfig } = await import("../engine/skus/brand-config.mjs");
  const { productForFolder, folderCodeOf, buildFolderCatalog, brandProducts } = await import("../engine/skus/folder-catalog.mjs");
  assert.equal(catalogKeyOf("brand.dialed-moods"), "dialed-moods");
  assert.equal(catalogKeyOf("brand.muha"), "muha");
  assert.equal(brandCatalogConfig("muha-meds").key, "muha");
  const dl = brandCatalogConfig("dialed-labs");
  const products = brandProducts(root, dl);
  assert.equal(productForFolder("Renders/Saunas/Barrel Sauna (BS-1815)/Angles", products, dl).product.id, "DL-barrel-sauna");
  assert.equal(productForFolder("Renders/Ice Baths/Vertical Plunge (CT_06)", products, dl), null, "no guessing between vplunge wood/black");
  assert.equal(folderCodeOf("Renders/Saunas/Barrel Sauna (BS-1815)/Angles"), "BS-1815");
  const library = [
    { id: "1", brand: "brand.dialed-labs", path: "Renders/Saunas/Barrel Sauna (BS-1815)/front.png" },
    { id: "2", brand: "brand.dialed-labs", path: "Renders/00 Old Dialed Labs Renders/CT_12/x.png" },
    { id: "3", brand: "brand.dialed-labs", path: "Renders/Red Light Therapy/M11/y.png" },
    { id: "4", brand: "brand.dialed-labs", path: "Lifestyle/z.png" },
  ];
  const { catalog } = buildFolderCatalog(root, { brand: "dialed-labs", library, write: false });
  assert.equal(catalog.reviewed, false);
  const barrel = catalog.lines.flatMap((line) => line.items).find((item) => item.productId === "DL-barrel-sauna");
  assert.equal(barrel.sku, null, "no SKU code is invented"); assert.equal(barrel.folderCode, "BS-1815"); assert.equal(barrel.reviewed, false); assert.equal(barrel.assets.length, 1);
  assert.deepEqual(catalog.groups.map((group) => group.kind), ["previous-design", null]);
  const dh = brandCatalogConfig("dialed-health");
  assert.equal(productForFolder("Renders/Oral Drops", brandProducts(root, dh), dh).product.id, "DH-oral-drop");
});

test("Muha catalog behaviour is unchanged by the per-brand configs (baseline recorded before the refactor)", async () => {
  const { deviceGenerationOf, inScope, computeCoverage, indexFolderMap, useBrand } = await import("../engine/skus/coverage.mjs");
  const { loadCatalog, catalogLookup } = await import("../engine/skus/catalog.mjs");
  useBrand("muha");
  const paths = ["Renders/Disposables/CA/CA_1G_Distillate_TechDesign_June2025/Blue Slushie.png", "Renders/Disposables/MI/MI_1G_Distillate_Nov2024/x.png", "Renders/Disposables/MI/MI Magnetic_Dispo/Magnetic Dispos Devices_Only/Blue Slushie.png", "Renders/Disposables/CA/CA_1G_Distillate_Feb2024/Grey Device/a.png", "Renders/Disposables/NY/Gen 3 NY 1G/a.png", "Renders/Cartridges/CA/x.png"];
  assert.deepEqual(paths.map((p) => deviceGenerationOf(p)), [3, 2, null, 1, 3, null]);
  assert.equal(inScope({ brand: "brand.muha", path: "Media/x.png" }), false);
  assert.equal(inScope({ brand: "brand.muha", path: "Renders/x.png" }), true);
  const catalog = loadCatalog(root, "muha");
  const hit = (product, intent) => { const x = catalogLookup(catalog, product, intent); return { line: x.line.id, item: x.item?.name, n: x.item?.assets.length }; };
  assert.deepEqual(hit("MI 2G Distillate Disposables Blue Slushie", ""), { line: "muha:MI:mi019", item: "Blue Slushie", n: 14 });
  assert.deepEqual(hit("Pineapple Express", "CA gen 3"), { line: "muha:CA:ca026", item: "Pineapple Express", n: 4 });
  assert.deepEqual(hit("Gush Mintz", "live resin"), { line: "muha:MI:mi009", item: "Gush Mintz", n: 1 });
  const registry = JSON.parse(fs.readFileSync(path.join(root, "knowledge/skus/muha-meds.json"), "utf8"));
  indexFolderMap(JSON.parse(fs.readFileSync(path.join(root, "knowledge/skus/folder-map.muha.json"), "utf8")));
  const library = [
    { id: "a1", brand: "brand.muha", path: "Renders/Disposables/MI/MI_2G_Distillate_Disposables_Gen3_Jan2026/Blue Slushie.png", product: "Blue Slushie 2G disposable" },
    { id: "a2", brand: "brand.muha", path: "Renders/Disposables/CA/CA_1G_Distillate_TechDesign_June2025/Pineapple Express.png", product: "Pineapple Express" },
    { id: "a3", brand: "brand.muha", path: "Renders/Disposables/CA/CA_1G_Distillate_Feb2024/Pineapple Express.png", product: "Pineapple Express" },
    { id: "a4", brand: "brand.muha", path: "Renders/Disposables/MI/MI Magnetic_Dispo/Magnetic Dispos Devices_Only/Blue Slushie.png", product: "Blue Slushie" },
    { id: "a5", brand: "brand.muha", path: "Renders/Cartridges/CA/CA_1G_Live_Resin_Carts/Gush Mintz.png", product: "Gush Mintz live resin cart" },
  ];
  const coverage = computeCoverage(registry, library);
  assert.deepEqual(coverage.assignments, { a2: [{ line: "muha:CA:ca026", item: "Pineapple Express", score: 6.5 }], a1: [{ line: "muha:MI:mi019", item: "Blue Slushie", score: 6.5 }] });
  assert.equal(coverage.totals.unmatchedGroups, 3);
  // Device-generation dating is Muha's only.
  useBrand("dialed-labs"); assert.equal(deviceGenerationOf(paths[0]), null); useBrand("muha");
});
