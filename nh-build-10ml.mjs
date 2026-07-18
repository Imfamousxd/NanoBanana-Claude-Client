#!/usr/bin/env node
// Build a Noble Harbor "10 ml" VOLUME batch.
// This is NOT a new dose. It reuses the existing approved 5ml clear vial image as the
// sole reference and changes ONLY the printed volume text from "5 ml" -> "10 ml".
// Same vial, same cap, same dose placeholder, same layout — single text change.
//
// Usage:
//   node nh-build-10ml.mjs                      # all products in nh-peptides.txt
//   node nh-build-10ml.mjs "BPC-157"            # one product (canary)
//   node nh-build-10ml.mjs "BPC-157" "KPV" ...  # specific products
// Optional last arg "--out file.json" to set the output filename.
//
// Each job: 4:5 / 4K, refImages = [ <product>_5ml_<color>.jpg ], _meta for renaming.

import fs from "fs";

const ROOT = "Noble Harbor Wholesale";
const colors = ["navy", "black", "white", "red", "green", "babyblue", "yellow", "pink", "purple"];

// ---- args ----
let argv = process.argv.slice(2);
let outFile = null;
const outIdx = argv.indexOf("--out");
if (outIdx !== -1) { outFile = argv[outIdx + 1]; argv.splice(outIdx, 2); }

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stemOf = (name) => name.replace(/\s+/g, "_"); // matches existing filename convention

// Product list: argv names, else everything in nh-peptides.txt
let products;
if (argv.length) {
  products = argv;
} else {
  products = fs.readFileSync("nh-peptides.txt", "utf8")
    .split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
}

function srcRef(product, color) {
  const stem = stemOf(product);
  for (const ext of ["jpg", "png"]) {
    const p = `${ROOT}/${product}/${stem}_5ml_${color}.${ext}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const jobs = [];
const missing = [];
for (const product of products) {
  for (const color of colors) {
    const ref = srcRef(product, color);
    if (!ref) { missing.push(`${product} / ${color}`); continue; }
    const tag = `nh-${slug(product)}-10ml-${color}`;
    const prompt = `${tag}: This is an exact-reproduction edit task. The single REFERENCE IMAGE is an approved pharmaceutical vial product photo. Reproduce the VIAL exactly, but make TWO corrections: (1) the volume text, and (2) the background must be cleaned to flawless pure white. Details below.\n\nKEEP IDENTICAL (do not re-interpret, do not redesign): the exact same camera framing, zoom, crop and vial scale — the vial must occupy the exact same position and size within the frame as the reference, do NOT zoom in or out; the exact same clear-glass vial shape and proportions; the exact same cap (same color, same shape, same angle); the exact same opaque matte-white wrap-around label at the same width and position; the exact same product name, the same 'xx mg' dose placeholder, the same two compliance lines, the same 'LOT: NH-1024' line; the same typography (typeface, weights, sizes, letter spacing, centering) for ALL text; the same bottom accent bar (same color, same edge-to-edge width); the same lighting on the vial, the same reflection and soft contact shadow directly beneath the vial.\n\nBACKGROUND — CRITICAL: the reference's background may contain faint grey smudges, blotches, dust, cloudiness or uneven texture. Do NOT copy these. Render the ENTIRE background as flawless, perfectly uniform, pure white #FFFFFF — seamless studio sweep, completely clean, no smudges, no grey patches, no dust, no marks, no gradient, no stray shadows — EXCEPT the soft contact shadow/reflection directly beneath the vial, which stays. The background must be cleaner than the reference.\n\nVOLUME TEXT: on the dose-and-volume line, change the volume from '5 ml' to '10 ml', so the line reads 'xx mg · 10 ml'. Keep that line in the exact same position, font, weight, size, charcoal-grey color, centering and middle-dot '·' separator as the reference — only the number changes from 5 to 10. The vial itself does NOT get bigger; only the printed text changes.\n\nDo not add, move, restyle or re-render any other text or element. Render all text crisp and sharp. No extra text, no misspellings. Vertical 4:5 portrait, premium clinical product photography.`;
    jobs.push({
      prompt,
      aspectRatio: "4:5",
      imageSize: "4K",
      refImages: [ref],
      _meta: { peptide: product, size: "10ml", color, tag },
    });
  }
}

if (!outFile) {
  outFile = argv.length === 1 ? `nh-10ml-${slug(products[0])}.json` : "nh-10ml-all.json";
}
fs.writeFileSync(outFile, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs across ${products.length} product(s) → ${outFile}`);
if (missing.length) {
  console.log(`\nWARNING: ${missing.length} missing 5ml source ref(s) — skipped:`);
  for (const m of missing) console.log(`  - ${m}`);
}
