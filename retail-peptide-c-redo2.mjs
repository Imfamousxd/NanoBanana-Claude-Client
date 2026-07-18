#!/usr/bin/env node
// Retail poster C — redo #2. Different direction: a bold inverted charcoal
// panel sitting inside a generous cream margin. Charcoal block with cream
// type inside, cream borders + tiny editorial corner marks outside. Refined
// gallery-poster aesthetic, distinct from A's edge-to-edge type and B's
// vertical spine.
import fs from "fs";

const jobs = [
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Bold inverted-color-block composition.

LOCKED THEME — clean cream / modern / Aesop-aligned design language:
- Outer background: warm cream #F4F0E6 seamless, with a fine paper-grain texture
- Inverted color block uses charcoal #1A1A1A with cream type inside
- Type system: a clean modern sans-serif with TWO weights — heavy bold + matching thin (Söhne Breit / Söhne Light pairing)
- One small warm muted gold #D6B36A accent allowed

LAYOUT:
- Cream backdrop fills the entire canvas with a fine paper-grain texture and slightly darker corners (~#E9E2D2)
- A SOLID CHARCOAL #1A1A1A rectangular panel sits centered on the canvas, occupying ~75% of canvas width and ~70% of canvas height — leaving generous cream borders on all four sides (margin roughly 12% on left and right, 15% on top and bottom). Crisp sharp edges, NO rounded corners, NO drop shadow, NO outline — just a flat solid charcoal rectangle. This dark panel is the hero visual.
- INSIDE the charcoal panel, vertically centered and horizontally centered, a stacked type block in CREAM #F4F0E6:
  - Eyebrow: "·  AVAILABLE INSIDE  ·" tracked-out caps, cream at 75% opacity, ~30% of panel width, top
  - Massive headline "PEPTIDES" in the heavy bold sans-serif weight, ALL CAPS, cream #F4F0E6, spanning ~85% of the panel width, single line, tightly tracked. Dominant.
  - A thin cream horizontal hairline rule directly beneath the headline, ~45% of panel width, centered
  - Beneath the rule: "SOLD HERE." in the MATCHING THIN/LIGHT weight, ALL CAPS, cream #F4F0E6, ~38% of panel width, generously tracked. The period a solid square dot.
  - Below this, a small two-line kicker centered:
    Line 1: "RESEARCH-GRADE" in tracked caps cream at 70% opacity
    Line 2: "Inquire inside for selection" in light italic accent in matching cream at 60% opacity

- OUTSIDE the charcoal panel, in the cream margins:
  - TOP-LEFT corner of the cream border: tiny tracked caps "Nº 03" in charcoal #1A1A1A at 65% opacity, very small
  - TOP-RIGHT corner: a tiny warm-gold #D6B36A solid circle (~8mm), a single accent
  - BOTTOM-LEFT corner: three small horizontal hairline stacks (a Swiss-grid corner mark) in charcoal at 60% opacity
  - BOTTOM-RIGHT corner: matching tiny tracked caps "RETAIL  ·  WALK-IN" in charcoal at 60% opacity

Whole poster reads bold gallery / museum exhibit poster — confident dark block of type framed by generous cream breathing room, refined corner detailing. Distinct from edge-to-edge typographic posters by virtue of the inverted color block.

Negative: no brand names, no logos, no specific brand identities, no photographs, no people, no QR codes, no neon, no busy backgrounds, no extra text beyond what is specified, no chrome, no AI-perfect renders, no vintage flourishes, no oxblood red, no arrows, no chevrons, no vial illustrations.`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v3-C-inverted-panel" },
  },
];

fs.writeFileSync("retail-peptide-c-redo2.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
