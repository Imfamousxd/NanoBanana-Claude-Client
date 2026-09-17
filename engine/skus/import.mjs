// `content skus import --brand <id> <csv…>` → knowledge/skus/<brand>.json (the registry the DAM and the
// Dropbox plan correlate renders with). Re-runnable; the file is rewritten from the sheets every time.
import fs from "node:fs";
import path from "node:path";
import { parseSheet, normaliseBlocks } from "./sheets.mjs";

const BRAND_FILES = { muha: "muha-meds", "dialed-moods": "dialed-moods", "dialed-labs": "dialed-labs", "dialed-health": "dialed-health", nulumin: "nulumin" };

export function importSkuSheets(root, { brand, files }) {
  if (!brand || !BRAND_FILES[brand]) throw new Error(`brand must be one of ${Object.keys(BRAND_FILES).join(", ")}`);
  const lines = [];
  for (const file of files) {
    const market = (path.basename(file).match(/\b([A-Z]{2}) THC\b/) || [])[1] || (/hemp/i.test(path.basename(file)) ? "HEMP" : null);
    const upcoming = /upcoming/i.test(path.basename(file));
    const blocks = parseSheet(fs.readFileSync(file, "utf8"));
    lines.push(...normaliseBlocks(blocks, { brand, market, source: path.basename(file) }).map((line) => ({ ...line, name: [line.market, line.line].filter(Boolean).join(" "), upcoming, items: line.items.map((item) => ({ ...item, inDevelopment: item.inDevelopment || upcoming })) })));
  }
  // Dedupe items by sku code across sheets (the Dialed 2026 sheet restates current products with customer-facing line names).
  const bySku = new Map();
  for (const line of lines) for (const item of line.items) if (item.sku) { const seen = bySku.get(item.sku); if (!seen || /2026/.test(line.source)) bySku.set(item.sku, { line: line.line, source: line.source }); }
  const registry = {
    schema: "sku-registry/1", brand, importedAt: new Date().toISOString().slice(0, 10), sources: [...new Set(files.map((file) => path.basename(file)))],
    lines: lines.map((line) => ({ ...line, items: line.items.map((item) => ({ ...item, canonicalLine: item.sku ? bySku.get(item.sku)?.line || line.line : line.line })) })),
    totals: { lines: lines.length, items: lines.reduce((n, line) => n + line.items.length, 0), uniqueSkus: bySku.size, markets: [...new Set(lines.map((line) => line.market).filter(Boolean))] },
  };
  const dir = path.join(root, "knowledge", "skus");
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${BRAND_FILES[brand]}.json`);
  fs.writeFileSync(target, JSON.stringify(registry, null, 1) + "\n");
  return { file: path.relative(root, target), totals: registry.totals };
}
