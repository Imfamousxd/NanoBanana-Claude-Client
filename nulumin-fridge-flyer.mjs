#!/usr/bin/env node
// NuLumin Bio-Sciences "Popular Stacks" 5x7 flyer / fridge-top sticker.
// 5 simple, clean, brand-forward layout variations.
// gpt-image-2, 3:4 AR (closest available to true 5:7 = 0.714 -> 3:4 = 0.750),
// 4K quality (2160x2880, max res for 3:4). Logo passed as fidelity ref.
import fs from "fs";

const LOGO_BLACK = "NuLumin Assets/NuLumin-logo-nobg-black.png";
const LOGO_WHITE = "NuLumin Assets/NuLumin-logo-nobg-white.png";

// ── Brand constants (locked) ────────────────────────────────────────────────
const BRAND = `NuLumin Bio-Sciences — clinical-modern research-peptide brand (Aesop x Apple x premium biotech). Palette drawn ONLY from the signature 5-segment spectrum band: lavender purple #B89BE2, cornflower blue #6FA5DD, mint green #5DBD84, warm gold #F2B856, coral #E68B9A; wordmark black #1A1A1A; cream #F4F0E6 / clinical white #FFFFFF. Mood: refined, clinical, premium — NOT energy-drink, NOT cosmic, NOT busy.`;

const LOGO_RULE = `Reproduce the supplied NuLumin Bio-Sciences logo (reference image) FAITHFULLY and crisply — the bold "Nu" + thin-weight "Lumin" wordmark, the thin horizontal divider, the tracked-out "BIO-SCIENCES" tagline, and the vertical 5-segment rounded spectrum band (purple, blue, green, gold, coral top-to-bottom). Do not redraw, restyle, recolor or warp it.`;

// The 5 popular stacks, each tied to one spectrum color (real NuLumin SKUs)
const STACKS = `Exactly FIVE popular peptide stacks, each labelled with a spectrum color accent, spelled EXACTLY as written:
1. "RECOVERY"  —  BPC-157 + TB-500       (mint green #5DBD84)
2. "VITALITY"  —  CJC-1295 + Ipamorelin  (cornflower blue #6FA5DD)
3. "LONGEVITY" —  Epithalon + NAD+        (lavender purple #B89BE2)
4. "LEAN"      —  GLP-1 + AOD-9604         (warm gold #F2B856)
5. "FOCUS"     —  Semax + Selank           (coral #E68B9A)`;

const QUALITY = `Design a SIMPLE, clean, premium print-ready flyer that doubles as a fridge-top sticker — minimal, lots of negative space, strong hierarchy, generous margins, perfectly legible. Flat vector / editorial graphic design (NOT a photo, no 3D, no mockup, no drop-shadowed paper). CRITICAL: all text must be crisp, correctly spelled and unwarped — real readable letterforms, absolutely no gibberish, no garbled or doubled text, no extra letters. Portrait 5:7 proportions.`;

const VARIATIONS = [
  {
    name: "v1-clinical-white-menu",
    logo: LOGO_BLACK,
    prompt: `Clean clinical WHITE-background flyer, portrait 5:7.

${LOGO_RULE} Place the full logo lockup centered near the top.

Beneath it, a small tracked-out header in black: "POPULAR STACKS". Then the five stacks as a tidy vertical menu — each row is: a small rounded color chip (its spectrum color) at the left, the STACK NAME in bold black uppercase, and the two peptides in a lighter grey beneath the name. Thin hairline rules separate the rows. Lots of clean whitespace. A tiny footer in grey: "RESEARCH PEPTIDES · NULUMIN BIO-SCIENCES".

${STACKS}

${BRAND}
${QUALITY}`,
  },
  {
    name: "v2-warm-cream-apothecary",
    logo: LOGO_BLACK,
    prompt: `Warm CREAM (#F4F0E6) background flyer, refined apothecary feel, portrait 5:7.

${LOGO_RULE} Logo lockup at top-left, with the spectrum band echoed slightly larger as a quiet motif.

A small serif-free header: "POPULAR STACKS". The five stacks as an elegant numbered menu (01–05) with hairline rules between them: the index number, the STACK NAME in confident black caps, the peptides in muted ink beneath, and a short spectrum-colored tick at the right edge of each row matching that stack's color. Sophisticated, airy, lots of margin. Tiny black footer: "RESEARCH PEPTIDES".

${STACKS}

${BRAND}
${QUALITY}`,
  },
  {
    name: "v3-spectrum-header-block",
    logo: LOGO_WHITE,
    prompt: `Portrait 5:7 flyer with a bold SPECTRUM HEADER block.

Top ~30% of the flyer is a full-width horizontal band of the five brand colors blending smoothly left-to-right (purple → blue → green → gold → coral). Over that band, in WHITE: ${LOGO_RULE} the logo lockup (white version) on the left, and the words "POPULAR STACKS" on the right.

Lower ~70% is clean white. The five stacks in a calm vertical list — each row: a solid round color dot (its spectrum color) + STACK NAME in bold black caps + the two peptides in grey beneath. Even spacing, airy. Tiny grey footer: "RESEARCH PEPTIDES · NULUMIN BIO-SCIENCES".

${STACKS}

${BRAND}
${QUALITY}`,
  },
  {
    name: "v4-dark-clinical-luxe",
    logo: LOGO_WHITE,
    prompt: `Premium DARK flyer on near-black charcoal (#141414), portrait 5:7 — designed to pop as a sticker on a white fridge.

${LOGO_RULE} The WHITE logo lockup centered near the top; the spectrum band reads vividly against the dark.

Small tracked-out off-white header: "POPULAR STACKS". The five stacks listed below, each with a short vertical accent bar in its spectrum color on the left, the STACK NAME in bold WHITE caps, and the peptides in soft grey beneath. High-contrast, luxe, minimal, lots of dark negative space. Tiny grey footer: "RESEARCH PEPTIDES".

${STACKS}

${BRAND}
${QUALITY}`,
  },
  {
    name: "v5-vertical-spectrum-rail",
    logo: LOGO_BLACK,
    prompt: `Editorial WHITE flyer with a tall VERTICAL SPECTRUM RAIL, portrait 5:7.

Down the full LEFT edge runs the signature 5-segment spectrum band scaled tall as the hero device — five stacked rounded segments: purple, blue, green, gold, coral (top to bottom), each segment occupying one fifth of the height.

To the RIGHT of the rail, the five stacks are stacked so each one aligns horizontally with its matching color segment — purple row = LONGEVITY, blue row = VITALITY, green row = RECOVERY, gold row = LEAN, coral row = FOCUS — each showing the STACK NAME in bold black caps and the two peptides in grey beneath. ${LOGO_RULE} Place the logo lockup small in the top-right. Clean, confident, lots of whitespace. Tiny grey footer bottom-right: "RESEARCH PEPTIDES".

${STACKS}

${BRAND}
${QUALITY}`,
  },
];

const jobs = VARIATIONS.map((v) => ({
  prompt: v.prompt,
  aspectRatio: "3:4",   // closest gpt-image-2 ratio to 5:7
  imageSize: "4K",       // high quality -> 2160x2880 (max res for 3:4)
  refImages: [v.logo],
  _meta: { name: v.name },
}));

fs.writeFileSync("nulumin-fridge-flyer.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} NuLumin flyer jobs (3:4 / 4K) -> run through gpt-image.mjs --batch`);
