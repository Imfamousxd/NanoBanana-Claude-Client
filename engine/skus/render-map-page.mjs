import fs from "node:fs"; import path from "node:path"; import sharp from "sharp";
import { scoreMatch, unmatchedKey } from "/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/engine/skus/coverage.mjs";
const S = "/private/tmp/claude-501/-Users-mario-Desktop-Cursor-Projects-NanoBanana-Claude-Client/6052abf4-48c5-44c9-b472-a14ff8c10702/scratchpad";
const root = "/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client";
const lib = JSON.parse(fs.readFileSync(S + "/render-library.json", "utf8"));
// Dropbox web links: source root + relative path → https://www.dropbox.com/home/<folder>?preview=<file>
const { loadEnv } = await import(root + "/engine/core/env.mjs"); const { DamDb } = await import(root + "/engine/dam/db.mjs"); const { damConfig } = await import(root + "/engine/dam/config.mjs");
loadEnv(root); const db = new DamDb(damConfig(root).databaseUrl); const ROOTS = Object.fromEntries((await db.query("select id, root from dam.sources")).rows.map((r) => [r.id, r.root])); await db.end();
const dropboxLink = (a) => { const full = (ROOTS[a.source_id] || "") + "/" + a.path; const dir = full.slice(0, full.lastIndexOf("/")); const name = full.slice(full.lastIndexOf("/") + 1); return "https://www.dropbox.com/home" + dir.split("/").map(encodeURIComponent).join("/") + "?preview=" + encodeURIComponent(name); };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const noise = /upcoming|special sku|new flavou?rs|below|^-+$|combination kits$|\bsku\b|hemp melted diamomd|mylar bags 3\.5g|king mate|exotic flower jars|donut holes 0\.6g|donuts 1g|muharillos$|fire flower 1\.5g/i;
const PROPOSED = { "Hemp / Pre Rolls": "Hemp King Pre-Rolls / Duo Strain — strains not in the sheet", "Discontinued / Disposables": "Discontinued hemp disposables (HHC, Delta-10) → _Discontinued", "Pre-Rolls / Glass Jars": "Mates in old glass jars → _old under the market's Mates line", "Concentrates / Old CA Box OCT 2023": "Hash Rosin Concentrate Jars, old box → _old", "Pre-Rolls / Metal Can": "Mates Metal Cans (CA) — flavours not in the sheet", "Pod & Battery Kits / MI 2G Vape Pod": "2G Vape Pods (MI028)", "Pod & Battery Kits / MI 2G Pod Battery Kit": "Pod & Battery Kits (MI028)", "Accessories / Lighter": "Accessories → Lighter", "Moods": "Muha Moods disposables (own line)", "Mavricks": "Mavricks Hash Rosin Disposables 0.5G (MI023)", "Pre-Rolls / MuhaMadness": "Muha Madness Pre-Rolls 1G", "TEMP / 5g cured rosin": "MO Cured Rosin 5g", "TEMP / 2g Infused Joints": "MO 2G Infused Pre-Rolls", "Disposables / Device": "hardware renders → _line of the matching line", "Labubu": "not a product render → out of Renders/", "DialedMoods / Dialed Sku's": "line-level renders (no flavour) → _line of each line", "DialedMoods / Motion": "motion stills → Motion/ (not Renders)", "DialedMoods / HQ": "environment renders → out of Renders/", "DialedMoods / Dialed Mood accessories Renders": "Accessories (needs the accessory names)" };
const proposedFor = (folder) => PROPOSED[folder] || (/ \/ All in One \(/.test(folder) ? "Older All-in-One device: its own device category under this line, not the current-device SKU rows (name to confirm)" : /(^|\/ )WRONG\b/i.test(folder) ? "Folder marked WRONG by the team: excluded from every SKU row; confirm delete or move to _old" : "");
const cacheDir = S + "/thumb72"; fs.mkdirSync(cacheDir, { recursive: true });
async function thumb(asset) {
  const url = asset.thumb; if (!url || !/^https?:/.test(url)) return null;
  const file = path.join(cacheDir, asset.id + ".jpg");
  if (!fs.existsSync(file)) { try { const r = await fetch(url); if (!r.ok) return null; const buf = Buffer.from(await r.arrayBuffer()); await sharp(buf).resize({ height: 72, width: 96, fit: "inside" }).jpeg({ quality: 55, mozjpeg: true }).toFile(file); } catch { return null; } }
  return "data:image/jpeg;base64," + fs.readFileSync(file).toString("base64");
}
async function mapLimit(items, limit, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: limit }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
const brands = [["brand.muha", "muha-meds", "Muha Meds"], ["brand.dialed-moods", "dialed-moods", "Dialed Moods"]];
const pages = [];
for (const [brand, regFile, label] of brands) {
  const reg = JSON.parse(fs.readFileSync(root + "/knowledge/skus/" + regFile + ".json", "utf8"));
  const assets = lib.filter((a) => a.brand === brand);
  const matched = new Set(); const sections = []; let items = 0, covered = 0;
  const byMarket = {}; for (const line of reg.lines) (byMarket[line.market || "—"] ??= []).push(line);
  const need = new Map();
  for (const [market, lines] of Object.entries(byMarket).sort()) {
    const blocks = [];
    for (const line of lines) {
      const rows = [];
      for (const item of line.items) { if (noise.test(item.name)) continue; items += 1; const hits = assets.map((a) => ({ a, s: scoreMatch(a, item, line) })).filter((h) => h.s >= 3).sort((x, y) => y.s - x.s); if (hits.length) covered += 1; for (const h of hits) matched.add(h.a.id); for (const h of hits) need.set(h.a.id, h.a); rows.push({ item, hits }); }
      if (rows.length) blocks.push({ line, rows });
    }
    sections.push({ market, blocks });
  }
  const unmatched = new Map();
  for (const a of assets) { if (matched.has(a.id)) continue; const key = unmatchedKey(a); const g = unmatched.get(key) || { folder: key, market: a.render?.market || null, files: 0, products: new Map(), samples: [] }; g.files += 1; if (a.product) g.products.set(a.product, (g.products.get(a.product) || 0) + 1); if (g.samples.length < 6) { g.samples.push(a); need.set(a.id, a); } unmatched.set(key, g); }
  const groups = [...unmatched.values()].filter((g) => g.files >= 2).sort((a, b) => b.files - a.files);
  console.log(label, "items", items, "covered", covered, "matched files", matched.size, "unmatched groups", groups.length, "thumbs to fetch", need.size);
  const uris = new Map(); const list = [...need.values()]; const results = await mapLimit(list, 16, thumb); list.forEach((a, i) => uris.set(a.id, results[i]));
  const img = (a) => uris.get(a.id) ? `<figure title="${esc(a.path)}"><a href="${dropboxLink(a)}" target="_blank" rel="noopener"><img loading="lazy" data-t="${a.id}" alt=""></a><figcaption>${esc((a.composition || "?").replace(/-/g, " "))}${a.angle && a.angle !== "n/a" ? " · " + esc(a.angle) : ""}</figcaption></figure>` : `<figure title="${esc(a.path)}"><div class="nothumb">no thumb</div><figcaption>${esc(path.basename(a.path)).slice(0, 22)}</figcaption></figure>`;
  let html = `<h2 id="${regFile}">${label}</h2><p class="lede">${matched.size.toLocaleString()} renders correlate to ${covered} of ${items} SKU items. Each row is one flavour from the book; the pictures are every render the system assigned to it. Click a picture to open the full-resolution file in Dropbox; hover for its path. A red bar means the book has the item but no render was found.</p>`;
  for (const { market, blocks } of sections) {
    if (!blocks.length) continue;
    html += `<h3>${esc(market)}</h3>`;
    for (const { line, rows } of blocks) {
      const withRenders = rows.filter((r) => r.hits.length).length;
      html += `<details${withRenders ? " open" : ""}><summary><b>${esc(line.line)}${line.format ? " " + esc(line.format) : ""}</b> <span class="dim">${esc(line.category)}${line.skuBlock ? " · " + esc(line.skuBlock) : ""} · ${withRenders}/${rows.length} with renders</span></summary><table>`;
      for (const { item, hits } of rows) html += `<tr class="${hits.length ? "" : "none"}"><td class="item">${esc(item.name)}<br><span class="mono">${esc(item.sku || "")}</span><br><span class="dim">${hits.length} file${hits.length === 1 ? "" : "s"}</span></td><td class="pics">${hits.map((h) => img(h.a)).join("")}</td></tr>`;
      html += `</table></details>`;
    }
  }
  html += `<h3 id="${regFile}-unmatched">In the Dropbox, no SKU row — needs guidance</h3><p class="lede">${assets.length - matched.size} ${label} renders match nothing in the books. Grouped by the folder they live in today, with what the vision model calls them and a few samples. The right column is my proposed handling; correct it.</p><div class="scroll"><table class="un"><thead><tr><th>Folder today</th><th class="n">Files</th><th>What they are (vision)</th><th>Samples</th><th>Proposed handling</th></tr></thead><tbody>`;
  for (const g of groups) html += `<tr><td class="mono">${esc(g.folder)}${g.market ? ` <span class="dim">[${esc(g.market)}]</span>` : ""}</td><td class="n">${g.files}</td><td class="dim">${esc([...g.products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${p} ×${n}`).join(" · "))}</td><td class="pics">${g.samples.map(img).join("")}</td><td class="dim">${esc(proposedFor(g.folder))}</td></tr>`;
  html += `</tbody></table></div>`;
  const map = {}; for (const [id, uri] of uris) if (uri) map[id] = uri;
  pages.push({ label, regFile, html: html + `<script>const T=${JSON.stringify(map)};for(const el of document.querySelectorAll("img[data-t]"))el.src=T[el.dataset.t]||"";</script>` });
}
const css = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Code+Pro&display=swap"><style>:root{--bg:#f6f5f1;--card:#fff;--ink:#1f2a24;--muted:#66706b;--line:#dfe2dd;--accent:#1e5a55;--soft:#e4efec;--bad:#b23a2c;color-scheme:light}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15191a;--card:#1d2324;--ink:#e8ebe8;--muted:#9aa4a0;--line:#2c3436;--accent:#6fc2b7;--soft:#1f3532;--bad:#f08a7c;color-scheme:dark}}:root[data-theme="dark"]{--bg:#15191a;--card:#1d2324;--ink:#e8ebe8;--muted:#9aa4a0;--line:#2c3436;--accent:#6fc2b7;--soft:#1f3532;--bad:#f08a7c;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14.5px/1.45 "Source Sans 3",system-ui,sans-serif}.wrap{max-width:1240px;margin:0 auto;padding-block:26px 80px;padding-inline:20px}h1{font-size:28px;margin:0 0 6px;text-wrap:balance}h2{font-size:21px;margin:34px 0 8px;border-bottom:1px solid var(--line);padding-bottom:6px}h3{font-size:14px;margin:22px 0 6px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.lede{color:var(--muted);max-width:74ch;margin:0 0 12px}nav{position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);border-bottom:1px solid var(--line);padding:8px 0;display:flex;gap:14px;flex-wrap:wrap;font-size:13px;z-index:3}nav a{color:var(--accent);font-weight:600;text-decoration:none}details{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:8px 12px}summary{cursor:pointer}.dim{color:var(--muted);font-size:12.5px}table{border-collapse:collapse;width:100%;margin-top:6px}td,th{padding:6px 8px;border-top:1px solid var(--line);vertical-align:top;text-align:left}th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}td.n,th.n{text-align:right}td.item{width:190px;font-weight:600}.mono{font-family:"Source Code Pro",ui-monospace,monospace;font-size:12px;font-weight:400}td.pics{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start}figure{margin:0;width:96px;text-align:center}figure a{display:block}figure img{cursor:zoom-in;height:72px;max-width:96px;object-fit:contain;background:repeating-conic-gradient(#e6e6e6 0 25%,#fff 0 50%) 50%/12px 12px;border:1px solid var(--line);border-radius:6px}figcaption{font-size:10.5px;color:var(--muted);line-height:1.2;margin-top:2px}.nothumb{height:72px;width:96px;border:1px dashed var(--line);border-radius:6px;font-size:10px;color:var(--muted);display:flex;align-items:center;justify-content:center}.more{align-self:center}tr.none td:first-child{box-shadow:inset 3px 0 var(--bad)}.scroll{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:10px}table.un td{min-width:120px}table.un td.pics{min-width:420px}</style>`;
const title = (label) => `<title>${label} Render Map</title>`;
const one = title("SKU") + css + `<div class="wrap"><h1>SKU render map</h1><p class="lede">Every SKU item from the books with the actual renders assigned to it, and, at the bottom of each brand, every render folder the books do not cover.</p><nav>${pages.map((p) => `<a href="#${p.regFile}">${p.label}</a><a href="#${p.regFile}-unmatched">${p.label}: no SKU row</a>`).join("")}</nav>${pages.map((p) => p.html).join("")}</div>`;
const mb = (s) => (Buffer.byteLength(s) / 1048576).toFixed(1);
{ for (const p of pages) { const h = title(p.label) + css + `<div class="wrap"><h1>${p.label} render map</h1><nav><a href="#${p.regFile}">Assigned</a><a href="#${p.regFile}-unmatched">No SKU row</a></nav>${p.html}</div>`; fs.writeFileSync(S + "/sku-render-map-" + p.regFile + ".html", h); console.log("page", p.label, mb(h), "MB"); } }
