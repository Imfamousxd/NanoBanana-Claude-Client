#!/usr/bin/env node
// Nulumin "Now Available" Instagram launch v2 — 3:4 portrait, gpt-image-2, max
// resolution, BOLD/eye-catching/editorial direction. Three distinct hero
// treatments designed to stop the scroll.
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
const HERO_EPI = `${ASSETS}/NuL_Epithalon_30mg.png`;
const HERO_MOT = `${ASSETS}/NuL_MOTSC_20mg.png`;

const jobs = [
  // ── Concept A — Liquid Drama Splash ──────────────────────────────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for Nulumin research peptides. BOLD, eye-catching, magazine-cover-grade.

HERO SCENE: a single Nulumin GLP-1 10mg vial (reference 3) suspended mid-air at the dead center of the frame, tilted at a dynamic 25° angle, photographed at high-speed with crystalline clear liquid actively SPLASHING and ARCING around it in a frozen-frame moment — droplets, ribbons of liquid, and a swirling mid-air liquid crown all captured at 1/8000s shutter. The splash forms a sculptural halo around the vial. Vial label is sharp and fully readable (Nulumin logo, "GLP-1", "10 mg" all accurate per reference 3).

BACKGROUND: dramatic saturated gradient — top of frame deep electric cobalt #0B2A8C bleeding into mid-frame violet #5B1F8E, dropping to hot magenta #C8217B at the bottom. A massive soft circular bloom of warm white light behind the vial creating a halo. Subtle volumetric god-rays. Faint cosmic dust particles.

TYPOGRAPHY (layered with the vial — type BEHIND and IN FRONT of the splash for depth):
- Massive oversized headline "ARRIVED" running vertically/stacked behind the vial in ultra-bold condensed display sans-serif (think Druk Wide or NB Akademie Std), letter height ~75% of canvas height, color cream #F4F0E6, the vial sits in front partially eclipsing the middle letters
- Nulumin logo (reference 1, white) — top-center, sized ~22% of canvas width, with subtle outer glow
- Bottom-center kicker text: "32 RESEARCH PEPTIDES · OFFICIALLY AVAILABLE" in clean modern sans, small, tracked out, cream, with a thin horizontal divider line above it

LIGHTING: high-key dramatic — saturated cyan rim on the vial's left edge, hot magenta rim on the right edge, soft warm white glow behind. Reflections shimmer in every droplet. Cinematic, hyper-real.

Style: luxury fragrance / energy drink launch poster, Nike-keynote-grade visual drama, GQ cover energy, hyper-detailed splash photography, glossy crisp finish. Negative: no extra logos, no people, no clutter, no flat catalog shot, no static composition, no boring centered lineup, no warped typography, no inaccurate vial label.`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_WHITE, LOGO_BLACK, HERO_GLP1],
    _meta: { name: "nulumin-launch-v2-A-liquid-drama" },
  },

  // ── Concept B — Editorial Color Block Diagonal ───────────────────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for Nulumin research peptides. BOLD editorial color-block, magazine-poster aesthetic.

BACKGROUND: hard color-blocked composition — a sharp diagonal split running from top-right corner to bottom-left corner. UPPER-LEFT triangle: deep emerald-forest #0E3A2A. LOWER-RIGHT triangle: hot saffron-amber #E8A526. The diagonal seam is crisp and intentional, like a Swiss-modernist poster. A subtle paper-grain texture across the whole frame.

HERO LINEUP: THREE Nulumin vials arranged diagonally across the frame, each tilted ~20° to align with the color-block diagonal, evenly spaced from top-right to bottom-left:
- Top-right: GLP-1 10mg vial (reference 3)
- Center: BPC 10mg vial (reference 4)
- Bottom-left: Ipamorelin 10mg vial (reference 5)
Each vial photographed at a clean front 3/4 angle with the label fully readable (Nulumin logo + peptide name + dose mg accurate per refs). Each vial casts a LONG hard-edged shadow at 35° angle (suggesting low afternoon sun). Vials feel sculptural, posed like trophies.

TYPOGRAPHY:
- Massive headline "NOW / LIVE." stacked on two lines, set in ultra-bold condensed display sans (Druk Wide style), uppercase, off-white #F4F0E6 with subtle inner-emboss shadow, running across the upper-left zone — line 1 "NOW" sits in the emerald triangle, line 2 "LIVE." sits half-on-emerald half-on-saffron creating a duotone color split through the letterforms
- Nulumin logo (reference 2, BLACK) — bottom-right corner, ~18% canvas width
- Small kicker bottom-left: "RESEARCH-GRADE PEPTIDES · 32 SKUs" uppercase, tracked out, black at 80% opacity
- A small numbered tag "N° 001" top-right corner like an editorial issue number

LIGHTING: hard editorial sun-lit feel — sharp specular highlights on each vial's left edge, deep crisp shadows on the right. Gallery-poster perfection.

Style: Swiss poster meets Off-White launch graphic meets Aesop editorial. Brutalist confidence, intentional, refined. Negative: no extra text, no extra logos, no people, no clutter, no soft gradient backgrounds, no warped typography, no inaccurate vial labels.`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_WHITE, LOGO_BLACK, HERO_GLP1, HERO_BPC, HERO_IPA],
    _meta: { name: "nulumin-launch-v2-B-color-block" },
  },

  // ── Concept C — Cosmic Glow / Floating Catalog ───────────────────────────────
  {
    prompt: `Instagram launch poster — 3:4 portrait — for Nulumin research peptides. ETHEREAL, premium-tech-wellness, cinematic Apple-keynote-grade.

BACKGROUND: deep cosmic gradient — top of frame inky midnight black #060812, transitioning through deep ultraviolet #1A0E45, to a luminous aurora teal #0FB3A8 toward the center, fading back to dark at the bottom. Soft volumetric light bloom radiating from the center. Faint nebula wisps and tiny pinpoint stars. Like an OLED hero shot for a luxury tech product.

HERO LINEUP: SIX Nulumin vials (refs 3–8) arranged in a floating CONSTELLATION — not standing on a surface, but suspended in space at different depths. Three vials forward and larger (GLP-1, BPC, Ipamorelin), three vials further back and slightly smaller (NAD, TB, KPV) softly blurred for depth. The forward three are clustered loosely in the middle-lower portion of the frame at slight different angles (one slightly tilted left, one upright, one tilted right) — they read as a hero trio. The back three drift higher and softer behind them. Each visible label is crisp and fully readable (Nulumin logo + peptide name + dose mg accurate per refs).

EACH VIAL gets a soft luminous halo of pale cyan-to-violet light around it, like the vials themselves are gently glowing — premium clinical/tech aesthetic, NOT cheesy. Subtle chromatic refraction on the glass.

TYPOGRAPHY:
- Nulumin logo (reference 1, white) — top-center, sized ~24% of canvas width, with a very soft outer glow
- Just below the logo: a small kicker "EST. 2026" in tracked-out caps, cream at 60% opacity
- Massive headline "ALL 32. / NOW LIVE." stacked on two lines at the BOTTOM of the frame in a clean modern sans (think Söhne Breit), uppercase, off-white #F4F0E6, line 2 in slightly lighter weight, generous letterspacing — feels like an Apple keynote title card
- Tiny URL bottom-center beneath the headline: "nulumin.co" in fine letterspaced caps

LIGHTING: ethereal volumetric — cyan rim light on left edges of vials, violet kicker on right edges, soft warm white core glow behind the hero trio. Like product photography shot inside a planetarium.

Style: Apple Vision Pro keynote × Aesop campaign × cosmic luxury wellness, cinematic dreamlike premium aesthetic, hyper-real glass and liquid rendering, glossy crisp finish. Negative: no extra logos, no people, no hands, no clutter, no flat product-catalog look, no boring centered lineup, no warped typography, no inaccurate vial labels.`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO_WHITE, LOGO_BLACK, HERO_GLP1, HERO_BPC, HERO_IPA, HERO_NAD, HERO_TB, HERO_KPV],
    _meta: { name: "nulumin-launch-v2-C-cosmic-glow" },
  },
];

fs.writeFileSync("nulumin-launch-v2.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
