// Per-brand configuration of the product-catalog pipeline (engine/skus/*, engine/dam/product-*.mjs).
//
// Everything that used to be hard-coded to Muha lives here, one entry per brand: which Dropbox sources hold the
// render library, which part of a source counts as the render tree (scope), the SKU book and catalog file
// names, folders that are not products, whether the Muha disposable device-generation dating applies, and —
// for brands with no SKU book — how render folders map to the products in knowledge/products/<brand>.json.
//
// Data only (no imports from coverage.mjs) so coverage, catalog, folder-map and the DAM can all read it.
// Adding a brand = adding an entry here; Muha's entry reproduces the previous behaviour exactly.

/** Muha: "Renders/<Category>/<Market>/<Line>/…" under "/2025 Full Ops/MUHA MEDS" (source dropbox:muha:2025). */
const MUHA = {
  key: "muha",
  brandId: "brand.muha",
  name: "Muha Meds",
  registry: "muha-meds",                    // knowledge/skus/muha-meds.json — the SKU book
  products: "muha-meds",                    // knowledge/products/muha-meds.json
  sources: ["dropbox:muha:2025"],
  renderRoots: ["/2025 Full Ops/MUHA MEDS/Renders"],
  // Library scope: Muha product renders are only what lives under the brand's top-level Renders/ folder.
  scope: (asset) => String(asset.path || "").startsWith("Renders/"),
  scopeLabel: "Renders/ only",
  // Device generations of the Muha disposables (Nov 2024 = Gen 2, June 2025 = Gen 3), coverage.mjs.
  deviceGenerations: true,
  // Line-specific folders (Moods, Mavricks, MM x Cookies, Madness, Magnetic, Dual) only serve their line.
  lineFolders: true,
  notProduct: /^Renders\/(Website Images|Motion|Apparel|Labubu|Ape|HOTKNIFES|Giveaway Tickets|Muha_Vaults|Catalyst|Ai Resources|Multi Product Group Shots|Master Case Group Shots|TEMP|CA catalog resized)(\/|$)/i,
  previous: null,
  reviewed: true,                            // catalog.muha.json was reviewed folder by folder (328/328)
};

/** Dialed Moods: SKU book (knowledge/skus/dialed-moods.json); renders in two trees. */
const DIALED_MOODS = {
  key: "dialed-moods",
  brandId: "brand.dialed-moods",
  name: "Dialed Moods",
  registry: "dialed-moods",
  products: "dialed-moods",
  // "/2025 Full Ops/DIALED MOODS/Renders/DialedMoods/…" (2025 library) and the 2026-10 source of truth
  // "/CM Headquarters/DIALED MOODS: Master/Product Renders/DM <Product>/…".
  sources: ["dropbox:dialed-moods:2025", "dropbox:dialed-moods:master"],
  renderRoots: ["/2025 Full Ops/DIALED MOODS/Renders", "/CM Headquarters/DIALED MOODS: Master/Product Renders"],
  scope: (asset) => /^(Renders\/(DialedMoods|Assets for Amazon)\/|Product Renders\/)/.test(String(asset.path || "")),
  scopeLabel: "Renders/DialedMoods, Renders/Assets for Amazon, Product Renders (CM Headquarters master)",
  deviceGenerations: false,
  lineFolders: false,
  // Motion stills, the HQ environment renders and the website collage are not product renders (render-map review notes).
  notProduct: /^Renders\/DialedMoods\/(Motion|HQ|DialedCollage|Website Image - DIALED|Gym)(\/|$)|^Renders\/(Apparel|ArtTest)(\/|$)/i,
  previous: /(^|\/)(older versions?[^/]*|old|_old|archive)(\/|$)/i,
  reviewed: false,
};

/**
 * Dialed Health: no SKU book. Renders are filed by container ("/2025 Full Ops/DIALED HEALTH/Renders/<Container>"):
 * the three containers of knowledge/products/dialed-health.json plus the blood-test kit. A NuLumin folder inside
 * "Syringe Bottle" belongs to NuLumin (config.mjs BRAND_PATH_RULES) and never reaches this catalog.
 */
const DIALED_HEALTH = {
  key: "dialed-health",
  brandId: "brand.dialed-health",
  name: "Dialed Health",
  registry: null,
  products: "dialed-health",
  sources: ["dropbox:dialed-health:2025", "dropbox:dialed-health:master", "dropbox:final-2026:dialed-health"],
  renderRoots: ["/2025 Full Ops/DIALED HEALTH/Renders", "/CM Headquarters/DIALED HEALTH: Master/Visual Assets/09_Packaging"],
  scope: (asset) => /^(Renders\/|Visual Assets\/09_Packaging\/|Blood Kits\/)/.test(String(asset.path || "")),
  scopeLabel: "Renders/, Visual Assets/09_Packaging (master), Blood Kits (2026 final content)",
  deviceGenerations: false,
  lineFolders: false,
  notProduct: /^Renders\/Motion(\/|$)/i,
  previous: /(^|\/)(old|_old|old versions?|archive)(\/|$)/i,
  // Folder → product, from the folder names in the Dropbox (verified 2026-10-27) and the product aliases.
  folderProducts: [
    { match: /(^|\/)(syringe bottle|vial bottle case|vials?)(\/|$)/i, product: "DH-vial", line: "Containers" },
    { match: /(^|\/)(pills|pill bottles?|capsules?)(\/|$)/i, product: "DH-capsule", line: "Containers" },
    { match: /(^|\/)oral drops?(\/|$)/i, product: "DH-oral-drop", line: "Containers" },
    { match: /(^|\/)(blood[_ ]test[_ ]kit|blood kits?)(\/|$)/i, product: { id: "DH-blood-test-kit", name: "Blood test kit", source: "knowledge/products/dialed-health.json bloodTestKit" }, line: "Kits" },
  ],
  reviewed: false,
};

/**
 * Dialed Labs: no SKU book. Renders are filed by category and product, the model number in the folder name:
 * "/2025 Full Ops/DIALED LABS/Renders/Saunas/Barrel Sauna (BS-1815)/…". Products from
 * knowledge/products/dialed-labs.json (14-SKU catalog). "00 Old Dialed Labs Renders" are previous designs.
 */
const DIALED_LABS = {
  key: "dialed-labs",
  brandId: "brand.dialed-labs",
  name: "Dialed Labs",
  registry: null,
  products: "dialed-labs",
  sources: ["dropbox:dialed-labs:2025"],
  renderRoots: ["/2025 Full Ops/DIALED LABS/Renders"],
  scope: (asset) => String(asset.path || "").startsWith("Renders/"),
  scopeLabel: "Renders/ only",
  deviceGenerations: false,
  lineFolders: false,
  notProduct: /^Renders\/(UFC Brand Deck)(\/|$)/i,
  previous: /(^|\/)(00 old dialed labs renders|old|old \(\d+\)|old ?versions?|oldversion( \(\d+\))?)(\/|$)/i,
  folderProducts: [
    { match: /barrel sauna/i, product: "DL-barrel-sauna" },
    { match: /king sauna/i, product: "DL-king-sauna" },
    { match: /queen sauna/i, product: "DL-queen-sauna" },
    { match: /(^|\/)pro sauna(\/|$)/i, product: "DL-pro-sauna" },
    { match: /ir smart pod|smart pod/i, product: "DL-smart-pod" },
    { match: /pro pod \(ct-19\)|(^|\/)pro pod(\/|$)/i, product: "DL-pro-pod" },
    { match: /(^|\/)pod \(top-07\)(\/|$)/i, product: "DL-pod" },
    { match: /air plunge/i, product: "DL-air-plunge" },
    { match: /two person oxygen chamber/i, product: "DL-hb-two-person" },
  ],
  reviewed: false,
};

export const BRAND_CATALOGS = { muha: MUHA, "dialed-moods": DIALED_MOODS, "dialed-health": DIALED_HEALTH, "dialed-labs": DIALED_LABS };

/** Config by key ("muha"), brand id ("brand.dialed-moods") or registry name ("muha-meds"). Null when unknown. */
export function brandCatalogConfig(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  const key = raw.replace(/^brand\./, "");
  if (BRAND_CATALOGS[key]) return BRAND_CATALOGS[key];
  return Object.values(BRAND_CATALOGS).find((config) => config.registry === key || config.products === key || config.brandId === raw) || null;
}

/** The catalog key of a brand id: "brand.dialed-moods" → "dialed-moods", "brand.muha" → "muha". */
export function catalogKeyOf(brand) { return brandCatalogConfig(brand)?.key || (brand ? String(brand).replace(/^brand\./, "") : null); }

export const registryFileOf = (key) => brandCatalogConfig(key)?.registry ?? key;
