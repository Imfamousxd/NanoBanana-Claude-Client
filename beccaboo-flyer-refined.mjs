#!/usr/bin/env node
// Refined gpt-image-2 flyer: consistent watercolor bg (no bars), logos painted in,
// EQUAL vials, BOLD NON-CURSIVE legible headline, calm/balanced (not busy). Medium, 3.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/refined";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const PROMPT = `Design ONE elegant, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Refined, modern and tasteful — balanced and clean, with calm negative space. NOT busy, NOT cluttered, NOT over-decorated.

BACKGROUND: ONE single, CONSISTENT soft lavender watercolor background flowing seamlessly across the ENTIRE graphic top to bottom (gentle, smooth, with a soft vignette). NO solid white or cream bars, panels or empty bands anywhere — the wash is continuous through the whole piece, including behind the logos. Keep it understated.

DECORATION (restrained): only a FEW soft watercolor florals framing the CORNERS, and a subtle, soft glow behind the vials so they stand out. Just a whisper of fine gold accent — minimal. Leave plenty of clean breathing room; do NOT fill the space with flowers, sparkles or heavy gold filigree.

HEADLINE — the most important part: render "Peptides Available Now" in a CLEAN, BOLD, MODERN, HIGHLY LEGIBLE typeface. NO cursive, NO script, NO calligraphy, NO handwriting — use upright bold letters that are very easy to read. "Peptides" large and bold in deep plum; "Available Now" directly below in clean bold lettering (bold serif or clean bold sans). Strong contrast, crisp edges, maximum legibility. Spell it EXACTLY: "Peptides Available Now".

INTEGRATE the references naturally into the single background (painted in, soft-edged, never pasted or boxed):
- Reference 1 = "Becca Boo Beauty" brand logo — reproduce faithfully (the "Becca Boo" script, "BEAUTY", purple butterfly + small florals), blended at the TOP.
- Reference 2 = "NuLumin BIO-SCIENCES" partner logo (vertical 5-color spectrum bar + wordmark) — reproduce faithfully, smaller, blended near the BOTTOM.
- Reference 3 = the THREE purple-capped vials. Reproduce them faithfully with their white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE VIALS THE EXACT SAME SIZE and height, in a neat row on one baseline (do NOT make the middle one bigger).

A softly rounded pill BUTTON lower down, spelled EXACTLY: "Get Started Today", in the same clean legible lettering.

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no cursive/script/handwritten headline, no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars or boxes, no clutter, no heavy gold filigree, no excess sparkles, vials must be equal size, nothing pasted-looking, no watermark.`;

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
for (const n of ["ref1", "ref2", "ref3"]) { const o = await gen(n); if (o) outs.push(o); }
if (outs.length) { try { (await import("child_process")).execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/3`);
