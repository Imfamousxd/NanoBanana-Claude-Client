#!/usr/bin/env node
// 5 genuinely DISTINCT typographic directions for the flyer (different fonts + moods).
// Consistent bg (no bars), equal vials, integrated logos, non-cursive legible headline,
// premium CTA. gpt-image-2 medium, 3 refs, retries.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/fonts";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE elegant, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Refined and balanced — tasteful, not cluttered, not plain.

BACKGROUND: ONE single CONSISTENT soft lavender watercolor background flowing seamlessly across the WHOLE graphic top to bottom, with a soft glow behind the vials. NO solid white/cream bars, panels or empty bands anywhere. Just a few soft watercolor florals framing the corners; keep generous clean breathing room.

INTEGRATE the references into that single background (painted in, soft-edged, never pasted or boxed):
- Reference 1 = "Becca Boo Beauty" logo — reproduce faithfully ("Becca Boo" script, "BEAUTY", purple butterfly + florals), blended at the TOP.
- Reference 2 = "NuLumin BIO-SCIENCES" logo (vertical 5-color spectrum bar + wordmark) — reproduce faithfully, smaller, blended near the BOTTOM.
- Reference 3 = the THREE purple-capped vials. Reproduce faithfully with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE VIALS THE EXACT SAME SIZE and height in a neat row on one baseline.

The headline reads EXACTLY "Peptides Available Now" and must be UPRIGHT and very legible (NOT cursive, NOT script, NOT handwriting). The CTA button reads EXACTLY "Get Started Today" and must look premium and designed (not a plain flat pill).

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no cursive headline, no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars, vials must be equal size, nothing pasted-looking, no watermark.

TYPOGRAPHY & MOOD FOR THIS VERSION (make the font and feel clearly distinctive): `;

const STYLES = [
  ["f1_sans", "MODERN SANS — set the headline in a bold, clean, contemporary GEOMETRIC SANS-SERIF (confident, minimal, like a high-end modern skincare brand), with generous letter-spacing and lots of calm negative space; very minimal florals; a sleek simple deep-plum CTA with a thin gold border. Overall mood: clean, modern, understated."],
  ["f2_fashion", "FASHION EDITORIAL — set the headline in a TALL, NARROW, CONDENSED high-fashion SERIF in ALL CAPS (Vogue / Harper's Bazaar style), dramatically stretched vertically, paired with thin gold hairline rules; a sophisticated editorial magazine layout. Mood: high-fashion, glossy."],
  ["f3_deco", "ART-DECO GLAMOUR — set the headline in an elegant geometric ART-DECO DISPLAY font (1920s Gatsby glamour) with symmetrical gold linework and a touch of deco ornament framing it; rich gold accents. Mood: glamorous, opulent, luxe."],
  ["f4_soft", "SOFT MODERN — set the headline in a friendly, SOFT, ROUNDED contemporary serif (warm, approachable luxury) in deep plum; airy and gentle; a softly rounded cream-and-gold CTA. Mood: warm, inviting, gentle."],
  ["f5_bold", "BOLD STATEMENT — set the headline in a HEAVY, CHUNKY modern BOLD SERIF (strong, confident, contemporary wellness brand), large and impactful with tight leading in deep plum; a bold solid-gold CTA with dark text. Mood: punchy, premium, high-impact."],
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
