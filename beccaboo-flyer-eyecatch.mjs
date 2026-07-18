#!/usr/bin/env node
// Eye-catching gpt-image-2 flyer: ONE consistent watercolor bg (no bars), logos painted
// in, EQUAL-SIZE vials, plus drama — radial glow, gold foil, sparkle, depth, dynamic florals.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/eyecatch";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const PROMPT = `Design ONE striking, EYE-CATCHING, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Make it feel high-end and distinctive — NOT plain, NOT a generic template. Rich, dimensional and luxe, yet elegant. Palette: lavender, deep plum, cream and real GOLD-FOIL accents.

BACKGROUND: ONE single, CONSISTENT, dimensional purple watercolor background flowing seamlessly across the ENTIRE graphic top to bottom — with depth, soft bokeh and a gentle vignette. NO solid white or cream bars, panels or empty bands anywhere; the wash, florals and atmosphere are continuous through the whole piece, including behind the logos.

MAKE IT EYE-CATCHING (this is important):
- A luminous radial GLOW / soft halo of light behind the three vials so they appear to glow and become the clear focal point.
- Elegant GOLD-FOIL filigree linework and a scatter of fine gold sparkles / light particles.
- A DYNAMIC, flowing floral arrangement with real movement — lush peonies and lilac cascading diagonally from the corners, varied scale, depth of field (some blurred, some sharp).
- A small refined GOLD-FOIL emblem/seal as an accent.
- Confident depth and contrast so it pops at a glance.

INTEGRATE the references naturally into that single background (painted in, soft-edged, never pasted or boxed):
- Reference 1 = "Becca Boo Beauty" brand logo — reproduce faithfully (calligraphy "Becca Boo", "BEAUTY", purple butterfly + florals), blended at the TOP.
- Reference 2 = "NuLumin BIO-SCIENCES" partner logo (vertical 5-color spectrum bar + wordmark) — reproduce faithfully, smaller, blended at the BOTTOM.
- Reference 3 = the THREE purple-capped vials. Reproduce them faithfully with their white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). IMPORTANT: render ALL THREE VIALS THE EXACT SAME SIZE and height, standing in a neat row on the same baseline (do NOT make the middle one bigger).

HEADLINE in the upper area, spelled EXACTLY: "Peptides Available Now" — "Peptides" in a large, bold, high-impact high-contrast serif in deep plum (with a subtle gold edge), "Available Now" in an elegant bold calligraphy script. Crisp, dramatic, highly legible.
A softly rounded gold-rimmed pill BUTTON lower down, spelled EXACTLY: "Get Started Today".

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars or boxes, NOT plain or flat, no vials of different sizes, nothing pasted-looking, no watermark.`;

async function genOnce(name) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", PROMPT);
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
async function gen(name) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}
const outs = [];
for (const n of ["eye1", "eye2", "eye3"]) { const o = await gen(n); if (o) outs.push(o); }
if (outs.length) { try { (await import("child_process")).execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/3`);
