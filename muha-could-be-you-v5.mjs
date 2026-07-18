#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway — aspirational "you could win" energy. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: pure deep black background with atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Styled disclaimer at bottom flanked by gold stars. Same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 2) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // GIVEAWAY" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-34% from top: THREE-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "THE NEXT"
   Line 2: "WINNER"
   Line 3: "COULD BE YOU"
   All three lines the SAME font size and weight — uniform, bold, commanding.

   CRITICAL FONT INSTRUCTION: BIG BOLD GEOMETRIC SANS-SERIF (Poppins / Montserrat family), heavy weight (~800-900), uppercase, clean geometric forms. NOT slab serif. Subtle GRUNGY LETTERPRESS TEXTURE — ink-scatter, micro-texture, soft edge erosion. Warm cream #E8D5A8 with warm-gold glow halo.

5) CINEMATIC HERO ZONE at ~38-72% from top: The red Dodge Challenger driving across a long Miami causeway bridge at night, shot from a dramatic low-angle 3/4 rear view. The Miami downtown skyline glitters in the distance across dark water — towers lit up in warm gold and red. The causeway stretches toward the city with streetlights receding into the distance. Water on both sides of the bridge reflects the city lights in streaks of red, gold, and amber. Overhead the sky is deep navy-black with faint stars. Warm red taillights from the Challenger glow intensely. The whole scene is WIDE, OPEN, ASPIRATIONAL — you're driving toward the life. Atmospheric haze softens the distant skyline.

6) CALLOUT PILL at ~78% from top: a single thin red rounded-rectangle outline pill with soft red glow, spanning ~65% canvas width, containing cream letterpress caps: "BECOME A MEMBER TODAY"

7) BOTTOM (~90% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Negative: do not use slab serif on headline, do NOT make headline lines different sizes, do not include any raffle ticket or card, do not include any QR code, do not lighten the background, do not warp the MM logo, do not show any faces, no extra logos, no palm trees in this scene (use the causeway/skyline instead).`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, MM_LOGO],
    _meta: { name: "muha-could-be-you-v5" },
  },
];

fs.writeFileSync("muha-could-be-you-v5.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
