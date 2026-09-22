// The reviewed product catalog: what the content-gen MCPs (image and video) resolve products against.
// Built from the SKU registry (state-prefixed line names, flavours, codes), the folder map (a person's decision
// per render folder, design tags, device generations) and the matcher's assignments. One JSON per brand:
// knowledge/skus/catalog.<brand>.json — lines → items → assets (id, path, composition, angle, generation,
// design tag, current or previous design), plus "groups": folders that are a category rather than a SKU line
// (devices, group shots, badges, Moods…). Nothing here calls a model; rebuild with `skus catalog`.
import fs from "node:fs";
import path from "node:path";
import { computeCoverage, loadLibrary, indexFolderMap, folderPathOf, previousDesignOf, deviceIterationOf, deviceGenerationOf, compositionLabel } from "./coverage.mjs";

const REGISTRY_FILE = { muha: "muha-meds" };
export function catalogFile(root, brand) { return path.join(root, "knowledge", "skus", `catalog.${brand}.json`); }
export function loadCatalog(root, brand) { const file = catalogFile(root, brand); return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null; }

export function buildCatalog(root, { brand = "muha", libraryFile }) {
  const registry = JSON.parse(fs.readFileSync(path.join(root, "knowledge", "skus", `${REGISTRY_FILE[brand] || brand}.json`), "utf8"));
  const map = JSON.parse(fs.readFileSync(path.join(root, "knowledge", "skus", `folder-map.${brand}.json`), "utf8"));
  const folderByPath = new Map(map.folders.map((f) => [f.path, f]));
  indexFolderMap(map);
  const library = loadLibrary(libraryFile, brand);
  const coverage = computeCoverage(registry, library);
  const byId = new Map(library.map((a) => [a.id, a]));
  const assetEntry = (a, category) => {
    const folder = folderByPath.get(folderPathOf(a)) || null;
    const previous = deviceIterationOf(a) || previousDesignOf(a);
    return { id: a.id, path: a.path, composition: a.composition || null, compositionLabel: compositionLabel(a.composition, category), angle: a.angle || null, generation: folder?.generation ?? deviceGenerationOf(a.path), designTag: folder?.designTag || null, folder: folder?.path || null, current: !previous, previous: previous || null, alpha: Boolean(a.alpha), quality: a.quality ?? null, verdict: a.verdict || null, thumb: a.thumb || null };
  };
  const perLine = new Map();
  for (const [assetId, hits] of Object.entries(coverage.assignments)) for (const hit of hits) { const key = `${hit.line}|${hit.item}`; (perLine.get(key) || perLine.set(key, []).get(key)).push(assetId); }
  const lines = registry.lines.map((line) => {
    const items = line.items.map((item) => {
      const ids = perLine.get(`${line.id}|${item.name}`) || [];
      const assets = ids.map((id) => byId.get(id)).filter(Boolean).map((a) => assetEntry(a, line.category)).sort((x, y) => Number(y.current) - Number(x.current) || (y.quality || 0) - (x.quality || 0));
      return { name: item.name, sku: item.sku || null, altSkus: item.altSkus || [], discontinued: Boolean(item.discontinued), inDevelopment: Boolean(item.inDevelopment), assets };
    });
    const folders = [...new Set(items.flatMap((i) => i.assets.map((a) => a.folder)).filter(Boolean))].map((p) => { const f = folderByPath.get(p); return { path: p, designTag: f?.designTag || null, generation: f?.generation ?? null, files: f?.files ?? null, decision: f?.decision?.verdict || null }; });
    return { id: line.id, name: line.name || line.line, title: line.line, market: line.market || null, category: line.category, format: line.format || null, generation: line.generation || null, variant: line.variant || null, skuBlock: line.skuBlock || null, mergedFrom: line.mergedFrom || [], folders, items, covered: items.filter((i) => i.assets.length).length };
  });
  const groups = map.folders.filter((f) => !f.lines.length && (f.kind || (f.decision && f.decision.verdict === "ok" && !f.status))).map((f) => ({ path: f.path, kind: f.kind || null, designTag: f.designTag || null, generation: f.generation ?? null, files: f.files, status: f.status || null, assets: library.filter((a) => folderPathOf(a) === f.path).map((a) => assetEntry(a, f.path.split("/")[1] || "")) }));
  const catalog = { brand, builtAt: new Date().toISOString(), scope: map.scope, lines, groups, totals: { lines: lines.length, items: lines.reduce((n, l) => n + l.items.length, 0), itemsWithAssets: lines.reduce((n, l) => n + l.covered, 0), assetsOnLines: new Set(Object.keys(coverage.assignments)).size, groups: groups.length } };
  fs.writeFileSync(catalogFile(root, brand), JSON.stringify(catalog, null, 1) + "\n");
  return { file: path.relative(root, catalogFile(root, brand)), ...catalog.totals };
}

const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const STATES = ["ca", "mi", "mo", "nj", "nm", "ny", "oh", "az", "hemp"];
/** Find the catalog line + flavour a request names: "MI 2G Distillate Disposables Blue Slushie", "Blue Slushie gen 3 packaging", "CA hash rosin mates honey jack". */
export function catalogLookup(catalog, product, intent = "") {
  const q = " " + norm(`${product} ${intent}`) + " ";
  const state = STATES.find((s) => q.includes(` ${s} `)) || null;
  const gen = (q.match(/\bgen ?(\d)\b/) || [])[1] || null;
  const scored = [];
  for (const line of catalog.lines) {
    const lineWords = norm(line.title).split(" ").filter((w) => w.length >= 3);
    const lineHits = lineWords.filter((w) => q.includes(` ${w} `)).length;
    for (const item of line.items) {
      const flavour = norm(item.name).replace(/\b(i|s|h|indica|sativa|hybrid)\b/g, "").trim();
      if (flavour.length < 3 || !q.includes(` ${flavour} `)) continue;
      let score = 10 + flavour.length / 10 + lineHits * 2;
      if (state) score += line.market && line.market.toLowerCase() === state ? 5 : -5;
      if (gen && line.generation) score += String(line.generation).includes(gen) ? 3 : -3;
      if (!item.assets.length) score -= 4;
      scored.push({ score, line, item });
    }
    if (!line.items.some((item) => q.includes(` ${norm(item.name)} `)) && lineHits >= Math.max(2, lineWords.length - 1) && (!state || (line.market || "").toLowerCase() === state)) scored.push({ score: 5 + lineHits, line, item: null });
  }
  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  const best = scored[0];
  const alternatives = scored.slice(1, 6).filter((s) => s.line.id !== best.line.id || (s.item && best.item && s.item.name !== best.item.name)).map((s) => ({ line: s.line.name, flavour: s.item?.name || null, assets: s.item ? s.item.assets.length : s.line.items.reduce((n, i) => n + i.assets.length, 0) }));
  return { line: best.line, item: best.item, gen, state, alternatives };
}
