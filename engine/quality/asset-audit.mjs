import fs from "node:fs";
import path from "node:path";
import { resolveInside } from "../core/files.mjs";
import { inspectAsset } from "./asset-inspector.mjs";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function walk(directory, files, limit) {
  if (files.length >= limit) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || files.length >= limit) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath, files, limit);
    else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(filePath);
  }
}

export function auditAssetDirectory(root, requestedDirectory, { limit = 1_000 } = {}) {
  const directory = resolveInside(root, requestedDirectory, "asset audit directory");
  const paths = [];
  walk(directory, paths, limit);
  const assets = [];
  const failures = [];
  for (const filePath of paths) {
    const relative = path.relative(root, filePath);
    try {
      assets.push(inspectAsset(root, { path: relative, role: "audit" }));
    } catch (error) {
      failures.push({ path: relative, error: error.message });
    }
  }
  const hashes = new Map();
  for (const asset of assets) {
    const group = hashes.get(asset.sha256) || [];
    group.push(asset.path);
    hashes.set(asset.sha256, group);
  }
  const duplicateGroups = [...hashes.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([sha256, files]) => ({ sha256, files }));
  const dimensions = new Map();
  for (const asset of assets) {
    const key = asset.media.width ? `${asset.media.width}x${asset.media.height}` : "unknown";
    dimensions.set(key, (dimensions.get(key) || 0) + 1);
  }
  return {
    directory: requestedDirectory,
    scanned: assets.length,
    truncated: paths.length >= limit,
    bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    extensionMismatches: assets.filter((asset) => asset.extensionMismatch).map((asset) => ({ path: asset.path, extensionMime: asset.extensionMime, detectedMime: asset.mime })),
    unknownImageHeaders: assets.filter((asset) => !asset.media.width).map((asset) => asset.path),
    dimensions: Object.fromEntries([...dimensions.entries()].sort()),
    duplicateGroups,
    failures,
  };
}

