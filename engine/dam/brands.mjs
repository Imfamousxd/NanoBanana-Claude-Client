// Per-brand dissection of the library: what each brand has (files by kind and class), how far each stage got
// (discovered → probed → analysed → embedded), its product renders and product-catalog coverage, its newest
// additions, its sources' health, and the next action. Free: reads the database and knowledge/skus only.
// CLI `dam brands [--brand b] [--json]`, MCP `dam_brands`.
import fs from "node:fs";
import path from "node:path";
import { brandForPath, estimateUsd } from "./config.mjs";
import { BRAND_CATALOGS, brandCatalogConfig } from "../skus/brand-config.mjs";

const UNASSIGNED = "(unassigned)";

/**
 * The render library of one brand, straight from the database, in the shape engine/skus/* consume
 * ({id, path, brand, product, title, composition, angle, quality, alpha, thumb, render, verdict, text}).
 * Membership is by folder (source + BRAND_PATH_RULES) and the brand's render scope (brand-config.mjs).
 */
export async function exportRenderLibrary(db, brand) {
  const config = brandCatalogConfig(brand);
  if (!config) throw new Error(`no catalog config for ${brand}; add one to engine/skus/brand-config.mjs`);
  const { rows } = await db.query(`
    select a.id, a.source_id, a.path, a.status, a.product, a.title, a.quality, a.has_alpha as alpha, a.proxies->>'thumb' as thumb,
           a.flags->'render' as render, a.verdict, a.analysis->>'composition' as composition, a.analysis->>'angle' as angle,
           a.analysis->'on_image_text' as text, a.modified_at, s.brand_hint, s.root
    from dam.assets a join dam.sources s on s.id = a.source_id
    where a.source_id = any($1::text[]) and a.kind = 'image' and a.deleted_at is null and a.duplicate_of is null`, [config.sources]);
  return rows
    .map((row) => ({ ...row, brand: brandForPath({ brand_hint: row.brand_hint }, row.path), analysed: ["analyzed", "embedded"].includes(row.status), text: Array.isArray(row.text) ? row.text : [] }))
    .filter((asset) => asset.brand === config.brandId && (!config.scope || config.scope(asset)));
}

/** Catalog coverage from knowledge/skus/catalog.<key>.json: items with ≥ 1 render and with ≥ 1 REVIEWED render. */
export function catalogCoverage(root, brand) {
  const config = brandCatalogConfig(brand);
  const key = config?.key || String(brand || "").replace(/^brand\./, "");
  const file = path.join(root, "knowledge", "skus", `catalog.${key}.json`);
  if (!fs.existsSync(file)) return { file: path.relative(root, file), exists: false, hasSkuBook: Boolean(config?.registry) };
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  // A catalog without `reviewed: false` is the folder-reviewed Muha catalog: every render on a line was confirmed
  // by a person's folder decision. Otherwise only renders with an approved verdict count as reviewed.
  const reviewedCatalog = catalog.reviewed !== false;
  const items = catalog.lines.flatMap((line) => line.items);
  const withRender = items.filter((item) => item.assets.length).length;
  const withReviewed = items.filter((item) => item.assets.some((asset) => reviewedCatalog || asset.verdict === "approved")).length;
  return {
    file: path.relative(root, file), exists: true, builtAt: catalog.builtAt, reviewed: reviewedCatalog, basis: catalog.review?.basis || (reviewedCatalog ? "SKU book + reviewed folder map" : null),
    lines: catalog.lines.length, items: items.length, itemsWithRender: withRender, itemsWithReviewedRender: withReviewed,
    skuCodes: items.filter((item) => item.sku).length, unmatchedFolders: catalog.totals?.unmatchedFolders ?? null, groups: catalog.groups?.length || 0,
    missing: items.filter((item) => !item.assets.length && !item.discontinued && !item.inDevelopment).slice(0, 12).map((item) => item.name),
  };
}

export async function brandReport(db, graph, root, { brand = null, newest = 5, config = null } = {}) {
  const q = async (sql, params = []) => (await db.query(sql, params)).rows;
  const B = "coalesce(a.brand, s.brand_hint, '(unassigned)')";
  const filter = brand ? ` and ${B} = $1` : "";
  const params = brand ? [brand] : [];
  const [kinds, classes, stages, renders, recent, pending, sources, unbranded, workers, deadDiscover] = await Promise.all([
    q(`select ${B} as brand, a.kind, count(*)::int as n, coalesce(sum(a.bytes),0)::float as bytes from dam.assets a join dam.sources s on s.id = a.source_id where a.deleted_at is null${filter} group by 1,2`, params),
    q(`select ${B} as brand, coalesce(a.class,'(unclassified)') as class, count(*)::int as n from dam.assets a join dam.sources s on s.id = a.source_id where a.deleted_at is null${filter} group by 1,2`, params),
    q(`select ${B} as brand, a.status, count(*)::int as n from dam.assets a join dam.sources s on s.id = a.source_id where a.deleted_at is null${filter} group by 1,2`, params),
    q(`select ${B} as brand, count(*)::int as candidates, count(*) filter (where a.status in ('analyzed','embedded'))::int as analysed from dam.assets a join dam.sources s on s.id = a.source_id
       where a.deleted_at is null and a.duplicate_of is null and a.flags->>'candidate' = 'product-ref'${filter} group by 1`, params),
    q(`select * from (select ${B} as brand, a.id, a.source_id, a.path, a.kind, a.status, a.modified_at, a.created_at as indexed_at,
         row_number() over (partition by ${B} order by a.created_at desc) as r from dam.assets a join dam.sources s on s.id = a.source_id where a.deleted_at is null${filter}) t where r <= ${Number(newest) || 5}`, params),
    q(`select ${B} as brand, a.kind, j.kind as job, count(*)::int as n from dam.jobs j join dam.assets a on a.id = j.asset_id join dam.sources s on s.id = a.source_id
       where j.status = 'pending' and j.kind in ('analyze','embed') and a.deleted_at is null${filter} group by 1,2,3`, params),
    q(`select id, root, brand_hint, enabled, cursor is not null as has_cursor, round(extract(epoch from (now() - last_sync_at))/60)::int as sync_age_min, left(last_error, 300) as last_error from dam.sources order by id`),
    q(`select coalesce(s.brand_hint,'(none)') as hint, count(*)::int as n from dam.assets a join dam.sources s on s.id = a.source_id where a.deleted_at is null and a.brand is null group by 1`),
    q(`select id, activity, round(extract(epoch from (now() - last_seen_at)))::int as seen_s_ago from dam.workers order by last_seen_at desc limit 3`),
    q(`select source_id, count(*)::int as n from dam.jobs where kind = 'discover' and status = 'dead' group by 1`),
  ]);
  const vision = config?.vision?.model || "gemini-2.5-flash";
  const embedModel = config?.embed?.model || "gemini-embedding-2";
  const brandIds = new Set([...kinds.map((row) => row.brand), ...(brand ? [brand] : [])]);
  const nodeName = (id) => graph?.nodes?.find((node) => node.id === id)?.name || id;
  const liveWorker = workers.some((worker) => worker.seen_s_ago < 180);
  const report = [];
  for (const id of [...brandIds].sort((a, b) => (a === UNASSIGNED) - (b === UNASSIGNED) || String(a).localeCompare(String(b)))) {
    const sum = (rows) => rows.filter((row) => row.brand === id);
    const byKind = Object.fromEntries(sum(kinds).sort((a, b) => b.n - a.n).map((row) => [row.kind, row.n]));
    const byClass = Object.fromEntries(sum(classes).sort((a, b) => b.n - a.n).map((row) => [row.class, row.n]));
    const byStatus = Object.fromEntries(sum(stages).map((row) => [row.status, row.n]));
    const files = Object.values(byKind).reduce((n, v) => n + v, 0);
    const stage = { discovered: byStatus.discovered || 0, probed: byStatus.probed || 0, analyzed: byStatus.analyzed || 0, embedded: byStatus.embedded || 0, failed: byStatus.failed || 0, skipped: byStatus.skipped || 0 };
    stage.understood = stage.analyzed + stage.embedded;
    const pendingRows = sum(pending);
    const analyzePending = pendingRows.filter((row) => row.job === "analyze");
    const analyzeImages = analyzePending.filter((row) => row.kind !== "video").reduce((n, row) => n + row.n, 0);
    const analyzeVideos = analyzePending.filter((row) => row.kind === "video").reduce((n, row) => n + row.n, 0);
    const analyzeUsd = analyzeImages * (estimateUsd(vision, "vision-image") + estimateUsd(embedModel, "embed", 2)) + analyzeVideos * (estimateUsd(vision, "vision-video") + estimateUsd(embedModel, "embed", 2));
    const catalogConfig = brandCatalogConfig(id);
    const catalog = catalogConfig ? catalogCoverage(root, id) : null;
    const brandSources = sources.filter((source) => source.brand_hint === id);
    const render = sum(renders)[0] || { candidates: 0, analysed: 0 };
    const next = [];
    for (const source of brandSources) {
      if (!source.enabled) next.push(`source ${source.id} is disabled (${source.last_error || "no reason"}) — re-point it: npm run content -- dam add-source ${source.id} --dropbox "<new root>"`);
      else if (source.last_error && !/^root moved/.test(source.last_error)) next.push(`source ${source.id} reports: ${source.last_error.slice(0, 120)}`);
    }
    const dead = deadDiscover.filter((row) => brandSources.some((source) => source.id === row.source_id)).reduce((n, row) => n + row.n, 0);
    if (dead) next.push(`${dead} dead discover jobs — npm run content -- dam recover --dry-run, then without --dry-run`);
    if (!liveWorker) next.push("no live worker heartbeat — deploy/restart the hosted worker (docs/DAM.md runbook)");
    const unbrandedHere = unbranded.find((row) => row.hint === id)?.n || 0;
    if (unbrandedHere) next.push(`${unbrandedHere} files carry no brand yet — npm run content -- dam backfill-brands (free)`);
    if (stage.discovered) next.push(`${stage.discovered} files wait for the free probe (the worker drains them)`);
    if (catalogConfig && !catalog?.exists) next.push(`no product catalog — npm run content -- dam catalog --brand ${catalogConfig.key} --write`);
    if (render.candidates > render.analysed) next.push(`${render.candidates - render.analysed} product-render candidates not analysed — approve the render pass (≈ $${((render.candidates - render.analysed) * (estimateUsd(vision, "vision-image") + estimateUsd(embedModel, "embed", 2))).toFixed(2)})`);
    if (analyzeImages + analyzeVideos) next.push(`${analyzeImages + analyzeVideos} analyze jobs pending (≈ $${analyzeUsd.toFixed(2)}) — need approval and a spend cap`);
    if (catalog?.exists && !catalog.reviewed) next.push(`catalog is unreviewed (${catalog.itemsWithRender}/${catalog.items} items have a render, ${catalog.itemsWithReviewedRender} reviewed) — review its folders`);
    if (id !== UNASSIGNED && !brandSources.length) next.push("no Dropbox source for this brand — add one with dam add-source when the team creates its folder");
    report.push({
      brand: id, name: id === UNASSIGNED ? UNASSIGNED : nodeName(id), files, gigabytes: Math.round(sum(kinds).reduce((n, row) => n + row.bytes, 0) / 1e8) / 10,
      byKind, byClass, stages: stage, renderCandidates: { ...render, pending: render.candidates - render.analysed },
      pendingPaid: { analyzeImages, analyzeVideos, embed: pendingRows.filter((row) => row.job === "embed").reduce((n, row) => n + row.n, 0), estimatedUsd: Math.round(analyzeUsd * 100) / 100 },
      catalog, sources: brandSources.map(({ id: sid, root: sroot, enabled, sync_age_min, last_error }) => ({ id: sid, root: sroot, enabled, syncAgeMin: sync_age_min, lastError: last_error })),
      newest: sum(recent).map(({ id: aid, source_id, path: p, kind, status, modified_at, indexed_at }) => ({ id: aid, source: source_id, path: p, kind, status, modifiedAt: modified_at, indexedAt: indexed_at })),
      next: next[0] || "nothing pending", nextActions: next,
    });
  }
  // Configured catalog brands with no files at all (NuLumin / Noble Harbor have no Dropbox folders yet).
  for (const config of Object.values(BRAND_CATALOGS)) if ((!brand || brand === config.brandId) && !brandIds.has(config.brandId)) report.push({ brand: config.brandId, name: config.name, files: 0, next: "no files indexed — register its Dropbox folders", nextActions: [], catalog: catalogCoverage(root, config.brandId) });
  return { generatedAt: new Date().toISOString(), liveWorker, workers, brands: report };
}

/** Compact text, one block per brand. */
export function renderBrandsText(result) {
  const lines = [`DAM by brand · ${result.liveWorker ? "worker live" : "NO LIVE WORKER"} · ${result.generatedAt}`];
  for (const b of result.brands) {
    lines.push("", `== ${b.name} (${b.brand}) — ${b.files} files${b.gigabytes ? `, ${b.gigabytes} GB` : ""} ==`);
    if (!b.files) { lines.push(`  next: ${b.next}`); continue; }
    lines.push(`  kinds: ${Object.entries(b.byKind).map(([k, n]) => `${k} ${n}`).join(", ")}`);
    lines.push(`  classes: ${Object.entries(b.byClass).slice(0, 8).map(([k, n]) => `${k} ${n}`).join(", ")}`);
    lines.push(`  stages: discovered ${b.stages.discovered} · probed ${b.stages.probed} · analysed ${b.stages.analyzed} · embedded ${b.stages.embedded} · failed ${b.stages.failed} · skipped ${b.stages.skipped}`);
    lines.push(`  product renders: ${b.renderCandidates.candidates} candidates, ${b.renderCandidates.analysed} analysed`);
    if (b.catalog) lines.push(b.catalog.exists ? `  catalog: ${b.catalog.itemsWithReviewedRender}/${b.catalog.items} items with a reviewed render, ${b.catalog.itemsWithRender} with any render${b.catalog.reviewed ? "" : " (UNREVIEWED)"} — ${b.catalog.file}` : `  catalog: none (${b.catalog.file})`);
    lines.push(`  pending paid: ${b.pendingPaid.analyzeImages} image + ${b.pendingPaid.analyzeVideos} video analyses ≈ $${b.pendingPaid.estimatedUsd}`);
    for (const s of b.sources) lines.push(`  source ${s.id}${s.enabled ? "" : " [DISABLED]"}: ${s.root} · synced ${s.syncAgeMin ?? "never"} min ago${s.lastError ? ` · ${s.lastError.slice(0, 100)}` : ""}`);
    for (const n of b.newest.slice(0, 3)) lines.push(`  newest: ${String(n.indexedAt).slice(0, 10)} ${n.path.slice(-70)} (${n.status})`);
    lines.push(`  next: ${b.next}`);
  }
  return lines.join("\n");
}
