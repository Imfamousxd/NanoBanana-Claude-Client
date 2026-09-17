// Folder map: the review unit for SKU ↔ render assignment is the design folder, not the file. Renders arrive
// in folders that already mean one thing ("CA_1G_Distillate_TechDesign_June2025" is one product line, one
// market, one packaging design), so a person reviews ~300 folders once instead of ~1,200 SKU rows, and every
// file in a folder inherits the folder's decision. The map is written to knowledge/skus/folder-map.<brand>.json;
// the review page saves each click to the artifact's database, and `skus folders --decisions` merges them back.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { computeCoverage, loadLibrary, indexFolderMap, folderPathOf, deviceIterationOf, previousDesignOf, quarantined, compositionLabel, lineName } from "./coverage.mjs";

const REGISTRY_FILE = { muha: "muha-meds" };
const GENERIC_RE = /ai resources|master case|group shot|website images|badge|catalog resized|motion\/|redesign ?test/i;
const NOT_PRODUCT_RE = /^Renders\/(Website Images|Motion|Apparel|Labubu|Ape|HOTKNIFES|Giveaway Tickets|Muha_Vaults|Catalyst|Ai Resources|Multi Product Group Shots|Master Case Group Shots|TEMP|CA catalog resized)(\/|$)/i;
export const idOf = (folderPath) => crypto.createHash("sha1").update(folderPath).digest("hex").slice(0, 16);

function readDecisions(file) {
  // A directory of JSON documents (one per folder id, as `read_db --out_dir` saves them) or one JSON file
  // holding an array / an object keyed by folder id.
  if (!file) return new Map();
  const out = new Map();
  const take = (id, doc) => { if (doc && doc.verdict) out.set(id, { verdict: doc.verdict, lineId: doc.lineId || null, lineLabel: doc.lineLabel || null, note: doc.note || "", at: doc.at || null }); };
  if (fs.statSync(file).isDirectory()) {
    const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (entry.name.endsWith(".json")) { const doc = JSON.parse(fs.readFileSync(full, "utf8")); take(doc.id || doc.__id || path.basename(entry.name, ".json"), doc.data || doc); } } };
    walk(file);
  } else {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(data)) for (const doc of data) take(doc.id, doc.data || doc);
    else for (const [id, doc] of Object.entries(data)) take(id, doc);
  }
  return out;
}

// Whole-folder checks. Four sample pictures do not prove the other files, so every file is compared with its
// folder two ways: (1) the label words the vision model read on it (strength, device, size, packaging) against
// what most of the folder says; (2) how far its visual embedding sits from the folder's visual centre. Files
// that disagree are listed on the row as "look different", with the reason.
const FAMILIES = {
  strength: [["live resin", /live ?resin/], ["melted diamond", /melted ?diamond/], ["hash rosin", /hash ?rosin/], ["distillate", /distillate/], ["THC-A", /thc-?a\b/]],
  device: [["pod battery kit", /battery kit|combo kit/], ["vape pod", /vape pod/], ["cart", /\bcart(ridge)?s?\b/], ["disposable", /disposable|all[- ]?in[- ]?one/], ["pre-roll", /pre-?roll|\bjoint/], ["gummies", /gumm/], ["flower", /\bflower\b/]],
  size: [["0.5g", /\b0?\.5 ?g\b|\b500 ?mg\b/], ["1g", /\b1 ?g(ram)?\b|\b1000 ?mg\b/], ["2g", /\b2 ?g(rams)?\b|\b2000 ?mg\b/], ["3.5g", /3\.5 ?g|3500 ?mg/]],
  packaging: [["metal can", /metal can|\btin\b/], ["mylar", /mylar/], ["jar", /\bjar/]],
};
function labelSignature(asset, flavourNames) {
  let t = `${(asset.text || []).join(" ")} ${asset.product || ""} ${asset.title || ""}`.toLowerCase();
  for (const name of flavourNames) t = t.split(name).join(" ");
  return Object.fromEntries(Object.entries(FAMILIES).map(([family, values]) => [family, new Set(values.filter(([, re]) => re.test(t)).map(([k]) => k))]));
}
function labelConflicts(assets, flavourNames) {
  const sigs = new Map(assets.map((a) => [a.id, labelSignature(a, flavourNames)]));
  const out = new Map();
  if (assets.length < 4) return out;
  for (const family of Object.keys(FAMILIES)) {
    const count = new Map(); for (const sig of sigs.values()) for (const v of sig[family]) count.set(v, (count.get(v) || 0) + 1);
    const majority = [...count.entries()].filter(([, n]) => n >= 0.6 * assets.length).map(([v]) => v);
    if (majority.length !== 1) continue;
    for (const a of assets) { const have = sigs.get(a.id)[family]; const other = [...have].filter((v) => v !== majority[0]); if (other.length && !have.has(majority[0])) out.set(a.id, `${family}: reads "${other.join(", ")}", the folder is "${majority[0]}"`); }
  }
  return out;
}
async function visualDistances(root, library, folderOf) {
  try {
    const { loadEnv } = await import("../core/env.mjs"); const { DamDb } = await import("../dam/db.mjs"); const { damConfig } = await import("../dam/config.mjs");
    loadEnv(root); const db = new DamDb(damConfig(root).databaseUrl);
    const entries = library.map((a) => [a.id, folderOf.get(a.id)]).sort((a, b) => a[1].localeCompare(b[1]));
    const out = new Map();
    let start = 0;
    while (start < entries.length) {
      // Chunks of about 2,000 files, extended to the end of the folder they stop in (a centroid needs the whole folder).
      let end = Math.min(entries.length, start + 2000); while (end < entries.length && entries[end][1] === entries[end - 1][1]) end += 1;
      const chunk = entries.slice(start, end);
      const values = chunk.map((e, k) => `($${k * 2 + 1}::uuid,$${k * 2 + 2})`).join(","); const params = chunk.flat();
      const sql = `with m(id,folder) as (values ${values}), c as (select m.folder, avg(a.embedding_visual) as centroid, count(*) n from dam.assets a join m on m.id=a.id where a.embedding_visual is not null group by m.folder) select a.id, c.n, (a.embedding_visual <=> c.centroid) as dist from dam.assets a join m on m.id=a.id join c on c.folder=m.folder where a.embedding_visual is not null`;
      for (const row of (await db.query(sql, params)).rows) out.set(row.id, { n: Number(row.n), dist: Number(row.dist) });
      start = end;
    }
    await db.end(); return out;
  } catch (error) { console.error("visual check skipped:", error.message); return new Map(); }
}
function statusOf(asset) {
  if (quarantined(asset)) return "folder marked WRONG";
  const iteration = deviceIterationOf(asset); if (iteration) return `older device: ${iteration}`;
  const previous = previousDesignOf(asset); if (previous) return previous;
  if (NOT_PRODUCT_RE.test(asset.path)) return "not a product render folder";
  if (GENERIC_RE.test(asset.path)) return "generic (badges, group shots, website composites)";
  return null;
}

function proposalOf(folder) {
  const lines = folder.lines;
  if (lines.length) {
    const top = lines[0];
    const more = lines.length > 1 ? ` (+${lines.length - 1} more line${lines.length > 2 ? "s" : ""}: ${lines.slice(1, 3).map((l) => l.name).join("; ")})` : "";
    const flavours = top.flavours.slice(0, 6).join(", ") + (top.flavours.length > 6 ? ` +${top.flavours.length - 6}` : "");
    const rest = folder.files - folder.assigned;
    return `Feeds ${top.name}${top.generation ? " · " + top.generation : ""}${top.skuBlock ? " · " + top.skuBlock : ""}${more} — ${folder.assigned} of ${folder.files} files on rows${rest ? `, ${rest} on no row` : ""}. Flavours: ${flavours}.`;
  }
  if (folder.status) return `On no SKU row — ${folder.status} (${folder.files} files).`;
  return `On no SKU row — nothing in the book matched (${folder.files} files).`;
}

// What a "Yes" click commits to, in the reviewer's words.
function meaningOf(folder) {
  const lines = folder.lines;
  if (lines.length === 1) return `Yes means: every file in this folder is ${lines[0].name} and its flavours are named from the book.`;
  if (lines.length > 1) return `Yes means: this folder is split between ${lines.map((l) => l.name).join(" and ")}, as shown. Pick "This is one line…" to give the whole folder one name instead.`;
  if (folder.status) return `Yes means: this folder stays off every SKU row (${folder.status}).`;
  return `Yes means: this folder stays off every SKU row (nothing in the book matched). Pick "This is one line…" if it is a product.`;
}
// The folder's own classification words, kept as context: "CA_1G_Distillate_TechDesign_June2025" fed to the
// line "CA 1G Distillate Disposables" leaves "TechDesign June 2025"; "NM_1G_Distillate_Carts OLD" leaves "OLD";
// "CA_1G_Distillate_All in One_Sept2024" leaves "All in One Sept 2024". Words the line name already says, the
// state code, sizes, strength shorthands and generic words are dropped; everything else is passed on verbatim.
const DROP_WORDS = /^(muha|mm|meds|renders?|product|products|dispo|dispos|disposable|disposables|cart|carts|cartridge|cartridges|hr|lr|md|thca|thc|a|d9|distillate|distallite|the|of|and|with|main|under|5mb|mb|final|finals)$/i;
export function designTagOf(folderName, line) {
  const said = new Set(`${line?.market || ""} ${line?.line || ""} ${line?.category || ""} ${line?.format || ""}`.toLowerCase().replace(/[^a-z0-9.]+/g, " ").split(" ").filter(Boolean));
  const words = String(folderName).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Za-z])(?=\d)/g, "$1 ").replace(/(\d)(?=[A-Za-z])/g, "$1 ").replace(/[()\[\]-]+/g, " ").split(/\s+/).filter(Boolean);
  const kept = words.filter((w, i) => { const l = w.toLowerCase(); if (DROP_WORDS.test(l) || said.has(l)) return false; if (/^(ca|mi|mo|nj|nm|ny|oh|az|hemp)$/i.test(l)) return false; if (/^\d+(\.\d+)?g$/i.test(l) || /^0?\.?5g$/i.test(l) || /^\d+ct$/i.test(l)) return false; if (/^g$/i.test(l) && words.some((x) => /^\d/.test(x))) return false; if (/^\d+(\.\d+)?$/.test(l) && !/^20\d\d$/.test(l) && !/^gen$/i.test(words[i - 1] || "")) return false; return true; });
  // re-join split camel words the folder wrote as one ("Tech Design" stays as the folder wrote it)
  return kept.join(" ").replace(/\s+/g, " ").trim();
}
// Same-titled lines in one state get a tag so their names differ: the book's generation when it has one,
// otherwise what feeds them (an OLD / previous-design folder → "old design"; a Gen-N folder → "Gen N"; a dated
// current folder → "<year> design"; V2 codes → "V2"), otherwise their order in the book ("older" / "newer").
// Two lines with the same title and the same flavours are one line written twice in the sheet: the copy is dropped.
export function nameLines(registry, folders) {
  const feeding = new Map();
  for (const f of folders) for (const l of f.lines) (feeding.get(l.id) || feeding.set(l.id, []).get(l.id)).push({ folder: f.path.split("/").pop(), status: f.status, files: l.files });
  const groups = new Map();
  for (const line of registry.lines) { const key = `${line.market || ""}|${String(line.line).trim().toLowerCase()}`; (groups.get(key) || groups.set(key, []).get(key)).push(line); }
  const dropped = [];
  for (const line of registry.lines) line.name = [line.market, line.line].filter(Boolean).join(" ");
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // drop exact copies (same flavours, same codes)
    const seen = new Map();
    for (const line of group) { const sig = line.items.map((i) => `${i.name}|${i.sku || ""}`).sort().join(";"); if (seen.has(sig)) { dropped.push(line.id); line.duplicateOf = seen.get(sig); } else seen.set(sig, line.id); }
    const live = group.filter((l) => !l.duplicateOf);
    if (live.length < 2) continue;
    const labels = live.map((line) => {
      const feeds = (feeding.get(line.id) || []).sort((a, b) => (a.status ? 1 : 0) - (b.status ? 1 : 0) || b.files - a.files);
      const tag = feeds.length ? designTagOf(feeds[0].folder, line) : "";
      const v2 = line.items.length && line.items.every((i) => /^V2-/i.test(i.sku || "")) ? "V2" : null;
      const parts = [line.generation, tag && tag.toLowerCase() !== String(line.generation || "").toLowerCase() ? tag : null, v2].filter(Boolean);
      return parts.length ? parts.join(" · ") : null;
    });
    // fill the gaps by book order: the earlier block is the older line
    const unlabelled = live.map((l, i) => i).filter((i) => !labels[i]);
    if (unlabelled.length === live.length) { unlabelled.forEach((i, k) => { labels[i] = k === 0 ? "older" : k === 1 && live.length === 2 ? "newer" : `set ${k + 1}`; }); }
    else for (const i of unlabelled) labels[i] = labels.includes("old design") ? "newer" : "older";
    const used = new Map(); live.forEach((line, i) => { let label = labels[i]; if (used.has(label)) label = `${label} ${line.skuBlock || used.get(label) + 1}`; used.set(labels[i], (used.get(labels[i]) || 0) + 1); line.variant = label; line.name = `${[line.market, line.line].filter(Boolean).join(" ")} (${label})`; });
  }
  registry.lines = registry.lines.filter((l) => !l.duplicateOf);
  return { dropped };
}
export async function buildFolderMap(root, { brand = "muha", libraryFile, page, decisions }) {
  const registryFile = path.join(root, "knowledge", "skus", `${REGISTRY_FILE[brand] || brand}.json`);
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  const library = loadLibrary(libraryFile, brand);
  const mapFile = path.join(root, "knowledge", "skus", `folder-map.${brand}.json`);
  const previous = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, "utf8")) : { folders: [] };
  const known = new Map(previous.folders.filter((f) => f.decision).map((f) => [f.path, f.decision]));
  const incoming = readDecisions(decisions);
  const byId = new Map(previous.folders.map((f) => [f.id, f.path]));
  for (const asset of library) { const fp = folderPathOf(asset); byId.set(idOf(fp), fp); }
  for (const [id, decision] of incoming) { const fp = byId.get(id); if (fp) known.set(fp, decision); }
  indexFolderMap({ folders: [...known.entries()].map(([fp, decision]) => ({ path: fp, decision })) });
  const coverage = computeCoverage(registry, library);
  const linesById = new Map(registry.lines.map((line) => [line.id, line]));
  const folderOf = new Map(library.map((a) => [a.id, folderPathOf(a)]));
  const visual = await visualDistances(root, library, folderOf);
  const flavourNames = [...new Set(registry.lines.flatMap((l) => l.items.map((i) => i.name.toLowerCase())).filter((n) => n.length >= 5))].sort((a, b) => b.length - a.length);
  const groups = new Map();
  for (const asset of library) {
    const fp = folderPathOf(asset);
    const g = groups.get(fp) || { path: fp, id: idOf(fp), files: 0, assigned: 0, lines: new Map(), markets: new Map(), statuses: new Map(), samples: [], compositions: new Map() };
    g.files += 1;
    const market = (asset.render || {}).market; if (market) g.markets.set(market, (g.markets.get(market) || 0) + 1);
    const assigned = coverage.assignments[asset.id];
    if (assigned) { g.assigned += 1; const seen = new Set(); for (const { line, item } of assigned) { const e = g.lines.get(line) || { files: 0, items: new Set() }; if (!seen.has(line)) { e.files += 1; seen.add(line); } e.items.add(item); g.lines.set(line, e); } }
    const status = statusOf(asset); if (status) g.statuses.set(status, (g.statuses.get(status) || 0) + 1);
    const comp = compositionLabel(asset.composition, fp.split("/")[1] || ""); g.compositions.set(comp, (g.compositions.get(comp) || 0) + 1);
    if (g.samples.length < 4 && asset.thumb) g.samples.push({ id: asset.id, path: asset.path, thumb: asset.thumb, source_id: asset.source_id, composition: comp });
    (g.assets ||= []).push(asset);
    groups.set(fp, g);
  }
  for (const g of groups.values()) {
    const conflicts = labelConflicts(g.assets, flavourNames);
    const dists = g.assets.map((a) => visual.get(a.id)?.dist).filter((d) => d !== undefined).sort((a, b) => a - b);
    const median = dists.length ? dists[Math.floor(dists.length / 2)] : null;
    const cut = median === null ? null : Math.max(0.09, median + 0.05);
    g.outliers = g.assets.map((a) => { const v = visual.get(a.id); const why = []; if (conflicts.has(a.id)) why.push(conflicts.get(a.id)); if (v && cut !== null && g.assets.length >= 4 && v.dist > cut) why.push(`looks different from the rest (distance ${v.dist.toFixed(2)}, folder typical ${median.toFixed(2)})`); return why.length ? { id: a.id, path: a.path, thumb: a.thumb, source_id: a.source_id, composition: compositionLabel(a.composition, g.path.split("/")[1] || ""), why: why.join("; ") } : null; }).filter(Boolean).slice(0, 8);
    g.checked = { files: g.assets.length, visual: dists.length, labels: g.assets.length >= 4 };
    g.unassigned = g.assets.filter((a) => !coverage.assignments[a.id]).map((a) => a.path.split("/").pop());
    delete g.assets;
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const folders = [...groups.values()].map((g) => {
    const lines = [...g.lines.entries()].map(([id, e]) => { const l = linesById.get(id) || {}; return { id, name: l.line ? lineName(l) : id, line: l.line || id, market: l.market || null, skuBlock: l.skuBlock || null, generation: l.generation || null, files: e.files, flavours: [...e.items] }; }).sort((a, b) => b.files - a.files);
    const folder = { id: g.id, path: g.path, files: g.files, assigned: g.assigned, market: top(g.markets), status: top(g.statuses), compositions: Object.fromEntries(g.compositions), lines, samples: g.samples, outliers: g.outliers || [], checked: g.checked, unassigned: g.unassigned || [], decision: known.get(g.path) || null };
    folder.designTag = designTagOf(g.path.split("/").pop(), lines[0] ? linesById.get(lines[0].id) : null);
    folder.proposal = proposalOf(folder);
    folder.meaning = meaningOf(folder);
    return folder;
  }).sort((a, b) => a.path.localeCompare(b.path));
  const naming = nameLines(registry, folders);
  for (const f of folders) for (const l of f.lines) { const reg = linesById.get(l.id); if (reg) l.name = reg.name; }
  for (const f of folders) { f.proposal = proposalOf(f); f.meaning = meaningOf(f); }
  fs.writeFileSync(registryFile, JSON.stringify(registry, null, 1) + "\n");
  const map = { brand, builtAt: new Date().toISOString(), scope: brand === "muha" ? "Renders/ only" : "all", naming, folders: folders.map(({ samples, outliers, ...rest }) => ({ ...rest, samples: samples.map((s) => ({ id: s.id, path: s.path })), outliers: outliers.map((o) => ({ id: o.id, path: o.path, why: o.why })) })) };
  fs.writeFileSync(mapFile, JSON.stringify(map, null, 1) + "\n");
  let pageFile = null;
  if (page) { fs.writeFileSync(page, await buildReviewPage(root, { ...map, folders }, registry)); pageFile = page; }
  return { file: path.relative(root, mapFile), folders: folders.length, files: library.length, decided: folders.filter((f) => f.decision).length, onRows: folders.filter((f) => f.lines.length).length, renamed: registry.lines.filter((l) => l.variant).map((l) => l.name), droppedDuplicates: naming.dropped, page: pageFile };
}

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function thumbData(root, asset, cacheDir) {
  const file = path.join(cacheDir, asset.id + ".jpg");
  if (!fs.existsSync(file)) {
    try { const sharp = (await import("sharp")).default; const r = await fetch(asset.thumb); if (!r.ok) return null; const buf = Buffer.from(await r.arrayBuffer()); await sharp(buf).resize({ height: 72, width: 96, fit: "inside" }).jpeg({ quality: 55, mozjpeg: true }).toFile(file); } catch { return null; }
  }
  return "data:image/jpeg;base64," + fs.readFileSync(file).toString("base64");
}

async function dropboxRoots(root) {
  try {
    const { loadEnv } = await import("../core/env.mjs"); const { DamDb } = await import("../dam/db.mjs"); const { damConfig } = await import("../dam/config.mjs");
    loadEnv(root); const db = new DamDb(damConfig(root).databaseUrl); const rows = (await db.query("select id, root from dam.sources")).rows; await db.end();
    return Object.fromEntries(rows.map((r) => [r.id, r.root]));
  } catch { return {}; }
}

export async function buildReviewPage(root, map, registry) {
  const cacheDir = path.join(process.env.SKU_THUMB_CACHE || path.join(root, ".content-engine", "thumb72")); fs.mkdirSync(cacheDir, { recursive: true });
  const roots = await dropboxRoots(root);
  const sourceOf = (folder) => folder.samples[0]?.source_id;
  const folderLink = (folder) => { const r = roots[sourceOf(folder)]; return r ? "https://www.dropbox.com/home" + (r + "/" + folder.path).split("/").map(encodeURIComponent).join("/") : null; };
  const fileLink = (folder, sample) => { const r = roots[sample.source_id]; if (!r) return null; const full = r + "/" + sample.path; const dir = full.slice(0, full.lastIndexOf("/")); const name = full.slice(full.lastIndexOf("/") + 1); return "https://www.dropbox.com/home" + dir.split("/").map(encodeURIComponent).join("/") + "?preview=" + encodeURIComponent(name); };
  const thumbs = {};
  let i = 0; const all = map.folders.flatMap((f) => [...f.samples, ...f.outliers.filter((o) => o.thumb)]);
  await Promise.all(Array.from({ length: 8 }, async () => { while (i < all.length) { const s = all[i++]; const uri = await thumbData(root, s, cacheDir); if (uri) thumbs[s.id] = uri; } }));
  const lines = registry.lines.map((l) => ({ id: l.id, market: l.market || "—", label: `${lineName(l)}${l.format ? " " + l.format : ""}${l.generation ? " · " + l.generation : ""}${l.skuBlock ? " · " + l.skuBlock : ""} [${l.category}]` }));
  const parents = new Map();
  for (const f of map.folders) { const parent = f.path.split("/").slice(0, -1).join("/") || f.path; (parents.get(parent) || parents.set(parent, []).get(parent)).push(f); }
  const decided = map.folders.filter((f) => f.decision).length;
  let body = "";
  for (const [parent, folders] of [...parents.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const files = folders.reduce((n, f) => n + f.files, 0);
    body += `<section class="group" data-ids="${folders.map((f) => f.id).join(" ")}"><header><h2>${esc(parent.replace(/^Renders\//, ""))}</h2><span class="dim">${folders.length} folder${folders.length > 1 ? "s" : ""} · ${files} files</span><button class="mini" data-group-ok>Yes to every folder in this group</button></header>`;
    for (const f of folders) {
      const pics = f.samples.map((s) => { const link = fileLink(f, s); const img = thumbs[s.id] ? `<img loading="lazy" data-t="${s.id}" alt="">` : `<div class="nothumb">no thumb</div>`; return `<figure title="${esc(s.path)}">${link ? `<a href="${link}" target="_blank" rel="noopener">${img}</a>` : img}<figcaption>${esc(s.composition)}</figcaption></figure>`; }).join("");
      const link = folderLink(f);
      const name = f.path.split("/").pop();
      const odd = f.outliers.map((o) => { const l = fileLink(f, o); const img = thumbs[o.id] ? `<img loading="lazy" data-t="${o.id}" alt="">` : `<div class="nothumb">no thumb</div>`; return `<figure class="odd" title="${esc(o.path)} — ${esc(o.why)}">${l ? `<a href="${l}" target="_blank" rel="noopener">${img}</a>` : img}<figcaption>${esc(o.why.split(";")[0].slice(0, 60))}</figcaption></figure>`; }).join("");
      const check = f.checked ? (f.outliers.length ? `<div class="check bad"><b>${f.outliers.length} file${f.outliers.length > 1 ? "s" : ""} look different</b> from the rest of this folder (checked all ${f.checked.files}):</div><div class="pics">${odd}</div>` : `<div class="check ok">Checked all ${f.checked.files} files: ${f.checked.labels ? "label words agree" : "too few files to compare labels"}${f.checked.visual ? " · they look alike" : ""}.</div>`) : "";
      const tag = f.designTag && !(f.lines[0] && f.lines[0].name.toLowerCase().includes(f.designTag.toLowerCase())) ? ` <span class="tag" title="Classification words carried over from the Dropbox folder name">${esc(f.designTag)}</span>` : "";
      const headline = f.lines.length ? `${esc(f.lines[0].name)}${tag} <span class="dim">${f.lines[0].skuBlock ? "· " + esc(f.lines[0].skuBlock) : ""}${f.lines.length > 1 ? " · +" + (f.lines.length - 1) + " more line" + (f.lines.length > 2 ? "s" : "") : ""}</span>` : `<span class="dim">No SKU line</span>`;
      const unnamed = f.unassigned.length && f.lines.length ? `<p class="dim small">Not named yet (${f.unassigned.length}): ${esc(f.unassigned.slice(0, 6).join(", "))}${f.unassigned.length > 6 ? " …" : ""}</p>` : "";
      body += `<article class="row" id="f-${f.id}" data-id="${f.id}" data-market="${esc(f.market || "")}"><div class="pics">${pics}</div><div class="what"><div class="headline">${headline}</div><div class="name">${link ? `<a href="${link}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name)} <span class="dim">· ${f.files} files${f.market ? " · " + esc(f.market) : ""}</span></div><p class="proposal">${esc(f.proposal)}</p>${unnamed}${f.status && f.lines.length ? `<p class="dim small">${esc(f.status)}</p>` : ""}<p class="meaning">${esc(f.meaning)}</p>${check}</div><div class="decide"><div class="state" data-state></div><div class="buttons"><button data-v="ok" title="Confirm what the row says">✓ Yes, that's right</button><button data-v="line" title="Give every file in this folder one SKU line from the book">This is one line…</button><button data-v="old" title="Older design or device: keep it off the current SKU rows">Old design</button><button data-v="skip" title="Not a product render, or a category with no book line">Not a product</button></div><div class="lineform" hidden><select data-sel><option value="">Pick the line this folder belongs to…</option></select><label class="small"><input type="checkbox" data-allmarkets> all markets</label></div><input class="note" data-note placeholder="Note (optional): e.g. 'this is the Mavricks SKU', 'glass jars category'"></div></article>`;
    }
    body += `</section>`;
  }
  const css = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Code+Pro&display=swap"><style>:root{--bg:#f6f5f1;--card:#fff;--ink:#1f2a24;--muted:#66706b;--line:#dfe2dd;--accent:#1e5a55;--soft:#e4efec;--bad:#b23a2c;--warn:#9a6b00;--ok:#2f7d4f;color-scheme:light}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15191a;--card:#1d2324;--ink:#e8ebe8;--muted:#9aa4a0;--line:#2c3436;--accent:#6fc2b7;--soft:#1f3532;--bad:#f08a7c;--warn:#e0b45a;--ok:#7dc99a;color-scheme:dark}}:root[data-theme="dark"]{--bg:#15191a;--card:#1d2324;--ink:#e8ebe8;--muted:#9aa4a0;--line:#2c3436;--accent:#6fc2b7;--soft:#1f3532;--bad:#f08a7c;--warn:#e0b45a;--ok:#7dc99a;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14.5px/1.45 "Source Sans 3",system-ui,sans-serif}.wrap{max-width:1280px;margin:0 auto;padding-block:22px 90px;padding-inline:18px}h1{font-size:26px;margin:0 0 4px;text-wrap:balance}.lede{color:var(--muted);max-width:78ch;margin:0 0 10px}.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:4;background:var(--bg);border-bottom:1px solid var(--line);padding:8px 0;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px}.bar b{font-size:15px}progress{width:220px;height:10px}.bar label{display:flex;gap:6px;align-items:center}.bar .save{margin-left:auto;color:var(--muted)}.bar .save.bad{color:var(--bad)}section.group{margin-top:22px}section.group header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:4px;margin-bottom:6px}h2{font:600 15px/1.3 "Source Code Pro",ui-monospace,monospace;margin:0}.dim{color:var(--muted)}.small{font-size:12px}button{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:7px;padding:4px 9px}button:hover{border-color:var(--accent)}button.mini{font-size:12px;padding:2px 8px;margin-left:auto}button.on{background:var(--accent);color:#fff;border-color:var(--accent)}article.row{display:grid;grid-template-columns:412px 1fr 300px;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;align-items:start}article.row.done{opacity:.72}article.row.done.hide{display:none}.pics{display:flex;gap:6px;flex-wrap:wrap}figure{margin:0;width:96px;text-align:center}figure a{display:block}figure img{height:72px;max-width:96px;object-fit:contain;background:repeating-conic-gradient(#e6e6e6 0 25%,#fff 0 50%) 50%/12px 12px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}figcaption{font-size:10.5px;color:var(--muted);line-height:1.2;margin-top:2px}.nothumb{height:72px;width:96px;border:1px dashed var(--line);border-radius:6px;font-size:10px;color:var(--muted);display:flex;align-items:center;justify-content:center}.check{margin-top:6px;font-size:12.5px}.check.ok{color:var(--ok)}.check.bad{color:var(--bad)}figure.odd img{border-color:var(--bad);border-style:dashed}figure.odd figcaption{color:var(--bad)}.headline{font-size:15px;font-weight:700;line-height:1.3}.tag{display:inline-block;font-size:11.5px;font-weight:600;color:var(--accent);background:var(--soft);border-radius:999px;padding:1px 8px;vertical-align:middle;margin-left:4px}.headline .dim{font-weight:400;font-size:13px}.name{font:400 12px "Source Code Pro",ui-monospace,monospace;word-break:break-word;color:var(--muted);margin-top:2px}.meaning{margin:6px 0 0;font-size:12.5px;color:var(--accent)}.name a{color:var(--accent);text-decoration:none}.proposal{margin:4px 0 0}.decide{display:flex;flex-direction:column;gap:6px}.buttons{display:flex;gap:5px;flex-wrap:wrap}.state{min-height:18px;font-size:12.5px;font-weight:600}.state.ok{color:var(--ok)}.state.line{color:var(--accent)}.state.old,.state.skip{color:var(--warn)}.lineform{display:flex;flex-direction:column;gap:4px}select,input.note{font:inherit;width:100%;border:1px solid var(--line);border-radius:7px;padding:4px 6px;background:var(--card);color:var(--ink)}@media (max-width:900px){article.row{grid-template-columns:1fr}.pics{max-width:100%}}</style>`;
  const html = `<title>Muha Render Folders</title>${css}<div class="wrap"><h1>Muha render folders, one decision each</h1><p class="lede">Every folder under the Muha Meds <b>Renders</b> folder, grouped by where it sits. Each row leads with the <b>name from the SKU book</b> that its files will get, plus a green pill with the <b>classification words from the Dropbox folder name</b> ("TechDesign June 2025", "All in One Sept 2024", "OLD") that stay attached to the files as context. The Dropbox path underneath is where they live today. Under that: how many files got a flavour name, which ones did not yet, and one sentence saying exactly what a Yes commits to. One click per folder applies to every file in it. Clicks save as you go and I read them back.</p><p class="lede">Every file in a folder was checked against its folder-mates two ways: the words printed on it (strength, device, size, packaging) and how it looks (its visual fingerprint against the folder's centre). A folder marked <b>checked</b> in green has no exceptions; files that read or look different are shown with a red dashed frame and the reason, so you only need to look at those.</p><div class="bar"><b id="count">${decided} / ${map.folders.length}</b> folders decided <progress id="prog" max="${map.folders.length}" value="${decided}"></progress><label><input type="checkbox" id="hide"> hide decided</label><label><input type="checkbox" id="onlyrows" checked> show folders that are on SKU rows first</label><span class="save" id="save">connecting…</span></div>${body}</div>
<script>const T=${JSON.stringify(thumbs)};for(const img of document.querySelectorAll("img[data-t]")){const u=T[img.dataset.t];if(u)img.src=u;}
const LINES=${JSON.stringify(lines)};const SEED=${JSON.stringify(Object.fromEntries(map.folders.filter((f) => f.decision).map((f) => [f.id, f.decision])))};const PATHS=${JSON.stringify(Object.fromEntries(map.folders.map((f) => [f.id, f.path])))};
const state=Object.assign({},SEED);let db=null;const saveEl=document.getElementById("save");
function label(d){if(!d)return "";if(d.verdict==="ok")return "✓ Yes";if(d.verdict==="line")return "→ "+(d.lineLabel||d.lineId||"another line");if(d.verdict==="old")return "Old design / device";if(d.verdict==="skip")return "Not a product render";return d.verdict;}
function paint(id){const row=document.getElementById("f-"+id);if(!row)return;const d=state[id];const st=row.querySelector("[data-state]");st.textContent=label(d)+(d&&d.note?" · "+d.note:"");st.className="state "+(d?d.verdict:"");row.classList.toggle("done",!!d);for(const b of row.querySelectorAll("button[data-v]"))b.classList.toggle("on",!!d&&b.dataset.v===d.verdict);if(d&&d.note!==undefined){const n=row.querySelector("[data-note]");if(document.activeElement!==n)n.value=d.note||"";}}
function counts(){const n=Object.values(state).filter(Boolean).length;document.getElementById("count").textContent=n+" / "+Object.keys(PATHS).length;document.getElementById("prog").value=n;}
function fillSelect(row){const sel=row.querySelector("[data-sel]");if(sel.dataset.filled)return;const all=row.querySelector("[data-allmarkets]").checked;const m=row.dataset.market;const opts=LINES.filter(l=>all||!m||l.market===m||l.market==="—");const groups={};for(const l of opts)(groups[l.market]=groups[l.market]||[]).push(l);sel.innerHTML='<option value="">Pick the line this folder belongs to…</option>'+Object.keys(groups).sort().map(k=>'<optgroup label="'+k+'">'+groups[k].map(l=>'<option value="'+l.id+'">'+l.label.replace(/</g,"&lt;")+'</option>').join("")+'</optgroup>').join("");sel.dataset.filled=all?"all":"market";}
async function save(id,patch){const prev=state[id]||{};const d={verdict:patch.verdict||prev.verdict||"ok",lineId:patch.lineId!==undefined?patch.lineId:(prev.lineId||null),lineLabel:patch.lineLabel!==undefined?patch.lineLabel:(prev.lineLabel||null),note:patch.note!==undefined?patch.note:(prev.note||""),path:PATHS[id],at:new Date().toISOString()};state[id]=d;paint(id);counts();if(!db){saveEl.textContent="not saved: saving is unavailable here — tell me the folder names and verdicts in chat";saveEl.className="save bad";return;}try{await db.doc("decisions/"+id).set(d);saveEl.textContent="saved "+new Date().toLocaleTimeString();saveEl.className="save";}catch(e){saveEl.textContent="save failed ("+(e&&e.code||"error")+") — try again";saveEl.className="save bad";}}
document.addEventListener("click",async(ev)=>{const b=ev.target.closest("button");if(!b)return;const row=b.closest("article.row");if(b.hasAttribute("data-group-ok")){const sec=b.closest("section.group");for(const id of sec.dataset.ids.split(" ")){if(!state[id])await save(id,{verdict:"ok"});}return;}if(!row)return;const id=row.dataset.id;const v=b.dataset.v;if(v==="line"){const f=row.querySelector(".lineform");f.hidden=!f.hidden;if(!f.hidden)fillSelect(row);return;}await save(id,{verdict:v,lineId:null,lineLabel:null});});
document.addEventListener("change",async(ev)=>{const row=ev.target.closest("article.row");if(!row)return;const id=row.dataset.id;if(ev.target.matches("[data-sel]")&&ev.target.value){const l=LINES.find(x=>x.id===ev.target.value);await save(id,{verdict:"line",lineId:l.id,lineLabel:l.label});row.querySelector(".lineform").hidden=true;}if(ev.target.matches("[data-allmarkets]")){const sel=row.querySelector("[data-sel]");sel.dataset.filled="";fillSelect(row);}if(ev.target.matches("[data-note]")){await save(id,{note:ev.target.value.trim()});}});
document.addEventListener("keydown",(ev)=>{if(ev.key==="Enter"&&ev.target.matches("[data-note]"))ev.target.blur();});
document.getElementById("hide").addEventListener("change",(ev)=>{document.body.classList.toggle("hide-done",ev.target.checked);for(const r of document.querySelectorAll("article.row.done"))r.classList.toggle("hide",ev.target.checked);});
document.getElementById("onlyrows").addEventListener("change",(ev)=>{const on=ev.target.checked;const secs=[...document.querySelectorAll("section.group")];const wrap=secs[0].parentElement;secs.sort((a,b)=>{const ra=a.querySelector(".proposal").textContent.startsWith("Feeds")?0:1;const rb=b.querySelector(".proposal").textContent.startsWith("Feeds")?0:1;return on?(ra-rb)||a.querySelector("h2").textContent.localeCompare(b.querySelector("h2").textContent):a.querySelector("h2").textContent.localeCompare(b.querySelector("h2").textContent);});for(const s of secs)wrap.appendChild(s);});
for(const id of Object.keys(state))paint(id);counts();document.getElementById("onlyrows").dispatchEvent(new Event("change"));
(async()=>{try{db=await (window.claude&&window.claude.use?window.claude.use("db"):Promise.resolve(null));}catch{db=null;}if(!db){saveEl.textContent="saving unavailable in this view";saveEl.className="save bad";return;}saveEl.textContent="connected";db.collection("decisions").onSnapshot((snap)=>{for(const ch of snap.docChanges()){if(ch.type==="removed"){delete state[ch.doc.id];}else{state[ch.doc.id]=ch.doc.data();}paint(ch.doc.id);}counts();for(const r of document.querySelectorAll("article.row.done"))r.classList.toggle("hide",document.getElementById("hide").checked);},(e)=>{saveEl.textContent="live updates stopped ("+e.code+")";saveEl.className="save bad";});})();</script>`;
  return html;
}
