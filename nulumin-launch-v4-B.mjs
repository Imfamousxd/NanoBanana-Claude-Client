#!/usr/bin/env node
// Nulumin launch — Concept B v4 ONLY. Color-correlated lineup: 5 vials, each
// height-aligned to the matching segment of the brand spectrum band on the
// left. Cap color of each vial = brand color of the band beside it.
import fs from "fs";

const ASSETS = "NuLumin Assets";
const LOGO_BLACK = `${ASSETS}/NuLumin-logo-nobg-black.png`;

// One vial per brand color, in band order (top → bottom).
const BAND_LAVENDER = `${ASSETS}/NuL_BPC_10mg.png`;       // lavender pastel cap
const BAND_BLUE     = `${ASSETS}/NuL_NAD_500mg.png`;      // cornflower blue cap
const BAND_MINT     = `${ASSETS}/NuL_DSIP_5mg.png`;       // mint green cap
const BAND_GOLD     = `${ASSETS}/NuL_GLP1_10mg.png`;      // warm gold yellow cap
const BAND_CORAL    = `${ASSETS}/NuL_Ipamorelin_10mg.png`;// coral pink cap

const LOGO_RULE = `Reproduce the official NuLumin Bio-Sciences lockup FAITHFULLY from reference 1: the wordmark must read "NuLumin" with "Nu" in bold sans + "Lumin" in matching thin sans-serif weight, a thin horizontal divider line beneath the wordmark, and "BIO-SCIENCES" tracked-out caps tagline beneath the divider. The 5-segment color spectrum bar sits IMMEDIATELY to the LEFT of the wordmark, full wordmark height. Do NOT warp the typography, do NOT substitute the typeface, do NOT alter the color order of the spectrum bar, do NOT drop "BIO-SCIENCES".`;

const jobs = [
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. EDITORIAL, BOLD, IN-BRAND. Brand: clinical-modern medical aesthetic.

BACKGROUND: massively scaled-up version of the NuLumin signature 5-segment vertical spectrum band occupies the ENTIRE LEFT 30% of the canvas. Five rounded-rectangle color bands stacked top-to-bottom, each band exactly 1/5 of canvas height (~20% canvas-height each), spanning the full left strip width, hard-edged seams between bands:
- TOP band: soft lavender purple #B89BE2
- 2nd band: cornflower sky blue #6FA5DD
- 3rd (middle) band: mint green #5DBD84
- 4th band: warm golden yellow #F2B856
- BOTTOM band: coral pink #E68B9A
The top of the topmost band and bottom of the bottommost band are softly rounded (capsule ends), matching the brand spectrum bar shape from the logo. The remaining RIGHT 70% of the canvas is a clean warm cream #F4F0E6 panel with very subtle paper-grain texture. A clean vertical seam where the spectrum band meets the cream — hard edge, no gradient blend, intentional.

HERO LINEUP — FIVE NuLumin vials staggered vertically down the right cream panel, each vial CENTERED HORIZONTALLY within the right panel AND VERTICALLY ALIGNED so its METALLIC CRIMP CAP sits at the EXACT vertical midpoint of the matching brand-color band on the LEFT. The cap color of each vial MATCHES the band beside it — this color-correlation is the central concept:
- Vial 1 (TOP, aligned with lavender band): BPC-157 10mg (reference 2) — lavender/light-purple cap
- Vial 2 (UPPER-MID, aligned with blue band): NAD+ 500mg (reference 3) — cornflower blue cap
- Vial 3 (MIDDLE, aligned with mint band): DSIP 5mg (reference 4) — mint green cap
- Vial 4 (LOWER-MID, aligned with gold band): GLP-1 10mg (reference 5) — warm gold yellow cap
- Vial 5 (BOTTOM, aligned with coral band): Ipamorelin 10mg (reference 6) — coral pink cap
Each vial photographed at a clean front 3/4 angle, upright, with the full NuLumin Bio-Sciences mini-lockup + peptide name + dose all accurate per its reference. Soft contact shadows beneath each vial on an invisible surface. Vials feel posed, sculptural, gallery-grade. The visual rhyme: cap color of each vial = adjacent band color — five matched pairs running top to bottom.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo at the TOP-RIGHT of the right cream panel (top margin ~6%), sized so the full lockup spans ~50% of the right-panel width.
- Large headline "NOW LIVE." stacked on two lines centered within the right panel (vertically centered between vial 2 and vial 4), set in a clean modern sans-serif matching the NuLumin wordmark style — bold weight for "NOW" line 1 and thin weight for "LIVE." line 2 (mirroring the Nu/Lumin weight contrast in the logo), uppercase, black #1A1A1A, sized so each line spans ~50% of right-panel width. The headline sits BEHIND the vials at slightly reduced contrast where vials overlap (~70% opacity over vials, full opacity elsewhere) so vials read in front but type remains legible.
- Bottom-right corner: small kicker "31 research-grade peptides · officially available" in tracked-out caps, black at 80% opacity, single line
- Small numbered editorial tag top-right corner of the cream panel: "N° 001" in tracked-out caps, black at 60%

LIGHTING: bright soft diffused daylight, each vial gets a subtle vertical specular highlight, long soft contact shadows. Gallery-poster crispness.

Style: editorial wellness poster, Aesop × Hermès × premium bio-tech. The color correlation between vial caps and the brand spectrum band is the hero device — make it READ at a glance. Negative: no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing BIO-SCIENCES tagline, no caps that don't match their adjacent band color, no vials misaligned with their band, no extra colors outside the 5 brand colors + cream + black, no cosmic backgrounds, no Swiss saffron/emerald, no warped typography, no inaccurate vial labels, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, BAND_LAVENDER, BAND_BLUE, BAND_MINT, BAND_GOLD, BAND_CORAL],
    _meta: { name: "nulumin-launch-v4-B-color-correlated" },
  },
];

fs.writeFileSync("nulumin-launch-v4-B.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
