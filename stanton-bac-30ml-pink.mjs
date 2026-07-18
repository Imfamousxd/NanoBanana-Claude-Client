#!/usr/bin/env node
// Stanton Medical Supply — 30 mL BACTERIOSTATIC WATER vial label (PINK portrait variant).
// Modeled EXACTLY on the supplied pink-banner reference: white label, magenta diagonal
// banner across the middle, two-line "BACTERIOSTATIC WATER" in white on the band,
// "0.9% benzyl alcohol added.", magenta "Premium Lab-Grade Quality" tagline, small
// "For Research Use Only". Stanton seal sits as the small brand mark top-right (where
// the eBacc mark sits in the ref).
// Portrait wrap label sized 1024x1536 (2:3) — matches the proportion of the ref image.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "1536x1024";
const CROP_H = 685; // 1536 * 29/65 = 685 -> exact 65:29 dieline crop
const SEAL_REF = "Stanton Assets/stanton-seal.png";
const STYLE_REF = "Stanton Assets/refs/bac-water-pink-style-ref.png";
const outDir = "Stanton Assets/BAC Water Label";
fs.mkdirSync(outDir, { recursive: true });

const BRAND = `BRAND — Stanton Medical Supply: clinical, trustworthy, PREMIUM-MEDICAL. Label stock is matte WHITE and white is the DOMINANT surface. Palette ONLY: vivid STANTON CLINICAL TEAL #1A9AA6 (the central horizontal banner, the "Premium Lab-Grade Quality" tagline, the small brand-mark teal-ring accent), deep BLACK #0A0A0A (product name spec lines, body text, dose callout), neutral medium GREY #6B6B6B (small "For Research Use Only" line), pure WHITE (label background + reversed text inside the teal banner). NO pink, NO magenta, NO navy, NO other hues — use the Stanton teal exactly.`;

const TYPE = `TYPOGRAPHY — clean modern industrial pharmaceutical sans throughout (Helvetica / Inter style). The big "BACTERIOSTATIC WATER" product name is HEAVY BOLD sans, reversed WHITE on the teal band, set on ONE SINGLE LINE that spans the band width comfortably (the strip is wide-and-short so one line fits). Body lines below the band in clean black sans. The "Premium Lab-Grade Quality" tagline in teal italic / medium-weight sans. Very small "For Research Use Only" in light grey at the very bottom.`;

const STYLE = `STYLE TARGET — REFERENCE IMAGE 1 shows the LOOK to emulate but it is PORTRAIT — we are adapting that aesthetic to a WIDE LANDSCAPE wrap label (proportion ~2.24:1). Match the reference's clean clinical pharma feel: flat white label, a SOLID HORIZONTAL ACCENT BANNER, large reversed-white bold uppercase product name on the banner, a thin black spec line beneath, a colored "Premium Lab-Grade Quality" tagline, small "For Research Use Only" footer. RECOLOR the banner and accents from the reference's pink to STANTON CLINICAL TEAL #1A9AA6. Use REFERENCE IMAGE 2 (the Stanton seal) as the small brand mark.\nIMPORTANT: output a FLAT 2D printed LABEL ARTWORK only — do NOT render a 3D vial, a bottle, a hand, a photograph, or any background scene. Just the flat rectangular wide-landscape label face on its own.`;

const CONTENT = `LABEL TEXT — spell each EXACTLY:
- Top-LEFT zone, small black sans: "30 mL Multiple-dose"
- Top-RIGHT zone, small: the Stanton seal mark + "Stanton" wordmark beside it
- A solid TEAL horizontal banner across the middle of the strip
- Inside the banner, white reversed BOLD uppercase ONE LINE: "BACTERIOSTATIC WATER" (single line spanning the banner)
- Directly beneath the banner, black sans: "0.9% benzyl alcohol added."
- One line below, teal medium italic sans: "Premium Lab-Grade Quality"
- At the very bottom, small light-grey: "For Research Use Only"
No dosage/injection instructions, no health claims, no other text, no URL, no badges.`;

const FORMAT = `FORMAT — wide LANDSCAPE flat label, proportion EXACTLY ~2.24:1 (65mm wide × 29mm tall, much wider than tall). Render content for a LETTERBOX: place ALL label content inside a wide horizontal band centered in the image, and keep the TOP ~16% and BOTTOM ~16% of the rendered image as PLAIN SOLID WHITE empty trim margin (no content, no band, no keyline up there) so the artwork crops cleanly to the 2.24:1 dieline. Within the content band, the teal banner stretches full-width and the BACTERIOSTATIC WATER product name sits on ONE single horizontal line within it. Above the banner the top zone holds the dose callout (left) and the Stanton seal+wordmark (right). Below the banner the lower zone holds the three small text lines. Wide and short — never stack tall.`;

const NEG = `STRICT — Flat 2D label artwork ONLY (no 3D vial, no bottle, no hand, no photo, no scene). Spell ALL text EXACTLY. Use ONLY Stanton clinical teal + white + black + small grey — NO pink, NO magenta, NO navy, NO other hues. Clean sterile premium pharma look; NOT a warning/hazard label. WIDE LANDSCAPE aspect (~2.24:1) — never portrait, never square. The product name "BACTERIOSTATIC WATER" sits on ONE SINGLE LINE inside the banner (not two lines).`;

const LAYOUT = `LAYOUT — ${FORMAT} Top zone (above banner): "30 mL Multiple-dose" anchored LEFT in small black sans, the Stanton seal + "Stanton MEDICAL SUPPLY" lockup anchored RIGHT (small). Middle zone: a solid TEAL horizontal banner stretching the full content width with the white reversed BOLD UPPERCASE "BACTERIOSTATIC WATER" set on ONE SINGLE LINE centered inside it. Lower zone (below banner): three small stacked lines, left-aligned — line 1 black "0.9% benzyl alcohol added.", line 2 teal italic "Premium Lab-Grade Quality", line 3 small grey "For Research Use Only".`;

const VARIANTS = [
  { slug: "pink-30ml-a", layout: LAYOUT },
  { slug: "pink-30ml-b", layout: LAYOUT },
  { slug: "pink-30ml-c", layout: LAYOUT },
];

const sealBuf = fs.readFileSync(SEAL_REF);
const styleBuf = fs.readFileSync(STYLE_REF);
const results = [];
const ONLY = process.env.STANTON_ONLY ? process.env.STANTON_ONLY.split(",") : null;
for (const v of VARIANTS) {
  if (ONLY && !ONLY.includes(v.slug)) continue;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Stanton BAC water label (pink): ${v.slug}...`);
  const PROMPT = `Design a PRINT-READY 30 mL BACTERIOSTATIC WATER vial LABEL for Stanton Medical Supply — a flat 2D label artwork, PORTRAIT proportion, in the EXACT visual style of the supplied pink-banner reference.

${BRAND}

${TYPE}

${STYLE}

${CONTENT}

${v.layout}

${NEG}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([styleBuf], { type: "image/png" }), "style-ref.png");
  form.append("image[]", new Blob([sealBuf], { type: "image/png" }), "stanton-seal.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 400)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.slug})`); continue; }
  const fullPath = `${outDir}/${stamp}_stanton-bac-${v.slug}.png`;
  fs.writeFileSync(fullPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${fullPath}`);
  results.push(fullPath);
}
console.log(`\nDone — ${results.length} files`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
