#!/usr/bin/env node
// Glow Blend studio purple — BACKGROUND-MATCH pass. Keep the approved Glow c1 vial/
// cap/label/text/framing pixel-identical; change ONLY the studio backdrop to the
// catalog brand grey (#D5D4D5 neutral) so it matches BPC/TB/GHK. Remove lavender wash.
// ref1 = approved Glow c1 (content truth). ref2 = BPC catalog (backdrop target). 2 candidates.
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

const SRC = "Nulumin Generated/Glow Klow Purple/GlowBlend_70mg_studio_purple_c1.png"; // content
const BG_REF = "NuLumin Assets/NuL_BPC_10mg.png";                                     // backdrop target
const OUT_DIR = "Nulumin Generated/Glow Klow Purple";
const N = 2;

const inline = (p) => ({ inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference image 1 is an APPROVED NuLumin Bio-Sciences purple "Glow Blend" studio product shot. Reference image 2 is another NuLumin vial (BPC-157) whose STUDIO BACKDROP is the correct, canonical brand grey — a clean NEUTRAL light grey.

Reproduce reference image 1 EXACTLY and pixel-faithfully — the vial, the purple flip-off CAP (its exact shape, slim silver collar, and exact purple color/finish), the clear glass, the white label and EVERY element on it (the "NuLumin BIO-SCIENCES" lockup, the purple accent stripe, the boxed research text, the italic serif "Glow Blend" name in BLACK, the purple "70mg" dose, the "Manufactured by NuLumin" line), the lighting on the vial, the contact shadow, the vial position/size and the 1:1 square framing — ALL pixel-identical.

THE ONLY CHANGE — replace the studio BACKDROP with the exact same neutral grey as reference image 2's backdrop:
- a clean, perfectly NEUTRAL light grey, approximately RGB 213,212,213, where the red, green and blue values are essentially equal (no color cast).
- slightly DARKER than reference 1's current backdrop, matching reference 2's brightness and its soft subtle top-to-bottom gradient (a touch lighter near the base where the vial sits).
- REMOVE the faint lavender / purple / magenta / cool wash that is currently in reference 1's background — the backdrop must be a true neutral grey with no purple tint, identical in tone to reference 2.

Change ONLY the empty backdrop area. Do not alter the vial, cap, label, text, shadow, lighting or framing in any way.

ASPECT RATIO: 1:1 square, identical framing to reference 1.

Negative: no lavender/purple/magenta/warm/cream tint in the background; do NOT lighten the backdrop beyond reference 2's tone; do NOT change the cap shape/color, the vial, glass, label, any text, the shadow or the framing; product name stays BLACK; no misspellings.`;

async function genOne(i) {
  const body = {
    contents: [{ parts: [inline(SRC), inline(BG_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`  c${i} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(OUT_DIR, `GlowBlend_70mg_studio_purple_bgfix_c${i}.png`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`); return out;
    }
  }
  console.error(`  c${i}: no image`); return null;
}

console.log(`\n=== Glow studio purple — background-match to catalog grey, ${N} candidates ===`);
const outs = [];
for (let i = 1; i <= N; i++) { const o = await genOne(i); if (o) outs.push(o); }
if (outs.length) { try { execSync(`open -a Preview ${outs.map((o) => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/${N}.`);
