#!/usr/bin/env node
// 5 styled gpt-image-2 flyer variants: designed (not plain) BOLD UPRIGHT serif headline
// + premium gold-rimmed CTA, equal vials, consistent bg (no bars), integrated logos.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/styled";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE elegant, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Tasteful and balanced — refined, not cluttered and not over-decorated, but NOT plain or flat either. Lavender / deep plum / cream with refined GOLD accents.

BACKGROUND: ONE single, CONSISTENT soft lavender watercolor background flowing seamlessly across the ENTIRE graphic, top to bottom, with a gentle vignette and a soft glow behind the vials. NO solid white or cream bars, panels or empty bands anywhere. A few soft watercolor florals frame the corners only — keep generous clean breathing room.

HEADLINE (make it a DESIGNED STATEMENT, not plain): render "Peptides Available Now" in a BOLD, ELEGANT, UPRIGHT HIGH-CONTRAST SERIF display — sophisticated and premium, with crisp thick-and-thin strokes. NOT a plain flat block sans-serif, and NOT cursive / script / handwriting. "Peptides" large and commanding in deep plum; "Available Now" directly below. Add a tasteful refined gold accent to the headline. Highly legible, strong contrast, beautifully art-directed. Spell EXACTLY: "Peptides Available Now".

CTA: a PREMIUM, designed pill BUTTON — deep plum with a fine GOLD rim/border, a soft drop shadow and a small arrow, elegant and substantial (not a thin plain flat pill). Spell EXACTLY: "Get Started Today", clearly legible.

INTEGRATE the references naturally into the single background (painted in, soft-edged, never pasted or boxed):
- Reference 1 = "Becca Boo Beauty" logo — reproduce faithfully (the "Becca Boo" script, "BEAUTY", purple butterfly + small florals), blended at the TOP.
- Reference 2 = "NuLumin BIO-SCIENCES" logo (vertical 5-color spectrum bar + wordmark) — reproduce faithfully, smaller, blended near the BOTTOM.
- Reference 3 = the THREE purple-capped vials. Reproduce faithfully with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE VIALS THE EXACT SAME SIZE and height in a neat row on one baseline (do NOT make the middle one bigger).

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no plain flat block-sans headline, no cursive/script headline, no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars or boxes, no clutter, vials must be equal size, nothing pasted-looking, no watermark.
HEADLINE & BUTTON STYLE FOR THIS VERSION: `;

const STYLES = [
  ["s1", "a slim elegant gold underline flourish beneath 'Peptides'; the CTA is deep plum with a thin gold border and a small gold arrow."],
  ["s2", "'AVAILABLE NOW' set in refined letter-spaced caps with a slim gold hairline rule above and below it; the CTA is a soft gold gradient pill with plum text."],
  ["s3", "a small ornamental gold flourish/divider sitting between the two headline lines; the CTA is deep plum with a double gold outline and an arrow."],
  ["s4", "the word 'Peptides' extra-large with a subtle gold edge and soft emboss for depth; the CTA is a rounded plum-to-gold gradient button with a gentle sheen."],
  ["s5", "the serif headline flanked by two tiny gold leaf sprigs as accents; the CTA is a gold-rimmed cream button with bold plum text and an arrow."],
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
if (outs.length) { try { (await import("child_process")).execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/${STYLES.length}`);
