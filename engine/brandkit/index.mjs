import fs from "node:fs";
import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { writeJsonAtomic } from "../core/files.mjs";
import { bundleFonts, fontCachePath } from "./fonts.mjs";
import { findChrome } from "./chrome.mjs";
import { dataEntries, dataKeys, listPacks, loadBrandKit, resolvePackId } from "./kit.mjs";
import { buildHeroJob } from "./hero-job.mjs";
import { validateAllPacks, validatePack } from "./validate.mjs";
import { createPack } from "./scaffold.mjs";
import { FORMATS, RATIOS, composeAd, renderAds } from "./nulumin-ads.mjs";

export { dataEntries, dataKeys, listPacks, loadBrandKit, resolvePackId, buildHeroJob, composeAd, renderAds, FORMATS, RATIOS, findChrome, validatePack, validateAllPacks, createPack };

const AD_GENERATORS = { nulumin: { formats: FORMATS, render: renderAds } };

/** `brandkit fonts <brand>` — one-time offline bundle of the pack's webfonts. */
export async function commandFonts(root, brand) {
  const id = resolvePackId(root, brand);
  const design = JSON.parse(fs.readFileSync(path.join(root, "knowledge", "brands", id, "design-system.json"), "utf8"));
  const url = design.typography.bundle.css2;
  const result = await bundleFonts(root, id, url);
  return { ok: true, brand: id, sources: result.families, bytes: result.bytes, cache: path.relative(root, result.path) };
}

/** `brandkit kit <brand>` — what the pack knows, without dumping the whole pack. */
export async function commandKit(root, brand) {
  const id = resolvePackId(root, brand);
  const design = JSON.parse(fs.readFileSync(path.join(root, "knowledge", "brands", id, "design-system.json"), "utf8"));
  const kitPath = (file) => path.join(root, "knowledge", "brands", id, file);
  const read = (file) => (fs.existsSync(kitPath(file)) ? JSON.parse(fs.readFileSync(kitPath(file), "utf8")) : null);
  const catalog = read("catalog.json");
  const points = read("selling-points.json");
  const heroPrompts = read("hero-prompts.json");

  // Concrete paths get a present/absent check. Patterns get expanded into what is actually on disk,
  // because "scenePattern: not present" would be a lie: a missing scene is a supported fallback.
  const declared = dataEntries(design.assets).filter(([, value]) => typeof value === "string" && value.includes("/"));
  const assets = declared
    .filter(([, value]) => !value.includes("{"))
    .map(([key, value]) => ({ key, path: value, present: fs.existsSync(path.join(root, value)) }));
  const scenes = declared
    .filter(([, value]) => value.includes("{"))
    .flatMap(([, value]) => {
      const directory = path.join(root, path.dirname(value));
      return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
    });

  return {
    brand: id,
    directory: path.relative(root, path.join(root, "knowledge", "brands", id)),
    fontsBundled: fs.existsSync(fontCachePath(root, id, design.typography.bundle.css2)),
    chrome: findChrome() ? "available" : "not found",
    formats: AD_GENERATORS[id]?.formats || [],
    compounds: catalog ? dataKeys(catalog.compounds) : [],
    panels: catalog ? dataKeys(catalog.panels) : [],
    variants: points ? dataKeys(points.variants) : [],
    hooks: points ? dataKeys(points.hooks) : [],
    heroStyles: heroPrompts ? dataKeys(heroPrompts.styles) : [],
    droppedStyles: heroPrompts ? dataKeys(heroPrompts.dropped) : [],
    assets,
    scenes,
    docs: fs.readdirSync(path.join(root, "knowledge", "brands", id)).filter((file) => file.endsWith(".md")),
  };
}

/** `brandkit new <brand>` — scaffold a valid, empty pack and register it in the graph. */
export function commandNew(root, brand, options) {
  return createPack(root, brand, options);
}

/** `brandkit validate [brand]` — structural check. Errors block use; warnings need a human look. */
export function commandValidate(root, brand) {
  const results = brand ? [validatePack(root, resolvePackId(root, brand))] : validateAllPacks(root);
  return {
    ok: results.every((result) => result.ok),
    packs: results,
    summary: results.map((result) => `${result.pack}: ${result.ok ? "ok" : `${result.errors.length} error(s)`}, ${result.warnings.length} warning(s)`),
  };
}

/** `brandkit ad <brand> <format>` — render the deterministic layout. No provider call. */
export async function commandAd(root, brand, format, options) {
  const id = resolvePackId(root, brand);
  const generator = AD_GENERATORS[id];
  if (!generator) throw new EngineError("NO_AD_GENERATOR", `No ad generator for "${id}". Packs with one: ${Object.keys(AD_GENERATORS).join(", ")}.`);
  const kit = await loadBrandKit(root, id, { offlineFonts: options.offlineFonts });

  const ratios = (options.ratio || "9:16").split(",").map((value) => value.trim()).filter(Boolean);
  const outputDirectory = path.resolve(root, options.out || path.join("generations", `${id}-ads`));
  const results = await generator.render(kit, {
    format,
    compound: options.compound,
    panel: options.panel,
    hook: options.hook,
    variant: options.variant,
    style: options.style,
    ratios,
    outputDirectory,
    basename: options.basename,
  });

  // Every run leaves a record: what was composed, from which points, and which claim records those
  // points depend on. Claim approval is verified at job time, not here — this is the audit trail.
  const manifestPath = path.join(outputDirectory, `_manifest_${format}_${Date.now()}.json`);
  writeJsonAtomic(manifestPath, {
    brand: id,
    generatedAt: new Date().toISOString(),
    outputs: results.map((result) => ({ path: path.relative(root, result.path), bytes: result.bytes, meta: result.meta })),
  });

  return {
    ok: true,
    outputs: results.map((result) => path.relative(root, result.path)),
    manifest: path.relative(root, manifestPath),
    claimsToVerify: [...new Set(results.flatMap((result) => result.meta.points.map((point) => point.claim)))],
    reminder: "Selling points depend on claim records. Confirm each is status=approved before this ships.",
  };
}

/** `brandkit job <brand> hero` — emit a schema-valid content job for the generative half. */
export async function commandJob(root, brand, kind, options) {
  if (kind !== "hero") throw new EngineError("UNKNOWN_JOB_KIND", 'brandkit job supports: hero');
  const kit = await loadBrandKit(root, brand, { offlineFonts: true }).catch(async (error) => {
    // A hero job needs no fonts; do not make font bundling a prerequisite for writing one.
    if (error.code !== "FONT_BUNDLE_MISSING") throw error;
    return loadBrandKitWithoutFonts(root, brand);
  });
  return buildHeroJob(kit, {
    compound: options.compound,
    style: options.style,
    ratio: options.ratio,
    empty: options.empty,
    candidates: options.candidates ? Number(options.candidates) : undefined,
    labelCrop: options.labelCrop,
  });
}

async function loadBrandKitWithoutFonts(root, brand) {
  const id = resolvePackId(root, brand);
  const directory = path.join(root, "knowledge", "brands", id);
  const read = (file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
  return {
    id,
    directory,
    design: read("design-system.json"),
    catalog: read("catalog.json"),
    points: read("selling-points.json"),
    heroPrompts: read("hero-prompts.json"),
  };
}
