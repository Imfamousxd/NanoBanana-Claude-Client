// Product renders and product assets, per brand and per product, current and inbound — the DAM's first job.
//
// The team Dropbox already carries a folder taxonomy for renders ("Renders/<Category>/<Market>/<Line>/…",
// "Approved Renders/Renders/<Market>/…", "Website Assets/…/Product Renders/…"). That structure is free,
// deterministic and available for every file the moment it is discovered, long before the paid vision
// pass. So the product directory is built from the path first and enriched by analysis second:
//   path  → brand (source), category, market, line, approved / discontinued, version
//   vision → product string, subclass (render-3d, cutout-transparent, …), roles, quality, alpha
//
// A file that lands in one of those folders is a *render candidate*: it is probed first, analysed first
// when a worker may spend, and — when DAM_AUTO_PRODUCT_REFS=1 — analysed automatically as it arrives,
// under its own small daily cap, without unlocking the rest of the library.
import { estimateUsd } from "./config.mjs";
import { brandCards } from "./analyze.mjs";

/** A path segment that marks a product-render tree. Matched against whole segments, not substrings. */
export const RENDER_ROOT_RE = /^(approved renders?|renders?|product renders?|product photos?|packshots?|product shots?|cut ?outs?|transparent(?:s| pngs?)?|sku images|product images|hero shots?|white bg.*|3d renders?)$/i;
/** Anything under these is not a product asset even when it sits in a render tree. */
export const RENDER_EXCLUDE_RE = /texture|archmodels|cinema 4d|\/tex\/|_thumbnails|(^|\/)icons?\/|strain graphics|lifestyle|ugc|meme|screenshot|(^|\/)logos?\/|animation|hdri/i;
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "tif", "tiff", "webp", "heic"]);
const MARKETS = new Set(["ca", "mi", "ny", "nm", "mo", "az", "fl", "nv", "ok", "nj", "il", "co", "wa", "or", "tx", "ma", "md", "oh", "pa", "mn", "usa", "us", "eu", "uk"]);

/** Structured facts a render path carries. Null when the path is not inside a render tree. */
export function renderPathFacts(relativePath) {
  const segments = String(relativePath).split("/");
  segments.pop(); // file name
  const index = segments.findIndex((segment) => RENDER_ROOT_RE.test(segment.trim()));
  if (index < 0) return null;
  const root = segments[index].trim();
  const below = segments.slice(index + 1).map((segment) => segment.trim()).filter((segment) => segment && !RENDER_ROOT_RE.test(segment));
  const facts = {
    root,
    approved: segments.some((segment) => /approved/i.test(segment)),
    discontinued: segments.some((segment) => /discontinued|old versions?|archive|\bold\b|outdated|do not use/i.test(segment)),
    market: null, version: null, category: null, line: null, leaf: null, group: null, depth: below.length,
  };
  const rest = [];
  for (const segment of below) {
    const key = segment.toLowerCase();
    if (MARKETS.has(key)) { facts.market = key.toUpperCase(); continue; }
    const version = key.match(/^v(?:ersion)?[ _-]?(\d+)$/);
    if (version) { facts.version = Number(version[1]); continue; }
    rest.push(segment);
  }
  facts.category = rest[0] || null;
  facts.line = rest[1] || null;
  facts.leaf = rest[rest.length - 1] || null;
  // The directory groups by category + line; a deeper folder is a variant of the same line.
  facts.group = [facts.category, facts.line].filter(Boolean).join(" / ") || root;
  return facts;
}

export function isRenderCandidate(relativePath, extension = null) {
  const ext = String(extension || relativePath.split(".").pop() || "").toLowerCase();
  if (!IMAGE_EXT.has(ext)) return false;
  if (RENDER_EXCLUDE_RE.test(relativePath)) return false;
  return renderPathFacts(relativePath) !== null;
}

/** SQL fragment for the same rule, so bulk queries and the JS rule agree. */
export const RENDER_CANDIDATE_SQL = `kind = 'image' and deleted_at is null and duplicate_of is null and flags->>'candidate' = 'product-ref'`;

/** Brand a source belongs to (sources carry brand_hint; MEDIA Team folders fall back to their name). */
export function brandForSource(source) {
  if (source?.brand_hint) return source.brand_hint;
  const id = String(source?.id || source || "");
  if (/muha/.test(id)) return "brand.muha";
  if (/dialed-health/.test(id)) return "brand.dialed-health";
  if (/dialed-labs|dialed-and-defend/.test(id)) return "brand.dialed-labs";
  if (/dialed-moods/.test(id)) return "brand.dialed-moods";
  if (/nulumin/.test(id)) return "brand.nulumin";
  if (/noble/.test(id)) return "brand.noble-harbor";
  return null;
}

/**
 * Mark every discovered image inside a render tree as a product-ref candidate and move it to the front
 * of every queue. Free. Idempotent. Returns per-brand counts and the estimated cost of analysing what
 * is not analysed yet.
 */
export async function flagRenderCandidates(db, { brand = null, dryRun = false, model = "gemini-2.5-flash", embedModel = "gemini-embedding-2" } = {}) {
  const sources = await db.listSources();
  const sourceBrand = new Map(sources.map((source) => [source.id, brandForSource(source)]));
  const { rows } = await db.query(
    "select id, source_id, path, extension, status, flags from dam.assets where kind = 'image' and deleted_at is null and duplicate_of is null and path ~* $1 and path !~* $2",
    ["(^|/)(approved renders?|renders?|product renders?|product photos?|packshots?|product shots?|cut ?outs?|transparent(s| pngs?)?|sku images|product images|hero shots?|white bg[^/]*|3d renders?)(/|$)", RENDER_EXCLUDE_RE.source],
  );
  const flagged = [];
  const perBrand = {};
  for (const row of rows) {
    const b = sourceBrand.get(row.source_id) || null;
    if (brand && b !== brand) continue;
    if (!isRenderCandidate(row.path, row.extension)) continue;
    const facts = renderPathFacts(row.path);
    flagged.push({ id: row.id, flags: JSON.stringify({ candidate: "product-ref", render: facts, brand_hint: b }) });
    const bucket = (perBrand[b || "unknown"] ??= { candidates: 0, analysed: 0, approvedFolder: 0, discontinued: 0 });
    bucket.candidates += 1;
    if (["analyzed", "embedded"].includes(row.status)) bucket.analysed += 1;
    if (facts.approved) bucket.approvedFolder += 1;
    if (facts.discontinued) bucket.discontinued += 1;
  }
  if (!dryRun && flagged.length) {
    for (let i = 0; i < flagged.length; i += 2000) {
      const chunk = flagged.slice(i, i + 2000);
      await db.query("update dam.assets a set flags = a.flags || t.f::jsonb from unnest($1::uuid[], $2::text[]) as t(id, f) where a.id = t.id", [chunk.map((row) => row.id), chunk.map((row) => row.flags)]);
    }
    // Candidates go first in every queue: probe (free) at 1, analyze/embed at 0 and tagged auto so an
    // auto-intake worker may take them.
    await db.query("update dam.jobs j set priority = 1 from dam.assets a where a.id = j.asset_id and a.flags->>'candidate' = 'product-ref' and j.kind = 'probe' and j.status = 'pending' and j.priority > 1");
    await db.query("update dam.jobs j set priority = 0, payload = coalesce(j.payload, '{}'::jsonb) || '{\"auto\":\"product-ref\"}'::jsonb from dam.assets a where a.id = j.asset_id and a.flags->>'candidate' = 'product-ref' and j.kind in ('analyze','embed') and j.status = 'pending' and (j.priority > 0 or not (coalesce(j.payload, '{}'::jsonb) ? 'auto'))");
  }
  const perImage = estimateUsd(model, "vision-image") + estimateUsd(embedModel, "embed", 2);
  let total = 0;
  for (const bucket of Object.values(perBrand)) { bucket.toAnalyse = bucket.candidates - bucket.analysed; bucket.estimatedUsd = Math.round(bucket.toAnalyse * perImage * 100) / 100; total += bucket.toAnalyse; }
  return { flagged: dryRun ? 0 : flagged.length, matched: flagged.length, perBrand, toAnalyse: total, estimatedUsd: Math.round(total * perImage * 100) / 100, perImageUsd: perImage };
}

/**
 * The product directory: brand → category / line → what exists, what is analysed, what the vision model
 * calls it, the best files to hand a generation, and what is still missing. Registry products with no
 * matching asset are listed as gaps.
 */
export async function productDirectory(db, graph, root, { brand = null, since = null, limit = 6 } = {}) {
  const sources = await db.listSources();
  const sourceBrand = new Map(sources.map((source) => [source.id, brandForSource(source)]));
  const params = [];
  const where = [RENDER_CANDIDATE_SQL];
  if (since) { params.push(since); where.push(`modified_at >= $${params.length}`); }
  const { rows } = await db.query(`select id, source_id, path, status, class, subclass, product, quality, reference_roles, has_alpha, width, height, proxies->>'thumb' as thumb, title, modified_at, flags->'render' as render, flags->>'brand_hint' as brand_hint, verdict from dam.assets where ${where.join(" and ")}`, params);
  const groups = new Map();
  for (const row of rows) {
    const b = row.brand_hint || sourceBrand.get(row.source_id) || null;
    if (brand && b !== brand) continue;
    const facts = row.render || renderPathFacts(row.path) || { group: "(root)", category: null, line: null };
    const key = `${b}|${facts.group}`;
    const group = groups.get(key) || { brand: b, category: facts.category, line: facts.line, group: facts.group, files: 0, analysed: 0, approvedFolder: 0, discontinued: 0, markets: new Set(), versions: new Set(), products: new Map(), subclasses: new Map(), roles: new Map(), alpha: 0, newest: null, best: [], sources: new Set() };
    group.files += 1;
    group.sources.add(row.source_id);
    if (facts.approved) group.approvedFolder += 1;
    if (facts.discontinued) group.discontinued += 1;
    if (facts.market) group.markets.add(facts.market);
    if (facts.version) group.versions.add(facts.version);
    if (row.modified_at && (!group.newest || row.modified_at > group.newest)) group.newest = row.modified_at;
    const analysed = ["analyzed", "embedded"].includes(row.status);
    if (analysed) {
      group.analysed += 1;
      if (row.product) group.products.set(row.product, (group.products.get(row.product) || 0) + 1);
      if (row.subclass) group.subclasses.set(row.subclass, (group.subclasses.get(row.subclass) || 0) + 1);
      for (const role of row.reference_roles || []) group.roles.set(role, (group.roles.get(role) || 0) + 1);
      if (row.has_alpha) group.alpha += 1;
      group.best.push({ id: row.id, title: row.title, product: row.product, subclass: row.subclass, quality: row.quality, alpha: row.has_alpha, size: row.width ? `${row.width}x${row.height}` : null, thumb: row.thumb, path: row.path, verdict: row.verdict, roles: row.reference_roles || [] });
    }
    groups.set(key, group);
  }
  const directory = [...groups.values()].map((group) => ({
    brand: group.brand, category: group.category, line: group.line, group: group.group,
    files: group.files, analysed: group.analysed, pending: group.files - group.analysed,
    approvedFolder: group.approvedFolder, discontinued: group.discontinued,
    markets: [...group.markets].sort(), versions: [...group.versions].sort((a, b) => a - b), sources: [...group.sources],
    newest: group.newest,
    products: [...group.products.entries()].sort((a, b) => b[1] - a[1]).map(([product, n]) => ({ product, n })),
    subclasses: Object.fromEntries(group.subclasses), roles: Object.fromEntries(group.roles),
    missing: group.analysed ? { transparent: group.alpha === 0 && !group.subclasses.has("cutout-transparent"), canonical: !group.roles.has("canonical") } : null,
    best: group.best.sort((a, b) => (b.verdict === "approved") - (a.verdict === "approved") || (b.quality || 0) - (a.quality || 0)).slice(0, limit),
  })).sort((a, b) => String(a.brand).localeCompare(String(b.brand)) || String(a.category).localeCompare(String(b.category)) || b.files - a.files);

  // Registry products with no analysed render whose product string mentions them.
  const gaps = [];
  const analysedProducts = new Map();
  for (const entry of directory) for (const { product } of entry.products) analysedProducts.set(`${entry.brand}|${product.toLowerCase()}`, entry.group);
  for (const card of brandCards(root, graph)) {
    if (brand && card.id !== brand) continue;
    const seen = new Set();
    for (const product of card.products || []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      const needles = [product.name, ...(product.aliases || [])].filter(Boolean).map((needle) => needle.toLowerCase());
      const hit = [...analysedProducts.keys()].some((key) => key.startsWith(`${card.id}|`) && needles.some((needle) => key.includes(needle)));
      if (!hit) gaps.push({ brand: card.id, product: product.name, id: product.id });
    }
  }
  const totals = directory.reduce((sum, entry) => ({ groups: sum.groups + 1, files: sum.files + entry.files, analysed: sum.analysed + entry.analysed }), { groups: 0, files: 0, analysed: 0 });
  return { totals, directory, registryGaps: gaps };
}

/** Compact text for agents and the CLI: one line per group. */
export function renderDirectoryText({ totals, directory, registryGaps }) {
  const lines = [`${totals.groups} product groups · ${totals.files} render files · ${totals.analysed} analysed`];
  let currentBrand = null;
  for (const entry of directory) {
    if (entry.brand !== currentBrand) { currentBrand = entry.brand; lines.push("", `== ${entry.brand || "unknown brand"} ==`); }
    const flags = [entry.approvedFolder ? "approved-folder" : null, entry.discontinued === entry.files ? "discontinued" : null, entry.markets.length ? entry.markets.join("/") : null].filter(Boolean).join(" · ");
    const products = entry.products.slice(0, 4).map((item) => `${item.product} ×${item.n}`).join("; ");
    lines.push(`- ${entry.group}: ${entry.files} files, ${entry.analysed} analysed${flags ? ` [${flags}]` : ""}${products ? ` → ${products}` : ""}${entry.missing?.transparent ? " · no transparent cutout" : ""}`);
  }
  if (registryGaps.length) { lines.push("", "Registry products with no analysed render yet:"); for (const gap of registryGaps) lines.push(`- ${gap.brand}: ${gap.product}`); }
  return lines.join("\n");
}
