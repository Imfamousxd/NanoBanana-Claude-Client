// SKU ↔ render coverage: for every item in a SKU registry, which analysed renders in the library show it,
// and which render folders in the library match no SKU at all (new launches, unlisted lines, stray files).
// Matching is deterministic text matching over the vision product string, the title, the file name and
// the folder facts; every score is explainable.
import fs from "node:fs";
import path from "node:path";

// The book line's display name always carries the state: "CA 1G Distillate Disposables", "HEMP 2g THCA Carts".
export function lineName(line) { return line.name || [line.market, line.line].filter(Boolean).join(" "); }
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
  edibles: [/gumm|edible|mambas|chocolate|\btin|mylar|candy/, /dispo|disposable|cart(?!on)|\bpod|preroll|mates|\bjoint|cone|flowerjar|flowerbag/],
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
export function unmatchedKey(asset) { const render = asset.render || {}; const label = deviceIterationOf(asset) || previousDesignOf(asset); return `${render.group || path.dirname(String(asset.path || ""))}${label ? " / " + label : ""}`; }
// Pre-roll forms are walls too: a Mates metal-can line never takes a King & Queen joint, a Muharillo or a Donut.
// Packaging design iterations. A line directory often holds one folder per design ("CA_1G_Distillate 2024",
// "CA_1G_Distillate_Carts 2025", "CA_1G_Distillate_Carts_TechDesign_June 2025"). Only the newest dated folder
// for a product (same format + strength words) is the current design; its older siblings are previous designs
// and never attach to a SKU row — they surface as their own group so the team can move them to _old.
// An explicit old/archive folder is always a previous design. Folders marked WRONG do not take part.
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const VIEW_DIRS = /^(display ?boxes?|devices?[_ ]?only|devices[_ ]?boxes|dual dispose device_only|magnetic dispos devices_only|group ?shots?|solo|v\d+|front[a-z ]*|back[a-z ]*|45[a-z ]*|three ?quarters?|under 5 ?mb|\d+ ?ct|icons? variations?)$/i;
const OLD_DIR = /^(old|old ?version|_old|archive|archived|previous|prev)$/i;
export function designRank(folder) {
  const t = String(folder).toLowerCase().replace(/[_()-]+/g, " ").replace(/\s+/g, " ").trim();
  if (/\bold\b|oldversion/.test(t)) return -2;
  const q = t.match(/\bq([1-4]) ?(20\d\d)\b/);
  if (q) return Number(q[2]) * 12 + (Number(q[1]) - 1) * 3 + 2;
  const my = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? ?(20\d\d)\b/);
  if (my) return Number(my[2]) * 12 + MONTHS[my[1]];
  const y = t.match(/\b(20\d\d)\b/);
  if (y) return Number(y[1]) * 12 + (/\btech/.test(t) ? 0.5 : 0);
  return -1;
}
const designStem = (folder) => norm(String(folder).replace(/([A-Za-z])(?=\d)|(\d)(?=[A-Za-z])/g, "$1$2 ")).replace(/\b(20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|[a-z]*uary|march|april|june|july|august|september|october|november|december|tech|techdesign|design|new|old|version|main|renders?|mock|q[1-4]|v\d+|\d+)\b/g, "").replace(/\s+/g, " ").trim();
// Device generations of the Muha disposables (user, 2026-09-16): Nov 2024 = Gen 2, June 2025 = Gen 3; the
// mapping applies to distillate, hash rosin, live resin and melted diamond disposables alike. Dual and
// Magnetic (and Moods, Mavricks, pods) are their own device lines and never get a generation from a date.
// An explicit "Gen N" in a folder name always wins. Folders older than Nov 2024 count as Gen 1.
const OWN_DEVICE_RE = /\b(dual|magnetic|moods|mavricks?|pod)\b/i;
export function deviceGenerationOf(pathOrFolder) {
  const dirs = String(pathOrFolder || "").split("/"); const inDisposables = dirs.some((d) => /^disposables$/i.test(d.trim()));
  if (!inDisposables) return null;
  if (dirs.some((d) => OWN_DEVICE_RE.test(d.replace(/_/g, " ")))) return null;
  for (const d of dirs) { const m = d.replace(/_/g, " ").match(/\bgen ?(\d)\b/i); if (m) return Number(m[1]); }
  const rank = Math.max(...dirs.map((d) => designRank(d)));
  if (rank < 0) return null;
  if (rank < 2024 * 12 + 11) return 1;
  if (rank < 2025 * 12 + 6) return 2;
  return 3;
}
function designKey(folder) {
  const c = compact(folder);
  const formats = formatsIn(c.replace(/([a-z])(?=[0-9])/g, "$1 ").replace(/\s/g, ""));
  const strengths = STRENGTH_WORDS.filter(([, has]) => has.test(norm(folder))).map(([ask]) => String(ask));
  const lines = LINE_FOLDERS.filter(([, re]) => re.test(folder)).map(([seg]) => seg);
  if (!formats.length && !strengths.length && !lines.length) return "stem:" + designStem(folder);
  return `${formats.join("+")}|${strengths.join("+")}|${lines.join("+")}`;
}
// The design folder of a render: the deepest directory that is not a view sub-folder; plus its parent.
export function designFolderOf(asset) {
  const dirs = String(asset.path || "").split("/").slice(0, -1);
  if (dirs.some((d) => OLD_DIR.test(d.trim()))) return { folder: dirs[dirs.length - 1], parent: dirs.slice(0, -1).join("/"), old: true };
  while (dirs.length > 3 && VIEW_DIRS.test(dirs[dirs.length - 1].trim())) dirs.pop();
  if (dirs.length < 3) return null;
  return { folder: dirs[dirs.length - 1], parent: dirs.slice(0, -1).join("/"), old: false };
}
let CURRENT_DESIGNS = new Map(); // `${parent}|${key}` → newest rank among the sibling design folders (kept for reports)
const marketOfPath = (p) => (String(p).match(/(?:^|\/)(CA|MI|MO|NJ|NM|NY|OH|AZ)(?:\/|_| |$)/) || [])[1] || (/(^|\/)hemp(\/|$)/i.test(String(p)) ? "HEMP" : "");
const isDisposablesTree = (p) => String(p).split("/").some((d) => /^disposables$/i.test(d.trim())) && !String(p).split("/").some((d) => OWN_DEVICE_RE.test(d.replace(/_/g, " ")));
export function designGroups(library) {
  const groups = new Map(); // group key → Map(full folder path → {folder, parent, rank, files, generation})
  for (const asset of library) {
    if (quarantined(asset)) continue;
    const d = designFolderOf(asset); if (!d || d.old) continue;
    const full = `${d.parent}/${d.folder}`;
    // Disposables: generation beats date and the folders of one product (state + size + strength) are compared
    // across the whole tree ("CA_1G_Distillate_Feb2024/Grey Device" is Gen 1 next to the Gen 3 Tech Design
    // folder); every folder of the newest generation is current, older generations are previous designs.
    const disposables = isDisposablesTree(full);
    const gen = disposables ? deviceGenerationOf(full) : null;
    const key = disposables ? `gen|${marketOfPath(full)}|${designKey(full.replace(/^Renders\/[^/]+\//, ""))}` : `${d.parent}|${designKey(d.folder)}`;
    const rank = gen !== null ? 100000 + gen : designRank(d.folder);
    const g = groups.get(key) || new Map(); const e = g.get(full) || { folder: d.folder, parent: d.parent, rank, files: 0, generation: gen }; e.files += 1; g.set(full, e); groups.set(key, g);
  }
  const out = [];
  for (const [key, g] of groups) {
    if (g.size < 2) continue;
    const ranks = [...g.values()].map((e) => e.rank);
    if (!ranks.some((r) => r >= 0)) continue; // undated vs undated: nothing to separate
    const best = Math.max(...ranks);
    const bestStem = [...g.values()].filter((e) => e.rank === best).map((e) => designStem(e.folder));
    // An undated folder is a previous design only when it is plainly the same folder name without the date
    // ("MI_1G_Distillate_Carts" next to "MI_1G_Distillate_Carts_Tech June 2025"); "HR_Gummies_Only" next to
    // "HR 4ct Mylar 2026" is a different kind of render, not an older design, and stays where it is.
    const folders = [...g.entries()].filter(([, e]) => e.rank >= 0 || bestStem.some((b) => { const u = designStem(e.folder); return u && b && (u === b || b.includes(u) || u.includes(b)); })).map(([path, e]) => ({ path, folder: e.folder, parent: e.parent, rank: e.rank, generation: e.generation ?? null, files: e.files, current: e.rank === best })).sort((a, b) => b.rank - a.rank);
    if (folders.length < 2) continue;
    out.push({ parent: key.startsWith("gen|") ? `${key.split("|")[1]} disposables ${key.split("|")[2]}` : key.split("|")[0], key, best, folders });
  }
  return out;
}
let PREVIOUS_DESIGNS = new Set(); // `${parent}/${folder}` of every folder judged a previous design
export function indexDesigns(library) { const groups = designGroups(library); CURRENT_DESIGNS = new Map(groups.map((g) => [g.key, g.best])); PREVIOUS_DESIGNS = new Set(groups.flatMap((g) => g.folders.filter((f) => !f.current).map((f) => f.path))); return groups; }
// Designer working folders (brand projects, SOP examples) are not the library: their renders serve a SKU only
// when the Renders tree has nothing for it, and they are flagged like a previous design.
const WORKING_RE = /(^|\/)(_BRAND PROJECTS|Graphic Designer General SOP|WIP|Drafts?|Working Files?)(\/|$)/i;
export function workingFileOf(asset) { const m = String(asset.path || "").match(WORKING_RE); return m && !/^Renders\//.test(String(asset.path || "")) ? `working file: ${String(asset.path).split("/").slice(0, 2).join("/")}` : null; }
// The reviewed folder map (knowledge/skus/folder-map.<brand>.json): a decision per design folder made by a
// person on the folder review page. "line" locks the folder to one SKU line, "old" and "skip" take it off
// every row, "ok" confirms the automatic proposal. Decisions beat every heuristic below.
let FOLDER_DECISIONS = new Map(); // design-folder path → { verdict, lineId, note }
export function indexFolderMap(map) { FOLDER_DECISIONS = new Map((map?.folders || []).filter((f) => f.decision && f.decision.verdict).map((f) => [f.path, f.decision])); return FOLDER_DECISIONS; }
export function folderPathOf(asset) { const d = designFolderOf(asset); return d ? (d.parent ? `${d.parent}/${d.folder}` : d.folder) : path.dirname(String(asset.path || "")); }
export function folderDecisionOf(asset) { return FOLDER_DECISIONS.size ? FOLDER_DECISIONS.get(folderPathOf(asset)) || null : null; }
// Library scope: Muha product renders are only what lives under the brand's top-level Renders/ folder.
export function inScope(asset) { return !/muha/.test(String(asset.brand || "")) || String(asset.path || "").startsWith("Renders/"); }
export function loadLibrary(libraryFile, brand) { return JSON.parse(fs.readFileSync(libraryFile, "utf8")).filter((asset) => asset.brand === `brand.${brand}` && inScope(asset)); }
export function previousDesignOf(asset) {
  const working = workingFileOf(asset); if (working) return working;
  const d = designFolderOf(asset); if (!d) return null;
  if (d.old) return `old folder: ${d.folder}`;
  const gen = deviceGenerationOf(`${d.parent}/${d.folder}`);
  if (PREVIOUS_DESIGNS.has(`${d.parent}/${d.folder}`)) return gen !== null ? `previous generation (Gen ${gen}): ${d.folder}` : `previous design: ${d.folder}`;
  return null;
}
// Muha line folders only: "Dialed_Moods" is a brand name, not the Muha Moods line.
const LINE_FOLDERS = [[/\bmoods\b/i, /moods/i], [/\bmavricks?\b/i, /mavrick/i], [/\bmm ?x ?cookies\b/i, /cookies/i], [/(?<!mango )\bmadness\b/i, /(?<!mango )madness/i], [/\bmagnetic\b/i, /magnetic/i], [/\bdual\b/i, /dual/i]];
const splitWords = (text) => String(text || "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
// Packaging style is a wall too: a Metal Cans line never takes glass-jar, mylar or tube renders and vice versa.
// A bare product render (a single joint, a loose gummy) names no style and passes.
const PACK_STYLES = [[/metal cans?|\btins?\b/, /metal ?cans?|\btins?\b|mates ?tin/], [/glass jars?|\bjars?\b/, /glass ?jars?|\bjars?\b/], [/mylar|\bbags?\b/, /mylar|\bbags?\b/], [/\btubes?\b/, /\btubes?\b/]];
const PREROLL_FORMS = [[/green ?house/, /green ?house/], [/dank ?darts?/, /dank ?darts?/], [/\bmates?\b|metal cans?/, /\bmates?\b|\bmetal cans?\b|\bkief ?joints?\b/], [/\bkings?\b|\bqueens?\b/, /\bkings?\b|\bqueens?\b/], [/\bdonuts?\b/, /\bdonuts?\b/], [/\bmadness\b/, /\bmadness\b/], [/\bmuharillos?\b|\bblunts?\b/, /\bmuharillos?\b|\bblunts?\b/]];
function formatsIn(compactText) { return FORMATS.filter((fmt) => new RegExp("(^|[^0-9])" + fmt + "(?![0-9])").test(compactText)); }
function genOf(text) { const m = String(text).toLowerCase().match(/gen\s?(\d)/); return m ? Number(m[1]) : null; }

/** Score one asset against one SKU item. 0 = no match. */
// SKU_DEBUG=1 prints why a render was refused for an item.
const why = (asset, reason) => { if (process.env.SKU_DEBUG) console.error(`  refused: ${reason} — ${String(asset.path || "").split("/").pop()}`); return 0; };
export function scoreMatch(asset, item, line, prepared = assetText(asset)) {
  if (GENERIC_RE.test(String(asset.path || ""))) return why(asset, "generic folder");
  if (quarantined(asset)) return why(asset, "WRONG folder");
  const decision = folderDecisionOf(asset);
  if (decision) {
    if (decision.verdict === "skip" || decision.verdict === "old") return why(asset, `folder review: ${decision.verdict}`);
    if (decision.verdict === "line" && decision.lineId && decision.lineId !== line.id) return why(asset, "folder review: locked to another line");
  }
  const iteration = deviceIterationOf(asset);
  if (iteration && !/all ?in ?one|\baio\b/.test(norm(`${line.line} ${line.section || ""}`))) return why(asset, "older device iteration");
  // Line-specific folders (Moods, Mavricks, MM x Cookies, Madness, Magnetic, Dual) only serve their line, and a
  // line that names one of them (the Cookies collab, the Dual disposables…) only takes renders from that folder
  // or renders whose own text names it: a plain 1G Distillate Blue Slushie is not the Cookies-collab Blue Slushie.
  const dirSegments = String(asset.path || "").split("/").slice(0, -1).map(splitWords); // directories only: the file name carries the flavour ("Mango Madness")
  for (const [seg, re] of (asset.brand && !/muha/.test(asset.brand) ? [] : LINE_FOLDERS)) {
    const inFolder = dirSegments.some((d) => seg.test(d));
    const lineWants = re.test(`${line.line} ${line.section || ""}`);
    if (inFolder && !lineWants) return why(asset, "line folder, line does not want it");
    if (lineWants && !inFolder && !re.test(prepared.spaced || prepared.full)) return why(asset, "line wants its folder, render is not in it");
  }
  if (asset.composition === "lineup" || /lineup|line up|group|all flavou?rs|assorted|variety/i.test(`${asset.title || ""} ${String(asset.path || "").split("/").pop()}`)) return why(asset, "lineup / group");
  if (/,.*,|\band\b.*\band\b/.test(String(asset.product || "")) && !new RegExp(compact(item.name).slice(0, 8)).test(compact(asset.product))) return why(asset, "rule 6");
  const flavour = norm(item.name).replace(/\b(i|s|h|indica|sativa|hybrid|collab)\b/g, "").trim();
  if (flavour.length < 3) return why(asset, "flavour too short");
  // A pack whose product string or printed text names three or more different flavours is a multi-flavour pack
  // (a "Dialed Pack" of three strains, a variety box), never one flavour's render.
  const packOf = multiFlavourPack(asset);
  if (packOf) return why(asset, "multi-flavour pack: " + packOf);
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
  else return why(asset, "flavour not in text");
  // Hard walls: vape form, format, market, generation.
  // A longer flavour that contains this one ("Strawberry Lemon" for "Strawberry") present in the text means it is that flavour, not this one.
  if (KNOWN_NAMES.some((other) => other !== flavour && other.includes(flavour) && new RegExp("(^| )" + other.replace(/\s/g, "") + "( |$)").test(" " + prepared.compactFull.replace(/([a-z])(?=[0-9])/g, "$1 ") + " ") || (other !== flavour && other.includes(flavour) && other.split(" ").every((w) => prepared.full.split(" ").includes(w))))) return why(asset, "a longer flavour name is present");
  // Strength / cannabinoid wall. The file's own words (file name, vision product and title, leaf folder) decide
  // first: a parent folder called "D8 D10 HHC" names all three and must not vouch for a file that says "D8".
  const wantStrength = STRENGTH_WORDS.filter(([ask]) => ask.test(norm(`${line.line} ${line.section || ""}`)));
  if (wantStrength.length) { const near = nameWords.join(" "); const haveNear = STRENGTH_WORDS.filter(([, has]) => has.test(near)); const have = haveNear.length ? haveNear : STRENGTH_WORDS.filter(([, has]) => has.test(prepared.full)); if (have.length && !have.some((s) => wantStrength.includes(s))) return why(asset, "strength word wall"); }
  const wall = CATEGORY_WALLS[line.category];
  // Walls are tested on the glued text (allinone, flowerjar…) and on the word-split text (\bpod, \baio\b).
  const spaced = prepared.spaced || prepared.full;
  if (wall) { if (!wall[0].test(prepared.compactFull) && !wall[0].test(spaced)) return why(asset, "category wall: category words missing"); if (wall[1].test(prepared.compactFull) || wall[1].test(spaced)) return why(asset, "category wall: category words missing"); }
  // A Pod & Battery (combination) kit is its own product: judged on the file name, product, title and leaf folder,
  // not on the parent folder ("Pod & Battery Kits" also holds the pod-only renders).
  const lineIsKit = /\bkits?\b|combination|combo/.test(norm(`${line.line} ${line.section || ""}`)); const assetIsKit = /battery ?kit|combo ?kit|combination ?kit|pod ?kit|\bkits?\b/.test(nameWords.join(" "));
  if (lineIsKit !== assetIsKit) return why(asset, "kit vs pod-only");
  const wantStyles = PACK_STYLES.filter(([ask]) => ask.test(norm(`${line.line} ${line.section || ""}`)));
  if (wantStyles.length) { const haveStyles = PACK_STYLES.filter(([, has]) => has.test(nameWords.join(" "))); if (haveStyles.length && !haveStyles.some((st) => wantStyles.includes(st))) return why(asset, "packaging style wall"); }
  const wantForms = PREROLL_FORMS.filter(([ask]) => ask.test(norm(`${line.line} ${line.section || ""}`)));
  if (wantForms.length) { const haveForms = PREROLL_FORMS.filter(([, has]) => has.test(prepared.spaced || prepared.full)); if (haveForms.length && !haveForms.some((f) => wantForms.includes(f))) return why(asset, "pre-roll form wall"); }
  if (line.format) { const want = compact(line.format); const present = formatsIn(prepared.compactFull); if (present.length && !present.includes(want)) return why(asset, "format wall"); }
  if (line.market && prepared.market && prepared.market !== line.market) return why(asset, "market wall");
  const lineGen = line.generation ? genOf(line.generation) : null; const assetGen = genOf(`${asset.path} ${asset.title || ""}`);
  if (lineGen && assetGen && lineGen !== assetGen) return why(asset, "generation wall");
  const wanted = lineWordsOf(`${line.line} ${line.section || ""} ${line.category}`);
  let lineHits = 0;
  for (const has of wanted) if (has.test(prepared.compactFull) || has.test(spaced)) lineHits += 1;
  if (wanted.length) score += wanted.length ? (lineHits / wanted.length) * 2 - (lineHits === 0 ? 1.5 : 0) : 0;
  if (line.format) { const fmt = compact(line.format); if (prepared.compactFull.includes(fmt)) score += 0.5; }
  if (line.market && prepared.market === line.market) score += 1;
  if (lineGen && assetGen === lineGen) score += 0.5;
  return Math.max(0, score);
}

// What a composition is called for a given category: a lone pre-roll is a single joint, not a "device".
export function compositionLabel(composition, category) {
  const c = String(composition || "n/a");
  if (/pre-?rolls?|joints?/i.test(String(category || ""))) return { "device-only": "single joint", "device-with-packaging": "joint with packaging", "packaging-only": "packaging only", "multi-pack": "display / multi-pack" }[c] || c.replace(/-/g, " ");
  if (/edible|gumm/i.test(String(category || ""))) return { "device-only": "loose product", "device-with-packaging": "product with packaging", "packaging-only": "packaging only", "multi-pack": "display / multi-pack" }[c] || c.replace(/-/g, " ");
  return c.replace(/-/g, " ");
}
// Hits for one SKU item: a previous design (or an explicit old folder) is kept only when the item has no render
// from a current folder at all — then it is the best the library has, and it is flagged so the page says so.
export function selectHits(hits) {
  const tagged = hits.map((hit) => ({ ...hit, previous: previousDesignOf(hit.asset) }));
  const current = tagged.filter((hit) => !hit.previous);
  return current.length ? current : tagged;
}
// The flavour names of a registry: the "longer flavour wins" and multi-flavour rules need them. Call before scoring.
const MULTI_CACHE = new Map(); // asset id → the flavours a pack names (string) or "" — computed once per registry
function multiFlavourPack(asset) {
  if (!KNOWN_NAMES.length) return "";
  const key = asset.id || asset.path; if (MULTI_CACHE.has(key)) return MULTI_CACHE.get(key);
  const printed = " " + norm(`${asset.product || ""} ${asset.title || ""} ${(asset.text || []).join(" ")}`) + " ";
  const named = LONG_NAMES.filter((name) => printed.includes(name));
  const distinct = named.filter((name) => !named.some((other) => other !== name && other.includes(name)));
  const out = distinct.length >= 3 ? distinct.slice(0, 4).map((n) => n.trim()).join(", ") : "";
  MULTI_CACHE.set(key, out); return out;
}
let LONG_NAMES = [];
export function indexRegistry(registry) { MULTI_CACHE.clear(); LONG_NAMES = []; KNOWN_NAMES = [...new Set(registry.lines.flatMap((line) => line.items.map((item) => norm(item.name).replace(/\b(i|s|h|indica|sativa|hybrid|collab)\b/g, "").trim())).filter((name) => name.length >= 3))]; LONG_NAMES = KNOWN_NAMES.filter((name) => name.length >= 5).map((name) => " " + name + " "); return KNOWN_NAMES; }
export function computeCoverage(registry, library, { threshold = 3 } = {}) {
  indexDesigns(library);
  indexRegistry(registry);
  const prepared = library.map((asset) => ({ asset, text: assetText(asset) }));
  const matchedAssetIds = new Map(); // assetId → [{ lineId, item }]
  // Generic files: matched to 3+ different flavours without the flavour in the file name → not a flavour render.
  const flavoursPerAsset = new Map();
  for (const line of registry.lines) for (const item of line.items) for (const entry of prepared) { if (scoreMatch(entry.asset, item, line, entry.text) >= threshold) { const name = norm(item.name); const file = norm(String(entry.asset.path).split("/").pop().replace(/([a-z])([A-Z])/g, "$1 $2")); if (!file.includes(name.replace(/\s/g, "")) && !name.split(" ").every((w) => file.split(" ").includes(w))) (flavoursPerAsset.get(entry.asset.id) || flavoursPerAsset.set(entry.asset.id, new Set()).get(entry.asset.id)).add(name); } }
  const generic = new Set([...flavoursPerAsset.entries()].filter(([, names]) => names.size >= 3).map(([id]) => id));
  const lines = registry.lines.map((line) => {
    const items = line.items.map((item) => {
      let hits = [];
      for (const entry of prepared) {
        if (generic.has(entry.asset.id)) continue;
        const score = scoreMatch(entry.asset, item, line, entry.text);
        if (score >= threshold) hits.push({ score, asset: entry.asset });
      }
      hits = selectHits(hits);
      hits.sort((a, b) => b.score - a.score || (b.asset.quality || 0) - (a.asset.quality || 0));
      for (const hit of hits) { const list = matchedAssetIds.get(hit.asset.id) || []; list.push({ line: line.id, item: item.name, score: hit.score }); matchedAssetIds.set(hit.asset.id, list); }
      const compositions = {};
      for (const hit of hits) compositions[hit.asset.composition || "n/a"] = (compositions[hit.asset.composition || "n/a"] || 0) + 1;
      return { name: item.name, sku: item.sku, discontinued: item.discontinued, inDevelopment: item.inDevelopment, renders: hits.length, compositions, hasDeviceOnly: Boolean(compositions["device-only"]), hasPackaging: Boolean(compositions["packaging-only"] || compositions["device-with-packaging"]), hasDisplay: Boolean(compositions["multi-pack"]), hasAlpha: hits.some((hit) => hit.asset.alpha), top: hits.slice(0, 3).map((hit) => ({ id: hit.asset.id, score: hit.score, path: hit.asset.path, previous: hit.previous || null, composition: hit.asset.composition, angle: hit.asset.angle, thumb: hit.asset.thumb })), folders: [...new Set(hits.map((hit) => path.dirname(hit.asset.path)))].slice(0, 4) };
    });
    const covered = items.filter((item) => item.renders > 0).length;
    return { id: line.id, name: lineName(line), market: line.market, category: line.category, format: line.format, line: line.line, generation: line.generation, skuBlock: line.skuBlock, source: line.source, items: items.length, covered, coveragePct: items.length ? Math.round((covered / items.length) * 100) : 0, missing: items.filter((item) => item.renders === 0 && !item.discontinued && !item.inDevelopment).map((item) => item.name), itemsDetail: items };
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
  const assignments = Object.fromEntries([...matchedAssetIds.entries()]);
  return { brand: registry.brand, computedAt: new Date().toISOString().slice(0, 10), totals, lines, unmatchedGroups, assignments };
}

export function coverageText(coverage) {
  const t = coverage.totals;
  const out = [`${coverage.brand}: ${t.covered}/${t.items} SKU items have at least one render · ${t.matchedAssets}/${t.assets} renders matched a SKU · ${t.unmatchedGroups} render folders match nothing`];
  let market = null;
  for (const line of [...coverage.lines].sort((a, b) => String(a.market).localeCompare(String(b.market)) || a.category.localeCompare(b.category))) {
    if (line.market !== market) { market = line.market; out.push("", `== ${market || "no market"} ==`); }
    out.push(`- [${line.category}${line.format ? " " + line.format : ""}] ${lineName(line)}${line.generation ? " " + line.generation : ""}${line.skuBlock ? " (" + line.skuBlock + ")" : ""}: ${line.covered}/${line.items} covered${line.missing.length ? " · missing: " + line.missing.slice(0, 6).join(", ") + (line.missing.length > 6 ? ", …" : "") : ""}`);
  }
  out.push("", "Render folders that match no SKU (new launches / unlisted lines / strays):");
  for (const group of coverage.unmatchedGroups.slice(0, 40)) out.push(`- ${group.folder}${group.market ? " [" + group.market + "]" : ""}: ${group.files} files → ${group.products.map((p) => `${p.product} ×${p.n}`).join("; ").slice(0, 160)}`);
  return out.join("\n");
}

export function runCoverage(root, { brand, libraryFile }) {
  const registryFile = path.join(root, "knowledge", "skus", `${{ muha: "muha-meds" }[brand] || brand}.json`);
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  const library = loadLibrary(libraryFile, brand);
  const mapFile = path.join(root, "knowledge", "skus", `folder-map.${brand}.json`);
  if (fs.existsSync(mapFile)) indexFolderMap(JSON.parse(fs.readFileSync(mapFile, "utf8")));
  const coverage = computeCoverage(registry, library);
  const target = registryFile.replace(/\.json$/, ".coverage.json");
  const { assignments, ...file } = coverage;
  fs.writeFileSync(target, JSON.stringify(file, null, 1) + "\n");
  return { file: path.relative(root, target), coverage };
}
