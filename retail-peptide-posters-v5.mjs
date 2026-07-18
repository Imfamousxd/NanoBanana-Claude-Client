#!/usr/bin/env node
// Retail posters v5 — A/B/C redo with COLORED backdrops (subtle but cool),
// cream type, and the same generic colored-cap vial set. Three muted backdrops
// so the trio reads as a unified retail set with palette variation.
import fs from "fs";

const VIAL_PALETTE = `5-VIAL ACCENT PALETTE — same five vial cap colors across all three posters in left-to-right order:
  1. Soft lavender #B89BE2
  2. Cornflower blue #7A9BC1
  3. Sage green #9BB389
  4. Warm gold #D6B36A
  5. Muted coral #C97B6E`;

const VIAL_SPEC = `GENERIC VIAL ICONS — clean line-art outline only, slim cylindrical research-vial shape with a small flat circular crimp top, simple double-line body outline in cream #F4F0E6 (since the backdrop is colored). The CAP is rendered as a small solid filled rectangle on top of the body in the accent color. Five vials in the row read left-to-right with the cap colors in palette order. Each vial sized identically, equally spaced. Refined editorial illustration set.`;

const TYPE_SYSTEM = `Type system: clean modern sans-serif with TWO weights — heavy bold for the dominant word, matching thin/light for secondary copy. Cream #F4F0E6 type primary (since backdrop is colored), warm-cream at 70-75% opacity for kickers.`;

const NEGATIVE = `Negative: no brand names, no logos, no specific brand identities, no photographs, no people, no QR codes, no neon, no busy backgrounds, no chrome, no AI-perfect splashes, no levitating products, no vintage flourishes, no Victorian filigree, no arrows, no chevrons, no white/cream backdrop.`;

const jobs = [
  // ── A v5 — Hero typographic on muted sage ────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Editorial typographic hero with a row of colored vials.

LOCKED BACKDROP: a muted DUSTY SAGE GREEN backdrop #7E927A — saturated enough to read as a clear color choice, muted enough to feel premium and refined, NOT a pastel and NOT a neon. Seamless flat color with a very subtle paper-grain texture and gently darkened corners (~#6B7E68). The sage feels grounded, herbal, plant-medicine adjacent — like a high-end dispensary or apothecary brand.

${TYPE_SYSTEM}
${VIAL_PALETTE}

LAYOUT:
- TOP at ~22% from top: small eyebrow "·  AVAILABLE INSIDE  ·" tracked-out caps in cream at 75% opacity, ~30% canvas width centered
- HERO HEADLINE at ~32% from top: "PEPTIDES." in heavy bold sans-serif, ALL CAPS, cream #F4F0E6, ~85% canvas width centered, single line, tightly tracked. The period a solid square dot.
- Beneath at ~46% from top: a thin cream horizontal hairline rule, ~45% canvas width, centered
- "SOLD HERE" in matching THIN/LIGHT weight, ALL CAPS, cream #F4F0E6, ~32% canvas width centered, generously tracked

- VIAL ROW at ~63% from top: row of FIVE generic line-art vials evenly spaced, spanning ~70% of canvas width. ${VIAL_SPEC}

- KICKER at ~82% from top: two-line centered:
  Line 1: "RESEARCH-GRADE PEPTIDES" tracked caps, cream at 70% opacity
  Line 2: "Ask a team member for selection" matching light italic, cream at 60% opacity

- Corner: tiny tracked badge "Nº 01" top-left in cream at 60% opacity; three small horizontal hairline stacks bottom-right in cream at 60%.

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v5-A-sage" },
  },

  // ── B v5 — Vertical spine on warm clay ───────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Editorial composition with a rotated vertical spine wordmark on the left and a colored vial row in the right column.

LOCKED BACKDROP: a muted WARM CLAY / DUSTY TERRACOTTA backdrop #B07F6A — earthy, premium, NOT a pastel, NOT bright orange. Seamless flat color with subtle paper-grain texture and gently darkened corners (~#956A57). Feels grounded, warm, mid-century-modern, refined.

${TYPE_SYSTEM}
${VIAL_PALETTE}

LAYOUT:
- LEFT 25% of canvas: wordmark "PEPTIDES" in heavy bold sans-serif, ALL CAPS, cream #F4F0E6, ROTATED 90° COUNTER-CLOCKWISE reading vertically from bottom to top. Letter-height spans ~75% canvas height. Magazine-spine feel.
- A thin vertical CREAM hairline rule at ~28% from left, running from ~10% to ~90% canvas height, separates spine from right column

- RIGHT 65% of canvas: editorial copy column, left-aligned:
  - Eyebrow at ~18% from top: "AVAILABLE INSIDE" tracked caps, cream at 75% opacity
  - Massive two-line stacked headline in matching THIN/LIGHT weight, MIXED CASE:
    Line 1: "Sold"
    Line 2: "Here."
    Cream #F4F0E6, each line ~50% of right-column width
  - Thin cream horizontal hairline beneath, ~38% canvas width, left-aligned in the right column

- VIAL ROW at ~60% from top inside the right column: row of FIVE generic line-art vials evenly spaced, spanning ~50% of canvas width. ${VIAL_SPEC}

- Below: kicker "RESEARCH-GRADE  ·  ASK A TEAM MEMBER" in tracked caps, cream at 75% opacity, ~40% canvas width left-aligned in the right column

- Lower-right corner: tiny cream solid circle (~10mm) and small numeric tag "N° 02" in tracked caps cream at 65% opacity

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v5-B-clay" },
  },

  // ── C v5 — Inverted panel on dusty teal ──────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Bold inverted-color-block composition.

LOCKED BACKDROP: a muted DUSTY TEAL backdrop #4D6970 — moody, clinical-modern, refined. Seamless flat color with subtle paper-grain texture and gently darkened corners (~#3F575D). NOT bright cyan, NOT navy — muted dusty teal.

INSIDE the central panel, the color is a deep INK CHARCOAL #14191C (a near-black slightly cooler than pure charcoal). Inside that ink panel, cream #F4F0E6 type and cream-outlined vials.

${TYPE_SYSTEM}
${VIAL_PALETTE} — vial CAPS retain these five accent colors INSIDE the ink panel.

LAYOUT:
- Dusty teal #4D6970 backdrop fills the entire canvas with subtle paper-grain texture
- A solid INK CHARCOAL #14191C rectangular panel sits centered, occupying ~75% canvas width and ~70% canvas height — generous teal borders on all four sides (~12% left/right, ~15% top/bottom). Crisp sharp edges, no rounded corners

- INSIDE the ink panel, vertically centered, cream type block:
  - Eyebrow: "·  AVAILABLE INSIDE  ·" tracked caps, cream at 75% opacity, ~30% of panel width
  - Massive headline "PEPTIDES" in heavy bold sans, ALL CAPS, cream #F4F0E6, ~85% of panel width single line tightly tracked
  - Thin cream hairline rule beneath, ~45% of panel width centered
  - "SOLD HERE." in matching THIN/LIGHT weight, ALL CAPS, cream, ~38% of panel width, generously tracked

- VIAL ROW INSIDE the ink panel at ~65% from panel top: row of FIVE generic line-art vials evenly spaced, ~55% of panel width. ${VIAL_SPEC}

- Below the vials inside the panel: two-line kicker centered:
  Line 1: "RESEARCH-GRADE" tracked caps cream at 70% opacity
  Line 2: "Inquire inside for selection" in matching light italic cream at 60%

- OUTSIDE the ink panel, in the teal margins:
  - TOP-LEFT corner: tiny tracked caps "Nº 03" in cream at 65% opacity
  - TOP-RIGHT corner: tiny warm-gold #D6B36A solid circle (~8mm)
  - BOTTOM-LEFT corner: three small horizontal hairline stacks in cream at 60%
  - BOTTOM-RIGHT corner: tiny tracked caps "RETAIL  ·  WALK-IN" in cream at 60%

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v5-C-teal" },
  },
];

fs.writeFileSync("retail-peptide-posters-v5.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
