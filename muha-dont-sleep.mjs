#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway — FOMO / urgency energy with a street-culture edge. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: pure deep black background with a red-tinted nighttime Miami / Vice City skyline + dark palm tree silhouettes + neon red glow, atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Styled disclaimer at bottom flanked by gold stars. Same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 3) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // GIVEAWAY" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-32% from top: TWO-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "DON'T"
   Line 2: "SLEEP"
   Both lines the SAME font size and weight — uniform, bold, commanding.

   CRITICAL FONT INSTRUCTION: The headline uses a BIG BOLD GEOMETRIC SANS-SERIF typeface in the Poppins / Montserrat / Inter Display family — heavy bold weight (~800-900), uppercase, clean modern geometric forms with circular round letterforms. NOT a slab serif, NOT a traditional letterpress display face. The letters have a subtle GRUNGY LETTERPRESS TEXTURE applied — ink-scatter, micro-texture, soft edge erosion, faint scratches/grit within the letterforms. Color is warm cream #E8D5A8 with a warm-gold glow halo.

5) SUB-INSTRUCTION at ~35% from top: one line of cream tracked-out caps reading "THE GIVEAWAY WON'T LAST FOREVER" — small but readable, letterpress texture, warm gold tint.

6) HERO ZONE at ~40-72% from top: The red Dodge Challenger from reference 2 parked in a dark Vice City alleyway at night, headlights ON, twin beams cutting through dense atmospheric fog/haze. The car faces slightly toward the viewer in a dramatic 3/4 angle. Wet pavement reflects the red headlights and neon glow. Dark palm trees and Miami skyline silhouettes frame the background. Red and amber neon signage glows faintly on alley walls. The mood is cinematic, moody, and urgent — like the car is waiting for someone to claim it. The GTA Muha card (reference 2) floats at a slight angle in the lower portion of the hero zone, overlapping the bottom of the Challenger scene, with a soft red glow behind it.

7) CALLOUT PILL at ~78% from top: a single thin red rounded-rectangle outline pill with soft red glow, spanning ~65% canvas width, containing cream letterpress caps: "BECOME A MEMBER TODAY"

8) BOTTOM (~90% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Style: same GTA Vice City key-art cinematic vibe, same color palette (deep black + red Miami glow + cream/gold typography), same dark moody atmosphere. The OTHER text elements (eyebrow, pill, disclaimer) keep the cream letterpress slab texture — ONLY the main headline uses the geometric sans-serif with grunge texture.

Negative: do not use slab serif or traditional letterpress display font on the main headline (geometric sans-serif ONLY), do NOT make headline lines different sizes (both SAME SIZE), do not lighten the background, do not omit the red Miami glow / palm silhouettes, do not warp the MM logo, do not omit the gold stars, do not show any faces, no extra logos, no QR codes.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, CARD, MM_LOGO],
    _meta: { name: "muha-dont-sleep" },
  },
];

fs.writeFileSync("muha-dont-sleep.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
