#!/usr/bin/env node
// 5 genuinely DIFFERENT LAYOUTS (not just bg swaps). Both logos top, equal vials, bold
// legible headline, lower-center left OPEN for a composited crisp button. gpt-2 medium.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/layouts";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE polished, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Professionally art-directed.

CO-BRAND LOGOS AT THE TOP: place BOTH logos together at the very TOP as a partnership lockup — "Becca Boo Beauty" (reference 1) as the larger primary mark and "NuLumin BIO-SCIENCES" (reference 2, vertical 5-color spectrum bar + wordmark) as a smaller secondary mark beside it with a slim divider. Reproduce BOTH faithfully, painted into the design (soft-edged, never pasted/boxed), both clearly visible. NO logo at the bottom.

HEADLINE text reads EXACTLY "Peptides Available Now": BOLD, UPRIGHT, very legible elegant serif (NOT cursive, NOT script, NOT a plain flat sans), colored for strong contrast against the background.

VIALS from reference 3: the three purple-capped vials with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE THE EXACT SAME SIZE and height.

IMPORTANT: leave the LOWER-CENTER of the flyer as clean, open background — do NOT draw any button, pill, badge, or call-to-action text there; just leave open space for one to be added later.

Tasteful and balanced. Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no button or "Get Started" text, no logo at bottom, no cursive headline, no other text, no misspellings, no gibberish, no white/cream bars, vials must be equal size, nothing pasted-looking, no watermark.

LAYOUT & BACKGROUND FOR THIS VERSION (the composition must be clearly different from the others): `;

const STYLES = [
  ["A_centered", "CENTERED CLASSIC — perfectly symmetric. Co-brand logos centered at the top; the headline centered just below; the three equal vials standing in a neat centered row in the middle; calm open space in the lower-center. Soft lavender watercolor background."],
  ["B_angle", "DYNAMIC ANGLE — energetic and asymmetric. The three equal vials arranged in a slightly OVERLAPPING DIAGONAL cluster (staggered front-to-back with depth and soft shadows) sitting to one side; the headline set off to the opposite side / upper area; florals sweeping diagonally from one corner. Cream-and-soft-gold marble background."],
  ["C_editorial", "EDITORIAL BIG-TYPE — an OVERSIZED headline dominating the upper half (very large, bold, commanding); the three equal vials rendered smaller in a tidy row across the lower third; lots of clean negative space. Minimal soft white-to-lilac background with a thin gold frame."],
  ["D_vialstop", "VIALS-UP-TOP — inverted layout. Directly beneath the logos, the three equal vials are displayed as a hero shelf row across the upper-middle; the large bold headline sits BELOW the vials; open space at the lower-center. Warm blush-pink to lavender gradient background."],
  ["E_framed", "FRAMED SPOTLIGHT — the three equal vials centered inside an elegant tall ARCHED gold-outlined frame / spotlight in the middle, glowing; the headline arching neatly just above the arch; symmetric and ornate but clean. Dramatic deep plum / aubergine background with a soft glow and faint gold sparkles; headline and text in warm cream/gold for contrast."],
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
const outs = [];
for (const [n, s] of STYLES) { const o = await gen(n, s); if (o) outs.push(o); }
console.log(`Done ${outs.length}/${STYLES.length}`);
