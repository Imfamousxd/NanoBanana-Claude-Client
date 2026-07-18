#!/usr/bin/env node
// Retail posters v6 — same approved cream layouts (A hero typographic, B
// vertical spine, C inverted panel) but with SUBTLE BLURRED COLOR BLOOMS
// scattered across the cream backdrop. Cream stays as the base.
import fs from "fs";

const BLOOM_SPEC = `BACKDROP TREATMENT — keep the base color warm cream #F4F0E6 with fine paper-grain texture. ADD subtle blurred colored bloom spots scattered across the cream:
- A soft lavender #B89BE2 bloom in the UPPER-LEFT quadrant, heavily Gaussian-blurred (radius ~25% canvas height), at ~15% opacity — feels like soft ambient light through tinted glass
- A muted coral #C97B6E bloom in the LOWER-RIGHT quadrant, same heavy blur, at ~12% opacity
- A small warm gold #D6B36A bloom near the UPPER-RIGHT corner, slightly smaller and tighter (radius ~15% canvas height), at ~10% opacity
- A faint sage green #9BB389 bloom in the LOWER-LEFT, ~12% opacity, very soft
The blooms feel like out-of-focus colored stage lights or a watercolor wash — atmospheric, NOT visible color blocks. The cream backdrop must clearly read as the dominant base color, with the blooms only as subtle ambient color hints. The typography and vials sit on top with full contrast unaffected.`;

const VIAL_PALETTE = `5-VIAL ACCENT PALETTE — left-to-right cap colors:
  1. Soft lavender #B89BE2
  2. Cornflower blue #7A9BC1
  3. Sage green #9BB389
  4. Warm gold #D6B36A
  5. Muted coral #C97B6E`;

const VIAL_SPEC = `GENERIC VIAL ICONS — clean line-art outline only, slim cylindrical research-vial body in charcoal #1A1A1A double-line outline, small flat circular crimp top, the CAP rendered as a small solid filled rectangle in the accent color. Five vials in a row, identical sizing, equal spacing. Refined editorial illustration set.`;

const TYPE_SYSTEM = `Type system: clean modern sans-serif with TWO weights — heavy bold for the dominant word, matching thin/light for secondary copy. Charcoal #1A1A1A primary type, warm-gray #6B6258 at 75% opacity for kickers.`;

const NEGATIVE = `Negative: no brand names, no logos, no specific brand identities, no photographs, no people, no QR codes, no neon, no busy backgrounds, no chrome, no AI-perfect splashes, no levitating products, no vintage flourishes, no Victorian filigree, no arrows, no chevrons, NO full color backdrop (the cream must still clearly be the dominant base color), no hard-edged color blocks, no flat color shapes — the blooms must be very soft and blurred only.`;

const jobs = [
  // ── A v6 — Hero typographic with cream + blooms ──────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Editorial typographic hero with subtle colored blooms in the backdrop.

${BLOOM_SPEC}
${TYPE_SYSTEM}
${VIAL_PALETTE}

LAYOUT:
- Eyebrow at ~22% from top: "·  AVAILABLE INSIDE  ·" tracked-out caps, charcoal #1A1A1A, ~30% canvas width centered
- HERO HEADLINE at ~32% from top: "PEPTIDES." in heavy bold sans-serif, ALL CAPS, charcoal #1A1A1A, ~85% canvas width centered, single line, tightly tracked, period a solid square dot
- Thin charcoal horizontal hairline beneath, ~45% canvas width centered
- "SOLD HERE" in the SAME HEAVY BOLD weight as the "PEPTIDES." headline above, ALL CAPS, charcoal #1A1A1A, ~38% canvas width centered, generously tracked. Bold weight matched to the hero headline.

- VIAL ROW at ~63% from top: FIVE generic line-art vials evenly spaced, spanning ~70% of canvas width. ${VIAL_SPEC}

- Two-line kicker at ~82% from top:
  Line 1: "RESEARCH-GRADE PEPTIDES" tracked caps, warm-gray #6B6258 at 75% opacity
  Line 2: "Ask a team member for selection" matching thin italic, warm-gray

- Tiny tracked badge "Nº 01" top-left in charcoal at 60% opacity; three small horizontal hairline stacks bottom-right in charcoal at 60%

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v6-A-bloom-boldsold" },
  },

  // ── B v6 — Vertical spine + blooms ───────────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Rotated vertical spine wordmark on the left, editorial right column, subtle colored blooms in the backdrop.

${BLOOM_SPEC}
${TYPE_SYSTEM}
${VIAL_PALETTE}

LAYOUT:
- LEFT 25%: wordmark "PEPTIDES" in heavy bold sans, ALL CAPS, charcoal #1A1A1A, ROTATED 90° COUNTER-CLOCKWISE reading vertically bottom-to-top. Letter-height ~75% canvas height. Magazine spine.
- Thin vertical CHARCOAL hairline rule at ~28% from left, running from ~10% to ~90% canvas height

- RIGHT 65%: editorial copy column, left-aligned:
  - Eyebrow at ~18% from top: "AVAILABLE INSIDE" tracked caps, warm-gray at 75% opacity
  - Massive two-line stacked headline in HEAVY BOLD weight, MIXED CASE:
    Line 1: "Sold"
    Line 2: "Here."
    Charcoal #1A1A1A, each line ~55% of right-column width, bold weight matched to the rotated spine wordmark
  - Thin charcoal hairline beneath, ~38% canvas width, left-aligned in the right column

- VIAL ROW at ~60% from top inside the right column: FIVE generic line-art vials evenly spaced, spanning ~50% of canvas width. ${VIAL_SPEC}

- Kicker "RESEARCH-GRADE  ·  ASK A TEAM MEMBER" in tracked caps, warm-gray at 75% opacity

- Lower-right corner: tiny warm-gold #D6B36A solid circle (~10mm) + small "N° 02" in tracked caps charcoal at 65%

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v6-B-bloom-boldsold" },
  },

  // ── C v6 — Inverted charcoal panel + blooms in cream margins ─────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Bold inverted-color-block with subtle colored blooms in the cream margins around the dark panel.

${BLOOM_SPEC} — the colored blooms appear ONLY in the cream BORDER margins around the centered charcoal panel. The blooms do NOT extend onto or behind the charcoal panel.

${TYPE_SYSTEM}
${VIAL_PALETTE} — vial CAPS retain the accent colors INSIDE the charcoal panel.

LAYOUT:
- Cream backdrop with the soft colored blooms scattered in the four cream-margin areas around the panel
- Solid CHARCOAL #1A1A1A rectangular panel centered, ~75% canvas width × ~70% canvas height, generous cream margins (~12% left/right, ~15% top/bottom). Crisp sharp edges, no rounded corners, no shadow

- INSIDE the charcoal panel, vertically centered, cream type:
  - Eyebrow: "·  AVAILABLE INSIDE  ·" tracked caps, cream at 75% opacity, ~30% panel width
  - Massive headline "PEPTIDES" in heavy bold sans, ALL CAPS, cream #F4F0E6, ~85% panel width, single line tightly tracked
  - Thin cream hairline beneath, ~45% panel width centered
  - "SOLD HERE." in the SAME HEAVY BOLD weight as the "PEPTIDES" headline above, ALL CAPS, cream #F4F0E6, ~42% panel width generously tracked. Bold weight matched to the hero headline.

- VIAL ROW inside the panel at ~65% from panel top: FIVE line-art vials evenly spaced, ~55% of panel width. Vial body outlines in CREAM (inverted), caps in accent colors. Same five-color palette.

- Below vials inside panel: two-line kicker:
  Line 1: "RESEARCH-GRADE" tracked caps cream at 70% opacity
  Line 2: "Inquire inside for selection" matching cream italic at 60%

- In the cream MARGINS outside the panel:
  - TOP-LEFT corner: tiny "Nº 03" tracked caps charcoal at 65% opacity
  - TOP-RIGHT corner: tiny warm-gold #D6B36A solid circle (~8mm)
  - BOTTOM-LEFT: three small hairline stacks (Swiss-grid mark) in charcoal at 60%
  - BOTTOM-RIGHT: tiny "RETAIL  ·  WALK-IN" tracked caps charcoal at 60%

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v6-C-bloom-boldsold" },
  },
];

fs.writeFileSync("retail-peptide-posters-v6.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
