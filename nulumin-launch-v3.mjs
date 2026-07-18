#!/usr/bin/env node
// Nulumin "Now Available" Instagram launch v3 — 3:4 portrait, gpt-image-2,
// 4K. Locks to NuLumin Bio-Sciences brand identity: clean clinical-modern
// medical aesthetic, signature 5-color spectrum band (lavender/blue/mint/
// gold/coral) as the recurring graphic motif, faithful logo lockup, 31 SKUs.
import fs from "fs";

const ASSETS = "NuLumin Assets";
const LOGO_BLACK = `${ASSETS}/NuLumin-logo-nobg-black.png`;
const LOGO_WHITE = `${ASSETS}/NuLumin-logo-nobg-white.png`;

const HERO_GLP1 = `${ASSETS}/NuL_GLP1_10mg.png`;
const HERO_BPC = `${ASSETS}/NuL_BPC_10mg.png`;
const HERO_IPA = `${ASSETS}/NuL_Ipamorelin_10mg.png`;
const HERO_NAD = `${ASSETS}/NuL_NAD_500mg.png`;
const HERO_TB = `${ASSETS}/NuL_TB_10mg.png`;
const HERO_KPV = `${ASSETS}/NuL_KPV_10mg.png`;

// Brand spectrum band — used as a recurring graphic motif across all 3 concepts.
const BAND_SPEC = `the NuLumin signature 5-segment vertical spectrum band — five rounded-rectangle color blocks stacked top-to-bottom: soft lavender purple #B89BE2, cornflower sky blue #6FA5DD, mint green #5DBD84, warm golden yellow #F2B856, coral pink #E68B9A — exactly as it appears beside the wordmark in reference 1 (the official logo)`;

const LOGO_RULE = `Reproduce the official NuLumin Bio-Sciences lockup FAITHFULLY from reference 1: the wordmark must read "NuLumin" with "Nu" in bold sans + "Lumin" in matching thin sans-serif weight, a thin horizontal divider line beneath the wordmark, and "BIO-SCIENCES" tracked-out caps tagline beneath the divider. The 5-segment color spectrum bar sits IMMEDIATELY to the LEFT of the wordmark, full wordmark height. Do NOT warp the typography, do NOT substitute the typeface, do NOT alter the color order of the spectrum bar, do NOT drop "BIO-SCIENCES".`;

const jobs = [
  // ── Concept A v3 — Refined Liquid Hero (legible, in-brand) ───────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. CLEAN, REFINED, EYE-CATCHING. Brand: clinical-modern medical aesthetic.

HERO SCENE: a single NuLumin GLP-1 10mg vial (reference 2) standing centered slightly below the visual midline, tilted at a subtle 8° angle. A CONTROLLED, sculptural ribbon of crystal-clear liquid arcs gracefully around the vial in a single elegant suspended curve (NOT a chaotic splash) — like a luxury fragrance product shot but clinical. A few small suspended droplets in the air. Vial label SHARP and fully readable (the full NuLumin Bio-Sciences mini-lockup, "GLP-1", "10 mg" all accurate per reference 2).

BACKGROUND: clean warm cream #F4F0E6 seamless gradient, slightly darker at the corners for depth. A soft circular bloom of warm white light behind the vial creates a halo. ${BAND_SPEC} — render this band as a LARGE vertical graphic running down the FAR-RIGHT EDGE of the canvas from top to bottom, ~6% of canvas width, like an editorial trim — this is the brand's signature device.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo centered horizontally at the very top of the canvas (~7% margin from top), sized so the wordmark spans ~38% of canvas width.
- BIG headline "ARRIVED." set in a clean modern sans-serif (Söhne Breit or Inter Display, thin weight matching the "Lumin" portion of the logo for cohesion), single line, lowercase letters EXCEPT for capital A and the period, color black #1A1A1A, sized so it spans ~70% of canvas width, positioned just below the logo at roughly 22% from top. Heavy letterspacing for editorial breathing room. Crystal-clear legibility.
- Beneath the headline: a single thin black horizontal divider line ~50% of canvas width, centered
- Beneath the divider: small kicker "31 research-grade peptides · now available" in tracked-out caps, black at 75% opacity, ~25% canvas width

LIGHTING: bright soft diffused studio daylight, gentle cool rim on the vial's left edge, soft warm core glow behind. Crisp glassy reflections in every droplet. The liquid ribbon catches subtle hints of the 5 brand colors as refraction. Premium medical-grade product photography.

Style: Aesop × Apple Health × premium bio-tech launch poster. Clean, refined, magazine-worthy. Crisp typography is the hero — fully legible. Negative: no chaotic splash, no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing color bar, no missing BIO-SCIENCES tagline, no extra text, no people, no clutter, no cosmic/nebula backgrounds, no brutalist Swiss color blocks, no warped typography, no inaccurate vial label, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, HERO_GLP1],
    _meta: { name: "nulumin-launch-v3-A-refined-liquid" },
  },

  // ── Concept B v3 — Spectrum Band Editorial (in-brand color block) ────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. EDITORIAL, BOLD, IN-BRAND. Brand: clinical-modern medical aesthetic.

BACKGROUND: massively scaled-up version of ${BAND_SPEC} occupies the ENTIRE LEFT 35% of the canvas as a single dominant graphic element — the five color bands run horizontally across this left strip (rounded ends top and bottom), each band a full 7% canvas-height stripe stacked top-to-bottom in the correct brand order (lavender, blue, mint, gold, coral). The remaining RIGHT 65% of the canvas is a clean warm cream #F4F0E6 panel with subtle paper-grain texture. A clean vertical seam where the band meets the cream — no fade, hard edge, intentional.

HERO LINEUP: THREE NuLumin vials staggered vertically down the right cream panel, each centered horizontally within the right panel and evenly spaced top-to-bottom:
- Top right: GLP-1 10mg vial (reference 2)
- Middle right: BPC 10mg vial (reference 3)
- Bottom right: Ipamorelin 10mg vial (reference 4)
Each vial photographed at a clean front 3/4 angle, upright, with the full NuLumin Bio-Sciences mini-lockup + peptide name + dose all accurate per refs. Soft contact shadows beneath each vial on an invisible surface. Vials feel posed, sculptural, gallery-grade.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo at the TOP-RIGHT of the right cream panel (top margin ~6%), sized ~42% of the right-panel width. It can read as a smaller "header" of the cream panel.
- Large headline "NOW LIVE." stacked on two lines centered within the right panel, set in a clean modern sans-serif (matching the NuLumin wordmark style — bold for "NOW" and thin for "LIVE." to mirror the "Nu / Lumin" weight contrast in the logo), uppercase, black #1A1A1A, sized so each line spans ~55% of right-panel width, positioned vertically centered within the right panel (interleaved between the three vials — the vials and the headline coexist; the type sits BEHIND the vials at slightly reduced contrast where they overlap, ~70% opacity over the vials and full opacity elsewhere).
- Bottom-right corner: small kicker "31 research-grade peptides · officially available" tracked-out caps, black at 80% opacity, single line
- Small numbered editorial tag top-right corner of the cream panel: "N° 001" in tracked-out caps, black at 60%

LIGHTING: bright soft diffused daylight, each vial gets a subtle vertical specular highlight, long soft contact shadows. Gallery-poster crispness.

Style: editorial wellness poster, Aesop × Hermès × premium bio-tech. The brand spectrum band is the hero graphic motif. Negative: no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing BIO-SCIENCES tagline, no other color schemes outside the 5 brand colors + cream + black, no cosmic backgrounds, no Swiss saffron/emerald, no warped typography, no inaccurate vial labels, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, HERO_GLP1, HERO_BPC, HERO_IPA],
    _meta: { name: "nulumin-launch-v3-B-spectrum-editorial" },
  },

  // ── Concept C v3 — Clinical Floating Catalog (medical-grade) ─────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. CLEAN CLINICAL-MEDICAL, APPLE-KEYNOTE-GRADE. Brand: research-grade peptides, clinical-modern wellness.

BACKGROUND: pristine seamless clinical gradient — pure white #FFFFFF at the top fading to a soft warm cream #F4F0E6 at the bottom. A single very soft circular light bloom centered in the middle of the canvas, like overhead surgical lighting in a high-end research lab. Hyper-clean, no texture, no clutter. ${BAND_SPEC} — render this band as a thin HORIZONTAL element running across the BOTTOM of the canvas (~4% of canvas height, full canvas width), the five color segments laid side-by-side in correct order (lavender left, then blue, mint, gold, coral right) — a subtle brand seal at the foot of the poster.

HERO LINEUP: SIX NuLumin vials (refs 2–7) arranged in a floating MUSEUM-CASE CONSTELLATION — suspended in space at gently different depths, NOT chaotic, INTENTIONAL. Composition:
- Three vials forward and larger in the lower-center of the frame, evenly spaced, very slight different angles (GLP-1 left tilt 5°, BPC upright, Ipamorelin right tilt 5°)
- Three vials further back and softer (NAD, TB, KPV) drifting higher behind them, slightly out of focus
Each visible label is crisp and fully readable (full NuLumin Bio-Sciences mini-lockup + peptide name + dose accurate per refs). Vials have a faint medical-clean glow around each one, NOT cosmic, more like premium glass-case display lighting.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo centered horizontally at the TOP of the canvas (~6% from top), sized so the wordmark spans ~40% of canvas width.
- Below the logo: a thin BLACK horizontal divider line ~30% of canvas width, centered
- Beneath the divider: small kicker "EST. 2026  ·  BIO-SCIENCES" in tracked-out caps, black at 65% opacity
- Massive headline "31. NOW LIVE." stacked on two lines at the BOTTOM-center of the frame (just above the spectrum band), set in clean modern sans-serif matching the NuLumin wordmark style (bold "31." line 1, thin "NOW LIVE." line 2 to mirror the Nu/Lumin weight contrast), black #1A1A1A, generous letterspacing, line 1 spans ~25% canvas width and line 2 spans ~55% canvas width

LIGHTING: pristine clinical studio — soft cool-white from above, gentle warm under-fill, each vial gets a controlled vertical specular highlight, soft contact reflections. The aesthetic of a high-end pharma launch keynote.

Style: Apple keynote × premium pharma × museum display case. Quiet, confident, premium. The vials are precious objects on display. Negative: no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing BIO-SCIENCES tagline, no cosmic nebulae, no aurora glows, no chaotic splashes, no dark backgrounds, no brutalist color blocks, no warped typography, no inaccurate vial labels, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, HERO_GLP1, HERO_BPC, HERO_IPA, HERO_NAD, HERO_TB, HERO_KPV],
    _meta: { name: "nulumin-launch-v3-C-clinical-floating" },
  },
];

fs.writeFileSync("nulumin-launch-v3.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
