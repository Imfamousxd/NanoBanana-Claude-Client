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
const STYLE_REF = "NuLumin Assets/NuL_CFC_5mg.png";

const PRODUCTS = [
  {
    name: "NuL_CJCIpam_5mg",
    productName: "CJC-1295 + Ipamorelin Blend",
    dose: "5mg",
    capColor: "endocrine pink (warm coral pink, same exact pink as the cap in the reference image)",
    accentColor: "endocrine pink (matches the cap, used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text)",
  },
  {
    name: "NuL_GlowBlend_70mg",
    productName: "Glow Blend",
    dose: "70mg",
    capColor: "baby blue (soft sky / cornflower blue, a clean pastel blue cap)",
    accentColor: "baby blue (matches the cap, used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text)",
  },
  {
    name: "NuL_KlowBlend_80mg",
    productName: "Klow Blend",
    dose: "80mg",
    capColor: "baby blue (soft sky / cornflower blue, a clean pastel blue cap)",
    accentColor: "baby blue (matches the cap, used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text)",
  },
];

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(product) {
  const PROMPT = `Reproduce reference 1 PIXEL-FAITHFULLY as a NuLumin Bio-Sciences product studio shot, with ONLY these specific changes:

LOCKED FROM REFERENCE 1 (do not change):
- Bright clean white studio background, soft even studio lighting, single vial centered front-facing.
- Vial body shape, proportions, glass material, label layout, label texture, label placement on the vial, vial reflections/shadows on the surface beneath, camera angle (slightly above eye level, straight head-on), depth of field, and overall photographic style.
- The NuLumin Bio-Sciences brand lockup on the label — "NuLumin" wordmark (Nu bold sans + Lumin thin) on top, thin horizontal divider line beneath, "BIO SCIENCES" tracked small caps beneath the divider. Same exact lockup as reference 1.
- The small side text block on the upper right of the label (the multi-line spec/usage text). Keep that block intact — same layout and texture as reference 1.
- "Manufactured by NuLumin" line at the bottom of the label.

CHANGES FOR THIS RENDER:
1. CAP COLOR: ${product.capColor}. The cap should look identical in shape, height, and finish to the reference 1 cap, only the color changes.
2. ACCENT COLOR: ${product.accentColor}. Replace the pink accents in reference 1 with this new accent color throughout the label.
3. LABEL PRODUCT NAME: replace the existing "CJC-1295(N)" italic script text on the label with the text "${product.productName}" set in the SAME italic script display font as reference 1, same color (accent color above), same position, same size scale. If the full name is too long for one line, set it on TWO lines (still in italic script, still centered) so it fits cleanly within the label area without spilling off the edge.
4. LABEL DOSE: keep the "${product.dose}" text below the product name in the same heavy sans italic style and accent color as reference 1's "5mg".

Render at high resolution, 5:4 aspect ratio (slightly wider than tall, matching reference 1).

Negative: do not change the white studio background, do not change the vial proportions, do not change the NuLumin Bio-Sciences brand lockup, do not warp the wordmark, do not change the side spec text block, do not change the camera angle, do not add any extra graphics or icons, do not change "Manufactured by NuLumin" line, do not change the cap shape (only its color), do not introduce shadows or props that aren't in reference 1.`;

  const body = {
    contents: [{ parts: [inline(STYLE_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "5:4", imageSize: "4K" } },
  };

  console.log(`\n→ ${product.name}: ${product.productName} ${product.dose} (${product.capColor.split("(")[0].trim()})`);
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
