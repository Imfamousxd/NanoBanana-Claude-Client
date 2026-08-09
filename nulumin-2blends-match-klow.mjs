#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const VIAL_REF = "NuLumin Assets/NuL_CFC_5mg.png";
const STREAK_REF = "_ref_streak_klow.png";

const PRODUCTS = [
  {
    name: "NuL_CJCIpam_5mg_matchklow",
    productName: "CJC-1295 + Ipamorelin Blend",
    dose: "5mg",
    capColor: "the same exact pink as in reference 1 (do NOT alter the cap color — keep it identical to reference 1's pink cap)",
    accentColor: "the same exact pink as the cap in reference 1",
    bgColorDesc: "richly saturated PINK/MAGENTA — same exact pink tonality as the vial cap in reference 1. Darker saturated pink at the top, brighter pink-white glow wash at the bottom of the frame.",
    streakColorDesc: "bright white core with a soft warm pink halo bloom around each streak",
  },
  {
    name: "NuL_GlowBlend_70mg_matchklow",
    productName: "Glow Blend",
    dose: "70mg",
    capColor: "soft baby blue (clean pastel sky / cornflower blue) — replace reference 1's pink cap with this baby blue, identical shape and finish",
    accentColor: "soft baby blue matching the cap",
    bgColorDesc: "richly saturated SKY BLUE / CYAN — same exact blue tonality and gradient as reference 2's background. Darker saturated blue at the top, brighter blue-white glow wash at the bottom of the frame.",
    streakColorDesc: "bright white core with a soft cyan-blue halo bloom around each streak — exactly matching reference 2's streak color",
  },
];

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(product) {
  const PROMPT = `Reference 1 is the NuLumin vial — use it for the label layout, brand lockup, glass, proportions, and cap.
Reference 2 is the EXACT COMPOSITION + LIGHTING + STREAK TARGET — reproduce reference 2's overall look as faithfully as possible, just with the changes below.

LOCKED FROM REFERENCE 2 (replicate exactly):
- The 1:1 square composition with the vial centered and slightly tilted, hero-lit floating in mid-air.
- The lighting gradient: DARKER saturated color at the top, BRIGHTER white-glow wash at the BOTTOM of the frame.
- The light streaks: multiple thin elegant flowing light trails that sweep upward from the bottom-right area in long graceful curves, bright white cores with soft colored halo bloom, layered at multiple depths — some streaks pass behind the vial, some pass in front of it. Same number of streaks, same flow pattern, same density and placement as reference 2.
- The soft bright halo behind the cap and the crisp highlights on the glass.
- The overall depth of field, contrast, and finished render quality.

CHANGES FOR THIS RENDER (apply these to reference 2's composition):

1. BACKGROUND COLOR: ${product.bgColorDesc}

2. STREAK COLOR: ${product.streakColorDesc}

3. CAP: ${product.capColor}

4. LABEL ACCENT COLOR (left edge stripe + divider + dose text): ${product.accentColor}

5. LABEL PRODUCT NAME: replace the existing italic script text on the label with "${product.productName}" in the SAME italic script display font, in BLACK / dark charcoal (NOT the accent color). Same position, same size scale. If too long for one line, set it on TWO lines (still italic script, centered, BLACK).

6. LABEL DOSE: "${product.dose}" below the product name in the same heavy sans italic style, in the accent color.

7. KEEP from reference 1: the NuLumin Bio-Sciences brand lockup, the small side spec text block on the upper right of the label, the "Manufactured by NuLumin" line at the bottom.

ASPECT RATIO: 1:1 square, 4K resolution.

Negative: do NOT put the product name in the accent color (BLACK only), do NOT change the streak style from reference 2 (must be thin sweeping light trails, not thick neon tubes), do NOT change the gradient direction (bottom must be brighter), do NOT change the vial composition from reference 2, do NOT add or remove streaks compared to reference 2, do NOT change the NuLumin lockup or side spec text.`;

  const body = {
    contents: [{ parts: [inline(VIAL_REF), inline(STREAK_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };

  console.log(`\n→ ${product.name}: ${product.productName} ${product.dose}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    console.error(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_${product.name}.png`;
      fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${outPath}`);
      return outPath;
    }
  }
  console.error("  no image in response");
  return null;
}

const results = [];
for (const product of PRODUCTS) {
  const out = await generateOne(product);
  if (out) results.push(out);
}

console.log(`\nDone — ${results.length}/${PRODUCTS.length} generated`);
for (const r of results) console.log(`  ${r}`);
