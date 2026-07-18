#!/usr/bin/env node
// Build a green-only fix batch for a given product+dose using the dual-ref approach.
// Usage: node nh-green-fix.mjs "PRODUCT NAME" "DOSE" [outfile]

import fs from "fs";

const productName = process.argv[2];
const dose = process.argv[3];
if (!productName || !dose) {
  console.error('Usage: node nh-green-fix.mjs "PRODUCT NAME" "DOSE" [outfile]');
  process.exit(1);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const outFile = process.argv[4] || `nh-${slug(productName)}-${slug(dose)}-greenfix.json`;

const colorSpec = JSON.parse(fs.readFileSync("nh-colors.json", "utf8"));
const spec = colorSpec["green"];
const LOT = "NH-1024";

const jobs = [];
for (const size of ["3ml", "5ml"]) {
  const sizeLabel = size.replace("ml", " ml");
  const colorRef = `Noble Harbor Wholesale/BPC-157/BPC-157_${size}_green.jpg`;
  const navyRef = `Noble Harbor Wholesale/BPC-157/BPC-157_${size}_navy.jpg`;
  jobs.push({
    prompt: `Pharmaceutical vial product photography, vertical 4:5 portrait composition. TWO REFERENCE IMAGES are provided. The FIRST reference (navy variant) is the canonical TYPOGRAPHY ANCHOR — copy from it exactly: the product-name typeface, font weight, letter shapes, letter spacing, and overall label layout. The SECOND reference is the CAP COLOR ANCHOR — match its forest green cap color and bottom accent bar color exactly. Reproduce vial geometry, lighting, and shadow from either reference. Cap color must be EXACTLY hex ${spec.cap}, do not drift. Vial size: ${size}. The label has the following content laid out top to bottom: (1) Upper roughly 60 percent of the label is a blank pristine white logo zone with absolutely no graphics, text, lines, or marks. LOCKED TYPEFACE FOR ALL TEXT: Helvetica Neue. (2) Below the logo zone, the product name '${productName}' rendered in HELVETICA NEUE BOLD (~700 weight) in dark charcoal grey, perfectly horizontally centered on the label, natural letter proportions. (3) Directly below, the dose-and-volume line '${dose} · ${sizeLabel}' rendered in HELVETICA NEUE BOLD at ~60 percent of product-name size, charcoal grey, perfectly centered. (4) Below the dose with a small visual gap, the compliance text rendered as TWO STACKED LINES, each line perfectly horizontally centered on the label, both lines in HELVETICA NEUE LIGHT (~300 weight, NOT bold), all-caps, in medium grey, at roughly 22 percent of the product-name size. Line 1: 'FOR RESEARCH USE ONLY'. Line 2: 'NOT FOR HUMAN CONSUMPTION'. (5) Directly below with a small gap, the lot line 'LOT: ${LOT}' rendered in HELVETICA NEUE LIGHT (NOT bold), perfectly horizontally centered with EQUAL margins on both sides — never left-aligned. (6) At the very bottom edge, the slim solid accent bar at exactly hex ${spec.bar} running edge to edge. NO hairlines anywhere. CRITICAL — typography weight and shape match the navy reference exactly; cap color and bar color match the green reference. Sharp focus, high resolution, premium pharmaceutical product shot.`,
    aspectRatio: "4:5",
    imageSize: "4K",
    refImages: [navyRef, colorRef],
  });
}

fs.writeFileSync(outFile, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs → ${outFile}`);
