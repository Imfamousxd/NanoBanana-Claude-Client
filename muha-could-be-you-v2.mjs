#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway — aspirational "you could win" energy. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: pure deep black background with a red-tinted nighttime Miami / Vice City skyline + dark palm tree silhouettes + neon red glow, atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Styled disclaimer at bottom flanked by gold stars. Same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 3) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // GIVEAWAY" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-32% from top: THREE-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "THE NEXT"
   Line 2: "WINNER"
   Line 3: "COULD BE YOU"

   CRITICAL FONT INSTRUCTION: The headline uses a BIG BOLD GEOMETRIC SANS-SERIF typeface in the Poppins / Montserrat / Inter Display family — heavy bold weight (~800-900), uppercase, clean modern geometric forms with circular round letterforms. NOT a slab serif, NOT a traditional letterpress display face. The letters have a subtle GRUNGY LETTERPRESS TEXTURE applied — ink-scatter, micro-texture, soft edge erosion, faint scratches/grit within the letterforms, as if printed on a slightly rough surface. Color is warm cream #E8D5A8 with a warm-gold glow halo. "WINNER" is the largest word — big, dramatic, dominant. "THE NEXT" slightly smaller above, "COULD BE YOU" slightly smaller below.

5) CINEMATIC HERO ZONE at ~38-70% from top: A dramatic, atmospheric scene — a pair of car keys with a Dodge keychain dangling in the foreground, slightly out of focus, held by a shadowy hand. Behind the keys, the red Dodge Challenger from the GTA Muha card (reference 2) sits bathed in red neon glow on a wet Miami night street, palm trees overhead, atmospheric haze and city lights in the distance. The whole scene feels like a Vice City cinematic cutscene — moody, aspirational, dripping with lifestyle energy. Warm red and gold light reflections on the wet pavement. The car is angled 3/4 view, hero-lit from the left.

6) CALLOUT PILL at ~76% from top: a single thin red rounded-rectangle outline pill with soft red glow, spanning ~65% canvas width, containing cream letterpress caps: "BECOME A MEMBER TODAY"

7) BOTTOM (~90% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Style: same GTA Vice City key-art cinematic vibe, same color palette (deep black + red Miami glow + cream/gold typography), same dark moody atmosphere. The hero zone should feel like a MOVIE POSTER moment — aspirational, cinematic, dramatic lighting. The OTHER text elements (eyebrow, pill, disclaimer) keep the cream letterpress slab texture — ONLY the main headline uses the geometric sans-serif with grunge texture.

Negative: do not use slab serif or traditional letterpress display font on the main headline (geometric sans-serif ONLY), do not lighten the background, do not omit the red Miami glow / palm silhouettes / skyline atmosphere, do not warp the MM logo, do not omit the gold stars, do not show any faces, no extra logos, no QR codes.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, CARD, MM_LOGO],
    _meta: { name: "muha-could-be-you-v2" },
  },
];

fs.writeFileSync("muha-could-be-you-v2.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
