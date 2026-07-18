#!/usr/bin/env node
// Glow + Klow studio shots, GUARANTEED identical lighting + blue tint.
// Step 1: render a Glow studio ANCHOR off the CFC ref (cap pushed to exact #94c7e2).
// Step 2: render Klow by reproducing the anchor image EXACTLY, relabel only.
// => both shots share pixel-identical lighting, surface, shadow, and cap blue.
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
const CFC_REF = "NuLumin Assets/NuL_CFC_5mg.png";

const BLUE = "exact sky blue hex #94c7e2 = RGB(148,199,226) — a soft, light, slightly bright cyan-blue. It must read clearly BRIGHTER and a touch more saturated than a dull steel blue; do NOT let it go dark, greyed, navy, cornflower, or teal. Match #94c7e2 precisely";

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function callModel(parts, label, outName) {
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "5:4", imageSize: "4K" } },
  };
  console.log(`\n→ ${label}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_${outName}.png`;
      fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${outPath}`);
      return outPath;
    }
  }
  console.error("  no image in response");
  return null;
}

// ---- Step 1: Glow anchor ----
const ANCHOR_PROMPT = `Reproduce reference 1 PIXEL-FAITHFULLY as a NuLumin Bio-Sciences product studio shot, with ONLY these specific changes:

LOCKED FROM REFERENCE 1 — MATCH THE LIGHTING EXACTLY (do not change):
- The EXACT same studio environment as reference 1: the same soft warm light-grey seamless backdrop with its subtle gradient (NOT pure white, NOT brighter than the reference), the same soft even diffuse lighting, the same gentle contact shadow beneath the vial, and the same matte surface. Do NOT brighten the background and do NOT add a glossy mirror floor reflection that is not in reference 1.
- Single vial centered front-facing, same framing and scale as reference 1.
- Vial body shape, proportions, glass material, label layout, label texture, label placement, the vial's contact shadow, camera angle (slightly above eye level, straight head-on), depth of field, and overall photographic style — all identical to reference 1.

CHANGES FOR THIS RENDER:
1. CAP COLOR: ${BLUE}. Same cap shape, height, and glossy finish as reference 1's cap — only the color changes to #94c7e2.
2. ACCENT COLOR: the exact same blue #94c7e2 as the cap, used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text. Replace ALL the pink accents in reference 1 with this exact blue.
3. LABEL PRODUCT NAME: replace "CJC-1295(N)" with "Glow Blend" in the SAME italic script display font, in BLACK / dark charcoal (the SAME color as the original "CJC-1295(N)", which is BLACK — not the accent color). Same position and size scale; two centered lines if needed.
4. LABEL DOSE: replace "5mg" with "70mg" in the same heavy sans italic style, rendered in the accent blue (#94c7e2).

Render at high resolution, 5:4 aspect ratio matching reference 1.

Negative: do not change the studio background tone or brighten it, do not turn the backdrop pure white, do not add a glossy mirror floor reflection that is not in reference 1, do not change the shadow softness, do not change the vial proportions, do not change the NuLumin Bio-Sciences brand lockup, do not warp the wordmark, do not change the side spec text block, do not change the camera angle, do not add extra graphics or icons, do not change the cap shape (only its color to #94c7e2), do not let the blue drift dark/navy/cornflower/teal, do not put the product name in the accent color (BLACK only).`;

const anchor = await callModel(
  [inline(CFC_REF), { text: ANCHOR_PROMPT }],
  "Glow Blend 70mg studio ANCHOR (#94c7e2)",
  "NuL_GlowBlend_70mg_studio_anchor"
);
if (!anchor) { console.error("Anchor failed; aborting."); process.exit(1); }

// ---- Step 2: Klow derived from the anchor (relabel only) ----
const DERIVE_PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences studio product shot. Reproduce it as faithfully as a photo retouch — treat it as the canonical image and change ONLY the two text edits listed. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — REPRODUCE EXACTLY FROM THE REFERENCE (do not change in any way):
- The background tone, gradient, brightness, lighting, the contact shadow, and the surface — identical.
- The vial position, size, glass, proportions, reflections, and the camera angle — identical.
- The CAP COLOR and its exact blue tint — identical to the reference cap (do NOT shift the hue, brightness, or saturation of the cap even slightly).
- The full label design: NuLumin Bio-Sciences lockup, the thin left accent stripe, the divider, the side spec text block, the "Manufactured by NuLumin" line, the accent-blue color, and the layout — all identical.

THE ONLY CHANGES:
1. Replace the product name "Glow Blend" with "Klow Blend" — same italic script display font, same BLACK / dark-charcoal color, same size and position.
2. Replace the dose "70mg" with "80mg" — same heavy sans italic style, same accent-blue color, same position.

ASPECT RATIO: 5:4, identical framing to the reference.

Negative: do NOT change the cap color or blue tint, do NOT change the background, lighting, shadow, or surface, do NOT re-center or resize the vial, do NOT change the label design or lockup, do NOT alter any text other than the two edits above, do NOT put the product name in the accent color (BLACK only).`;

await callModel(
  [inline(anchor), { text: DERIVE_PROMPT }],
  "Klow Blend 80mg studio (derived from anchor)",
  "NuL_KlowBlend_80mg_studio_derived"
);

console.log("\nDone — Glow anchor + Klow derived (identical lighting & blue).");
