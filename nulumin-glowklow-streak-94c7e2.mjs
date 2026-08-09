#!/usr/bin/env node
// Glow Blend + Klow Blend — light-streak hero shots.
// v2: reproduce _ref_streak_blue.png (the approved Epithalon streak shot) EXACTLY — same
// background, streaks, gradient, lighting, composition, aspect (9:16). Only relabel the
// product (name/dose) and set cap + accent to EXACT blue #94c7e2. Label design preserved from ref.
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

const STREAK_REF = "_ref_streak_blue.png"; // canonical shot to reproduce (9:16 portrait)

const PRODUCTS = [
  { name: "NuL_GlowBlend_70mg_streak_94c7e2_v2", productName: "Glow Blend", dose: "70mg" },
  { name: "NuL_KlowBlend_80mg_streak_94c7e2_v2", productName: "Klow Blend", dose: "80mg" },
];

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(product) {
  const PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences hero product shot. Reproduce it as faithfully as a photo retouch — treat it as the canonical image and change ONLY the four things listed under CHANGES. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — REPRODUCE EXACTLY FROM THE REFERENCE (do not redraw, reinterpret, recompose, or restyle):
- The BACKGROUND: the exact same saturated blue, the exact same top-to-bottom gradient (darker blue at the top, brighter glow toward the bottom), the exact same overall tone and brightness.
- The LIGHT STREAKS: the exact same thin flowing ribbon-of-light trails — same number of streaks, same curves and S-bends, same positions, same density, same thickness, same crisp white cores with soft halo bloom, same ones passing behind vs in front of the vial. Match the streak layout of the reference exactly; do NOT invent a new streak pattern, do NOT make them symmetric or fan-shaped, do NOT add or remove streaks.
- The COMPOSITION: the vial in the exact same position, size, and slight tilt as the reference (vial sits in the same place in the frame, not re-centered).
- The vial GLASS, body shape, proportions, hero lighting, the soft bright halo behind the cap, reflections, and depth of field — all identical to the reference.
- The full LABEL DESIGN: the NuLumin Bio-Sciences brand lockup ("NuLumin" wordmark + thin divider + "BIO SCIENCES" tagline), the thin vertical accent stripe on the left edge of the label, the small side spec text block on the upper-right of the label, the "Manufactured by NuLumin" line at the bottom, and the label layout/proportions/placement on the vial — all preserved exactly as in the reference.

CHANGES (the ONLY differences from the reference):
1. PRODUCT NAME: replace the reference's product name with "${product.productName}", set in the SAME italic script display font, SAME size and position, in BLACK / dark charcoal. If too long for one line, set it on two centered lines (still italic script, BLACK).
2. DOSE: replace the reference's dose with "${product.dose}", same heavy sans italic style and position, rendered in the accent blue (#94c7e2).
3. CAP COLOR: exact sky blue hex #94c7e2 (a soft, light cyan-blue) — same cap shape, height, and glossy finish as the reference, only the color set to #94c7e2. Do not drift toward navy, cornflower, teal, lighter, or darker.
4. ACCENT COLOR: set the thin vertical label stripe and the dose text to the exact same blue #94c7e2.

ASPECT RATIO: 9:16 vertical portrait, exactly matching the reference framing.

Negative: do NOT change the background color or gradient, do NOT redraw or rearrange the light streaks, do NOT re-center or resize the vial, do NOT change the label design or lockup, do NOT drop the left accent stripe or the side spec block, do NOT put the product name in the accent color (BLACK only), do NOT let the blue drift off #94c7e2, do NOT add extra graphics, icons, or vials.`;

  const body = {
    contents: [{ parts: [inline(STREAK_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
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
