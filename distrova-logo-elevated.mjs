#!/usr/bin/env node
import fs from "fs";

// Round 2 — ELEVATED. Round 1 read as generic-startup / free-logo-generator.
// Goal now: designer-grade, custom-drawn letterforms, a real concept, more
// attitude. Still modern/clean/non-cannabis, but crafted — not template.
const STUDIO = `This must look like it was crafted by a world-class brand studio (Pentagram / Collins / DesignStudio caliber) — award-winning, distinctive, ownable, NOT a generic template or free logo-maker output. Custom-drawn letterforms (not a default off-the-shelf font), precise optical spacing, confident craft. Pure white #FFFFFF background, single centered composition, generous whitespace, NO cannabis or leaf imagery, no clip-art, no drop shadows.`;

const CONCEPTS = [
  {
    name: "monoline-ligature",
    desc: "Concept A — Monoline ligature logotype",
    prompt: `Distrova — "Monoline Ligature" logo. A premium lowercase custom logotype reading "distrova".

Custom monoline geometric letterforms of perfectly even hairline-to-medium weight. The key idea: the letters "t" and "r" are joined by one elegant continuous stroke, and the crossbar of the "t" extends rightward into a subtle tapered arrow / route line that glides toward the end of the word — a quiet signal of movement and delivery built into the type itself. Tight, refined optical kerning. Solid near-black ink #111111. Editorial, fashion-tech, high-craft. No separate icon. ${STUDIO}`,
  },
  {
    name: "ribbon-d",
    desc: "Concept B — Folded ribbon D monogram",
    prompt: `Distrova — "Ribbon D" logo. The mark is a single capital "D" constructed from one continuous folded paper ribbon that bends and overlaps on itself, the folds implying a delivery route folding toward a destination. Rendered FLAT in two tones — solid black #0A0A0A for the front faces and a single mid-gray #9A9A9A for the folded/under faces — to give crisp geometric dimension WITHOUT any gradient. Dynamic, architectural, distinctive. Below it, the wordmark "Distrova" in a custom medium-weight geometric sans, solid black, tightly and optically spaced. ${STUDIO}`,
  },
  {
    name: "luxury-serif",
    desc: "Concept C — Luxury high-contrast serif",
    prompt: `Distrova — "Luxe Serif" logo. The entire logo is the wordmark "DISTROVA" set in ALL CAPS in an elegant contemporary high-contrast serif (modern Didone — dramatic thick/thin stroke contrast, fine hairline serifs), generously letter-spaced like a luxury fashion house or premium concierge service. One ownable detail: the apex/leg of the "V" is sharpened slightly longer to subtly suggest forward motion. Solid black on white, supremely confident and minimal, unexpected and upscale for a delivery brand. No icon. ${STUDIO}`,
  },
  {
    name: "negative-space-squircle",
    desc: "Concept D — Negative-space courier squircle",
    prompt: `Distrova — "Negative Space" logo. The mark is one confident solid black rounded-square (squircle) tile. Cut into it with crisp white negative space is a single clever glyph that reads simultaneously as a stylized "D" AND, in its inner whitespace, as a forward-tilted paper plane / courier arrow caught mid-flight. Smart, subtle, dual-meaning — rewarding a second look, not literal. App-icon ready. Below, the wordmark "Distrova" in a custom geometric sans, solid black, optically spaced. ${STUDIO}`,
  },
  {
    name: "comet-nova",
    desc: "Concept E — Comet / nova streak",
    prompt: `Distrova — "Comet Nova" logo. The mark is an elegant abstract comet: a clean solid disc with a long tapered curved motion streak arcing behind it, the streak thinning to a fine point — evoking both the "nova" in the name and speed/delivery in motion. Asymmetric, dynamic, drawn with refined tapered geometry and crisp edges. Solid black #0A0A0A. Below, the wordmark "Distrova" in a sleek custom geometric sans, optically spaced. Premium, kinetic, distinctive. ${STUDIO}`,
  },
  {
    name: "gradient-mark",
    desc: "Concept F — Modern duotone gradient mark",
    prompt: `Distrova — "Gradient" logo. A contemporary tech-brand mark: a single bold abstract glyph that fuses a "D" with an upward-forward motion swoosh, rendered as ONE smooth premium gradient flowing from deep indigo #4F2BD9 into vivid violet-magenta #B33BE0 — clean, vibrant, dimensional but flat-vector (no photographic shading). Modern, energetic, app-icon ready. Below, the wordmark "Distrova" in a clean custom geometric sans in solid near-black #15151A, optically spaced. The mark is the only colored element. ${STUDIO}`,
  },
];

const jobs = CONCEPTS.map((c) => ({
  prompt: c.prompt,
  aspectRatio: "1:1",
  imageSize: "4K",
  refImages: [],
  _meta: { name: c.name, desc: c.desc },
}));

fs.writeFileSync("distrova-logo-elevated.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} concept jobs`);
