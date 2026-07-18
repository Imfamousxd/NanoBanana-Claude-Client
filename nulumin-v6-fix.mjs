#!/usr/bin/env node
// Fix v6 product-lineup: each vial's CAP + dose color must match its stack's
// spectrum color and the legend dot directly beneath it. 2 takes, pick best.
import fs from "fs";

const A = "NuLumin Assets";
const LOGO_BLACK = `${A}/NuLumin-logo-nobg-black.png`;
const REFS = [LOGO_BLACK, `${A}/NuL_BPC_10mg.png`, `${A}/NuL_CFC_10mg.png`,
  `${A}/NuL_Epithalon_10mg.png`, `${A}/NuL_GLP1_20mg.png`, `${A}/NuL_Semax_10mg.png`];

const BRAND = `NuLumin Bio-Sciences — clinical-modern research-peptide brand. Spectrum palette ONLY: lavender purple #B89BE2, cornflower blue #6FA5DD, mint green #5DBD84, warm gold #F2B856, coral #E68B9A; wordmark black #1A1A1A. Refined, clinical, premium.`;
const LOGO_RULE = `Reproduce the supplied NuLumin logo (reference image 1) FAITHFULLY — bold "Nu" + thin "Lumin" wordmark, divider, "BIO-SCIENCES" tagline, vertical 5-segment spectrum band. Never warp it.`;
const VIAL_LOOK = `Each is a real NuLumin vial reproduced photographically: clear glass, a crimped aluminium cap, a white wraparound label with the small NuLumin lockup + a thin spectrum stripe down the label's left edge, the product name in black italic script, and the dose, soft studio lighting, gentle contact shadow on a seamless light-grey backdrop. Keep every label crisp and correctly spelled.`;

const PROMPT = `Clinical product-photography flyer on a soft light-grey studio backdrop, portrait 5:7.

${LOGO_RULE} Logo lockup centered at the top, with a small tracked-out header beneath: "POPULAR STACKS".

Across the middle, FIVE real NuLumin vials stand in a clean, evenly-spaced row, all the same size, lit identically with soft contact shadows. ${VIAL_LOOK}

CRITICAL COLOR RULE — each vial is color-coded to its stack, and that SAME color repeats in the dose text on its label, in the caption dot directly beneath it, AND that caption sits perfectly centered under its own vial. Lock this exact left-to-right mapping (cap color = dose color = dot color = caption):
1. BPC-157 — MINT GREEN cap (#5DBD84) — caption "RECOVERY" with a green dot
2. CJC-1295 — CORNFLOWER BLUE cap (#6FA5DD) — caption "VITALITY" with a blue dot
3. Epithalon — LAVENDER PURPLE cap (#B89BE2) — caption "LONGEVITY" with a purple dot
4. GLP-1 — WARM GOLD cap (#F2B856) — caption "LEAN" with a gold dot
5. Semax — CORAL cap (#E68B9A) — caption "FOCUS" with a coral dot

So the colors run green, blue, purple, gold, coral left-to-right across BOTH the caps and the legend dots — every vial cap matches the dot in the caption right below it. Caption stack names in bold black caps. Footer in small grey caps: "RESEARCH PEPTIDES".

${BRAND}
Premium, clean, generous margins, perfectly legible; all text crisp and correctly spelled, no gibberish, no warped letters.`;

const jobs = [1, 2].map((n) => ({
  prompt: PROMPT,
  aspectRatio: "3:4",
  imageSize: "4K",
  refImages: REFS,
  _meta: { name: `v6-fix-take${n}` },
}));

fs.writeFileSync("nulumin-v6-fix.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} v6-fix takes (3:4 / 4K) -> gpt-image.mjs --batch`);
