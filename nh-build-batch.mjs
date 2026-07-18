#!/usr/bin/env node
// Build a Noble Harbor wholesale batch for a single peptide product.
// New design: 'xx mg' dose placeholder (one image works for every dose), three vial styles
// (3ml clear, 3ml dark amber, 5ml). 27 jobs per peptide (9 cap colors × 3 vial styles).
// Usage: node nh-build-batch.mjs "PRODUCT NAME" [outfile]
//   e.g. node nh-build-batch.mjs "BPC-157" nh-bpc157.json

import fs from "fs";

const productName = process.argv[2];
if (!productName) {
  console.error('Usage: node nh-build-batch.mjs "PRODUCT NAME" [outfile]');
  console.error('  e.g. node nh-build-batch.mjs "BPC-157" nh-bpc157.json');
  process.exit(1);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const outFile = process.argv[3] || `nh-${slug(productName)}.json`;

const colorSpec = JSON.parse(fs.readFileSync("nh-colors.json", "utf8"));
const colors = ["navy", "black", "white", "red", "green", "babyblue", "yellow", "pink", "purple"];
const sizes = ["3ml", "3ml-dark", "5ml"];

const LOT = "NH-1024";

// Volume label rendered on the actual vial label (both 3ml variants say "3 ml")
const sizeLabelMap = { "3ml": "3 ml", "3ml-dark": "3 ml", "5ml": "5 ml" };

// Typography anchors — our 3 approved navy baselines
const baselineMap = {
  "3ml": "Noble Harbor Wholesale/_baselines/baseline_3ml_navy.jpg",
  "3ml-dark": "Noble Harbor Wholesale/_baselines/baseline_3ml-dark_navy.jpg",
  "5ml": "Noble Harbor Wholesale/_baselines/baseline_5ml_navy.jpg",
};

// Cap-color anchors per non-navy color. For 3ml clear and 5ml use the existing
// BPC-157 color masters. For 3ml dark, fall back to the matching 3ml clear color
// master (cap color hue only — the dark baseline drives layout/glass).
function colorAnchor(size, color) {
  if (color === "navy") return null;
  const lookupSize = size === "3ml-dark" ? "3ml" : size;
  const ext = fs.existsSync(`Noble Harbor Wholesale/BPC-157/BPC-157_${lookupSize}_${color}.jpg`) ? "jpg" : "png";
  const p = `Noble Harbor Wholesale/BPC-157/BPC-157_${lookupSize}_${color}.${ext}`;
  return fs.existsSync(p) ? p : null;
}

// Glass-color descriptor injected into the prompt
const glassDesc = {
  "3ml": "clear glass 3ml vial",
  "3ml-dark": "amber-tinted dark-brown glass 3ml vial",
  "5ml": "clear glass 5ml round vial",
};

const jobs = [];
for (const size of sizes) {
  const sizeLabel = sizeLabelMap[size];
  const baseline = baselineMap[size];
  for (const color of colors) {
    const anchor = colorAnchor(size, color);
    const refs = color === "navy" ? [baseline] : (anchor ? [baseline, anchor] : [baseline]);
    const spec = colorSpec[color];
    const productSlug = slug(productName);
    const tag = `nh-${productSlug}-${size}-${color}`;

    const refIntro = color === "navy"
      ? `The reference image is the canonical NAVY ${size.toUpperCase()} BASELINE — reproduce its label layout, typography, vial geometry, lighting, ${glassDesc[size]}, navy cap, edge-to-edge bottom accent bar, and overall composition EXACTLY. Only the product name on the label changes.`
      : `TWO REFERENCE IMAGES are provided. The FIRST reference is the NAVY ${size.toUpperCase()} BASELINE — the canonical TYPOGRAPHY / LAYOUT / VIAL / BAR ANCHOR. Reproduce from it exactly: label layout, vertical text positioning (text block sits LOW on the label with a generous empty white logo zone above), typeface, font weights, letter spacing, edge-to-edge bottom bar, ${glassDesc[size]}, lighting, and shadow. The SECOND reference is the CAP COLOR ANCHOR — match its ${spec.name} cap color and bottom accent bar color exactly. Vial geometry and label layout come from the FIRST reference, NOT the second.`;

    jobs.push({
      prompt: `${tag}: Pharmaceutical vial product photography, vertical 4:5 portrait composition. ${refIntro} Cap color must be EXACTLY hex ${spec.cap}, do not drift lighter or darker, do not shift hue. Vial size: ${glassDesc[size]}.\n\nLABEL WRAP — CRITICAL, NON-NEGOTIABLE: the white label MUST extend horizontally across the FULL visible front face of the cylindrical vial body, from the visible left edge of the cylinder to the visible right edge. The label width must be AT LEAST 90 percent of the visible vial body width. The label looks like a paper strip wrapping the cylinder — NOT a small or medium-width centered rectangle floating on the front. There must be NO substantial naked glass (clear or amber) visible to the LEFT or RIGHT of the label in the same vertical band as the label. Only a small natural curve / perspective falloff at the very edges where the label wraps around to the back of the cylinder is acceptable. Match the wrap proportions of the FIRST reference image exactly.\n\nLABEL VERTICAL LAYOUT — the entire text block sits LOW on the label. The TOP roughly 70 percent of the label is COMPLETELY BLANK pristine white space — no text, no logos, no marks. ALL TEXT lives in the LOWER 30 percent of the label.\n\nLABEL MATERIAL: pristine opaque matte white, completely uniform across its surface — NO translucency, NO see-through to the glass behind it, NO dark patches, NO ghosting, NO discoloration. Only natural soft photographic shadow at the curved edges.\n\nLABEL TEXT TOP TO BOTTOM (all in the lower 30% of the label, all in Helvetica Neue clean sans-serif):\n(1) Product name '${productName}' in bold weight 700 sans-serif in dark charcoal grey, perfectly horizontally centered, natural letter proportions (NOT stretched, NOT condensed).\n(2) Directly below with tight spacing, the dose-and-volume line 'xx mg · ${sizeLabel}' in bold weight 700 sans-serif (same bold weight as product name) at roughly 60 percent of the product-name size, charcoal grey, perfectly centered, single middle-dot separator. The 'xx' must be rendered LITERALLY as two lowercase letter x characters — intentional dose placeholder, NOT a number.\n(3) Below the dose with a small gap, two stacked compliance lines in thin weight 300 sans-serif (NOT bold), all-caps, medium grey, ~22 percent of the product-name size, tight line spacing. Line 1: 'FOR RESEARCH USE ONLY'. Line 2: 'NOT FOR HUMAN CONSUMPTION'. Both centered, equal size and weight.\n(4) Below the second compliance line with a small gap, the lot line 'LOT: ${LOT}' in thin weight 300 sans-serif (NOT bold), same small size, medium grey, single line, perfectly horizontally centered with equal left and right margins.\n\nBAR — at the very bottom edge of the label, the slim solid accent bar at exactly hex ${spec.bar}${color === "white" ? " (medium grey, since the cap is white — the bar must be VISIBLY medium grey, clearly distinct from the white label, NOT pure white)" : ""} must run UNINTERRUPTED EDGE-TO-EDGE across the FULL WIDTH of the label, from the absolute leftmost edge to the absolute rightmost edge — NO gap, NO truncation, NO fade-out, NO white space at either end.\n\nABSOLUTELY NO hairlines, NO horizontal rules anywhere on the label other than the single bottom bar. Do NOT render any font name or styling instruction (e.g. 'HELVETICA', 'BOLD', 'LIGHT', '700', '300') as visible text on the label. Sharp focus, high resolution, premium pharmaceutical product shot, clinical minimalist aesthetic on a clean studio white background.\n\nCRITICAL: render every text string exactly as written — '${productName}', 'xx mg · ${sizeLabel}' (with two lowercase x's, NOT a number), 'FOR RESEARCH USE ONLY', 'NOT FOR HUMAN CONSUMPTION', 'LOT: ${LOT}'. CRITICAL POSITIONING: text block sits low on the label; upper 70% empty white. CRITICAL WRAP: label spans 90%+ of visible vial body width. CRITICAL CAP: hex ${spec.cap} exact.`,
      aspectRatio: "4:5",
      imageSize: "4K",
      refImages: refs,
      _meta: { peptide: productName, size, color, tag },
    });
  }
}

fs.writeFileSync(outFile, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs (9 colors × 3 sizes) → ${outFile}`);
