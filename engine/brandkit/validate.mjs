import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core/files.mjs";
import { loadGraph, resolveBrand } from "../knowledge/graph.mjs";
import { dataEntries, listPacks, packDirectory } from "./kit.mjs";

// Structural validation for a brand pack. This is the contract CONTRIBUTING.md describes, expressed
// as code so nobody has to remember it: `brandkit validate` tells a contributor exactly what is
// wrong and how to fix it, before a broken pack reaches a render or a client.

const KNOWN_PLACEHOLDERS = new Set(["name", "dose", "rules", "cap", "cake", "compound", "style", "ratio"]);
const ALLOWED_EXTENSIONS = new Set([".json", ".md"]);

function collect() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    error: (code, message, fix) => errors.push({ code, message, fix }),
    warn: (code, message, fix) => warnings.push({ code, message, fix }),
  };
}

function readOptional(directory, file, issues) {
  const filePath = path.join(directory, file);
  if (!fs.existsSync(filePath)) return null;
  try {
    return readJson(filePath);
  } catch (error) {
    issues.error("PACK_FILE_INVALID", `${file} is not valid JSON: ${error.message}`, "Fix the JSON syntax; a trailing comma is the usual cause.");
    return null;
  }
}

/** A declared asset must be inside the repository and actually present, or a render dies mid-batch. */
function checkAsset(root, label, relativePath, issues) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    issues.error("ASSET_OUTSIDE_REPO", `${label} points outside the repository: ${relativePath}`,
      "Brand assets must be committed under `Brand Context/assets/<Brand>/`. Absolute paths and `../` break for everyone else.");
    return;
  }
  if (!fs.existsSync(resolved)) {
    issues.error("ASSET_MISSING", `${label} is declared but not on disk: ${relativePath}`,
      "Commit the file, or remove the declaration until you have it.");
  }
}

function checkGraphRegistration(root, packId, design, issues) {
  let graph;
  try {
    graph = loadGraph(root);
  } catch (error) {
    issues.error("GRAPH_INVALID", `knowledge/graph.json could not be loaded: ${error.message}`);
    return;
  }

  const brand = resolveBrand(graph, design.brand || packId);
  if (!brand) {
    issues.error("BRAND_NOT_REGISTERED", `No brand node for "${design.brand || packId}" in knowledge/graph.json.`,
      "Add a `brand` node with an id of `brand.<pack-id>`, or run `brandkit new <pack-id>` which registers it for you.");
  } else if (brand.id.replace(/^brand\./, "") !== packId) {
    issues.warn("BRAND_ID_MISMATCH", `Pack directory "${packId}" does not match brand node "${brand.id}".`,
      "Name the directory after the brand node so `brandkit <brand>` resolves without an alias.");
  }

  if (!graph.nodes.some((node) => node.type === "brand-pack" && node.directory === `knowledge/brands/${packId}`)) {
    issues.warn("PACK_NOT_REGISTERED", `No brand-pack node points at knowledge/brands/${packId}.`,
      "Register one so `knowledge query` and other agents can discover what the pack provides.");
  }

  const registered = new Set(graph.sources.map((source) => source.path).filter(Boolean));
  for (const file of fs.readdirSync(packDirectory(root, packId))) {
    if (!file.endsWith(".md")) continue;
    if (!registered.has(`knowledge/brands/${packId}/${file}`)) {
      issues.warn("DOC_NOT_INDEXED", `${file} is not registered as a source in knowledge/graph.json.`,
        "Add it to `sources` or retrieval will never surface it, which defeats the point of writing it.");
    }
  }
}

function checkCatalog(root, catalog, issues) {
  if (!catalog) return;
  const compounds = dataEntries(catalog.compounds);
  if (!compounds.length) {
    issues.warn("CATALOG_EMPTY", "catalog.json declares no products yet.", "Add at least one before generating.");
  }
  for (const [key, compound] of compounds) {
    if (!compound.category || !catalog.categories?.[compound.category]) {
      issues.error("UNKNOWN_CATEGORY", `Product "${key}" uses category "${compound.category}" which is not in categories.`);
    }
    if (compound.cap && !catalog.capColors?.[compound.cap]) {
      issues.error("UNKNOWN_CAP_COLOR", `Product "${key}" uses cap "${compound.cap}" which is not in capColors.`);
    }
    if (compound.cake && !catalog.cakeColors?.[compound.cake]) {
      issues.error("UNKNOWN_CAKE_COLOR", `Product "${key}" uses cake "${compound.cake}" which is not in cakeColors.`);
    }
    if (compound.vial) checkAsset(root, `catalog.compounds.${key}.vial`, compound.vial, issues);
    else issues.warn("NO_PRODUCT_CANON", `Product "${key}" has no reference asset.`,
      "Text-only prompting is not a fidelity strategy. Add a cutout before generating this product.");
  }
  for (const [key, group] of dataEntries(catalog.panels)) {
    for (const member of group.members || []) {
      if (!catalog.compounds?.[member]) issues.error("UNKNOWN_PANEL_MEMBER", `Group "${key}" references unknown product "${member}".`);
    }
  }
}

function checkClaimRecord(root, brandNodeId, pointKey, claimId, issues) {
  const filePath = path.join(root, "knowledge", "claims", `${claimId}.json`);
  if (!fs.existsSync(filePath)) {
    issues.error("CLAIM_RECORD_MISSING", `Selling point "${pointKey}" names claim record ${claimId}, which does not exist.`,
      `Create knowledge/claims/${claimId}.json against schemas/claim-record.schema.json.`);
    return;
  }
  let record;
  try {
    record = readJson(filePath);
  } catch (error) {
    issues.error("CLAIM_RECORD_INVALID", `${claimId}.json is not valid JSON: ${error.message}`);
    return;
  }
  if (record.id !== claimId) issues.error("CLAIM_ID_MISMATCH", `${claimId}.json declares id "${record.id}".`);
  if (brandNodeId && record.brand !== brandNodeId) {
    issues.error("CLAIM_BRAND_MISMATCH", `${claimId}.json belongs to "${record.brand}", not "${brandNodeId}".`);
  }
  if (!record.source?.url || !record.source?.support) {
    issues.error("CLAIM_UNSOURCED", `${claimId}.json has no usable source.`,
      "Every claim needs a durable citation and the smallest supporting excerpt.");
  }
  // The one that actually matters: an approved claim with no accountable human is not approved.
  if (record.status === "approved" && (!record.owner || record.owner === "unassigned")) {
    issues.error("CLAIM_APPROVED_WITHOUT_OWNER", `${claimId}.json is approved but has no owner.`,
      "Set `owner` to the person accountable for the substantiation, or set status back to draft.");
  }
  if (record.status === "approved" && record.reviewAfter && Date.parse(record.reviewAfter) < Date.now()) {
    issues.warn("CLAIM_EXPIRED", `${claimId}.json passed its review date ${record.reviewAfter}.`, "Re-verify the source and refresh the dates.");
  }
}

function checkSellingPoints(root, points, brandNodeId, issues) {
  if (!points) return;
  const entries = dataEntries(points.points);
  if (!entries.length) issues.warn("POINTS_EMPTY", "selling-points.json declares no points yet.");

  for (const [key, point] of entries) {
    for (const field of ["label", "loud", "spec"]) {
      if (!point[field]) issues.error("POINT_INCOMPLETE", `Selling point "${key}" is missing its "${field}" form.`,
        "Each format renders a different form; a missing one renders blank.");
    }
    if (point.spec && (!Array.isArray(point.spec) || point.spec.length !== 2)) {
      issues.error("POINT_SPEC_SHAPE", `Selling point "${key}" spec must be a two-line pair.`,
        "Pre-break the line yourself; left to wrap, one column runs long and the spec row looks broken.");
    }
    if (!point.claim) {
      issues.error("POINT_UNSOURCED", `Selling point "${key}" names no claim record.`,
        "Every factual point must be traceable. Add `claim` and create the record.");
    } else {
      checkClaimRecord(root, brandNodeId, key, point.claim, issues);
    }
  }

  const known = new Set(entries.map(([key]) => key));
  for (const [key, hook] of dataEntries(points.hooks)) {
    if (!Array.isArray(hook.lines) || hook.lines.length !== 2) {
      issues.error("HOOK_SHAPE", `Hook "${key}" needs exactly two clauses (roman, then italic).`);
    }
    for (const pointKey of hook.points || []) {
      if (!known.has(pointKey)) issues.error("HOOK_UNKNOWN_POINT", `Hook "${key}" references unknown point "${pointKey}".`);
    }
    if (hook.offer && !known.has(hook.offer)) issues.error("HOOK_UNKNOWN_OFFER", `Hook "${key}" references unknown offer "${hook.offer}".`);
  }
  for (const [key, variant] of dataEntries(points.variants)) {
    if (variant.points?.length !== 3) {
      issues.error("VARIANT_SHAPE", `Variant "${key}" must carry exactly three selling points.`,
        "Three is the layout contract for every format. Two looks thin, four overflows.");
    }
    for (const pointKey of variant.points || []) {
      if (!known.has(pointKey)) issues.error("VARIANT_UNKNOWN_POINT", `Variant "${key}" references unknown point "${pointKey}".`);
    }
  }
}

function checkHeroPrompts(heroPrompts, catalog, issues) {
  if (!heroPrompts) return;
  for (const [key, style] of dataEntries(heroPrompts.styles)) {
    if (!style.prompt) issues.error("STYLE_EMPTY", `Hero style "${key}" has no prompt.`);
  }
  if (!dataEntries(heroPrompts.composition).length) {
    issues.warn("NO_COMPOSITION", "hero-prompts.json has no composition blocks.",
      "Without one the model chooses its own framing and leaves no room for copy.");
  }
  for (const [key, block] of dataEntries(heroPrompts.blocks)) {
    for (const match of String(block).matchAll(/\{([a-zA-Z]+)\}/g)) {
      if (!KNOWN_PLACEHOLDERS.has(match[1])) {
        issues.error("UNKNOWN_PLACEHOLDER", `Block "${key}" uses {${match[1]}}, which nothing fills.`,
          `Supported: ${[...KNOWN_PLACEHOLDERS].map((name) => `{${name}}`).join(", ")}.`);
      }
    }
  }
  if (catalog && dataEntries(heroPrompts.styles).length && !heroPrompts.provider?.id) {
    issues.warn("NO_HERO_PROVIDER", "hero-prompts.json declares no provider.", "Name the model these blocks were tuned against.");
  }
}

/** Validate one pack. Errors block use; warnings are things a reviewer should look at. */
export function validatePack(root, packId) {
  const issues = collect();
  const directory = packDirectory(root, packId);

  if (!fs.existsSync(directory)) {
    issues.error("PACK_NOT_FOUND", `knowledge/brands/${packId} does not exist.`, "Run `brandkit new <brand>` to scaffold it.");
    return { pack: packId, ok: false, errors: issues.errors, warnings: issues.warnings };
  }

  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.has(path.extname(file))) {
      issues.warn("UNEXPECTED_PACK_FILE", `${file} is not .json or .md.`,
        "A pack holds knowledge, not assets or code. Assets go under `Brand Context/assets/`, code under `engine/`.");
    }
  }
  if (!files.some((file) => file.endsWith(".md"))) {
    issues.warn("NO_PACK_DOC", "The pack has no markdown document.",
      "Write down the format law and why each rule exists, or the next person undoes it.");
  }

  const design = readOptional(directory, "design-system.json", issues);
  if (!design) {
    issues.error("NO_DESIGN_SYSTEM", "design-system.json is required — it is what makes the pack discoverable.",
      "Run `brandkit new <brand>` to scaffold a valid one.");
    return { pack: packId, ok: false, errors: issues.errors, warnings: issues.warnings };
  }

  for (const key of ["version", "brand", "disclosures", "surfaces", "typography"]) {
    if (design[key] === undefined) issues.error("DESIGN_INCOMPLETE", `design-system.json is missing "${key}".`);
  }
  if (!design.typography?.bundle?.css2) {
    issues.error("NO_FONT_BUNDLE", "typography.bundle.css2 is required.",
      "Point it at a Google Fonts css2 URL so `brandkit fonts` can bundle the faces offline.");
  }

  for (const [key, value] of dataEntries(design.assets)) {
    if (typeof value !== "string" || !value.includes("/") || value.includes("{")) continue;
    checkAsset(root, `design.assets.${key}`, value, issues);
  }
  if (!dataEntries(design.assets).length) {
    issues.warn("NO_ASSETS", "design-system.json declares no assets.", "At minimum a logo lockup, or every render is text-only.");
  }

  const catalog = readOptional(directory, "catalog.json", issues);
  const points = readOptional(directory, "selling-points.json", issues);
  const heroPrompts = readOptional(directory, "hero-prompts.json", issues);

  checkGraphRegistration(root, packId, design, issues);
  checkCatalog(root, catalog, issues);
  checkSellingPoints(root, points, design.brand, issues);
  checkHeroPrompts(heroPrompts, catalog, issues);

  const todos = [design, catalog, points, heroPrompts]
    .filter(Boolean)
    .reduce((count, value) => count + (JSON.stringify(value).match(/TODO/g) || []).length, 0);
  if (todos) {
    issues.warn("SCAFFOLD_INCOMPLETE", `${todos} TODO marker${todos === 1 ? "" : "s"} still in the pack.`,
      "Fill them in before this pack is used for client work.");
  }

  return { pack: packId, ok: issues.errors.length === 0, errors: issues.errors, warnings: issues.warnings };
}

export function validateAllPacks(root) {
  return listPacks(root).map((packId) => validatePack(root, packId));
}
