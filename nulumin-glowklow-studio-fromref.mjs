#!/usr/bin/env node
// Glow + Klow studio shots derived DIRECTLY from NuLumin Send/ref.png — the approved
// STUDIO Epithalon shot (grey backdrop, correct crimped cap, correct cap blue, full label).
// It is already the exact stage we want => change ONLY name + dose, keep everything else.
// Step 1: Glow anchor (relabel ref). Step 2: Klow derived from the Glow anchor.
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
const REF = "NuLumin Send/ref.png";

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function callModel(parts, label, outName) {
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
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

const GLOW_PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences STUDIO product shot. Reproduce it as faithfully as a photo retouch — treat it as the canonical image and change ONLY the two pieces of label text listed below. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — REPRODUCE EXACTLY FROM THE REFERENCE (do not change in any way):
- The grey studio background, its gradient and brightness, the lighting, the contact shadow, and the surface — identical.
- The vial position, size, clear glass, proportions, and reflections, and the camera angle — identical.
- The CAP: its exact crimped vial-cap shape, the exact same blue color, brightness, saturation, and glossy finish — identical (do NOT darken, lighten, or change the cap blue, and do NOT make it metallic/chrome).
- The full label design: the white label, the thin vertical blue accent stripe on the left, the "NuLumin BIO-SCIENCES" lockup, the blue divider line, the side spec text block, the "Manufactured by NuLumin" line, the typefaces, and the exact blue accent color — all identical.

THE ONLY CHANGES:
1. Replace the product name "Epithalon" with "Glow Blend" — same italic serif display font, same BLACK color, same size and position.
2. Replace the dose "10mg" with "70mg" — same heavy style, same blue accent color, same position.

ASPECT RATIO: 1:1, identical framing to the reference.

Negative: do NOT change the cap color/shape/finish, the background, lighting, shadow, surface, vial, glass, or label design; do NOT alter any text other than the two edits; do NOT put the product name in the accent color (BLACK only).`;

const glow = await callModel(
  [inline(REF), { text: GLOW_PROMPT }],
  "Glow Blend 70mg studio (from ref.png)",
  "NuL_GlowBlend_70mg_studio_fromref"
);
if (!glow) { console.error("Glow failed; aborting."); process.exit(1); }

const KLOW_PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences STUDIO product shot. Reproduce it as faithfully as a photo retouch — change ONLY the two text edits below. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — REPRODUCE EXACTLY (do not change): the grey studio background/gradient/lighting, the contact shadow and surface, the vial position/size/glass/proportions/reflections, the CAP color/shape/finish and its exact blue, and the full label design including the accent-blue color and layout.

THE ONLY CHANGES:
1. Replace "Glow Blend" with "Klow Blend" — same italic serif display font, same BLACK color, same size and position.
2. Replace "70mg" with "80mg" — same heavy style, same blue accent color, same position.

ASPECT RATIO: 1:1, identical framing.

Negative: do NOT change the cap color/shape/finish, background, lighting, shadow, surface, vial, or label design; do NOT alter any text other than the two edits; do NOT put the product name in the accent color (BLACK only).`;

await callModel(
  [inline(glow), { text: KLOW_PROMPT }],
  "Klow Blend 80mg studio (derived from Glow)",
  "NuL_KlowBlend_80mg_studio_fromref"
);

console.log("\nDone — Glow + Klow studio derived from NuLumin Send/ref.png.");
