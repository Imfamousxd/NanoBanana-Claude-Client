#!/usr/bin/env node
// Build a Noble Harbor "10 mg" DOSE batch for products that don't have a 10mg set yet.
// Reuses the approved root placeholder image (dose reads "xx mg") as the sole reference and
// changes ONLY the dose text "xx mg" -> "10 mg". Volume text stays as-is per vial size.
// Includes the locked BACKGROUND-CRITICAL pure-white block (from the 10ml run) so the model
// does NOT carry over / invent grey-black background smudges.
//
// Usage:
//   node nh-build-10mg.mjs "PRODUCT" ["PRODUCT2" ...]   # specific products
// Optional "--out file.json" to set the output filename.
//
// Each job: 4:5 / 4K, refImages = [ <Product>/<stem>_<size>_<color>.jpg ], _meta for renaming.

import fs from "fs";

const ROOT = "Noble Harbor Wholesale";
const colors = ["navy", "black", "white", "red", "green", "babyblue", "yellow", "pink", "purple"];
const sizes = ["3ml", "5ml"];

let argv = process.argv.slice(2);
let outFile = null;
const outIdx = argv.indexOf("--out");
if (outIdx !== -1) { outFile = argv[outIdx + 1]; argv.splice(outIdx, 2); }
if (!argv.length) { console.error("Pass at least one product name."); process.exit(1); }

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stemOf = (name) => name.replace(/\s+/g, "_");

function srcRef(product, size, color) {
  const stem = stemOf(product);
  for (const ext of ["jpg", "png"]) {
    const p = `${ROOT}/${product}/${stem}_${size}_${color}.${ext}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const jobs = [];
const missing = [];
for (const product of argv) {
  for (const size of sizes) {
    for (const color of colors) {
      const ref = srcRef(product, size, color);
      if (!ref) { missing.push(`${product} / ${size} / ${color}`); continue; }
      const vol = size.replace("ml", " ml");
      const tag = `nh-${slug(product)}-10mg-${size}-${color}`;
      const prompt = `${tag}: This is an exact-reproduction edit task. The single REFERENCE IMAGE is an approved pharmaceutical vial product photo. Reproduce the VIAL exactly, but make TWO corrections: (1) the dose text, and (2) the background must be cleaned to flawless pure white. Details below.\n\nKEEP IDENTICAL (do not re-interpret, do not redesign): the exact same camera framing, zoom, crop and vial scale — the vial must occupy the exact same position and size within the frame as the reference, do NOT zoom in or out; the exact same clear-glass vial shape and proportions; the exact same cap (same color, same shape, same angle); the exact same opaque matte-white wrap-around label at the same width and position; the exact same product name '${product}' spelled exactly as in the reference, the same two compliance lines, the same 'LOT: NH-1024' line; the same typography (typeface, weights, sizes, letter spacing, centering) for ALL text; the same bottom accent bar (same color, same edge-to-edge width); the same lighting on the vial, the same reflection and soft contact shadow directly beneath the vial.\n\nBACKGROUND — CRITICAL: the reference's background may contain faint grey smudges, blotches, dust, cloudiness or uneven texture. Do NOT copy these. Render the ENTIRE background as flawless, perfectly uniform, pure white #FFFFFF — seamless studio sweep, completely clean, no smudges, no grey patches, no dark marks, no dust, no gradient, no stray shadows — EXCEPT the soft contact shadow/reflection directly beneath the vial, which stays. The background must be cleaner than the reference.\n\nDOSE TEXT: on the dose-and-volume line, change the dose from 'xx mg' to '10 mg', so the line reads '10 mg · ${vol}'. Keep that line in the exact same position, font, weight, size, charcoal-grey color, centering and middle-dot '·' separator as the reference — only 'xx' changes to '10'. The volume '${vol}' stays exactly the same.\n\nDo not add, move, restyle or re-render any other text or element. Render all text crisp and sharp. No extra text, no misspellings. Vertical 4:5 portrait, premium clinical product photography.`;
      jobs.push({
        prompt,
        aspectRatio: "4:5",
        imageSize: "4K",
        refImages: [ref],
        _meta: { peptide: product, dose: "10mg", size, color, tag },
      });
    }
  }
}

if (!outFile) outFile = argv.length === 1 ? `nh-10mg-${slug(argv[0])}.json` : "nh-10mg-batch.json";
fs.writeFileSync(outFile, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs across ${argv.length} product(s) → ${outFile}`);
if (missing.length) {
  console.log(`\nWARNING: ${missing.length} missing source ref(s) — skipped:`);
  for (const m of missing) console.log(`  - ${m}`);
}
