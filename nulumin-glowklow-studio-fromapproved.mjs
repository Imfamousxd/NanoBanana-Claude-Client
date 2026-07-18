#!/usr/bin/env node
// Glow + Klow studio shots derived DIRECTLY from the APPROVED Epithalon hero image.
// The approved image already has the exact cap shape, cap blue, glass, and label design we want.
// => keep ALL of that pixel-faithful; change ONLY: background -> grey studio, name+dose.
// Step 1: Glow anchor (Epithalon ref -> studio relabel). Step 2: Klow derived from anchor.
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
const APPROVED = "NuLumin Send/Epithalon_10mg_blue.png";

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

// ---- Step 1: Glow anchor from approved Epithalon ----
const ANCHOR_PROMPT = `Reference 1 is an APPROVED, FINISHED NuLumin Bio-Sciences product shot. Keep the VIAL itself completely unchanged and only restage the background and edit two pieces of label text.

KEEP EXACTLY FROM REFERENCE 1 — pixel-faithful, do NOT alter in any way:
- The CAP: its exact crimped vial-cap shape, the exact same blue color, the exact same glossy finish, sheen, and highlights. Do NOT change the cap color, do NOT change the cap shape, do NOT make it darker, lighter, more or less metallic — copy the cap from reference 1 precisely.
- The glass vial: shape, proportions, clear glass, the way the light passes through it, reflections — identical to reference 1.
- The label design: the white/very-light label, the thin vertical blue accent stripe on the left edge, the "NuLumin BIO SCIENCES" wordmark lockup, the blue divider line under it, the small side spec text block ("For Res / Not for / Consu..."), the "Manufactured by NuLumin" line, the typefaces, and the exact blue accent color — all identical to reference 1.

THE ONLY CHANGES:
1. BACKGROUND: replace the blue light-streak background with a clean studio product backdrop — a soft, warm light-grey seamless sweep with a subtle gradient (not pure white), soft even diffuse studio lighting, and a soft natural contact shadow beneath the vial on a matte surface. Do NOT add a glossy mirror floor reflection. The vial sits centered, front-facing.
2. PRODUCT NAME: replace "Epithalon" with "Glow Blend" — same italic serif/script display font, same BLACK color, same position and size; two centered lines only if needed.
3. DOSE: replace "10mg" with "70mg" — same heavy style, same blue accent color, same position.

Lighting note: because the background is now neutral grey instead of blue, the cap and glass may pick up slightly less blue spill, but the cap's OWN paint color must stay exactly the blue it is in reference 1 — do not desaturate or darken it.

ASPECT RATIO: 5:4.

Negative: do NOT change the cap color, shape, or finish; do NOT change the glass or vial proportions; do NOT change the label layout, lockup, or accent-blue color; do NOT change any text except the two edits; do NOT put the product name in the accent color (BLACK only); do NOT add extra graphics; do NOT add a mirror floor reflection.`;

const anchor = await callModel(
  [inline(APPROVED), { text: ANCHOR_PROMPT }],
  "Glow Blend 70mg studio ANCHOR (from approved Epithalon)",
  "NuL_GlowBlend_70mg_studio_fromapproved"
);
if (!anchor) { console.error("Anchor failed; aborting."); process.exit(1); }

// ---- Step 2: Klow derived from the anchor (relabel only) ----
const DERIVE_PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences studio product shot. Reproduce it as faithfully as a photo retouch — change ONLY the two text edits below. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — REPRODUCE EXACTLY (do not change in any way): the background tone/gradient/lighting, the contact shadow and surface, the vial position/size/glass/proportions/reflections, the CAP color/shape/finish and its exact blue, and the full label design including the accent-blue color and layout.

THE ONLY CHANGES:
1. Replace "Glow Blend" with "Klow Blend" — same italic display font, same BLACK color, same size and position.
2. Replace "70mg" with "80mg" — same heavy style, same blue accent color, same position.

ASPECT RATIO: 5:4, identical framing.

Negative: do NOT change the cap color/shape/finish, background, lighting, shadow, surface, vial, or label design; do NOT alter any text other than the two edits; do NOT put the product name in the accent color (BLACK only).`;

await callModel(
  [inline(anchor), { text: DERIVE_PROMPT }],
  "Klow Blend 80mg studio (derived from anchor)",
  "NuL_KlowBlend_80mg_studio_fromapproved"
);

console.log("\nDone — Glow anchor + Klow derived from the approved Epithalon image.");
