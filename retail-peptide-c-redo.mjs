#!/usr/bin/env node
// Retail poster — C redo. New direction: a bold geometric wayfinding arrow
// as the hero visual hook, with minimal refined type. Cream/clean theme.
import fs from "fs";

const SHARED_STYLE = `LOCKED THEME — every detail matches the clean-cream / modern / Aesop-aligned design language:
- Background: warm cream #F4F0E6 seamless gradient, slightly darker corners (~#E9E2D2), fine paper-grain texture.
- Type: charcoal #1A1A1A primary, warm-gray #6B6258 75% opacity for kickers.
- Two-weight modern sans-serif system (heavy bold + matching thin).
- Hairlines: thin warm-charcoal horizontal rules used sparingly.
- A small warm muted gold #D6B36A may appear as ONE thin trim element only.`;

const jobs = [
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Bold graphic composition built around a wayfinding arrow as the hero visual hook.

${SHARED_STYLE}

LAYOUT:
- Upper third — refined type stack centered horizontally:
  - Eyebrow: "·  RESEARCH-GRADE  ·" tracked-out caps, charcoal #1A1A1A, ~25% canvas width, top at ~10% from top
  - Massive headline "PEPTIDES" in the heavy bold sans-serif weight, ALL CAPS, charcoal #1A1A1A, ~85% canvas width centered, single line, tightly tracked. The dominant typographic statement.
  - Thin charcoal horizontal hairline rule directly beneath, ~40% canvas width centered.
  - Beneath the hairline: "INSIDE" in the MATCHING THIN/LIGHT weight, ALL CAPS, charcoal, ~32% canvas width, generously tracked.

- MIDDLE-LOWER half of the canvas: a MASSIVE thick downward-pointing CHEVRON ARROW as the central graphic element. Pure geometric shape — equilateral chevron pointing straight DOWN ↓ — outline-only with a thick charcoal #1A1A1A stroke (~14pt at print scale), no fill. The arrow spans ~50% of canvas width and is vertically centered in the lower half at roughly 60% from top to 88% from top. Crisp clean geometry, modernist signage-style.

- A small warm-gold #D6B36A solid circle (~10mm) sits exactly at the TIP of the chevron arrow (centered horizontally, near the arrow's lowest point) — a single tasteful accent dot indicating the destination.

- Bottom 8% of the canvas: a small two-word kicker centered: "ASK INSIDE" in tracked-out caps, warm-gray #6B6258 at 75% opacity.

- Corner details: tiny tracked badge "Nº 03" top-left in warm-gray at 60% opacity; matching set of three small hairline stacks bottom-right.

The poster reads bold, functional, wayfinding-style — a giant arrow telling passersby exactly what's inside. Refined modernist signage, like a Swiss museum poster or a clean dispensary window.

Negative: no brand names, no logos, no specific brand identities, no photographs, no people, no QR codes, no neon, no busy backgrounds, no extra text beyond what is specified, no chrome, no AI-perfect renders, no vintage flourishes, no charcoal backgrounds, no oxblood red, no extra ornaments, no second arrow.`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v3-C-arrow" },
  },
];

fs.writeFileSync("retail-peptide-c-redo.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
