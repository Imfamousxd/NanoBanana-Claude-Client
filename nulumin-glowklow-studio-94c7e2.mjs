#!/usr/bin/env node
// Glow Blend + Klow Blend — clean white-studio front shots, cap locked to EXACT blue #94c7e2.
// Redo of nulumin-3blends-front-v2 (Glow/Klow only) with the corrected blue.
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
const STYLE_REF = "NuLumin Assets/NuL_CFC_5mg.png";

const BLUE = "exact sky blue hex #94c7e2 (a soft, light cyan-blue). Do NOT drift lighter, darker, toward navy, toward cornflower, or toward teal — match #94c7e2 precisely";

const PRODUCTS = [
  {
    name: "NuL_GlowBlend_70mg_studio_94c7e2",
    productName: "Glow Blend",
    dose: "70mg",
    capColor: `${BLUE}. The cap shape, height, and glossy finish stay identical to reference 1's cap — only the color changes to #94c7e2`,
    accentColor: `the exact same blue #94c7e2 as the cap (used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text)`,
  },
  {
    name: "NuL_KlowBlend_80mg_studio_94c7e2",
    productName: "Klow Blend",
    dose: "80mg",
    capColor: `${BLUE}. The cap shape, height, and glossy finish stay identical to reference 1's cap — only the color changes to #94c7e2`,
    accentColor: `the exact same blue #94c7e2 as the cap (used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text)`,
  },
];

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(product) {
  const PROMPT = `Reproduce reference 1 PIXEL-FAITHFULLY as a NuLumin Bio-Sciences product studio shot, with ONLY these specific changes:

LOCKED FROM REFERENCE 1 — MATCH THE LIGHTING EXACTLY (do not change):
- The EXACT same studio environment as reference 1: the same soft warm light-grey seamless backdrop with its subtle gradient (NOT pure white, NOT brighter than the reference), the same soft even diffuse lighting, the same gentle contact shadow beneath the vial, and the same matte surface. Do NOT brighten the background and do NOT add a glossy mirror floor reflection that is not in reference 1 — the surface treatment, shadow softness, and background tone must read as the identical photo shoot as reference 1.
- Single vial centered front-facing, same framing and scale as reference 1.
- Vial body shape, proportions, glass material, label layout, label texture, label placement on the vial, the vial's contact shadow on the surface beneath, camera angle (slightly above eye level, straight head-on), depth of field, and overall photographic style — all identical to reference 1.
- The NuLumin Bio-Sciences brand lockup on the label — "NuLumin" wordmark (Nu bold sans + Lumin thin) on top, thin horizontal divider line beneath, "BIO SCIENCES" tracked small caps beneath the divider. Same exact lockup as reference 1.
- The small side text block on the upper right of the label (the multi-line spec/usage text). Keep that block intact — same layout and texture as reference 1.
- "Manufactured by NuLumin" line at the bottom of the label.

CHANGES FOR THIS RENDER:
1. CAP COLOR: ${product.capColor}.
2. ACCENT COLOR: ${product.accentColor}. Replace ALL the pink accents in reference 1 with this exact blue (#94c7e2) throughout the label — the accent stripe, the divider, and the dose text must all read as #94c7e2.
3. LABEL PRODUCT NAME: replace the existing "CJC-1295(N)" italic script text on the label with "${product.productName}" set in the SAME italic script display font as reference 1, in BLACK / dark charcoal — the SAME color as the "CJC-1295(N)" text in reference 1 (which is BLACK, not pink). The product name is BLACK regardless of the accent color. Same position, same size scale. If the full name is too long for one line, set it on TWO lines (still italic script, centered) so it fits cleanly within the label area.
4. LABEL DOSE: keep the "${product.dose}" text below the product name in the same heavy sans italic style as reference 1's "5mg", rendered in the accent blue (#94c7e2).

Render at high resolution, 5:4 aspect ratio (slightly wider than tall, matching reference 1).

Negative: do not change the studio background tone or brighten it, do not turn the backdrop pure white, do not add a glossy mirror floor reflection that is not in reference 1, do not change the shadow softness, do not change the vial proportions, do not change the NuLumin Bio-Sciences brand lockup, do not warp the wordmark, do not change the side spec text block, do not change the camera angle, do not add any extra graphics or icons, do not change "Manufactured by NuLumin" line, do not change the cap shape (only its color to #94c7e2), do not let the blue drift to navy/cornflower/teal, do not put the product name in the accent color (BLACK only), do not introduce shadows or props that aren't in reference 1.`;

  const body = {
    contents: [{ parts: [inline(STYLE_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "5:4", imageSize: "4K" } },
  };

  console.log(`\n→ ${product.name}: ${product.productName} ${product.dose} (#94c7e2)`);
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
