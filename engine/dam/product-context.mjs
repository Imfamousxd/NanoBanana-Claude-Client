// Product context for content generation: "make X about <product>" → the right references, chosen.
//
// A product usually has many assets in the library: the box, the device alone, the box with the device,
// a display case, the flat label, a transparent cutout, several angles, several versions, several
// markets, some discontinued. A generation needs a few of them, each for a reason:
//   identity   what the product looks like as a whole (packaging with device for Muha; the container for
//              Dialed / NuLumin) — the canonical look every candidate is judged against
//   device     the device / can / vial / jar alone — for close-ups, in-hand shots, product-only heroes
//   packaging  the box / bag / jar alone — when the packaging is the subject
//   angles     one best file per camera angle, so a scene can ask for the side or the back
//   cutout     a transparent PNG for compositing and overlays
//   label      flat label / dieline artwork — the truth for printed copy and colours
//   lineup     several flavours / SKUs together — for range shots
//   avoid      discontinued, outdated, flagged, rejected — never passed
//
// Everything is chosen from what the vision pass recorded (composition, angle, subclass, roles, alpha,
// quality) plus what the Dropbox folder said (approved folder, version, market, discontinued) and the
// team's verdicts. Nothing here calls a model.
import { brandCards } from "./analyze.mjs";
import { renderPathFacts } from "./product-refs.mjs";

const REF_CLASSES = ["product-ref", "packaging-collateral"];
const ANGLE_ORDER = ["front", "three-quarter", "side", "back", "top", "bottom", "multiple"];

/** Composition of an asset, from the new field or, for older analyses, from the subclass. */
export function compositionOf(asset) {
  const analysis = asset.analysis || {};
  if (analysis.composition && analysis.composition !== "n/a") return analysis.composition;
  if (asset.class === "packaging-collateral") return /label|dieline|print|artwork/.test(String(asset.subclass)) ? "label-flat" : "packaging-only";
  // The team's own folder names are a strong hint ("Magnetic Dispos Devices_Only", "Display Boxes", "Lineup").
  const folder = `${asset.flags?.render?.leaf || ""} ${asset.flags?.render?.line || ""}`.toLowerCase();
  if (/devices?[ _-]?only|device[ _-]?renders?|\bdevices?\b/.test(folder) && !/box|display|case/.test(folder)) return "device-only";
  if (/display ?box|display ?case|master ?case|\bcases?\b|\btrays?\b|\d+ ?(pk|pack|ct)\b/.test(folder)) return "multi-pack";
  if (/\bboxes?\b|bags?\b|packaging/.test(folder)) return "packaging-only";
  if (/line ?ups?|family|range|all flavou?rs/.test(folder)) return "lineup";
  if (/dieline|label|print/.test(folder)) return "label-flat";
  switch (asset.subclass) {
    case "device-render": return "device-only";
    case "packaging-render": return "packaging-only";
    case "label-art": case "dieline": return "label-flat";
    case "cutout-transparent": return asset.has_alpha ? "device-only" : "n/a";
    default: return "n/a";
  }
}

export function angleOf(asset) {
  const angle = asset.analysis?.angle;
  const text = `${asset.title || ""} ${String(asset.path || "").split("/").pop()}`.toLowerCase();
  // The team's own naming outranks the model: a file called "Back View" is a back view even when it is angled.
  if (/\bback\b|_back|rear view/.test(text) && !/\bfront\b/.test(text)) return "back";
  if (angle && angle !== "n/a") return angle;
  if (/three[- ]?quarter|3\/4|angled|angle/.test(text)) return "three-quarter";
  if (/\bback\b|rear/.test(text)) return "back";
  if (/\bside\b|profile/.test(text)) return "side";
  if (/\btop\b|overhead|flat ?lay/.test(text)) return "top";
  if (/\bfront\b|straight/.test(text)) return "front";
  return "n/a";
}

/** Higher is better. Verdicts and the approved folder outrank everything else; discontinued sinks. */
export function referenceScore(asset) {
  const render = asset.flags?.render || renderPathFacts(asset.path) || {};
  const usability = asset.analysis?.usability || {};
  let score = 0;
  if (asset.verdict === "approved") score += 100;
  if (asset.verdict === "rejected") score -= 100;
  if (render.approved) score += 30;
  if (render.discontinued || usability.outdated_or_wrong || asset.flags?.do_not_use) score -= 80;
  if (usability.watermarked) score -= 40;
  if (usability.low_resolution) score -= 20;
  score += Math.min(Number(asset.quality) || 0, 1) * 30; // usability.quality is 0–1
  score += Math.min(render.version || 0, 9);
  if ((asset.reference_roles || []).includes("canonical")) score += 10;
  if (asset.width && asset.height) score += Math.min(Math.max(asset.width, asset.height) / 1000, 4);
  if (asset.has_alpha) score += 2;
  if (Number(asset.analysis?.product_confidence) >= 0.8) score += 5;
  return score;
}

function needlesFor(root, graph, brand, product) {
  const needles = new Set([String(product).toLowerCase().trim()]);
  for (const card of brandCards(root, graph)) {
    if (brand && card.id !== brand) continue;
    for (const item of card.products || []) {
      const names = [item.name, item.id, ...(item.aliases || [])].filter(Boolean).map((name) => String(name).toLowerCase());
      if (names.some((name) => name.includes([...needles][0]) || [...needles][0].includes(name))) names.forEach((name) => needles.add(name));
    }
  }
  return [...needles].filter((needle) => needle.length >= 3);
}

/** A flavour name is shared across product lines (Gush Mintz jar, cart, dispo…); a line word in the query decides. */
const LINE_WORDS = [
  [/\b(dispo|disposable|disposables|aio|all[- ]in[- ]one)\b/, /dispo|disposable|all[- ]?in[- ]?one|aio/],
  [/\b(cart|carts|cartridge|cartridges)\b/, /cart/],
  [/\b(jar|jars|flower)\b/, /jar|flower/],
  [/\b(pre[- ]?rolls?|joints?|kief)\b/, /pre[- ]?roll|joint|kief/],
  [/\b(gumm(y|ies)|edibles?)\b/, /gumm|edible/],
  [/\b(live resin)\b/, /live[ _-]?resin|\blr\b/],
  [/\b(distillate)\b/, /distillate/],
  [/\b(hash rosin|rosin)\b/, /rosin|\bhr\b/],
  [/\b(concentrates?|badder|diamonds?)\b/, /concentrate|badder|diamond/],
  [/\b(seltzer|can|cans)\b/, /seltzer|\bcan\b|cans/],
  [/\b(stick ?packs?|sachets?)\b/, /stick ?pack|sachet/],
  [/\b(vials?)\b/, /vial/],
  [/\b(hemp|thca)\b/, /hemp|thca/],
];

function matchStrength(asset, needles) {
  const product = String(asset.product || asset.analysis?.product || "").toLowerCase();
  const render = asset.flags?.render || {};
  const folder = `${render.line || ""} ${render.leaf || ""} ${render.category || ""}`.toLowerCase();
  const file = String(asset.path || "").toLowerCase().split("/").pop();
  const title = String(asset.title || "").toLowerCase();
  const haystack = `${product} ${folder} ${file} ${title} ${String(asset.path || "").toLowerCase()}`;
  // Line words asked for must be present; line words asked for and absent sink the match.
  const asked = needles.map((needle) => LINE_WORDS.filter(([ask]) => ask.test(needle))).flat();
  let lineBonus = 0;
  for (const [, has] of asked) lineBonus += has.test(haystack) ? 0.5 : -2;
  let best = 0;
  for (const needle of needles) {
    if (product.includes(needle)) best = Math.max(best, 3);
    if (folder.includes(needle)) best = Math.max(best, 2.5);
    if (file.includes(needle) || title.includes(needle)) best = Math.max(best, 2);
    const tokens = needle.split(/\s+/).filter((token) => token.length >= 3);
    if (tokens.length > 1 && tokens.every((token) => product.includes(token) || folder.includes(token) || file.includes(token))) best = Math.max(best, 1.5);
    // The flavour alone also matches when the query carried a line word ("gush mintz jar"): the line bonus decides.
    if (asked.length) { const flavour = needle.replace(/\b(dispo|disposables?|aio|all[- ]in[- ]one|carts?|cartridges?|jars?|flower|pre[- ]?rolls?|joints?|kief|gumm(y|ies)|edibles?|live resin|distillate|hash rosin|rosin|concentrates?|badder|diamonds?|seltzer|cans?|stick ?packs?|sachets?|vials?|hemp|thca)\b/g, " ").replace(/\s+/g, " ").trim(); if (flavour.length >= 3 && (product.includes(flavour) || folder.includes(flavour) || file.includes(flavour) || title.includes(flavour))) best = Math.max(best, 2); }
  }
  return best > 0 ? best + lineBonus : 0;
}

const slim = (asset, why) => ({
  id: asset.id, path: asset.path, title: asset.title, product: asset.product, subclass: asset.subclass,
  composition: compositionOf(asset), angle: angleOf(asset), roles: asset.reference_roles || [], alpha: Boolean(asset.has_alpha),
  size: asset.width ? `${asset.width}x${asset.height}` : null, quality: asset.quality, verdict: asset.verdict || null,
  approvedFolder: Boolean(asset.flags?.render?.approved), version: asset.flags?.render?.version || null, market: asset.flags?.render?.market || null,
  thumb: asset.proxies?.thumb || null, model: asset.proxies?.model || null, why,
});

/**
 * The reference kit for one product. `intent` is free text ("packaging hero", "device close-up in hand",
 * "flavour lineup", "label truth") and only changes which references are *recommended* first.
 */
export async function resolveProductReferences(db, graph, root, { brand = null, product, intent = "", limit = 3 } = {}) {
  if (!product) throw new Error("resolveProductReferences needs a product name");
  const needles = needlesFor(root, graph, brand, product);
  const params = [needles.map((needle) => `%${needle}%`)];
  const brandClause = brand ? (params.push(brand), ` and brand = $${params.length}`) : "";
  const { rows } = await db.query(`
    select id, source_id, path, title, class, subclass, product, quality, reference_roles, has_alpha, width, height, proxies, flags, analysis, verdict
    from dam.assets
    where status in ('analyzed','embedded') and deleted_at is null and duplicate_of is null and kind in ('image','document')${brandClause}
      and (class = any($${params.push(REF_CLASSES) && params.length}) or reference_roles && array['canonical','shape']::text[])
      and (product ilike any($1) or title ilike any($1) or path ilike any($1) or analysis->>'product' ilike any($1) or flags->'render'->>'line' ilike any($1) or flags->'render'->>'leaf' ilike any($1))
    limit 400`, params);
  const scored = rows.map((asset) => ({ asset, match: matchStrength(asset, needles), score: referenceScore(asset) })).filter((entry) => entry.match > 0);
  if (!scored.length) return { product, brand, needles, found: 0, kit: null, note: `No analysed product reference matches "${product}"${brand ? ` for ${brand}` : ""}. Check dam_product_directory for the folder name the team uses, or run the render pass for this brand.` };
  scored.sort((a, b) => b.match - a.match || b.score - a.score);
  const usable = scored.filter((entry) => entry.score > -50);
  const avoid = scored.filter((entry) => entry.score <= -50);
  const byComposition = (...kinds) => usable.filter((entry) => kinds.includes(compositionOf(entry.asset)));
  const pick = (entries, n = limit, why = "") => entries.slice(0, n).map((entry) => slim(entry.asset, why));

  // Identity = the product as sold, clean: packaging with device (Muha), else packaging, else the container
  // alone (Dialed / NuLumin). Scenes and hands only when nothing clean exists.
  const clean = (entries) => entries.filter((entry) => !["in-scene", "in-hand", "lineup", "multi-pack", "label-flat"].includes(compositionOf(entry.asset)));
  const identityPool = [...byComposition("device-with-packaging"), ...byComposition("packaging-only"), ...byComposition("device-only"), ...clean(usable.filter((entry) => (entry.asset.reference_roles || []).includes("canonical"))), ...clean(usable), ...usable];
  // A back or bottom view is never the identity while a front-facing view exists.
  const facing = (entry) => !["back", "bottom", "top"].includes(angleOf(entry.asset));
  const identity = pick([...identityPool.filter(facing), ...identityPool].filter((entry, index, all) => all.findIndex((other) => other.asset.id === entry.asset.id) === index), limit, "canonical look of the product as sold — judge drift against this");
  const device = pick(byComposition("device-only", "in-hand"), limit, "the device / container alone — close-ups, in-hand, product-only heroes");
  const packaging = pick(byComposition("packaging-only", "device-with-packaging"), limit, "the packaging as subject");
  const angles = {};
  const single = usable.filter((entry) => !["multi-pack", "lineup", "in-scene", "in-hand", "label-flat"].includes(compositionOf(entry.asset)));
  for (const angle of ANGLE_ORDER) { const best = (single.length ? single : usable).find((entry) => angleOf(entry.asset) === angle); if (best) angles[angle] = slim(best.asset, `best ${angle} view`); }
  const cutout = pick(usable.filter((entry) => entry.asset.has_alpha || entry.asset.subclass === "cutout-transparent"), limit, "transparent PNG — compositing and overlays");
  const label = pick(byComposition("label-flat"), limit, "flat label / dieline — the truth for printed copy and colours");
  const lineup = pick(byComposition("lineup", "multi-pack"), limit, "several units or flavours together — range and display shots");

  const wants = String(intent || "").toLowerCase();
  const recommended = [];
  const add = (item, reason) => { if (item && !recommended.some((existing) => existing.id === item.id)) recommended.push({ ...item, why: reason }); };
  if (/label|copy|text|print|dieline|colou?r accuracy/.test(wants)) add(label[0], "intent asks for label truth");
  if (/device|close[- ]?up|in[- ]?hand|holding|hero|product only|alone/.test(wants)) add(device[0], "intent is about the device / container itself");
  if (/pack|box|packaging|unbox|shelf/.test(wants)) add(packaging[0], "intent is about the packaging");
  if (/lineup|range|flavou?rs|all skus|family|set|display/.test(wants)) add(lineup[0], "intent is about the range");
  if (/composite|overlay|cutout|transparent|banner|web/.test(wants)) add(cutout[0], "intent needs a transparent cutout");
  add(identity[0], "always: the canonical look");
  if (!recommended.length) for (const entry of usable.slice(0, 2)) add(slim(entry.asset, ""), "best available match for this product");
  if (device[0]) add(device[0], "the product alone, for any close framing");
  if (!recommended.some((item) => item.angle === "three-quarter") && angles["three-quarter"]) add(angles["three-quarter"], "a second angle so the model learns the geometry");
  const composition = { device: device.length, packaging: packaging.length, identity: identity.length, cutout: cutout.length, label: label.length, lineup: lineup.length, angles: Object.keys(angles) };
  const missing = [];
  if (!device.length) missing.push("no device-only / container-only render");
  if (!identity.length) missing.push("no packaging or canonical reference");
  if (!cutout.length) missing.push("no transparent cutout");
  if (!angles.side && !angles["three-quarter"]) missing.push("only one angle");
  if (!label.length) missing.push("no flat label artwork");
  const products = [...new Set(usable.map((entry) => entry.asset.product).filter(Boolean))].slice(0, 8);
  return {
    product, brand, needles, found: scored.length, usable: usable.length, productsSeen: products,
    kit: { recommended: recommended.slice(0, 4), identity, device, packaging, angles, cutout, label, lineup, avoid: pick(avoid, 6, "discontinued, outdated, flagged or rejected — do not pass") },
    coverage: { ...composition, missing },
  };
}

/** Prompt-ready lines for a kit. */
export function renderProductKit(result) {
  if (!result?.kit) return result?.note ? [`- ${result.note}`] : [];
  const line = (item) => `- [${item.composition}${item.angle && item.angle !== "n/a" ? ` · ${item.angle}` : ""}${item.alpha ? " · alpha" : ""}${item.verdict === "approved" ? " · APPROVED" : item.approvedFolder ? " · approved folder" : ""}] ${item.path} — ${item.title || ""}${item.thumb ? ` (thumb: ${item.thumb})` : ""} — ${item.why}`;
  const lines = [`Product: ${result.product}${result.productsSeen.length ? ` (library names it: ${result.productsSeen.slice(0, 3).join("; ")})` : ""} — ${result.usable} usable references`];
  lines.push("Use these:");
  for (const item of result.kit.recommended) lines.push(line(item));
  const extras = [...result.kit.cutout.slice(0, 1), ...result.kit.label.slice(0, 1), ...result.kit.lineup.slice(0, 1)].filter((item) => !result.kit.recommended.some((chosen) => chosen.id === item.id));
  if (extras.length) { lines.push("Also available:"); for (const item of extras) lines.push(line(item)); }
  if (result.coverage.missing.length) lines.push(`Missing for this product: ${result.coverage.missing.join("; ")}.`);
  if (result.kit.avoid.length) lines.push(`Do not use: ${result.kit.avoid.map((item) => item.path.split("/").pop()).slice(0, 4).join(", ")}${result.kit.avoid.length > 4 ? ", …" : ""}.`);
  return lines;
}

/**
 * The kit in the shape the dialed-studio video MCP consumes (create_from_request.refs / scene_frame refs):
 * [{ path, name, role, describe, contains_person, third_party_marks }]. `path` is the local file once
 * materialised (auto-refs), or the Dropbox path for the studio's own puller; describe is ≥ 60 chars as the
 * studio's product gate requires. The studio's generation logic is untouched — it only receives files it
 * would otherwise have picked by file name.
 */
export function exportForStudio(result, { localPaths = {} } = {}) {
  if (!result?.kit) return [];
  const seen = new Set();
  const out = [];
  for (const item of [...result.kit.recommended, ...result.kit.cutout.slice(0, 1), ...result.kit.label.slice(0, 1)]) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    const describe = `${item.title || result.product}: ${item.composition.replace(/-/g, " ")}${item.angle && item.angle !== "n/a" ? `, ${item.angle} view` : ""}${item.alpha ? ", transparent background" : ""}${item.verdict === "approved" ? ", team-approved reference" : item.approvedFolder ? ", from the approved renders folder" : ""}. ${item.why}`;
    out.push({ path: localPaths[item.id] || item.path, name: (item.title || result.product).slice(0, 80), role: item.composition === "label-flat" ? "label" : "product", describe: describe.length >= 60 ? describe : `${describe} Exact product identity reference for ${result.product}.`, contains_person: item.composition === "in-hand", third_party_marks: [], dam_asset_id: item.id, composition: item.composition, angle: item.angle });
  }
  return out;
}

/** Resolve a product, bring its chosen files onto disk, and return them in the studio's refs shape. */
export async function studioReferences(db, graph, root, { brand = null, product, intent = "", materialize = true } = {}) {
  const result = await resolveProductReferences(db, graph, root, { brand, product, intent, limit: 3 });
  if (!result.kit) return { product, brand, refs: [], note: result.note };
  const localPaths = {};
  const problems = [];
  if (materialize) {
    const { materializeReference } = await import("../learning/auto-refs.mjs");
    let dropbox = null;
    try { const { DropboxClient } = await import("./dropbox.mjs"); dropbox = DropboxClient.fromEnv(process.env); } catch { dropbox = null; }
    for (const item of [...result.kit.recommended, ...result.kit.cutout.slice(0, 1), ...result.kit.label.slice(0, 1)]) {
      if (!item || localPaths[item.id]) continue;
      try { localPaths[item.id] = (await materializeReference(root, db, item, { dropbox, preferOriginal: item.composition === "label-flat" })).path; }
      catch (error) { problems.push(`${item.path.split("/").pop()}: ${String(error.message).slice(0, 100)}`); }
    }
  }
  return { product, brand, usable: result.usable, refs: exportForStudio(result, { localPaths }), missing: result.coverage?.missing || [], problems };
}
