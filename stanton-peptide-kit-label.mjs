#!/usr/bin/env node
// Stanton Medical Supply — "Peptide Essentials Kit" portrait LABEL (125mm x 150mm, 5:6).
// Rebrand of the kit label to Stanton's clinical-navy identity + a rendered hero image of all
// the kit products together. gpt-image-2; ref = the rendered Stanton seal. 3 variants.
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
const SEAL_REF = "Stanton Assets/stanton-seal.png";
const outDir = "Stanton Assets/Peptide Kit Label";
fs.mkdirSync(outDir, { recursive: true });

const BRAND = `BRAND — Stanton Medical Supply: a clinical, trustworthy, PREMIUM-MEDICAL sterile injection-prep supply brand. Calm, precise, built on ABUNDANT WHITE SPACE. Label stock is matte WHITE and white is the DOMINANT surface. Use ONLY this palette: deep medical NAVY #0F1C34 (the anchor — wordmark, headings, body text), a darker chip navy #1D3253, a SINGLE disciplined CLINICAL TEAL accent #1A9AA6 / #36B8C2 (used SPARINGLY — small accents, the eyebrow rule, seal ring, thin line-icon strokes), neutral STEEL #677889 / #4E5D6C (spec lines, secondary text), and a thin NAVY-100 #E2E8F0 hairline for the frame/rules. NO biohazard red, NO bright/rainbow colors. Institutional clinical-premium — NOT a hazard/warning label, NOT a cartoon, NOT cluttered.`;

const TYPE = `TYPOGRAPHY — a strict TWO-FAMILY system. DISPLAY / HEADINGS / PRODUCT NAME / the "Stanton" wordmark in SOURCE SERIF 4 (a serious bold display serif). EVERYTHING ELSE — subtitle, spec lines, eyebrows, fine print — in LIBRE FRANKLIN (a clean institutional grotesque sans). Eyebrows are UPPERCASE with wide 0.14em tracking. Strong contrast: crisp NAVY text on white.`;

const LOGO = `LOGO (top-left) — the Stanton Medical Supply lockup. REFERENCE IMAGE 1 is the brand SEAL: a deep-navy double-ring disc with a clean WHITE medical CROSS/plus and a thin teal inner ring — reproduce it EXACTLY. To the RIGHT of the seal, the wordmark stacked: "Stanton" in Source Serif 4 BOLD navy #0F1C34, and beneath it "MEDICAL SUPPLY" in Libre Franklin — small, uppercase, wide-tracked (~0.26em), clinical teal #1A9AA6. Anchored TOP-LEFT with clear space.`;

const HERO = `HERO PRODUCT RENDER — a tastefully styled, premium product render of GENERIC, UNBRANDED prep supplies arranged together (elevated product styling, NOT a clinical hospital-supply photo, and NOT carrying any brand name or logo on the products). Most items lay flat HORIZONTALLY (insulin syringes, luer-lock syringes, prep pad sachets) — only the BAC water vial stands upright. Include these FOUR product types and NOTHING ELSE:
- plain U-100 INSULIN SYRINGES with the standard realistic ORANGE needle CAPS — show a few of them ALL THE SAME SIZE and ALL LAYING DOWN HORIZONTALLY (parallel to one another, lying flat);
- exactly TWO 3 mL LUER-LOCK DRAW SYRINGES, BOTH LAYING DOWN HORIZONTALLY, in a GENERIC NEUTRAL COLOR (translucent clear plastic OR matte BLACK — pick ONE and use the SAME color on both syringes consistently). Each luer-lock syringe HAS A 24G HYPODERMIC DRAW NEEDLE FITTED onto its luer-lock tip — a realistic thin steel needle cannula with a small neutral needle hub. The needle MUST be clearly visible and attached on BOTH draw syringes — do NOT render them needle-less / bare-tipped;
- a clear glass VIAL with a metallic crimp cap and a CLEAN, SIMPLE white label reading "Bacteriostatic Water for Injection, USP" with a "30 mL" line — the VIAL STANDS UPRIGHT (vertical, on its base, NOT lying down), label facing forward;
- white ALCOHOL PREP PAD sachets shown as a SLIGHTLY OFFSET / CASCADED STACK (3–4 identical square sachets piled on top of one another but each one slightly shifted/rotated a few degrees so the corners of the underlying sachets are visible — you can clearly tell there are MULTIPLE sachets in the stack, not just one). Each sachet has a CLEAN, SIMPLE label reading "Sterile Alcohol Prep Pad". One little cascading pile, NOT a flat tight stack (where only the top is visible), NOT fully spread out across the surface.
NO other items. Arrange them artfully as a horizontal flat-lay composition with consistent baseline / slight overlap, soft premium studio lighting from above, gentle realistic shadows beneath each item, subtle shallow depth-of-field. Render it SMALL and COMPACT — a refined supporting visual that occupies no more than roughly a third of the label height — with generous clean white space around it. Allowed realistic color exceptions: the ORANGE insulin needle caps; the luer-lock syringes stay clear or black (no colored hub); everything else stays clinical navy/teal/steel/white.`;

const TITLE = `TITLE BLOCK — a small uppercase teal eyebrow "STERILE PREPARATION KIT" (Libre Franklin, tracked) above the main title "Stanton Prep Kit" in large Source Serif 4 BOLD navy; beneath it the subtitle "Everything Required for Clean Preparation" in Libre Franklin, steel #4E5D6C. Spell the title exactly: Stanton Prep Kit (NO "Peptide" — do not include the word Peptide anywhere).`;

const CONTENTS = `KIT CONTENTS — exactly FOUR items, each a MINIMAL THIN-LINE icon (navy/teal stroke, precise/technical, NOT cartoonish) + text in Libre Franklin (item name navy, spec in steel). Spell each exactly:
1. [insulin syringe] "30 × U-100 Insulin Syringes"  +  "1 mL · 30G"
2. [luer-lock draw syringe — the thin-line icon MUST clearly show a hypodermic NEEDLE fitted on the syringe's tip, not a bare luer tip] "2 × Luer-Lock Draw Syringes"  +  "3 mL · 24G Needle"
3. [vial] "1 × 30 mL Bacteriostatic Water Vial"
4. [square prep-pad sachet] "30 × Individually Sealed Alcohol Prep Pads"
Aligned, compact, scannable, generous spacing. Exactly FOUR rows, in this order.`;

const BADGES = `TRUST BADGES — FIVE compact badges, each a MINIMAL THIN-LINE icon (teal/navy) above a short Libre Franklin label in navy (row; wrap to two even rows if width is tight). Spell exactly: "99%+ Verified Purity" (shield+check), "Public COA Library" (documents), "Third-Party Tested" (lab flask+check), "Competitive Pricing" (price tag), "Fast U.S. Shipping" (truck).`;

const FOOTER = `FOOTER (very bottom) — a thin NAVY-100 hairline divider, then a single small line of Libre Franklin text in steel: "STANTON-MEDICAL-SUPPLY.COM" anchored to the BOTTOM-LEFT (NOT centered, NOT right-aligned — left-aligned at the bottom-left margin). The BOTTOM-RIGHT zone is RESERVED EMPTY WHITE SPACE for a UPC barcode that will be added in post — leave roughly the right ~30% of the footer area as clean empty white. Quiet and refined. Do NOT include "FOR RESEARCH PURPOSES ONLY" or any other footer text.`;

const FRAME = `A thin NAVY-100 #E2E8F0 hairline FRAME just inside the label edge, with generous quiet margins (white space is the brand).`;

const NEG = `STRICT — Spell ALL text EXACTLY. The LABEL DESIGN/graphics use ONLY navy / clinical-teal / steel / white — NO other hues, NO rainbow, NO biohazard red — EXCEPT the realistic ORANGE insulin-syringe needle caps AND the colored draw-needle hubs on the luer-lock syringes in the product render, which are the allowed realistic exceptions. Headings in Source Serif 4, everything else in Libre Franklin. Institutional clinical-premium — do NOT make it a medical hazard/WARNING label (no caution symbols, no red/yellow). NO dosage/usage/injection/treatment instructions or health claims. NO paragraphs. Keep abundant white space; logo anchored top-left (not centered). Legible at small sticker size. Flat 2D printed LABEL artwork in PORTRAIT 5:6 (no mailer mockup, no 3D, no perspective).`;

const GRID = `KIT-CONTENTS GRID — present the four CONTENTS items as a clean 2×2 GRID OF FOUR SQUARE TILES at the BOTTOM of the label (a 2-column × 2-row table of equal square cells, divided by thin NAVY-100 #E2E8F0 hairline rules — a quiet clinical spec grid). Inside EACH square cell: its MINIMAL THIN-LINE icon centered near the top, with the item name (navy) and spec (steel) in Libre Franklin centered below it. Equal cells, balanced, generous padding inside each square, crisply aligned. This 2×2 square grid is the anchor of the lower half — NOT a single stacked list.`;

const LIST = `KIT-CONTENTS LIST — present the four CONTENTS items as a clean SINGLE-COLUMN VERTICAL LIST of FOUR FULL-WIDTH ROWS stacked top-to-bottom at the BOTTOM of the label (NOT a grid, NOT side-by-side columns — one item per row, four rows). Each row spans the full content width and is separated from the next by a thin NAVY-100 #E2E8F0 hairline divider rule. Within EACH row: the item's MINIMAL THIN-LINE icon (navy/teal stroke) sits at the LEFT, then to its right the item name in Libre Franklin navy with its spec in steel — all vertically centered and left-aligned on a consistent baseline so the rows align into a tidy clinical spec list. The LUER-LOCK row's thin-line icon MUST show a draw syringe WITH a hypodermic NEEDLE fitted on its tip (not a bare luer tip). Equal row heights, generous vertical spacing, crisply aligned. This stacked four-row list is the anchor of the lower third.`;

const VARIANTS = [
  { slug: "D-grid", layout: `LAYOUT D (portrait) — ${FRAME} Logo lockup TOP-LEFT; title block at the top. Below the title, the SMALL compact HERO PRODUCT RENDER centered with white space around it. ${GRID} Footer at the very bottom. (No trust-badge icons.)` },
  { slug: "D2-grid", layout: `LAYOUT D2 (portrait) — ${FRAME} Logo lockup TOP-LEFT; title block at the top; the SMALL compact HERO PRODUCT RENDER directly beneath the title (kept modest). ${GRID} Make the 2×2 square grid sit prominently across the lower third with comfortable margins. Footer at the very bottom. (No trust-badge icons.)` },
  { slug: "E-list", layout: `LAYOUT E (portrait) — ${FRAME} Logo lockup TOP-LEFT; title block at the top; the SMALL compact HERO PRODUCT RENDER directly beneath the title (kept modest, same as layout D2). ${LIST} Make the four-row stacked list sit prominently across the lower third with comfortable margins. Footer at the very bottom. (No trust-badge icons.)` },
];

const sealBuf = fs.readFileSync(SEAL_REF);
const results = [];
const ONLY = process.env.STANTON_ONLY ? process.env.STANTON_ONLY.split(",") : null;
for (const v of VARIANTS) {
  if (ONLY && !ONLY.includes(v.slug)) continue;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Stanton kit label: ${v.slug}...`);
  const PROMPT = `Design a PRINT-READY product LABEL STICKER for the "Stanton Prep Kit" by Stanton Medical Supply — a flat 2D label artwork, PORTRAIT 5:6 proportion (TALLER than wide; printed at 125mm wide × 150mm tall), composed VERTICALLY with generous even margins.

${BRAND}

${TYPE}

${LOGO}

${HERO}

${TITLE}

${CONTENTS}

${FOOTER}

${v.layout}

${NEG}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([sealBuf], { type: "image/png" }), "stanton-seal.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 400)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.slug})`); continue; }
  const outPath = `${outDir}/${stamp}_stanton-peptide-kit-${v.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${VARIANTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
