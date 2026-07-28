import fs from "node:fs";
import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { dataUriForFile, readJson, resolveInside, sha256Text } from "../core/files.mjs";
import { loadGraph, resolveBrand } from "../knowledge/graph.mjs";
import { loadFontCss, fontStackCss } from "./fonts.mjs";

// A brand pack is knowledge/brands/<id>/: the design tokens, catalog, selling points and prompt
// blocks a generator needs in order to be right on the first attempt rather than the fifth.

const PACK_FILES = {
  design: "design-system.json",
  catalog: "catalog.json",
  points: "selling-points.json",
  heroPrompts: "hero-prompts.json",
};

// Pack files carry `$comment` / `$formats` keys documenting the reasoning next to the data. They are
// prose for whoever opens the file, never entries — always iterate a pack map through these.
export const dataEntries = (value) => Object.entries(value ?? {}).filter(([key]) => !key.startsWith("$"));
export const dataKeys = (value) => dataEntries(value).map(([key]) => key);

export function packDirectory(root, packId) {
  return path.join(root, "knowledge", "brands", packId);
}

export function listPacks(root) {
  const base = path.join(root, "knowledge", "brands");
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(base, entry.name, PACK_FILES.design)))
    .map((entry) => entry.name)
    .sort();
}

/** Accept a brand id, name, or alias and return the pack directory name. */
export function resolvePackId(root, requested) {
  const graph = loadGraph(root);
  const brand = resolveBrand(graph, requested);
  const candidates = [brand?.id?.replace(/^brand\./, ""), String(requested || "").trim().toLowerCase()];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(path.join(packDirectory(root, candidate), PACK_FILES.design))) return candidate;
  }
  throw new EngineError("BRAND_PACK_NOT_FOUND", `No brand pack for "${requested}".`, { available: listPacks(root) });
}

/**
 * Bbox-trim an image and cache the result. The NuLumin logo ships as a 6667x6667 canvas whose
 * wordmark fills ~31% of the height, so a raw CSS height renders it roughly 3x too small.
 */
async function trimmed(root, absolutePath) {
  const cachePath = path.join(root, ".content-engine", "brandkit", `${path.basename(absolutePath, path.extname(absolutePath))}.${sha256Text(absolutePath).slice(0, 8)}.png`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).mtimeMs >= fs.statSync(absolutePath).mtimeMs) return cachePath;
  const { default: sharp } = await import("sharp");
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  await sharp(absolutePath).trim({ threshold: 1 }).png().toFile(cachePath);
  return cachePath;
}

export async function loadBrandKit(root, requested, { offlineFonts = false } = {}) {
  const id = resolvePackId(root, requested);
  const directory = packDirectory(root, id);
  const pack = {};
  for (const [key, file] of Object.entries(PACK_FILES)) {
    const filePath = path.join(directory, file);
    pack[key] = fs.existsSync(filePath) ? readJson(filePath) : null;
  }

  const missing = [];
  const resolveAsset = (relativePath, { required = true } = {}) => {
    const absolute = resolveInside(root, relativePath, "brand asset");
    if (fs.existsSync(absolute)) return absolute;
    if (required) missing.push(relativePath);
    return null;
  };

  const typography = pack.design.typography;
  const fontCss = await loadFontCss(root, id, typography.bundle.css2, { offline: offlineFonts });

  return {
    id,
    directory,
    ...pack,
    missingAssets: missing,
    resolveAsset,
    dataUri: (relativePath, options) => {
      const absolute = resolveAsset(relativePath, options);
      return absolute ? dataUriForFile(absolute) : null;
    },
    /** Data URI of a bbox-trimmed copy — use for logos and any padded artwork. */
    trimmedDataUri: async (relativePath, options) => {
      const absolute = resolveAsset(relativePath, options);
      return absolute ? dataUriForFile(await trimmed(root, absolute)) : null;
    },
    fontCss,
    fontVariables: fontStackCss(typography.families, typography.bundle.fallbacks),
    /** Throw once, listing everything absent, instead of failing one asset at a time. */
    assertAssets: () => {
      if (missing.length) {
        throw new EngineError("BRAND_ASSET_MISSING", `Brand pack "${id}" is missing required assets.`, { missing });
      }
    },
  };
}
