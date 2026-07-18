#!/usr/bin/env node
// Build best-of-N fix chunks for smudged 10mg images.
// Reads nh-10mg-smudged.txt (lines: "<Product>/10mg/<stem>_10mg_<size>_<color>.jpg"),
// emits N identical chunk files (nh-10mg-fixchunk1..N.json), one job per defect each,
// using the root placeholder twin as the sole ref + the locked bg-critical 10mg prompt.
// Usage: node nh-build-10mg-fix.mjs [N=4]

import fs from "fs";

const ROOT = "Noble Harbor Wholesale";
const N = parseInt(process.argv[2] || "4", 10);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const lines = fs.readFileSync("nh-10mg-smudged.txt", "utf8")
  .split("\n").map(l => l.trim()).filter(Boolean);

const jobs = [];
for (const line of lines) {
  const product = line.split("/")[0];
  const stem = product.replace(/\s+/g, "_");
  const m = line.match(/_10mg_(\dml)_([a-z]+)\.jpg$/);
  if (!m) { console.warn(`skip unparseable: ${line}`); continue; }
  const [, size, color] = m;
  const ref = `${ROOT}/${product}/${stem}_${size}_${color}.jpg`;
  if (!fs.existsSync(ref)) { console.warn(`missing ref: ${ref}`); continue; }
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

for (let i = 1; i <= N; i++) {
  fs.writeFileSync(`nh-10mg-fixchunk${i}.json`, JSON.stringify(jobs, null, 2));
}
console.log(`${jobs.length} defects × ${N} candidates → nh-10mg-fixchunk1..${N}.json`);
