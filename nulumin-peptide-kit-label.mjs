#!/usr/bin/env node
// NuLumin Bio-Sciences — "Peptide Essentials Kit" bubble-mailer LABEL sticker (150mm x 125mm, 6:5 landscape).
// gpt-image-2, logo ref for an exact lockup. 3 layout variants. Designed with even margins so the
// 3:2 render crops cleanly to 6:5 for a 300dpi print file (done in a separate finalize step).
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
const SIZE = "1024x1536";
const LOGO_REF = "NuLumin Assets/NuLumin-logo-nobg-black.png";
const outDir = "Nulumin Generated/Peptide Kit Label";
fs.mkdirSync(outDir, { recursive: true });

const BRAND = `BRAND — NuLumin Bio-Sciences, a premium peptide-research brand. Aesthetic: clean modern biotech, high-trust, premium — NOT a medical/hazard warning label, NOT cold-clinical, NOT cluttered. Clean CLINICAL WHITE matte background with a VERY faint light-grey precision grid + subtle thin-line molecular/peptide-chain pattern (barely visible, never busy). Strong-contrast BLACK typography in a modern geometric sans. The NuLumin 5-color SPECTRUM is the signature accent, used SPARINGLY: lavender #B89BE2, cornflower blue #6FA5DD, mint #5DBD84, warm gold #F2B856, coral #E68B9A. Generous even white margins / safe-zone around ALL content (keep everything well inside the edges).`;

const LOGO = `LOGO — reproduce the NuLumin Bio-Sciences logo from REFERENCE IMAGE 1 EXACTLY in the TOP-LEFT corner: the vertical 5-segment rounded SPECTRUM BAND (lavender, blue, mint, gold, coral top-to-bottom) to the left of the "NuLumin" wordmark (bold "Nu" + light "Lumin"), a thin divider line, and the tracked-out "BIO-SCIENCES" tagline beneath. Do not warp, recolor, or restyle the logo. Keep it modest in size, anchored top-left.`;

const TITLE = `TITLE BLOCK (upper area, left-aligned, NOT centered) — main title "Peptide Essentials Kit" in large bold black sans; directly beneath it the subtitle "Everything Required for Clean Peptide Preparation" in a smaller, lighter grey weight.`;

const CONTENTS = `KIT CONTENTS (middle section) — exactly FOUR rows, each a MINIMAL THIN-LINE icon (precise, technical, NOT cartoonish) + short black text. Spell each exactly:
1. [thin-line small insulin syringe icon] "30 × U-100 Insulin Syringes"  with secondary line "1 mL · 30G"
2. [thin-line larger syringe icon] "2 × 3 mL Luer-Lock Draw Syringes"
3. [thin-line vial / bottle icon] "1 × 30 mL Bacteriostatic Water Vial"
4. [thin-line square prep-pad / sachet icon] "30 × Individually Sealed Alcohol Prep Pads"
Each icon outlined in ONE spectrum accent color; keep rows aligned, compact, easy to scan, with breathing room.`;

const BADGES = `TRUST BADGES (lower section) — FIVE compact badges, each a MINIMAL THIN-LINE icon above a short black label, laid out as a tidy row (wrap to two even rows if the portrait width is tight). Spell each exactly:
- [shield + checkmark] "99%+ Verified Purity"
- [stacked documents / folder] "Public COA Library"
- [lab flask + checkmark] "Third-Party Tested"
- [price tag] "Competitive Pricing"
- [fast delivery truck] "Fast U.S. Shipping"
Each badge icon may take a different one of the 5 spectrum colors. Light, premium, scannable — NOT loud.`;

const FOOTER = `FOOTER (very bottom) — a thin horizontal divider that is a subtle SPECTRUM gradient line, then small refined text: "FOR RESEARCH PURPOSES ONLY" and the website "WWW.NULUMIN.ORG". Small and elegant, NOT styled like a warning label.`;

const NEG = `STRICT — Spell ALL text EXACTLY as written. Do NOT make it look like a medical warning/hazard label (no red/orange/yellow caution styling, no warning symbols). Do NOT add any dosage, usage, injection, or treatment instructions or health claims. Do NOT use paragraphs. Do NOT center the whole layout — keep it asymmetric and clean. Do NOT use generic medical blue except the brand's own #6FA5DD. Do NOT overcrowd; keep abundant white space. Everything must stay legible at small sticker size. This is a flat 2D printed LABEL artwork (no mockup, no 3D mailer, no perspective) filling the frame with even margins.`;

const VARIANTS = [
  { slug: "A-column", layout: `LAYOUT A (portrait, top-to-bottom) — logo TOP-LEFT with a subtle minimal thin-line biotech graphic (a vial + syringe line illustration) in the TOP-RIGHT corner. Title + subtitle below the header, left-aligned. The four CONTENTS rows stacked as a clean full-width COLUMN through the middle. The five TRUST BADGES in a row (wrap to two rows if needed) in the lower area. Footer pinned to the bottom edge.` },
  { slug: "B-grid", layout: `LAYOUT B — logo TOP-LEFT; TOP-RIGHT a subtle abstract molecular / peptide-chain thin-line motif. Title + subtitle near the top. The four CONTENTS items arranged as a tidy 2x2 GRID of small cards in the middle. The five TRUST BADGES in one row beneath the grid. Footer at the bottom.` },
  { slug: "C-rail", layout: `LAYOUT C — logo TOP-LEFT; a scaled-up vertical NuLumin SPECTRUM rail accent runs down the RIGHT edge as the graphic device (with a faint molecular pattern). Title + subtitle top-left. The four CONTENTS rows as a single column in the middle-left. The five TRUST BADGES in a row along the lower area. Footer at the bottom.` },
];

const results = [];
const logoBuf = fs.readFileSync(LOGO_REF);
for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Peptide Kit label: ${v.slug}...`);
  const PROMPT = `Design a PRINT-READY product LABEL STICKER for the "Peptide Essentials Kit" — a flat 2D label artwork, PORTRAIT 5:6 proportion (TALLER than wide; printed at 125mm wide × 150mm tall). Compose the whole design VERTICALLY to read at that upright portrait proportion with even margins.

${BRAND}

${LOGO}

${TITLE}

${CONTENTS}

${BADGES}

${FOOTER}

${v.layout}

${NEG}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "nulumin-logo.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 400)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.slug})`); continue; }
  const outPath = `${outDir}/${stamp}_peptide-kit-label-${v.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${VARIANTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
