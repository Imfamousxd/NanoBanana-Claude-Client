#!/usr/bin/env node
// Glow Blend STREAK (9:16 hero) purple — recolor the whole BLUE scheme to brand purple.
// ref1 = approved blue Glow streak (composition/label/text truth).
// ref2 = approved purple Glow studio c1 (the exact cap + accent purple to match).
// Recolor background gradient + glowing light-ribbons + cap + accents -> violet/purple.
// Keep vial/label/all text/composition identical. 2 candidates.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const SRC = "NuLumin Send/Glow & Klow/NuLumin_Glow-Blend_70mg_streak.png";        // blue streak
const COLOR_REF = "Nulumin Generated/Glow Klow Purple/GlowBlend_70mg_studio_purple_c1.png"; // approved purple
const OUT_DIR = "Nulumin Generated/Glow Klow Purple";
const N = 2;

const inline = (p) => ({ inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference image 1 is an APPROVED, FINISHED NuLumin Bio-Sciences light-streak HERO product shot — the "Glow Blend" vial floating over a rich gradient background with glowing swirling light-ribbons, currently in a BLUE color scheme. Reference image 2 is the APPROVED PURPLE version of the same vial (purple cap + purple accent) — use it as the exact target purple.

Recreate reference image 1 EXACTLY and pixel-faithfully — IDENTICAL vial, clear glass, the flip-off cap shape and slim silver collar, the white wrap-label, the "NuLumin BIO-SCIENCES" lockup, the boxed research text, the italic serif "Glow Blend" product name, the "70mg" dose, the "Manufactured by NuLumin" line, the swirling glowing light-ribbon shapes and their exact positions, the lighting, glow, reflections, depth of field, the vial position/size and the overall 9:16 composition — everything in the same place at the same size.

THE ONLY CHANGE — recolor the entire BLUE color scheme to PURPLE / VIOLET of the same family as reference 2:
- the background gradient: from blue to a rich deep indigo -> violet purple gradient.
- the glowing swirling light-ribbons: glow violet/purple instead of blue (same shapes, same paths).
- the flip-off CAP: to the exact purple of reference 2's cap.
- the thin vertical ACCENT STRIPE on the label and the "70mg" DOSE text: to that same purple.
The product name "Glow Blend" stays BLACK; the wordmark, tagline, side text and "Manufactured by" line stay black/dark.

ASPECT RATIO: 9:16 vertical, identical framing and composition to reference 1.

Negative: do NOT change the vial, cap shape, label layout, text, ribbon shapes, composition or framing; recolor ONLY blue -> purple; leave no blue anywhere; do NOT put the product name in the accent color (BLACK only); no misspellings.`;

async function genOne(i) {
  const body = {
    contents: [{ parts: [inline(SRC), inline(COLOR_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`  c${i} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(OUT_DIR, `GlowBlend_70mg_streak_purple_c${i}.png`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`); return out;
    }
  }
  console.error(`  c${i}: no image`); return null;
}

console.log(`\n=== Glow Blend streak purple — ${N} candidates ===`);
const outs = [];
for (let i = 1; i <= N; i++) { const o = await genOne(i); if (o) outs.push(o); }
if (outs.length) { try { execSync(`open -a Preview ${outs.map((o) => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/${N}.`);
