// Catalog for a brand with NO SKU book (Dialed Health, Dialed Labs, …): built from the render folders and the
// product knowledge in knowledge/products/<brand>.json. Same file shape as the reviewed Muha catalog
// (knowledge/skus/catalog.<brand>.json: lines → items → assets, plus groups) so dam_catalog, catalogLookup and
// resolveProductReferences read it unchanged — but every item is marked `reviewed: false`, `sku` stays null
// (no SKU code is invented), and the model number a Dropbox folder carries ("Barrel Sauna (BS-1815)") is kept
// as `folderCode` with its source. Rebuild: `npm run content -- dam catalog --brand <b> --write`.
import fs from "node:fs";
import path from "node:path";
import { folderPathOf, compositionLabel, norm, useBrand } from "./coverage.mjs";
import { brandCatalogConfig } from "./brand-config.mjs";

const slug = (value) => norm(value).replace(/\s+/g, "-") || "other";

/** Products of a brand from knowledge/products/<brand>.json (plus config-declared extras such as the DH blood-test kit). */
export function brandProducts(root, config) {
  const file = path.join(root, "knowledge", "products", `${config.products}.json`);
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { products: [] };
  const products = (data.products || []).map((product) => ({ id: product.sku || product.id || slug(product.name), name: product.name, aliases: product.aliases || [], category: product.category || product.line || null, source: `knowledge/products/${config.products}.json` }));
  for (const rule of config.folderProducts || []) if (typeof rule.product === "object" && !products.some((product) => product.id === rule.product.id)) products.push({ aliases: [], category: rule.line || null, ...rule.product });
  return products;
}

/** The product a render folder shows: an explicit folderProducts rule first, else the product name/aliases in the folder path. */
export function productForFolder(folder, products, config) {
  for (const rule of config.folderProducts || []) {
    if (!rule.match.test(folder)) continue;
    const id = typeof rule.product === "object" ? rule.product.id : rule.product;
    const product = products.find((candidate) => candidate.id === id);
    if (product) return { product, basis: "folder rule", line: rule.line || null };
  }
  const text = ` ${norm(folder)} `;
  const hits = products.map((product) => ({ product, names: [product.name, ...(product.aliases || [])].map(norm).filter((name) => name.length >= 4) }))
    .map(({ product, names }) => ({ product, best: Math.max(0, ...names.filter((name) => text.includes(` ${name} `)).map((name) => name.length)) }))
    .filter((hit) => hit.best > 0).sort((a, b) => b.best - a.best);
  return hits.length ? { product: hits[0].product, basis: "product name in folder path", line: null } : null;
}

/** Model / size code a folder name carries in parentheses: "Barrel Sauna (BS-1815)" → "BS-1815". */
export function folderCodeOf(folder) {
  for (const segment of String(folder).split("/").reverse()) { const m = segment.match(/\(([A-Z]{1,4}[-_ ]?\d{2,5}[A-Z]?)\)/i); if (m) return m[1].replace(/[_ ]/, "-").toUpperCase(); }
  return null;
}

export function buildFolderCatalog(root, { brand, library, write = true }) {
  const config = brandCatalogConfig(brand);
  if (!config) throw new Error(`no catalog config for ${brand} (engine/skus/brand-config.mjs)`);
  useBrand(config.key);
  const products = brandProducts(root, config);
  const scoped = library.filter((asset) => (!asset.brand || asset.brand === config.brandId) && (!config.scope || config.scope(asset)));
  const folders = new Map();
  for (const asset of scoped) { const folder = folderPathOf(asset); (folders.get(folder) || folders.set(folder, []).get(folder)).push(asset); }
  const entry = (asset, category) => {
    const previous = config.previous && config.previous.test(String(asset.path)) ? `previous design: ${String(asset.path).split("/").slice(-2, -1)[0]}` : null;
    return { id: asset.id, path: asset.path, composition: asset.composition || null, compositionLabel: compositionLabel(asset.composition, category), angle: asset.angle || null, generation: null, designTag: null, folder: folderPathOf(asset), current: !previous, previous, alpha: Boolean(asset.alpha), quality: asset.quality ?? null, verdict: asset.verdict || null, thumb: asset.thumb || null, analysed: Boolean(asset.analysed) };
  };
  const items = new Map(); // product id → { product, line, assets, folders, codes, basis }
  const groups = [];
  for (const [folder, assets] of [...folders.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (config.notProduct && config.notProduct.test(`${folder}/`)) { groups.push({ path: folder, kind: "not-a-product", designTag: null, generation: null, files: assets.length, status: "unreviewed", assets: assets.map((a) => entry(a, "")) }); continue; }
    if (config.previous && config.previous.test(`${folder}/`) && !productForFolder(folder, products, config)) { groups.push({ path: folder, kind: "previous-design", designTag: null, generation: null, files: assets.length, status: "unreviewed", assets: assets.map((a) => entry(a, "")) }); continue; }
    const hit = productForFolder(folder, products, config);
    if (!hit) { groups.push({ path: folder, kind: null, designTag: null, generation: null, files: assets.length, status: "unreviewed", note: "no product in knowledge/products matches this folder", assets: assets.map((a) => entry(a, "")) }); continue; }
    const key = hit.product.id;
    const item = items.get(key) || { product: hit.product, line: hit.line || hit.product.category || "Products", assets: [], folders: new Set(), codes: new Set(), basis: new Set() };
    for (const asset of assets) item.assets.push(entry(asset, item.line));
    item.folders.add(folder);
    const code = folderCodeOf(folder); if (code) item.codes.add(code);
    item.basis.add(hit.basis);
    items.set(key, item);
  }
  const byLine = new Map();
  for (const product of products) {
    const item = items.get(product.id);
    const line = item?.line || product.category || "Products";
    (byLine.get(line) || byLine.set(line, []).get(line)).push({ product, item });
  }
  const lines = [...byLine.entries()].map(([line, members]) => {
    const lineItems = members.map(({ product, item }) => ({
      name: product.name, sku: null, productId: product.id, altSkus: [], discontinued: false, inDevelopment: false, reviewed: false,
      folderCode: item && item.codes.size ? [...item.codes].join(", ") : null, folderCodeSource: item && item.codes.size ? "Dropbox folder name" : null,
      matchBasis: item ? [...item.basis] : [], source: product.source,
      assets: item ? item.assets.sort((x, y) => Number(y.current) - Number(x.current) || (y.quality || 0) - (x.quality || 0)) : [],
    }));
    const folderList = [...new Set(members.flatMap(({ item }) => (item ? [...item.folders] : [])))].map((folder) => ({ path: folder, designTag: null, generation: null, files: folders.get(folder)?.length ?? null, decision: null }));
    return { id: `${config.key}:${slug(line)}`, name: line, title: line, market: null, category: slug(line), format: null, generation: null, variant: null, skuBlock: null, mergedFrom: [], folders: folderList, items: lineItems, covered: lineItems.filter((i) => i.assets.length).length };
  });
  const catalog = {
    brand: config.key, builtAt: new Date().toISOString(), scope: config.scopeLabel, reviewed: false,
    review: { folderMap: false, foldersDecided: 0, folders: folders.size, basis: `render folders + knowledge/products/${config.products}.json (no SKU book; nothing reviewed by a person yet)` },
    lines, groups,
    totals: { lines: lines.length, items: lines.reduce((n, l) => n + l.items.length, 0), itemsWithAssets: lines.reduce((n, l) => n + l.covered, 0), assetsOnLines: [...items.values()].reduce((n, i) => n + i.assets.length, 0), groups: groups.length, unmatchedFolders: groups.filter((g) => !g.kind).length, previousFolders: groups.filter((g) => g.kind === "previous-design").length },
  };
  const file = path.join(root, "knowledge", "skus", `catalog.${config.key}.json`);
  if (write) fs.writeFileSync(file, JSON.stringify(catalog, null, 1) + "\n");
  return { file: path.relative(root, file), written: write, ...catalog.totals, catalog: write ? undefined : catalog };
}
