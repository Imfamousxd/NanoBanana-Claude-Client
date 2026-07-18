#!/usr/bin/env node
// Generic, non-branded "Peptides For Sale / Sold Here" retail window posters.
// Designed for high-contrast storefront visibility — attention-grabbing from
// across the street. 2:3 portrait, gpt-image-2 4K. Three distinct aesthetics.
import fs from "fs";

const jobs = [
  // ── A — Brutalist Display Type ───────────────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — for a brick-and-mortar shop announcing peptides are sold there. NOT branded, NO logo, no brand names. Generic point-of-sale signage designed to grab attention from passersby on the street and from cars driving past at 25-35 mph.

LAYOUT — high-contrast brutalist display typography:
- Background: deep saturated CHARCOAL #1A1A1A flat solid color across the entire canvas, with a very subtle paper-grain texture overlay
- HUGE headline filling the upper two-thirds of the canvas: the single word "PEPTIDES" set in a massive ultra-bold condensed display sans-serif (Druk Wide / Söhne Schmal Breit weight character), uppercase, cream off-white #F4F0E6, the letters STACKED on two lines:
  Line 1: "PEPT" — line 2: "IDES" — OR keep it one word "PEPTIDES" on a single line if it can fit at ~95% canvas width — choose whichever reads MOST aggressively at distance. Letters TIGHTLY tracked, weight extremely heavy. The word should be the dominant visual element, readable from 50 feet away.
- Below the headline, a thin warm-cream horizontal divider line at ~75% canvas width, centered
- Beneath the divider: "SOLD HERE" set in a clean modern light sans-serif (matching the secondary weight contrast — thin against the bold), uppercase, generously tracked, cream off-white, ~70% canvas width centered
- Bottom 8% of the canvas: a thin small kicker in tracked-out caps "✦  RESEARCH-GRADE  ·  ASK INSIDE  ✦" in cream at 70% opacity
- The whole poster reads bold, confident, undeniable from the sidewalk

NEGATIVE: no brand names, no logos, no symbols beyond simple ornamental stars/divider, no photographs, no people, no products, no QR codes, no extra text, no warped typography, no decorative flourishes beyond what is specified. Bold flat brutalist signage.`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-A-brutalist" },
  },

  // ── B — Apothecary Vintage ───────────────────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — for a brick-and-mortar shop announcing peptides are sold there. NOT branded, NO logo, no brand names. Designed in the style of a vintage apothecary / old-time pharmacy poster, attention-grabbing for passersby walking or driving past.

LAYOUT — vintage apothecary aesthetic:
- Background: warm aged-paper cream #EFE5D1 with a subtle weathered paper texture, mild edge-darkening vignette as if the poster is slightly aged
- A thin ornamental rectangular DOUBLE border running just inside the canvas edge, deep oxblood-red #8B2A2A, with small filigree corner flourishes (simple Victorian-style ornaments) at each corner
- Centered at the top, a small ornamental crown or pharmaceutical caduceus-style symbol (simple, line-art only, oxblood red) — small and tasteful
- Headline "PEPTIDES" set in a heavy classic Didone serif (think Bodoni Poster or a Tuscan slab variant), uppercase, deep oxblood-red #8B2A2A, sized so the word spans ~80% of canvas width, occupying the upper-middle of the poster
- Below the headline: a thin oxblood-red double horizontal rule
- A flowing copperplate / engraved-script line beneath: "Available Within" in elegant cursive copperplate, deep oxblood-red, ~60% canvas width centered
- Lower-middle: a small simple line-art vial illustration (apothecary bottle silhouette, oxblood-red outline, no fill) — single illustration, centered
- Bottom: small caps line "✦  EST. RESEARCH PEPTIDES  ·  INQUIRE INSIDE  ✦" in deep oxblood red, tracked out
- Whole poster reads like an old-fashioned chemist's window placard — refined, trustworthy, eye-catching from a distance

NEGATIVE: no modern brand names, no photographs, no people, no logos, no QR codes, no extra ornaments beyond what is specified, no neon, no contemporary type. Pure vintage apothecary engraving aesthetic.`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-B-apothecary" },
  },

  // ── C — Modern Minimal Dispensary ────────────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — for a brick-and-mortar shop announcing peptides are sold there. NOT branded, NO logo, no brand names. Clean modern minimal dispensary / wellness-shop aesthetic — premium, readable from across the street.

LAYOUT — modern minimal:
- Background: warm bright off-white #F8F4EC flat seamless, with a single subtle horizontal light-grain hint
- Upper third: a clean simple line-art icon of a generic peptide vial (slim cylindrical research vial with a flat circular crimp top, simple double-line outline, charcoal #1A1A1A, no fill, sized to ~22% of canvas width, horizontally centered) — minimalist icon, NOT a photograph
- Center: massive headline "Peptides" set in a refined modern serif (think Söhne Mono Variable Display or a clean contemporary serif like Cormorant), MIXED CASE, only the P capitalized, ultra-large, charcoal #1A1A1A, ~80% canvas width centered. Generous tracking.
- Below the headline: a single thin charcoal horizontal hairline rule, ~30% canvas width, centered
- Beneath the rule: smaller caps line "SOLD HERE" tracked out in a clean modern sans-serif, charcoal #1A1A1A, ~30% canvas width
- A wider gap, then bottom kicker: small caps two-line copy block centered:
  Line 1: "RESEARCH-GRADE · IN-STORE PICKUP"
  Line 2: "ASK A TEAM MEMBER FOR DETAILS"
  Both in charcoal #1A1A1A at 75% opacity, refined sans-serif, generously tracked
- Lots of breathing space — minimal, calm, premium, like an upscale wellness boutique or modern dispensary

NEGATIVE: no brand names, no logos, no photographs, no people, no QR codes, no neon, no decorative gradients, no busy backgrounds, no extra text, no chrome, no AI-perfect renders. Clean Aesop / boutique-dispensary aesthetic.`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-C-modern-minimal" },
  },
];

fs.writeFileSync("retail-peptide-posters.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
