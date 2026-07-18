#!/usr/bin/env node
// 5 MORE polished variants (clean + eye-catching, glow focal point) across different
// backgrounds/arrangements. Both logos top, equal vials, bold legible headline, lower-
// center OPEN for the composited button. gpt-image-2 medium.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/more";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE polished, premium, EYE-CATCHING yet CLEAN PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Top-tier art direction: crisp, refined, intentional, striking at a glance through strong hierarchy and a luminous focal point — while staying CLEAN, uncluttered and balanced with generous negative space.

CO-BRAND LOGOS AT THE TOP: BOTH logos together at the very TOP as a partnership lockup — "Becca Boo Beauty" (reference 1) larger primary + "NuLumin BIO-SCIENCES" (reference 2, vertical 5-color spectrum bar + wordmark) smaller secondary, with a slim elegant divider. Reproduce BOTH faithfully, crisp, clearly visible, blended naturally (soft-edged). NO logo at the bottom.

HEADLINE reads EXACTLY "Peptides Available Now": BOLD, UPRIGHT, very legible elegant serif (NOT cursive, NOT a plain flat sans), beautifully kerned, strong contrast.

VIALS from reference 3: three purple-capped vials with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE THE EXACT SAME SIZE and height, crisply, sitting on a soft LUMINOUS GLOW so they pop as the focal point, with clean soft reflections.

A whisper of refined GOLD accent and a few delicate florals confined to the corners. Leave the LOWER-CENTER as clean OPEN background — do NOT draw any button, pill, badge or call-to-action text there.

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no button/"Get Started" text, no logo at bottom, no cursive headline, no other text, no misspellings, no gibberish, no clutter, no busy background, no white/cream bars, vials must be equal size, nothing pasted-looking, no watermark.

LOOK FOR THIS VERSION: `;

const STYLES = [
  ["m1_marble", "CLEAN SYMMETRIC centered — vials in a centered row on a soft glow; luxe CREAM & SOFT-GOLD MARBLE background with subtle veining and a thin gold frame. Elegant and bright."],
  ["m2_blush", "CLEAN SYMMETRIC centered — vials in a centered row on a soft glow; warm romantic BLUSH-PINK to lavender gradient background with a few soft petals drifting in the corners. Gentle and feminine."],
  ["m3_plum", "DRAMATIC SPOTLIGHT — vials centered on a strong luminous glow/spotlight as a bold focal point; deep PLUM / aubergine background with faint gold sparkles and a soft vignette; headline and text in warm cream/gold for contrast. Striking, opulent, premium."],
  ["m4_angle", "DYNAMIC ANGLE — the three equal vials in a gentle OVERLAPPING DIAGONAL cluster on a glow with soft depth, headline in the upper area; soft lavender watercolor background; energetic yet clean and balanced."],
  ["m5_gold", "EDITORIAL — an OVERSIZED bold headline in the upper half, the equal vials in a tidy row across the lower third on a soft glow; minimal warm IVORY/SOFT-GOLD background with refined gold hairlines; high-fashion, airy, premium."],
];

async function genOnce(name, style) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", COMMON + style);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(BB)], { type: "image/png" }), "becca.png");
  form.append("image[]", new Blob([fs.readFileSync(NU)], { type: "image/png" }), "nulumin.png");
  form.append("image[]", new Blob([fs.readFileSync(TRIO)], { type: "image/png" }), "vials.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form, signal: AbortSignal.timeout(240000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) throw new Error("no image");
  const out = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(out, Buffer.from(data[0].b64_json, "base64"));
  console.log(`✓ ${out}`);
  return out;
}
async function gen(name, style) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name, style); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}
let ok = 0;
for (const [n, s] of STYLES) { const o = await gen(n, s); if (o) ok++; }
console.log(`Done ${ok}/${STYLES.length}`);
