#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for Muha Members — FOMO / urgency energy with a street-culture edge. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: deep dark background with atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Styled disclaimer at bottom flanked by gold stars. Same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 2) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // EXCLUSIVE" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-32% from top: TWO-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "DON'T"
   Line 2: "SLEEP"
   Both lines the SAME font size and weight.

   CRITICAL FONT INSTRUCTION: BIG BOLD GEOMETRIC SANS-SERIF (Poppins / Montserrat family), heavy weight (~800-900), uppercase, clean geometric forms. NOT slab serif. Subtle GRUNGY LETTERPRESS TEXTURE — ink-scatter, micro-texture, soft edge erosion. Warm cream #E8D5A8 with warm-gold glow halo.

5) SUB-INSTRUCTION at ~35% from top: one line of cream tracked-out caps reading "THIS WON'T LAST FOREVER" — small but readable, letterpress texture, warm gold tint.

6) HERO ZONE at ~40-72% from top: The red Dodge Challenger parked inside a dark underground PARKING GARAGE, shot from a cinematic low angle. Raw concrete pillars frame the car on both sides. A single overhead fluorescent light casts a harsh warm-red pool of light directly on the car, the rest of the garage falling off into deep shadow. The concrete floor is slightly wet and reflective, catching red light from the car and the overhead lamp. Faint red neon light bleeds in from a garage entrance in the far background. The mood is UNDERGROUND, GRITTY, CLAUSTROPHOBIC — completely different from an open street scene. Industrial, raw, urgent.

7) CALLOUT PILL at ~78% from top: a single thin red rounded-rectangle outline pill with soft red glow, spanning ~65% canvas width, containing cream letterpress caps: "BECOME A MEMBER TODAY"

8) BOTTOM (~90% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Negative: do not use slab serif on headline, do NOT make headline lines different sizes, do not include any raffle ticket or card, do not include any QR code, do not lighten the background, do not warp the MM logo, do not show any faces, no extra logos, no palm trees, no open street scene, do not use the word GIVEAWAY or WIN or WINNER anywhere in the image.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, MM_LOGO],
    _meta: { name: "muha-dont-sleep-v4" },
  },
];

fs.writeFileSync("muha-dont-sleep-v4.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
