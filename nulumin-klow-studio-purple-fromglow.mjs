#!/usr/bin/env node
// Klow Blend STUDIO purple — derived DIRECTLY from the APPROVED purple Glow c1 so the
// pair stays identical in lighting, cap purple and tint. Change ONLY name+dose.
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

const GLOW = "Nulumin Generated/Glow Klow Purple/GlowBlend_70mg_studio_purple_bgfix_c2.png";
const OUT_DIR = "Nulumin Generated/Glow Klow Purple";
const N = 2;

const inline = (p) => ({ inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences STUDIO product shot — the purple "Glow Blend" vial on a clean NEUTRAL light-grey studio backdrop. Reproduce it EXACTLY and pixel-faithfully as a photo retouch — change ONLY the two pieces of text listed below. Everything else must be pixel-for-pixel identical to the reference.

LOCKED — reproduce with NO change: the studio background, its exact NEUTRAL light-grey color and gradient, the lighting white balance, the contact shadow and surface, the vial position/size/glass/proportions/reflections, the camera angle, the CAP (its exact flat flip-off shape, slim silver crimp collar, exact purple color/brightness/finish), and the full label design including the purple accent stripe, the purple divider, the boxed research text, the typefaces and layout.

CRITICAL WHITE BALANCE: keep the background and the whole image perfectly NEUTRAL light-grey, identical to the reference — do NOT add any yellow, warm, cream, beige, green or magenta color cast anywhere. The backdrop stays a clean cool-neutral grey (around RGB 215/213/214). The white label stays clean white, not cream.

THE ONLY CHANGES:
1. Replace the product name "Glow Blend" with "Klow Blend" — same italic serif display font, same BLACK color, same size and position.
2. Replace the dose "70mg" with "80mg" — same heavy style, same purple accent color, same position.

ASPECT RATIO: 1:1 square, identical framing to the reference.

Negative: NO yellow/warm/cream/green/magenta tint anywhere; do NOT change the cap color/shape/finish or the silver collar; do NOT change the background color, lighting, white balance, shadow, surface, vial, glass, or label design; do NOT alter any text other than the two edits; keep all purple accents the exact same purple; do NOT put the product name in the accent color (BLACK only); no misspellings.`;

async function genOne(i) {
  const body = {
    contents: [{ parts: [inline(GLOW), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`  c${i} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(OUT_DIR, `KlowBlend_80mg_studio_purple_bgfix_c${i}.png`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`); return out;
    }
  }
  console.error(`  c${i}: no image`); return null;
}

console.log(`\n=== Klow 80mg studio purple — tint-fix, ${N} candidates ===`);
const outs = [];
for (let i = 1; i <= N; i++) { const o = await genOne(i); if (o) outs.push(o); }
if (outs.length) { try { execSync(`open -a Preview ${outs.map((o) => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/${N}.`);
