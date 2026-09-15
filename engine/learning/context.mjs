// Context pack — what a generating agent should read before writing a prompt for a brand. It joins the
// graph (brand profile, compliance, routing), the product registries (exact reference files), the
// learning store (laws, approved exemplars with their prompts, recent rejections) and ranked
// knowledge chunks into one object plus a paste-ready prompt block. This is the read side of the
// self-improvement loop; feedback.mjs is the write side.
import { relatedNodes, resolveBrand } from "../knowledge/graph.mjs";
import { loadKnowledgeIndex } from "../knowledge/indexer.mjs";
import { queryKnowledge, tokenize } from "../knowledge/retrieval.mjs";
import { readJson } from "../core/files.mjs";
import path from "node:path";
import fs from "node:fs";
import { buildAssetCatalog, listProducts, searchAssets } from "../assets/catalog.mjs";
import { loadLearnings, requireBrand } from "./store.mjs";
import { searchLaws } from "./laws.mjs";

function overlap(terms, text) {
  const set = new Set(tokenize(text));
  let score = 0;
  for (const term of terms) if (set.has(term)) score += 1;
  return score;
}

function matchProducts(catalogProducts, brief, requested = []) {
  const needles = requested.map((value) => String(value).toLowerCase());
  const briefText = ` ${String(brief).toLowerCase()} `;
  return catalogProducts.filter((product) => {
    const names = [product.product, product.name, ...(product.aliases || [])].filter(Boolean).map((value) => String(value).toLowerCase());
    if (needles.some((needle) => names.some((name) => name === needle || name.includes(needle)))) return true;
    return names.some((name) => name.length >= 4 && briefText.includes(` ${name} `) || (name.length >= 6 && briefText.includes(name)));
  });
}

function registryLocked(root, graph, brandNode, matchedProducts) {
  const locked = [];
  const gaps = [];
  for (const registry of relatedNodes(graph, brandNode.id, "has-products")) {
    const file = path.resolve(root, registry.path || registry.source);
    if (!fs.existsSync(file)) continue;
    const data = readJson(file);
    for (const rule of data.locked || []) locked.push({ scope: "brand", rule });
    for (const gap of data.gaps || []) gaps.push(gap);
    for (const product of data.products || []) {
      const hit = matchedProducts.some((item) => [item.product, item.name].map((value) => String(value).toLowerCase()).includes(String(product.sku || product.name).toLowerCase()));
      if (!hit) continue;
      for (const rule of product.locked || []) locked.push({ scope: product.sku || product.name, rule });
      if (product.geometry) locked.push({ scope: product.sku || product.name, rule: `Geometry: ${typeof product.geometry === "string" ? product.geometry : JSON.stringify(product.geometry)}` });
      if (product.label) locked.push({ scope: product.sku || product.name, rule: `Label: ${typeof product.label === "string" ? product.label : JSON.stringify(product.label)}` });
    }
    if (data.lockedSpellings) locked.push({ scope: "brand", rule: `Locked spellings: ${JSON.stringify(data.lockedSpellings.strings || data.lockedSpellings)}` });
  }
  return { locked, gaps };
}

function routingHint(store, category) {
  const rows = Object.entries(store.stats?.byProviderCategory || {})
    .filter(([key]) => !category || key.endsWith(` :: ${category}`))
    .map(([key, counts]) => ({ key, ...counts, total: (counts.approved || 0) + (counts.rejected || 0) + (counts.revise || 0) }))
    .filter((row) => row.total > 0)
    .map((row) => ({ ...row, approvalRate: Math.round(((row.approved || 0) / row.total) * 100) / 100 }))
    .sort((a, b) => b.approvalRate - a.approvalRate || b.total - a.total);
  const overall = Object.entries(store.stats?.byProvider || {}).map(([key, counts]) => ({ key, ...counts }));
  return { byProviderForCategory: rows, byProvider: overall };
}

/**
 * Real assets from the DAM for this brief: canonical-grade product refs, real-creator UGC exemplars
 * and the measured UGC profile. Optional: returns null when the DAM database is unreachable or empty,
 * so a context pack never fails because the library is offline.
 */
export async function damContext(root, graph, { brandId, brief, category, products: namedProducts = [] }) {
  try {
    const [{ damConfig }, { DamDb }, { searchAssets, productIndexFromCards }, { brandCards }, { getUgcProfile }, { resolveProductReferences }] = await Promise.all([
      import("../dam/config.mjs"), import("../dam/db.mjs"), import("../dam/search.mjs"), import("../dam/analyze.mjs"), import("../dam/ugc-profile.mjs"), import("../dam/product-context.mjs"),
    ]);
    const config = damConfig(root);
    if (!config.databaseUrl) return null;
    const db = new DamDb(config.databaseUrl);
    try {
      const { rows: probe } = await db.query("select to_regclass('dam.assets') as t");
      if (!probe[0]?.t) return null;
      const products = productIndexFromCards(brandCards(root, graph));
      const refs = await searchAssets(db, graph, brief, { filters: { brand: brandId, roles: ["canonical", "shape", "style", "logo"] }, limit: 8, config: { ...config, searchEmbeddingsAllowed: false }, products });
      const wantsUgc = /ugc|creator|talking|testimonial|unbox|influencer|reel|tiktok|video/i.test(`${brief} ${category || ""}`);
      const ugc = wantsUgc ? await searchAssets(db, graph, brief, { filters: { brand: brandId, class: "ugc-video", realHuman: true }, limit: 6, config: { ...config, searchEmbeddingsAllowed: false }, products }) : null;
      const profile = wantsUgc ? await getUgcProfile(db, brandId) : null;
      const slim = (row) => ({ id: row.id, path: row.path, title: row.title, class: row.class, form: row.subclass, product: row.product, roles: row.reference_roles, quality: row.quality, thumb: row.proxies?.thumb || null, preview: row.proxies?.preview || null, summary: String(row.summary || "").slice(0, 300) });
      // Product kits: for every product the brief names, the chosen references (identity / device / packaging /
      // angles / cutout / label), with the intent taken from the brief. Falls back to the brief as a product query.
      const names = [...new Set(namedProducts.filter(Boolean))];
      if (!names.length && brief) {
        const seen = (await db.query("select distinct product from dam.assets where brand = $1 and product is not null and status in ('analyzed','embedded') and deleted_at is null", [brandId])).rows.map((row) => String(row.product));
        const lower = brief.toLowerCase();
        for (const product of seen) { const tokens = product.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 4); if (tokens.length && tokens.filter((token) => lower.includes(token)).length >= Math.min(2, tokens.length)) names.push(product); }
      }
      const productKits = [];
      for (const name of names.slice(0, 3)) { try { productKits.push(await resolveProductReferences(db, graph, root, { brand: brandId, product: name, intent: brief })); } catch (error) { productKits.push({ product: name, note: String(error.message).slice(0, 160) }); } }
      return { references: refs.results.map(slim), productKits, ugcExemplars: ugc ? ugc.results.map(slim) : [], ugcProfile: profile ? { sampleSize: profile.sample_size, bands: profile.bands, patterns: profile.patterns, laws: profile.laws } : null };
    } finally { await db.end(); }
  } catch (error) {
    return { unavailable: String(error.message).slice(0, 200) };
  }
}

export function buildContextPack(root, graph, { brand, brief, category = undefined, mode = undefined, products = [], limit = 6 }) {
  const brandNode = requireBrand(graph, brand);
  const catalog = buildAssetCatalog(root, graph, { brand: brandNode.id });
  const catalogProducts = listProducts(catalog, brandNode.id);
  const matchedProducts = matchProducts(catalogProducts, brief || "", products);
  const terms = [...new Set(tokenize(`${brief} ${category || ""} ${mode || ""} ${matchedProducts.map((item) => `${item.product} ${item.name}`).join(" ")}`))];

  const references = [];
  for (const product of matchedProducts) {
    const items = searchAssets(catalog, { brand: brandNode.id, product: product.product, existingOnly: false, limit: 12 });
    const ordered = ["canonical", "logo", "shape", "style", "approved-output", "canonical-white", "reference", "cutout", "asset", "brand-asset"];
    items.sort((a, b) => Math.min(...a.roles.map((role) => ordered.indexOf(role) === -1 ? 99 : ordered.indexOf(role))) - Math.min(...b.roles.map((role) => ordered.indexOf(role) === -1 ? 99 : ordered.indexOf(role))));
    for (const item of items.slice(0, 6)) references.push({ product: product.product, path: item.path, roles: item.roles, note: item.note, exists: item.exists, tracked: item.tracked });
  }
  const logos = searchAssets(catalog, { brand: brandNode.id, role: "logo", limit: 4 }).map((item) => ({ path: item.path, note: item.note, exists: item.exists, tracked: item.tracked }));
  const banned = catalog.items.filter((item) => item.banned).map((item) => ({ path: item.path, note: item.note }));

  const { store } = loadLearnings(root, graph, brandNode.id);
  const laws = searchLaws(root, graph, `${brief} ${category || ""} ${mode || ""}`, { brand: brandNode.id, category, limit, includeGlobal: Boolean(mode?.includes("video")) });
  const exemplars = (store.exemplars || [])
    .map((exemplar) => ({ exemplar, score: overlap(terms, `${exemplar.prompt} ${(exemplar.tags || []).join(" ")} ${exemplar.category || ""} ${exemplar.product || ""}`) + (category && exemplar.category === category ? 2 : 0) + (matchedProducts.some((item) => item.product === exemplar.product) ? 2 : 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.exemplar.createdAt.localeCompare(a.exemplar.createdAt))
    .slice(0, Math.min(limit, 4))
    .map(({ exemplar }) => ({ id: exemplar.id, image: exemplar.tracked || exemplar.output?.path, original: exemplar.output?.path, provider: exemplar.provider, model: exemplar.model, category: exemplar.category, product: exemplar.product, tags: exemplar.tags, reason: exemplar.reason, prompt: String(exemplar.prompt || "").slice(0, 1_500), refs: (exemplar.refs || []).map((item) => item.path) }));
  const rejections = (store.events || [])
    .filter((event) => event.verdict !== "approved")
    .map((event) => ({ event, score: overlap(terms, `${event.prompt || ""} ${event.reason} ${(event.tags || []).join(" ")} ${event.category || ""} ${event.product || ""}`) + (category && event.category === category ? 2 : 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.event.ts.localeCompare(a.event.ts))
    .slice(0, 4)
    .map(({ event }) => ({ id: event.id, verdict: event.verdict, reason: event.reason, provider: event.provider, model: event.model, category: event.category, product: event.product, lawId: event.lawId || null, promptExcerpt: String(event.prompt || "").slice(0, 400) }));

  const { locked, gaps } = registryLocked(root, graph, brandNode, matchedProducts);
  const compliance = graph.nodes.find((node) => node.type === "compliance-profile" && node.id === `compliance.${brandNode.complianceProfile}`) || { id: `compliance.${brandNode.complianceProfile}`, name: brandNode.complianceProfile };
  const routingRules = graph.nodes.filter((node) => node.type === "routing-rule").flatMap((node) => (node.rules || []).map((rule) => ({ from: node.id, rule })));
  const index = loadKnowledgeIndex(root);
  const knowledge = queryKnowledge(index, graph, `${brandNode.name} ${brief}`, { brand: brandNode.id, limit, category }).map((item) => ({ id: item.id, source: item.source, heading: item.heading, score: item.score, text: item.text.slice(0, 600) }));

  const pack = {
    brand: { id: brandNode.id, name: brandNode.name, aliases: brandNode.aliases || [], source: brandNode.source, pack: brandNode.pack || null, promptProfile: brandNode.promptProfile || null },
    brief, category: category || null, mode: mode || null,
    products: matchedProducts,
    availableProducts: catalogProducts.map((item) => ({ product: item.product, name: item.name, canonical: item.canonical, onDisk: item.onDisk })),
    references, logos, banned, locked, gaps,
    laws, exemplars, rejections,
    compliance: { id: compliance.id, name: compliance.name, requiredDisclosure: compliance.requiredDisclosure || null, humanReviewRequired: compliance.humanReviewRequired ?? null, forbiddenConcepts: compliance.forbiddenConcepts || [] },
    routing: { rules: routingRules, learned: routingHint(store, category) },
    knowledge,
    learningStats: store.stats?.verdicts || {},
  };
  return { pack, promptBlock: renderPromptBlock(pack) };
}

export async function buildContextPackWithDam(root, graph, options) {
  const base = buildContextPack(root, graph, options);
  const dam = await damContext(root, graph, { brandId: base.pack.brand.id, brief: options.brief, category: options.category, products: [...(options.products || []), ...((base.pack.products || []).map((item) => item.name || item.product))] });
  const pack = { ...base.pack, dam };
  return { pack, promptBlock: renderPromptBlock(pack) };
}

export function renderPromptBlock(pack) {
  const lines = [];
  const push = (...values) => lines.push(...values);
  push(`# CONTEXT PACK — ${pack.brand.name}`, "");
  if (pack.brand.promptProfile) {
    const profile = pack.brand.promptProfile;
    push("## Brand invariants");
    if (profile.positioning) push(`- Positioning: ${profile.positioning}`);
    if (profile.palette?.length) push(`- Palette: ${profile.palette.join("; ")}`);
    if (profile.visualLanguage?.length) push(`- Visual language: ${profile.visualLanguage.join("; ")}`);
    if (profile.mustPreserve?.length) push(`- Must preserve: ${profile.mustPreserve.join("; ")}`);
    if (profile.avoid?.length) push(`- Avoid: ${profile.avoid.join("; ")}`);
    push("");
  }
  if (pack.references.length || pack.logos.length) {
    push("## References to pass (canonical first — never substitute a file found by browsing)");
    for (const ref of pack.references) push(`- [${ref.roles.join("/")}] ${ref.path}${ref.product ? ` — ${ref.product}` : ""}${ref.note ? ` — ${ref.note}` : ""}${ref.exists ? "" : " — NOT ON THIS DISK"}`);
    for (const logo of pack.logos) push(`- [logo] ${logo.path}${logo.note ? ` — ${logo.note}` : ""}${logo.exists ? "" : " — NOT ON THIS DISK"}`);
    push("");
  } else if (pack.availableProducts.length) {
    push("## No product matched the brief. Known products:", ...pack.availableProducts.slice(0, 40).map((item) => `- ${item.product} — ${item.name} (${item.canonical} canonical refs)`), "");
  }
  if (pack.banned.length) push("## Never use", ...pack.banned.map((item) => `- ${item.path}${item.note ? ` — ${item.note}` : ""}`), "");
  if (pack.locked.length) push("## Locked rules (each one encodes a past rejection)", ...pack.locked.map((item) => `- (${item.scope}) ${item.rule}`), "");
  if (pack.laws.length) push("## Learned laws", ...pack.laws.map((law) => `- [${law.confidence}] ${law.claim}${law.applies_to && law.applies_to !== "all" ? ` (applies to: ${law.applies_to})` : ""}`), "");
  if (pack.exemplars.length) {
    push("## Approved exemplars — match these, and reuse their prompt structure");
    for (const exemplar of pack.exemplars) {
      push(`- ${exemplar.image}${exemplar.provider ? ` — ${exemplar.provider}${exemplar.model ? `/${exemplar.model}` : ""}` : ""}${exemplar.reason ? ` — approved because: ${exemplar.reason}` : ""}`);
      if (exemplar.prompt) push(`  prompt: ${exemplar.prompt.replace(/\s+/g, " ").slice(0, 500)}`);
    }
    push("");
  }
  if (pack.rejections.length) push("## Recent rejections — do not repeat", ...pack.rejections.map((item) => `- ${item.reason}${item.provider ? ` (${item.provider}${item.model ? `/${item.model}` : ""})` : ""}`), "");
  push("## Compliance", `- Profile: ${pack.compliance.name}`);
  if (pack.compliance.requiredDisclosure) push(`- Required disclosure (verbatim, legible): "${pack.compliance.requiredDisclosure}"`);
  for (const concept of pack.compliance.forbiddenConcepts) push(`- Forbidden: ${concept}`);
  push("");
  push("## Provider routing", ...pack.routing.rules.map((item) => `- ${item.rule}`));
  for (const row of pack.routing.learned.byProviderForCategory.slice(0, 4)) push(`- Learned: ${row.key} — ${row.approved || 0} approved / ${row.rejected || 0} rejected / ${row.revise || 0} revise`);
  if (pack.gaps.length) push("", "## Known gaps (ask, do not substitute)", ...pack.gaps.map((gap) => `- ${gap}`));
  if (pack.dam && !pack.dam.unavailable) {
    if (pack.dam.productKits?.length) {
      push("", "## Product references (DAM) — chosen per product; pass these as reference images");
      for (const kit of pack.dam.productKits) push(...renderProductKitLines(kit));
    }
    if (pack.dam.references?.length) push("", "## Real assets in the library (DAM) — canonical-grade references", ...pack.dam.references.map((item) => `- [${(item.roles || []).join("/") || item.class}] ${item.path}${item.product ? ` — ${item.product}` : ""} — ${item.title}${item.thumb ? ` (thumb: ${item.thumb})` : ""}`));
    if (pack.dam.ugcExemplars?.length) push("", "## Real creator videos to imitate (DAM)", ...pack.dam.ugcExemplars.map((item) => `- ${item.path}${item.form ? ` — ${item.form}` : ""} — ${item.summary}${item.preview ? ` (preview: ${item.preview})` : ""}`));
    if (pack.dam.ugcProfile) {
      const bands = pack.dam.ugcProfile.bands || {};
      const fmt = (band) => (band ? `${band.p25}–${band.p75} (median ${band.median}, n=${band.n})` : "n/a");
      push("", `## Measured real-creator UGC profile (n=${pack.dam.ugcProfile.sampleSize})`, `- Duration s: ${fmt(bands.duration_s)}`, `- Articulation w/s: ${fmt(bands.articulation_wps)}`, `- Hook lands by s: ${fmt(bands.hook_end_s)}`, `- Shots: ${fmt(bands.shot_count)}`, `- Loudness LUFS: ${fmt(bands.loudness_lufs)}`);
      for (const law of pack.dam.ugcProfile.laws || []) push(`- [${law.confidence}] ${law.claim}`);
    }
  }
  return lines.join("\n");
}

function renderProductKitLines(kit) {
  if (!kit?.kit) return [`- ${kit?.product || "product"}: ${kit?.note || "no references"}`];
  const line = (item) => `- [${item.composition}${item.angle && item.angle !== "n/a" ? ` · ${item.angle}` : ""}${item.alpha ? " · alpha" : ""}${item.verdict === "approved" ? " · APPROVED" : item.approvedFolder ? " · approved folder" : ""}] ${item.path} — ${item.title || ""}${item.thumb ? ` (thumb: ${item.thumb})` : ""} — ${item.why}`;
  const lines = [`### ${kit.product}${kit.productsSeen?.length ? ` (library: ${kit.productsSeen.slice(0, 3).join("; ")})` : ""} — ${kit.usable} usable`];
  for (const item of kit.kit.recommended) lines.push(line(item));
  const extras = [...kit.kit.cutout.slice(0, 1), ...kit.kit.label.slice(0, 1), ...kit.kit.lineup.slice(0, 1)].filter((item) => !kit.kit.recommended.some((chosen) => chosen.id === item.id));
  for (const item of extras) lines.push(line(item));
  if (kit.coverage?.missing?.length) lines.push(`- Missing for this product: ${kit.coverage.missing.join("; ")}`);
  if (kit.kit.avoid?.length) lines.push(`- Do not use: ${kit.kit.avoid.map((item) => item.path.split("/").pop()).slice(0, 4).join(", ")}`);
  return lines;
}
