#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram 4:5 portrait promo graphic for Muha Members — exclusivity / VIP energy. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: deep dark background with atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Same dark moody atmosphere, same star ornaments, same divider lines.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 2) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // EXCLUSIVE" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~18-30% from top: TWO-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "MEMBERS"
   Line 2: "ONLY"
   Both lines the SAME font size and weight — uniform, bold, commanding.

   CRITICAL FONT INSTRUCTION: BIG BOLD GEOMETRIC SANS-SERIF (Poppins / Montserrat family), heavy weight (~800-900), uppercase, clean geometric forms. NOT slab serif. Subtle GRUNGY LETTERPRESS TEXTURE — ink-scatter, micro-texture, soft edge erosion. Warm cream #E8D5A8 with warm-gold glow halo.

5) HERO ZONE at ~32-100% from top, filling the entire remaining vertical space: The red Dodge Challenger facing DEAD HEAD-ON toward the viewer — straight-on frontal view, perfectly symmetrical. The headlights are blazing bright, two intense white-red beams cutting through darkness and atmospheric haze/fog. The headlights are the PRIMARY light source in the scene — everything else falls off into deep darkness. The background behind and around the car is extremely dark, nearly black, with only a subtle dark red tint/wash to the atmosphere — no visible buildings, no skyline, no details, just dark void with a faint red ambient glow. Wet ground beneath the car reflects the headlight beams. Thin wisps of fog/haze drift across the headlight beams. The car emerges from the darkness like a beast — menacing, powerful, head-on. NO side angle, NO 3/4 view — perfectly FRONTAL. The hero scene runs to the bottom edge of the canvas with no text or pills beneath it.

NO sub-instruction, NO callout pill, NO disclaimer, NO text of any kind below the main headline. The bottom of the image is just the cinematic hero scene running to the canvas edge.

Negative: do not use slab serif on headline, do NOT make headline lines different sizes, do not include any raffle ticket or card, do not include any QR code, do not warp the MM logo, do not show any faces, no extra logos, no callout pills, no disclaimer text, no sub-instruction text, no "BECOME A MEMBER" text, do not use the word GIVEAWAY or WIN or WINNER anywhere, do NOT show the car at an angle (FRONTAL HEAD-ON ONLY).`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "4:5",
    imageSize: "4K",
    refImages: [STYLE_REF, MM_LOGO],
    _meta: { name: "muha-members-only-v3-45" },
  },
];

fs.writeFileSync("muha-members-only-v3-45.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
