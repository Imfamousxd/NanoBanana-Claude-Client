#!/usr/bin/env node
// Polish pass on the two chosen layouts (A centered, C editorial): cleaner + more
// eye-catching (glow behind vials, refined gold, crisp spacing). 3 candidates each.
// Both logos top, equal vials, bold legible headline, lower-center left OPEN for the
// composited button. gpt-image-2 medium.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/polish";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE polished, premium, EYE-CATCHING yet CLEAN PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Top-tier art direction: crisp, refined, intentional. It should grab attention at a glance through strong hierarchy, a luminous focal point and elegant contrast — while staying CLEAN, uncluttered and balanced with generous negative space (never busy, never messy).

CO-BRAND LOGOS AT THE TOP: place BOTH logos together at the very TOP as a partnership lockup — "Becca Boo Beauty" (reference 1) as the larger primary mark and "NuLumin BIO-SCIENCES" (reference 2, vertical 5-color spectrum bar + wordmark) as a smaller secondary mark beside it with a slim elegant divider. Reproduce BOTH faithfully, crisp and clearly visible, blended naturally (soft-edged, never pasted/boxed). NO logo at the bottom.

HEADLINE reads EXACTLY "Peptides Available Now": BOLD, UPRIGHT, very legible elegant serif (NOT cursive, NOT script, NOT a plain flat sans), beautifully kerned with precise spacing, strong contrast against the background.

VIALS from reference 3: the three purple-capped vials with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE THE EXACT SAME SIZE and height, crisply, sitting on a soft LUMINOUS GLOW / halo of light so they pop as the clear focal point, with clean soft reflections.

Add only a WHISPER of refined GOLD accent and a few delicate florals confined to the corners — restrained and tasteful. Leave the LOWER-CENTER as clean, open background — do NOT draw any button, pill, badge or call-to-action text there.

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no button or "Get Started" text, no logo at bottom, no cursive headline, no other text, no misspellings, no gibberish, no clutter, no busy or messy background, no white/cream bars, vials must be equal size, nothing pasted-looking, no watermark.

LAYOUT FOR THIS VERSION: `;

const STYLES = [
  ["A_centered", "CLEAN SYMMETRIC — perfectly centered and balanced. Logos centered at top; bold centered headline below; the three equal vials in a crisp centered row on a soft luminous glow as the focal point; calm open lower-center; soft dreamy LAVENDER watercolor background; refined and premium."],
  ["C_editorial", "CLEAN EDITORIAL — an OVERSIZED, bold, commanding headline dominating the upper half with crisp precise spacing; the three equal vials in a tidy centered row across the lower third on a soft glow; lots of calm negative space; a thin refined gold frame; MINIMAL soft white-to-pale-lilac background; high-fashion and striking through bold scale and contrast, not clutter."],
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
const jobs = [];
for (const [base, style] of STYLES) for (let i = 1; i <= 3; i++) jobs.push([`${base}_${i}`, style]);
let ok = 0;
for (const [n, s] of jobs) { const o = await gen(n, s); if (o) ok++; }
console.log(`Done ${ok}/${jobs.length}`);
