#!/usr/bin/env node
// Retail posters v3 — push design further while keeping the cream/clean/modern
// theme locked from v2-A. Two new design-forward variants (B + C) that lean
// into bold typographic moves instead of generic icon-and-text layouts.
import fs from "fs";

const SHARED_STYLE = `LOCKED THEME — every detail in this poster matches the clean-cream / modern / Aesop-aligned design language:
- Background: warm cream #F4F0E6 seamless gradient, slightly darker at the corners (~#E9E2D2) for subtle depth, very fine paper-grain texture. NO color blocks, NO neon, NO charcoal background, NO oxblood, NO vintage flourishes.
- Typography palette: charcoal #1A1A1A primary, warm-gray #6B6258 at 75% opacity for kickers.
- Type system: a clean modern sans-serif with TWO weights — a HEAVY bold weight for the dominant word and a MATCHING THIN/LIGHT weight for secondary copy (Söhne Breit Bold / Söhne Light pairing).
- Hairlines: thin warm-charcoal horizontal rules, used sparingly.
- A small warm muted gold #D6B36A may appear as one thin trim element only.`;

const NEGATIVE = `Negative: no brand names, no logos, no specific brand identities, no photographs, no people, no QR codes, no neon, no busy backgrounds, no extra text beyond what is specified, no chrome, no AI-perfect splashes, no levitating products, no vintage flourishes, no charcoal backgrounds, no oxblood red, no Victorian filigree.`;

const jobs = [
  // ── B v3 — Vertical spine wordmark (rotated 90°) ─────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Design-forward editorial composition with a rotated vertical spine wordmark on the left.

${SHARED_STYLE}

LAYOUT:
- LEFT 25% of the canvas: the wordmark "PEPTIDES" set in the heavy bold sans-serif weight, ALL CAPS, charcoal #1A1A1A, ROTATED 90° COUNTER-CLOCKWISE so it reads vertically from BOTTOM to TOP along the left edge of the canvas. The wordmark is HUGE — the height of the letters spans ~75% of the canvas height. Generous letterspacing within the rotated word. Like the spine of a hardcover magazine. This is the dominant visual element.
- A thin vertical charcoal hairline rule at ~28% from left, running from ~10% to ~90% canvas height, separates the rotated spine from the right column.
- RIGHT 65% of the canvas: an editorial copy column anchored to the upper-middle, left-aligned within its column:
  - Eyebrow: "AVAILABLE INSIDE" in tracked-out caps, warm-gray #6B6258 at 75% opacity, top of the right column at ~22% from top.
  - Then a massive two-line stacked headline in the MATCHING THIN/LIGHT weight, MIXED CASE (capitals where shown):
    Line 1: "Sold"
    Line 2: "Here."
    Charcoal #1A1A1A, each line ~50% of right-column width, lines tightly stacked.
  - A thin horizontal charcoal hairline rule beneath the headline, ~35% canvas width, left-aligned in the right column.
  - A small tracked caps kicker: "RESEARCH-GRADE  ·  ASK A TEAM MEMBER" in warm-gray #6B6258 at 75% opacity.
- Lower-right corner: a tiny warm-gold #D6B36A solid circle (~12mm) and a small numeric tag "N° 02" in tracked caps next to it. Very small. Editorial detail.
- Whole composition feels like a premium boutique-magazine spread.

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v3-B-vertical-spine" },
  },

  // ── C v3 — Oversized cropped headline ────────────────────────────────────────
  {
    prompt: `Retail window poster — 2:3 portrait — generic non-branded signage announcing peptides are sold at this shop. Bold typographic composition where the headline is intentionally OVERSIZED and CROPS off the canvas edges.

${SHARED_STYLE}

LAYOUT:
- Massive headline word "PEPTIDES" set in the heavy bold sans-serif weight, ALL CAPS, charcoal #1A1A1A, sized SO LARGE that the first letter "P" and the final letter "S" are partially CROPPED off the LEFT and RIGHT edges of the canvas — only the middle portion of those letters visible at the canvas edges. The word fills the FULL middle vertical band of the canvas (anchored at ~45% from top, vertically centered). Tightly tracked letterforms. This dramatic crop is the design statement — the word is so big it exceeds the canvas frame.
- A thin warm-gold #D6B36A horizontal trim line directly BENEATH the cropped headline, ~60% canvas width, centered. Subtle accent.
- Above the headline at ~25% from top, a small eyebrow line "·  AVAILABLE INSIDE  ·" in tracked caps, charcoal #1A1A1A, ~35% canvas width centered.
- Below the gold trim, "SOLD HERE." set in the MATCHING THIN/LIGHT weight of the same typeface, ALL CAPS, charcoal #1A1A1A, generously tracked, ~45% canvas width centered. The period a solid square dot.
- Lower kicker centered at ~88% from top: "RESEARCH-GRADE PEPTIDES  ·  INQUIRE WITHIN" in tracked warm-gray #6B6258 at 75% opacity.
- Top-left corner detail: a tiny tracked caps badge "Nº 03" in warm-gray at 65% opacity, very small. Bottom-right corner: a matching small ornament — three tiny horizontal stacked hairlines (a Swiss-grid corner mark).
- The whole poster has confident asymmetric energy — massive cropped headline as the hero, refined supporting type, generous breathing room. Like a premium fashion-magazine cover.

${NEGATIVE}`,
    aspectRatio: "2:3",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "retail-peptide-v3-C-cropped-hero" },
  },
];

fs.writeFileSync("retail-peptide-posters-v3.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
