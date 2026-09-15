// Asset catalog — one flat, searchable view of every reference image the knowledge graph knows about,
// across the product registries (knowledge/products/*.json), the meme registry, the learning stores'
// approved exemplars and the tracked mirror layer (Brand Context/assets/<Brand>/). Each item says
// where it came from, what role it plays, which product it belongs to, whether it is on this disk
// and whether git tracks it — so a fresh clone can tell "canonical ref" from "local-only render".
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson } from "../core/files.mjs";
import { relatedNodes, resolveBrand } from "../knowledge/graph.mjs";
import { tokenize } from "../knowledge/retrieval.mjs";
import { inspectImageBuffer } from "../quality/asset-inspector.mjs";
import { LEARNINGS_DIR } from "../learning/store.mjs";
import { brandSlug } from "../learning/prompt-log.mjs";

const ASSET_EXTENSIONS = /\.(png|jpe?g|webp|gif|mp4|mov|pdf|svg|tiff?)$/i;
const NEGATIVE_SECTIONS = /banned|neveruse|superseded|reject|wrong/i;
const ROLE_BY_KEY = {
  logo: "logo", references: "reference", assets: "asset", vialCutouts: "cutout", adScenes: "style",
  cornerHeroes: "approved-output", finals: "approved-output", approved: "approved-output", approvedOutputs: "approved-output",
  categoryHeroFiles: "style", trioShots: "style", sceneAssets: "style", categoryShots: "style", lifestyleAnchor: "style",
  emailHeroes: "approved-output", coaArt: "asset", refs: "reference", outputs: "approved-output",
};

export function brandFolder(brandNode) {
  const fromSource = brandNode?.source ? path.basename(brandNode.source, path.extname(brandNode.source)) : null;
  return fromSource || String(brandNode?.name || brandSlug(brandNode)).replace(/[^A-Za-z0-9]+/g, "_");
}

export function isAssetPath(value) {
  return typeof value === "string" && ASSET_EXTENSIONS.test(value) && !/^https?:/i.test(value) && !/[<>*{}]/.test(value) && value.length < 400;
}

export function mediaKind(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if ([".mp4", ".mov"].includes(extension)) return "video";
  if ([".pdf"].includes(extension)) return "document";
  return "image";
}

let trackedCache;
export function trackedFiles(root) {
  if (trackedCache?.root === root) return trackedCache.set;
  const set = new Set();
  try {
    const result = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (result.status === 0) for (const item of result.stdout.split("\0")) if (item) set.add(item);
  } catch { /* not a git checkout: nothing is tracked */ }
  trackedCache = { root, set };
  return set;
}

function walkRegistry(value, context, emit) {
  if (Array.isArray(value)) {
    for (const item of value) walkRegistry(item, context, emit);
    return;
  }
  if (value && typeof value === "object") {
    const isProduct = typeof value.sku === "string" || (context.key === "products" && typeof value.name === "string")
      || (["assetFamilies", "devices", "templates"].includes(context.key) && (value.id || value.name));
    const next = isProduct
      ? { ...context, product: value.sku || value.id || value.name, productName: value.name || value.sku || value.id, aliases: [...(value.aliases || []), ...(value.aka || [])].map(String) }
      : context;
    if (typeof value.path === "string" && isAssetPath(value.path)) {
      // Explicit fields win over the inherited context: a ref declared `role: "canonical"` inside a
      // `references` array must not be downgraded to the key's default role.
      emit({ ...next, path: value.path, role: value.role || next.role, note: value.note || value.why || value.instructions || next.note, mirror: value.mirror });
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("$")) continue;
      const negative = next.negative || NEGATIVE_SECTIONS.test(key);
      const role = ROLE_BY_KEY[key] || (negative ? "banned" : next.role);
      walkRegistry(child, { ...next, key, section: next.section || key, role, negative }, emit);
    }
    return;
  }
  if (isAssetPath(value)) emit({ ...context, path: value, role: context.role || "asset" });
}

function registryItems(root, brandNode, registryNode, emitInto) {
  const file = path.resolve(root, registryNode.path || registryNode.source);
  if (!fs.existsSync(file)) return;
  const registry = readJson(file);
  const origin = path.relative(root, file);
  walkRegistry(registry, { key: "", section: "", role: undefined, negative: false }, (item) => emitInto({ ...item, origin }));
  const skuIndex = registry.skuRegistry?.index;
  if (skuIndex && fs.existsSync(path.resolve(root, skuIndex))) {
    try {
      const index = readJson(path.resolve(root, skuIndex));
      for (const sku of index.skus || []) {
        const name = [sku.compound, sku.dose].filter(Boolean).join(" ");
        if (sku.transparent) emitInto({ path: sku.transparent, role: "canonical", product: sku.sku, productName: name, section: "skuRegistry", note: `${sku.categoryName || sku.category || ""} · accent ${sku.accentHex || ""}`.trim(), origin: skuIndex, meta: { category: sku.category, accentHex: sku.accentHex, cake: sku.cake } });
        if (sku.white) emitInto({ path: sku.white, role: "canonical-white", product: sku.sku, productName: name, section: "skuRegistry", origin: skuIndex, meta: { category: sku.category, accentHex: sku.accentHex } });
      }
    } catch (error) {
      console.error(`[assets] could not read SKU index ${skuIndex}: ${error.message}`);
    }
  }
}

function learningItems(root, brandNode, emitInto) {
  const file = path.join(root, LEARNINGS_DIR, `${brandSlug(brandNode)}.json`);
  if (!fs.existsSync(file)) return;
  const store = readJson(file);
  for (const exemplar of store.exemplars || []) {
    const primary = exemplar.tracked || exemplar.output?.path;
    if (!primary) continue;
    emitInto({ path: primary, role: "approved-output", product: exemplar.product || undefined, section: "learnings", note: exemplar.reason || exemplar.notes, origin: path.relative(root, file), meta: { exemplar: exemplar.id, category: exemplar.category, provider: exemplar.provider, model: exemplar.model, tags: exemplar.tags, original: exemplar.output?.path } });
  }
}

function mirrorItems(root, brandNode, emitInto) {
  const folder = path.join(root, "Brand Context", "assets", brandFolder(brandNode));
  if (!fs.existsSync(folder)) return;
  const stack = [folder];
  while (stack.length) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (isAssetPath(entry.name)) {
        const relative = path.relative(root, full);
        emitInto({ path: relative, role: /approved/.test(relative) ? "approved-output" : /logo/i.test(entry.name) ? "logo" : "brand-asset", section: "Brand Context/assets", origin: "Brand Context/assets" });
      }
    }
  }
}

/** Build the catalog for one brand or all brands. Items are deduplicated per (brand, path); roles merge. */
export function buildAssetCatalog(root, graph, { brand = undefined } = {}) {
  const tracked = trackedFiles(root);
  const brands = brand ? [resolveBrand(graph, brand)].filter(Boolean) : graph.nodes.filter((node) => node.type === "brand");
  if (brand && !brands.length) return { items: [], brands: [] };
  const items = new Map();
  for (const brandNode of brands) {
    const emitInto = (raw) => {
      const relative = raw.path.replace(/^\.\//, "");
      const key = `${brandNode.id}::${relative.toLowerCase()}`;
      const absolute = path.resolve(root, relative);
      const existing = items.get(key);
      if (existing) {
        if (raw.role && !existing.roles.includes(raw.role)) existing.roles.push(raw.role);
        if (raw.product && !existing.product) { existing.product = raw.product; existing.productName = raw.productName; existing.aliases = raw.aliases || []; }
        if (raw.note && !existing.note) existing.note = raw.note;
        if (raw.negative) existing.banned = true;
        if (raw.meta) existing.meta = { ...(existing.meta || {}), ...raw.meta };
        return;
      }
      items.set(key, {
        brand: brandNode.id,
        brandName: brandNode.name,
        path: relative,
        absolutePath: absolute,
        basename: path.basename(relative),
        kind: mediaKind(relative),
        roles: [raw.role || "asset"],
        product: raw.product || null,
        productName: raw.productName || null,
        aliases: raw.aliases || [],
        section: raw.section || null,
        note: raw.note || null,
        banned: Boolean(raw.negative || raw.role === "banned"),
        origin: raw.origin,
        exists: fs.existsSync(absolute),
        tracked: tracked.has(relative) || tracked.has(raw.mirror || ""),
        mirror: raw.mirror || null,
        meta: raw.meta || null,
      });
    };
    for (const registry of relatedNodes(graph, brandNode.id, "has-products")) registryItems(root, brandNode, registry, emitInto);
    for (const registry of relatedNodes(graph, brandNode.id, "has-memes")) registryItems(root, brandNode, registry, emitInto);
    learningItems(root, brandNode, emitInto);
    mirrorItems(root, brandNode, emitInto);
  }
  const list = [...items.values()].sort((a, b) => a.brand.localeCompare(b.brand) || (a.product || "").localeCompare(b.product || "") || a.path.localeCompare(b.path));
  return { items: list, brands: brands.map((node) => ({ id: node.id, name: node.name, folder: brandFolder(node) })) };
}

export function assetDimensions(absolutePath) {
  try {
    if (mediaKind(absolutePath) !== "image") return null;
    const info = inspectImageBuffer(fs.readFileSync(absolutePath));
    return info ? { width: info.width, height: info.height, alpha: Boolean(info.alphaChannel) } : null;
  } catch {
    return null;
  }
}

export function searchAssets(catalog, { brand = undefined, product = undefined, role = undefined, query = undefined, existingOnly = false, includeBanned = false, limit = 40, withDimensions = false } = {}) {
  const terms = tokenize(query || "");
  const productNeedle = product ? String(product).toLowerCase() : undefined;
  const roleNeedle = role ? String(role).toLowerCase() : undefined;
  const scored = [];
  for (const item of catalog.items) {
    if (brand && item.brand !== brand) continue;
    if (existingOnly && !item.exists) continue;
    if (item.banned && !includeBanned) continue;
    if (roleNeedle && !item.roles.some((value) => value.toLowerCase() === roleNeedle || value.toLowerCase().startsWith(roleNeedle))) continue;
    const productHaystack = `${item.product || ""} ${item.productName || ""} ${(item.aliases || []).join(" ")}`.toLowerCase();
    if (productNeedle && !productHaystack.includes(productNeedle)) continue;
    let score = 0;
    if (terms.length) {
      const haystack = tokenize(`${item.path} ${item.basename} ${item.roles.join(" ")} ${item.product || ""} ${item.productName || ""} ${item.note || ""} ${item.section || ""} ${JSON.stringify(item.meta || {})}`);
      const set = new Set(haystack);
      for (const term of terms) if (set.has(term)) score += 1; else if (haystack.some((token) => token.startsWith(term))) score += 0.5;
      if (!score) continue;
    }
    if (item.roles.includes("canonical")) score += 0.3;
    if (item.tracked) score += 0.1;
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.path.localeCompare(b.item.path));
  return scored.slice(0, limit).map(({ item, score }) => ({ ...item, score: Math.round(score * 100) / 100, ...(withDimensions && item.exists ? { dimensions: assetDimensions(item.absolutePath) } : {}) }));
}

/** Products a brand knows, with reference counts — the "what can I ask for" list. */
export function listProducts(catalog, brandId) {
  const products = new Map();
  for (const item of catalog.items) {
    if (brandId && item.brand !== brandId) continue;
    if (!item.product) continue;
    const key = `${item.brand}::${item.product}`;
    const entry = products.get(key) || { brand: item.brand, product: item.product, name: item.productName || item.product, aliases: new Set(), references: 0, canonical: 0, onDisk: 0, roles: new Set() };
    for (const alias of item.aliases || []) entry.aliases.add(alias);
    entry.references += 1;
    if (item.roles.includes("canonical")) entry.canonical += 1;
    if (item.exists) entry.onDisk += 1;
    for (const role of item.roles) entry.roles.add(role);
    products.set(key, entry);
  }
  return [...products.values()].map((entry) => ({ ...entry, aliases: [...entry.aliases], roles: [...entry.roles].sort() })).sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
}
