// SKU ↔ render coverage: for every item in a SKU registry, which analysed renders in the library show it,
// and which render folders in the library match no SKU at all (new launches, unlisted lines, stray files).
// Matching is deterministic text matching over the vision product string, the title, the file name and
// the folder facts; every score is explainable.
import fs from "node:fs";
import path from "node:path";

export function norm(value) { return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
const compact = (value) => norm(value).replace(/\s/g, "");

const LINE_WORDS = [
  [/dispo|disposable|aio|all in one/, /dispo|disposable|aio|allinone/],
  [/\bcarts?\b|cartridge/, /cart/],
  [/\bpods?\b/, /\bpod/],
  [/mates|pre ?roll|joint|cone|dank dart|donut|muharillo|blunt/, /mates|preroll|joint|cone|dankdart|donut|muharillo|blunt|metalcan/],
  [/gumm/, /gumm/],
  [/flower/, /flower/],
  [/jar/, /jar/],
  [/live resin/, /liveresin|\blr\b/],
  [/melted diamond/, /melteddiamond|\bmd\b/],
  [/hash rosin|rosin/, /hashrosin|rosin|\bhr\b/],
  [/distillate/, /distillate|disti/],
  [/piatella/, /piatella/],
  [/magnetic/, /magnetic/],
  [/dual/, /dual/],
  [/cookies/, /cookies/],
  [/seltzer/, /seltzer/],
  [/energy drink|elixir|can\b|rtd/, /energy|elixir|\bcan\b|cans|rtd/],
  [/shots?/, /shot/],
  [/stick|packet|electrolyte|hydration/, /stick|packet|electrolyte|hydration|sachet/],
  [/creatine/, /creatine/],
  [/collagen/, /collagen/],
  [/kava/, /kava/],
  [/kratom/, /kratom/],
  [/l ?dopa|cognition/, /ldopa|cognition/],
  [/shilajit/, /shilajit/],
  [/sea ?moss/, /seamoss/],
  [/mylar|bag/, /mylar|bag/],
  [/metal can|tin/, /metalcan|\btin/],
];

const STRENGTH_WORDS = [[/melted diamond/, /\bmelted diamond|\bmd\b|melteddiamond/], [/live resin/, /\blive resin|\blr\b|liveresin/], [/hash rosin/, /\bhash rosin|\bhr\b|hashrosin/], [/distillate|distallite/, /distillate|distallite|disti\b/], [/thc-?a\b|thca/, /\bthca\b|thc a\b/], [/piatella/, /piatella/], [/bubble hash/, /bubble hash|bubblehash/], [/d9|delta[- ]?9/, /\bd9\b|delta 9/], [/delta[- ]?8/, /\bd8\b|delta 8/], [/delta[- ]?10/, /\bd10\b|delta 10/], [/hhc/, /\bhhc/], [/thc-?p\b|thcp/, /\bthcp\b|thc p\b/]];
let KNOWN_NAMES = [];
function lineWordsOf(text) { const t = norm(text); return LINE_WORDS.filter(([ask]) => ask.test(t)).map(([, has]) => has); }

function assetText(asset) {
  const render = asset.render || {};
  const spaced = norm(`${asset.product || ""} ${asset.title || ""} ${String(asset.path || "").replace(/([a-z])([A-Z])/g, "$1 $2")} ${render.category || ""} ${render.line || ""} ${render.leaf || ""}`);
  return { spaced, full: norm(`${asset.product || ""} ${asset.title || ""} ${asset.path || ""} ${render.category || ""} ${render.line || ""} ${render.leaf || ""}`), compactFull: compact(`${asset.product || ""} ${asset.title || ""} ${asset.path || ""} ${render.category || ""} ${render.line || ""} ${render.leaf || ""}`), market: render.market || (String(asset.path || "").match(/(?:^|\/|_)(CA|MI|MO|NJ|NM|NY|OH|AZ)(?:\/|_| )/) || [])[1] || (/(^|\/)hemp(\/|$)/i.test(String(asset.path || "")) ? "HEMP" : null) };
}

// A render belongs to exactly one line: the vape form (disposable / cartridge / pod), the format (1G vs 2G vs
// 1.68G), the market and the device generation are hard walls, not tie-breakers. Generic files (flavour
// badges, master-case group shots, website composites) never attach to a single flavour.
// Every category is a wall: the render must carry its own category's words and none of another category's.
const CATEGORY_WALLS = {
  disposables: [/dispo|disposable|allinone|\baio\b/, /cart(?!on)|\bpod|preroll|mates|gumm|edible|flowerjar|\bjoint/],
  cartridges: [/cart(?!on)/, /dispo|disposable|allinone|\bpod|preroll|mates|gumm|edible|flower|\bjoint/],
  pods: [/\bpod/, /dispo|disposable|preroll|mates|gumm/],
  edibles: [/gumm|edible|mambas|chocolate|\btin|mylar|candy/, /dispo|disposable|cart(?!on)|\bpod|preroll|mates|\bjoint|cone|flowerjar|flowerbag|\bjar(?!.*gumm)/],
  "pre-rolls": [/preroll|pre_roll|mates|\bjoint|cone|dankdart|donut|muharillo|blunt|metalcan|infused|madness|king/, /dispo|disposable|cart(?!on)|\bpod|gumm|edible|flowerjar|flowerbag/],
  flower: [/flower|\bnug|eighth|greenhouse|indoor|sungrown|meteor/, /dispo|disposable|cart(?!on)|\bpod|gumm|edible|preroll|mates|\bjoint|rosin|badder|sift|concentrate/],
  concentrates: [/rosin|badder|diamond|sift|hash|concentrate|temple|caviar|piatella|liveresin|\bjar|cured|sauce/, /dispo|disposable|cart(?!on)|\bpod|gumm|edible|preroll|mates|\bjoint|flowerjar|flowerbag|flower/],
  beverages: [/\bcan|cans|energy|elixir|seltzer|drink|rtd|bottle/, /gumm|stick|packet|sachet|shot/],
  shots: [/shot/, /gumm|stick|packet|\bcan\b|cans/],
  gummies: [/gumm/, /stick|packet|shot|\bcan\b/],
  powders: [/stick|packet|sachet|powder|electrolyte|hydration|creatine|collagen|whey|protein|fiber|eaa/, /gumm|shot|\bcan\b|cans/],
};
const FORMATS = ["05g", "06g", "1g", "15g", "168g", "2g", "35g", "4g", "5g", "7g", "1oz"];
const GENERIC_RE = /ai resources|master case|group shot|website images|badge|catalog resized|motion\/|redesign ?test/i;
// Device iterations: a folder that names an older device ("CA_1G_Distillate_All in One_Sept2024") is its own
// device category. Its renders never attach to a SKU row for the current device; they surface as their own
// group in the unmatched table so the team can name the category.
const ITERATION_RE = /all[ _-]?in[ _-]?one[ _-]*([a-z]{3,9})?[ _-]?(20\d\d)/i;
export function deviceIterationOf(asset) {
  for (const seg of String(asset.path || "").split("/")) { const m = seg.match(ITERATION_RE); if (m) return `All in One (${m[1] ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + " " : ""}${m[2]})`; }
  return null;
}
// A folder the team marked WRONG is quarantined: nothing in it attaches to a SKU row.
export function quarantined(asset) { return String(asset.path || "").split("/").some((seg) => /^wrong\b/i.test(seg.trim())); }
// The key an unmatched render is grouped under in the coverage report and the render map.
export function unmatchedKey(asset) { const render = asset.render || {}; const iteration = deviceIterationOf(asset); return `${render.group || path.dirname(String(asset.path || ""))}${iteration ? " / " + iteration : ""}`; }
// Pre-roll forms are walls too: a Mates metal-can line never takes a King & Queen joint, a Muharillo or a Donut.
// Muha line folders only: "Dialed_Moods" is a brand name, not the Muha Moods line.
const LINE_FOLDERS = [["moods", /moods/i], ["mavricks", /mavrick/i], ["mmxcookies", /cookies/i], ["(?<!mango )madness", /(?<!mango )madness/i], ["magnetic", /magnetic/i], ["dual", /dual/i]];
const PREROLL_FORMS = [[/\bmates?\b|metal cans?/, /\bmates?\b|\bmetal cans?\b|\bkief ?joints?\b/], [/\bkings?\b|\bqueens?\b/, /\bkings?\b|\bqueens?\b/], [/\bdonuts?\b/, /\bdonuts?\b/], [/\bmadness\b/, /\bmadness\b/], [/\bmuharillos?\b|\bblunts?\b/, /\bmuharillos?\b|\bblunts?\b/]];
function formatsIn(compactText) { return FORMATS.filter((fmt) => new RegExp("(^|[^0-9])" + fmt + "(?![0-9])").test(compactText)); }
function genOf(text) { const m = String(text).toLowerCase().match(/gen\s?(\d)/); return m ? Number(m[1]) : null; }

/** Score one asset against one SKU item. 0 = no match. */
export function scoreMatch(asset, item, line, prepared = assetText(asset)) {
  if (GENERIC_RE.test(String(asset.path || ""))) return 0;
  if (quarantined(asset)) return 0;
  const iteration = deviceIterationOf(asset);
  if (iteration && !/all ?in ?one|\baio\b/.test(norm(`${line.line} ${line.section || ""}`))) return 0;
  // Line-specific folders (Moods, Mavricks, MM x Cookies, Madness, Magnetic, Dual) only serve their line, and a
  // line that names one of them (the Cookies collab, the Dual disposables…) only takes renders from that folder
  // or renders whose own text names it: a plain 1G Distillate Blue Slushie is not the Cookies-collab Blue Slushie.
  const segPath = String(asset.path || "").replace(/_/g, " ").replace(/\/[^/]*$/, "/"); // directories only: the file name carries the flavour ("Mango Madness")
  for (const [seg, re] of (asset.brand && !/muha/.test(asset.brand) ? [] : LINE_FOLDERS)) {
    const inFolder = new RegExp("(^|/)[^/]*\\b" + seg + "\\b[^/]*(/|$)", "i").test(segPath);
    const lineWants = re.test(`${line.line} ${line.section || ""}`);
    if (inFolder && !lineWants) return 0;
    if (lineWants && !inFolder && !re.test(prepared.spaced || prepared.full)) return 0;
  }
  if (asset.composition === "lineup" || /lineup|line up|group|all flavou?rs|assorted|variety/i.test(`${asset.title || ""} ${String(asset.path || "").split("/").pop()}`)) return 0;
  if (/,.*,|\band\b.*\band\b/.test(String(asset.product || "")) && !new RegExp(compact(item.name).slice(0, 8)).test(compact(asset.product))) return 0;
  const flavour = norm(item.name).replace(/\b(i|s|h|indica|sativa|hybrid|collab)\b/g, "").trim();
  if (flavour.length < 3) return 0;
  const flavourCompact = flavour.replace(/\s/g, "");
  let score = 0;
  const words = prepared.full.split(" ");
  const tokens = flavour.split(" ").filter(Boolean);
  const wholeCompact = new RegExp("(^|[^a-z])" + flavourCompact + "(?![a-z])").test(" " + prepared.compactFull.replace(/([a-z])(?=[0-9])/g, "$1 ") + " ") || prepared.compactFull.includes(flavourCompact + "_") || prepared.compactFull.endsWith(flavourCompact);
  const camel = String(asset.path || "").split("/").pop().replace(/([a-z])([A-Z])/g, "$1 $2");
  const nameWords = norm(`${camel} ${asset.product || ""} ${asset.title || ""} ${(asset.render || {}).leaf || ""}`).split(" ");
  const inName = tokens.every((token) => nameWords.includes(token)) || new RegExp("(^| )" + flavourCompact + "( |$)").test(nameWords.join(" "));
  if (inName) score += 3;
  else if (wholeCompact && tokens.length > 1) score += 3;
  else if (tokens.length >= 2 && tokens.every((token) => words.includes(token))) score += 2;
  else if (tokens.length === 1 && tokens[0].length >= 6 && words.includes(tokens[0])) score += 1.5;
  else return 0;
  // Hard walls: vape form, format, market, generation.
  // A longer flavour that contains this one ("Strawberry Lemon" for "Strawberry") present in the text means it is that flavour, not this one.
  if (KNOWN_NAMES.some((other) => other !== flavour && other.includes(flavour) && new RegExp("(^| )" + other.replace(/\s/g, "") + "( |$)").test(" " + prepared.compactFull.replace(/([a-z])(?=[0-9])/g, "$1 ") + " ") || (other !== flavour && other.includes(flavour) && other.split(" ").every((w) => prepared.full.split(" ").includes(w))))) return 0;
  const wantStrength = STRENGTH_WORDS.filter(([ask]) => ask.test(norm(`${line.line} ${line.section || ""}`)));
  if (wantStrength.length) { const haveAny = STRENGTH_WORDS.filter(([, has]) => has.test(prepared.full)); if (haveAny.length && !haveAny.some((s) => wantStrength.includes(s))) return 0; }
  const wall = CATEGORY_WALLS[line.category];
  if (wall) { if (!wall[0].test(prepared.compactFull)) return 0; if (wall[1].test(prepared.compactFull)) return 0; }
  const wantForms = PREROLL_FORMS.filter(([ask]) => ask.test(norm(`${line.line} ${line.section || ""}`)));
  if (wantForms.length) { const haveForms = PREROLL_FORMS.filter(([, has]) => has.test(prepared.spaced || prepared.full)); if (haveForms.length && !haveForms.some((f) => wantForms.includes(f))) return 0; }
  if (line.format) { const want = compact(line.format); const present = formatsIn(prepared.compactFull); if (present.length && !present.includes(want)) return 0; }
  if (line.market && prepared.market && prepared.market !== line.market) return 0;
  const lineGen = line.generation ? genOf(line.generation) : null; const assetGen = genOf(`${asset.path} ${asset.title || ""}`);
  if (lineGen && assetGen && lineGen !== assetGen) return 0;
  const wanted = lineWordsOf(`${line.line} ${line.section || ""} ${line.category}`);
  let lineHits = 0;
  for (const has of wanted) if (has.test(prepared.compactFull)) lineHits += 1;
  if (wanted.length) score += wanted.length ? (lineHits / wanted.length) * 2 - (lineHits === 0 ? 1.5 : 0) : 0;
  if (line.format) { const fmt = compact(line.format); if (prepared.compactFull.includes(fmt)) score += 0.5; }
  if (line.market && prepared.market === line.market) score += 1;
  if (lineGen && assetGen === lineGen) score += 0.5;
  return Math.max(0, score);
}

export function computeCoverage(registry, library, { threshold = 3 } = {}) {
  const prepared = library.map((asset) => ({ asset, text: assetText(asset) }));
  KNOWN_NAMES = [...new Set(registry.lines.flatMap((line) => line.items.map((item) => norm(item.name).replace(/\b(i|s|h|indica|sativa|hybrid|collab)\b/g, "").trim())).filter((name) => name.length >= 3))];
  const matchedAssetIds = new Map(); // assetId → [{ lineId, item }]
  // Generic files: matched to 3+ different flavours without the flavour in the file name → not a flavour render.
  const flavoursPerAsset = new Map();
  for (const line of registry.lines) for (const item of line.items) for (const entry of prepared) { if (scoreMatch(entry.asset, item, line, entry.text) >= threshold) { const name = norm(item.name); const file = norm(String(entry.asset.path).split("/").pop().replace(/([a-z])([A-Z])/g, "$1 $2")); if (!file.includes(name.replace(/\s/g, "")) && !name.split(" ").every((w) => file.split(" ").includes(w))) (flavoursPerAsset.get(entry.asset.id) || flavoursPerAsset.set(entry.asset.id, new Set()).get(entry.asset.id)).add(name); } }
  const generic = new Set([...flavoursPerAsset.entries()].filter(([, names]) => names.size >= 3).map(([id]) => id));
  const lines = registry.lines.map((line) => {
    const items = line.items.map((item) => {
      const hits = [];
      for (const entry of prepared) {
        if (generic.has(entry.asset.id)) continue;
        const score = scoreMatch(entry.asset, item, line, entry.text);
        if (score >= threshold) hits.push({ score, asset: entry.asset });
      }
      hits.sort((a, b) => b.score - a.score || (b.asset.quality || 0) - (a.asset.quality || 0));
      for (const hit of hits) { const list = matchedAssetIds.get(hit.asset.id) || []; list.push({ line: line.id, item: item.name, score: hit.score }); matchedAssetIds.set(hit.asset.id, list); }
      const compositions = {};
      for (const hit of hits) compositions[hit.asset.composition || "n/a"] = (compositions[hit.asset.composition || "n/a"] || 0) + 1;
      return { name: item.name, sku: item.sku, discontinued: item.discontinued, inDevelopment: item.inDevelopment, renders: hits.length, compositions, hasDeviceOnly: Boolean(compositions["device-only"]), hasPackaging: Boolean(compositions["packaging-only"] || compositions["device-with-packaging"]), hasDisplay: Boolean(compositions["multi-pack"]), hasAlpha: hits.some((hit) => hit.asset.alpha), top: hits.slice(0, 3).map((hit) => ({ id: hit.asset.id, score: hit.score, path: hit.asset.path, composition: hit.asset.composition, angle: hit.asset.angle, thumb: hit.asset.thumb })), folders: [...new Set(hits.map((hit) => path.dirname(hit.asset.path)))].slice(0, 4) };
    });
    const covered = items.filter((item) => item.renders > 0).length;
    return { id: line.id, market: line.market, category: line.category, format: line.format, line: line.line, generation: line.generation, skuBlock: line.skuBlock, source: line.source, items: items.length, covered, coveragePct: items.length ? Math.round((covered / items.length) * 100) : 0, missing: items.filter((item) => item.renders === 0 && !item.discontinued && !item.inDevelopment).map((item) => item.name), itemsDetail: items };
  });
  // Render folders that matched nothing: candidates for new/unlisted products.
  const unmatched = new Map();
  for (const { asset } of prepared) {
    if (matchedAssetIds.has(asset.id)) continue;
    const render = asset.render || {};
    const key = unmatchedKey(asset);
    const group = unmatched.get(key) || { folder: key, market: render.market || null, files: 0, products: new Map(), samples: [], compositions: {} };
    group.files += 1;
    if (asset.product) group.products.set(asset.product, (group.products.get(asset.product) || 0) + 1);
    group.compositions[asset.composition || "n/a"] = (group.compositions[asset.composition || "n/a"] || 0) + 1;
    if (group.samples.length < 3) group.samples.push(path.basename(asset.path));
    unmatched.set(key, group);
  }
  const unmatchedGroups = [...unmatched.values()].map((group) => ({ ...group, products: [...group.products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([product, n]) => ({ product, n })) })).sort((a, b) => b.files - a.files);
  const totals = { lines: lines.length, items: lines.reduce((n, line) => n + line.items, 0), covered: lines.reduce((n, line) => n + line.covered, 0), assets: library.length, matchedAssets: matchedAssetIds.size, unmatchedAssets: library.length - matchedAssetIds.size, unmatchedGroups: unmatchedGroups.length };
  return { brand: registry.brand, computedAt: new Date().toISOString().slice(0, 10), totals, lines, unmatchedGroups };
}

export function coverageText(coverage) {
  const t = coverage.totals;
  const out = [`${coverage.brand}: ${t.covered}/${t.items} SKU items have at least one render · ${t.matchedAssets}/${t.assets} renders matched a SKU · ${t.unmatchedGroups} render folders match nothing`];
  let market = null;
  for (const line of [...coverage.lines].sort((a, b) => String(a.market).localeCompare(String(b.market)) || a.category.localeCompare(b.category))) {
    if (line.market !== market) { market = line.market; out.push("", `== ${market || "no market"} ==`); }
    out.push(`- [${line.category}${line.format ? " " + line.format : ""}] ${line.line}${line.generation ? " " + line.generation : ""}${line.skuBlock ? " (" + line.skuBlock + ")" : ""}: ${line.covered}/${line.items} covered${line.missing.length ? " · missing: " + line.missing.slice(0, 6).join(", ") + (line.missing.length > 6 ? ", …" : "") : ""}`);
  }
  out.push("", "Render folders that match no SKU (new launches / unlisted lines / strays):");
  for (const group of coverage.unmatchedGroups.slice(0, 40)) out.push(`- ${group.folder}${group.market ? " [" + group.market + "]" : ""}: ${group.files} files → ${group.products.map((p) => `${p.product} ×${p.n}`).join("; ").slice(0, 160)}`);
  return out.join("\n");
}

export function runCoverage(root, { brand, libraryFile }) {
  const registryFile = path.join(root, "knowledge", "skus", `${{ muha: "muha-meds" }[brand] || brand}.json`);
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  const library = JSON.parse(fs.readFileSync(libraryFile, "utf8")).filter((asset) => asset.brand === `brand.${brand}` || (!asset.brand && false));
  const coverage = computeCoverage(registry, library);
  const target = registryFile.replace(/\.json$/, ".coverage.json");
  fs.writeFileSync(target, JSON.stringify(coverage, null, 1) + "\n");
  return { file: path.relative(root, target), coverage };
}
