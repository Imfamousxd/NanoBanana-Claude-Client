#!/usr/bin/env node
// Nulumin launch v5 — two more posters in the same family as v3-A (refined
// liquid hero). Cream backdrop, brand spectrum band as graphic motif, hero
// vial(s) with controlled liquid moment, big legible headline. Strict
// uniform sizing if multiple vials.
import fs from "fs";

const ASSETS = "NuLumin Assets";
const LOGO_BLACK = `${ASSETS}/NuLumin-logo-nobg-black.png`;

const BAND_SPEC = `the NuLumin signature 5-segment vertical spectrum band — five rounded-rectangle color blocks stacked top-to-bottom: soft lavender purple #B89BE2, cornflower sky blue #6FA5DD, mint green #5DBD84, warm golden yellow #F2B856, coral pink #E68B9A — exactly as it appears beside the wordmark in reference 1 (the official logo)`;

const LOGO_RULE = `Reproduce the official NuLumin Bio-Sciences lockup FAITHFULLY from reference 1: the wordmark must read "NuLumin" with "Nu" in bold sans + "Lumin" in matching thin sans-serif weight, a thin horizontal divider line beneath the wordmark, and "BIO-SCIENCES" tracked-out caps tagline beneath the divider. The 5-segment color spectrum bar sits IMMEDIATELY to the LEFT of the wordmark, full wordmark height. Do NOT warp the typography, do NOT substitute the typeface, do NOT alter the color order of the spectrum bar, do NOT drop "BIO-SCIENCES".`;

const jobs = [
  // ── v5-1 — Hero trio with shared liquid arc ──────────────────────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. CLEAN, REFINED, EYE-CATCHING. Same campaign family as the prior approved "ARRIVED." hero — clinical-modern medical aesthetic.

HERO SCENE: THREE NuLumin vials standing in a tight symmetric trio centered at the visual midline of the canvas. CRITICAL: all three vials are the EXACT SAME PHYSICAL SIZE — same height, same diameter, same vial format. Their bases ALL sit on the same invisible flat surface. Arrangement:
- Center vial: BPC-157 10mg (reference 2, lavender cap) — upright, slightly forward, dead-center of canvas
- Left vial: GLP-1 10mg (reference 3, gold cap) — upright, slightly behind and offset ~12% canvas-width to the left, tilted 4° outward (away from center)
- Right vial: Ipamorelin 10mg (reference 4, coral cap) — upright, slightly behind and offset ~12% canvas-width to the right, tilted 4° outward
All three vials photographed at the same clean 3/4 front angle, labels SHARP and fully readable (NuLumin Bio-Sciences mini-lockup + peptide name + dose all accurate per refs 2–4). A single elegant continuous ribbon of crystal-clear liquid weaves gracefully between the three vials in one sculptural arc, like a controlled fluid sculpture — NOT a chaotic splash. A few suspended droplets in the air around the trio.

BACKGROUND: clean warm cream #F4F0E6 seamless gradient, slightly darker at corners for depth. A soft circular bloom of warm white light behind the center vial. ${BAND_SPEC} — render this band as a LARGE vertical graphic running down the FAR-RIGHT EDGE of the canvas from top to bottom, ~6% canvas width, rounded capsule ends — the brand's signature device.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo centered horizontally at the top of the canvas (~7% margin from top), sized so the full lockup spans ~38% of canvas width.
- BIG headline "AVAILABLE." set in a clean modern sans-serif, ALL LETTERS IN UNIFORM BOLD WEIGHT — every character (A, V, A, I, L, A, B, L, E, and the period) must be the EXACT same bold weight, NO mixed weights, NO thin letters. Single line, uppercase, color black #1A1A1A, sized so it spans ~70% of canvas width, positioned just below the logo at ~22% from top. Generous letterspacing. Crystal-clear legibility — make the type the second hero element.
- Beneath the headline: a single thin black horizontal divider line ~50% of canvas width, centered
- Beneath the divider: small kicker "31 research-grade peptides · now live" in tracked-out caps, black at 75% opacity, ~28% canvas width

LIGHTING: bright soft diffused studio daylight, gentle cool rim on each vial's left edge, soft warm core glow behind. Crisp glassy reflections in every droplet. The liquid ribbon catches subtle hints of the 5 brand colors as refraction. Premium medical-grade product photography.

Style: Aesop × Apple Health × premium bio-tech launch poster. Refined, clean, magazine-worthy. Negative: vials at DIFFERENT sizes (CRITICAL — they must all be identical size), no chaotic splash, no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing BIO-SCIENCES tagline, no missing color bar, no extra text, no people, no clutter, no cosmic backgrounds, no brutalist color blocks, no warped typography, no inaccurate vial labels, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, `${ASSETS}/NuL_BPC_10mg.png`, `${ASSETS}/NuL_GLP1_10mg.png`, `${ASSETS}/NuL_Ipamorelin_10mg.png`],
    _meta: { name: "nulumin-launch-v5-1-trio-arc" },
  },

  // ── v5-2 — Single hero, alt vial + spiral rise, band along bottom ────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for NuLumin Bio-Sciences research peptides. CLEAN, REFINED, EYE-CATCHING. Same campaign family as the prior approved "ARRIVED." hero — clinical-modern medical aesthetic.

HERO SCENE: a SINGLE NuLumin BPC-157 10mg vial (reference 2, lavender cap) standing dead-center of the canvas, very slight 6° tilt to the right, vial standing on an invisible flat surface. Vial label SHARP and fully readable (NuLumin Bio-Sciences mini-lockup, "BPC-157", "10 mg" all accurate per reference 2). A controlled crystal-clear liquid ribbon RISES from the base of the vial in a gentle vertical spiral around the body, climbing up and over the cap in one elegant continuous arc, then dispersing into a few suspended droplets above the vial. Refined, controlled, sculptural — NOT chaotic.

BACKGROUND: clean warm cream #F4F0E6 seamless gradient, slightly darker at corners. A soft warm white halo behind the vial. ${BAND_SPEC} — render this band as a HORIZONTAL graphic running along the BOTTOM of the canvas, ~5% canvas height, five color segments side-by-side in correct order (lavender LEFT through coral RIGHT), rounded capsule ends, ~80% canvas width and horizontally centered. A foundational brand bar at the foot of the poster.

TYPOGRAPHY:
- ${LOGO_RULE} Place this logo centered horizontally at the top of the canvas (~7% margin from top), sized so the full lockup spans ~38% of canvas width.
- BIG headline "OFFICIALLY HERE." set in a clean modern sans-serif (mixing the NuLumin Nu/Lumin weight contrast: capital letters in bold, lowercase in matching thin weight — but render ALL CAPS uppercase for headline impact; achieve weight contrast by using bold weight on word "OFFICIALLY" and thin weight on word "HERE."), TWO lines stacked centered horizontally, line 1 "OFFICIALLY" (bold) line 2 "HERE." (thin + period), color black #1A1A1A. Each line spans ~60% canvas width. Generous letterspacing. Positioned in the upper-third just below the logo at ~20% from top.
- Beneath the headline: a single thin black horizontal divider line ~45% canvas width, centered
- Beneath the divider: small kicker "31 research-grade peptides · now available" tracked-out caps, black at 75% opacity

LIGHTING: bright soft diffused studio daylight from above-front, gentle cool rim down the vial's left edge, warm core glow behind. Glassy droplets catch hints of the 5 brand colors.

Style: Aesop × Apple Health × premium bio-tech launch poster — clearly the same campaign series as the trio version. Refined, clean. Negative: no chaotic splash, no second vial, no extra logos beyond the official lockup, no warped NuLumin wordmark, no missing BIO-SCIENCES tagline, no missing spectrum band, no extra text, no people, no clutter, no cosmic backgrounds, no brutalist color blocks, no warped typography, no inaccurate vial label, never write "32" — it's "31 research-grade peptides".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_BLACK, `${ASSETS}/NuL_BPC_10mg.png`],
    _meta: { name: "nulumin-launch-v5-2-spiral-rise" },
  },
];

fs.writeFileSync("nulumin-launch-v5.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
