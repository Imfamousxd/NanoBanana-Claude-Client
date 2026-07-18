#!/usr/bin/env node
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway — gamification / strategy energy, showing members how to maximize their chances. Same locked Vice City design language as reference 1.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: pure deep black background with a red-tinted nighttime Miami / Vice City skyline + dark palm tree silhouettes + neon red glow, atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Styled disclaimer at bottom flanked by gold stars. Same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 3) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // GIVEAWAY" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-32% from top: TWO-line stacked text, tightly stacked, generous letterspacing, warm-gold glow halo:
   Line 1: "STACK YOUR"
   Line 2: "ENTRIES"

   CRITICAL FONT INSTRUCTION: The headline uses a BIG BOLD GEOMETRIC SANS-SERIF typeface in the Poppins / Montserrat / Inter Display family — heavy bold weight (~800-900), uppercase, clean modern geometric forms with circular round letterforms. NOT a slab serif, NOT a traditional letterpress display face. The letters have a subtle GRUNGY LETTERPRESS TEXTURE applied — ink-scatter, micro-texture, soft edge erosion, faint scratches/grit within the letterforms, as if printed on a slightly rough surface. Color is warm cream #E8D5A8 with a warm-gold glow halo. "ENTRIES" is the larger word.

5) SUB-INSTRUCTION at ~35% from top: one line of cream tracked-out caps reading "MORE WAYS TO WIN — MORE CHANCES TO SCORE" — small but readable, letterpress texture, warm gold tint.

6) HERO ZONE at ~40-68% from top: A dramatic vertical STACK of 4-5 GTA Muha cards (reference 2) cascading downward from the top of the zone, each card slightly offset and rotated — like a hand of cards being dealt or a deck being fanned vertically. The top card is most visible and angled, each subsequent card peeks out below with increasing tilt, creating a cascading waterfall effect. All cards rendered PIXEL-FAITHFUL to reference 2. A dramatic warm-red glow bloom emanates from behind the stack. Gold sparkle/particle accents scattered around the cascade. The stack conveys ACCUMULATION — pile up those entries.

7) FOUR STACKED ACTION PILLS at ~72-90% from top, each spanning ~72% canvas width, evenly spaced vertically. Each is a thin red rounded-rectangle outline pill with soft red glow, cream letterpress caps:
   - PILL 1: "SCAN YOUR CARD IN APP → 10 ENTRIES"
   - PILL 2: "SHARE THE POST → +50 POINTS"
   - PILL 3: "POST YOUR CARD → +100 POINTS"
   - PILL 4: "REFER A FRIEND → +200 POINTS"

8) BOTTOM (~94% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Style: same GTA Vice City key-art cinematic vibe, same color palette (deep black + red Miami glow + cream/gold typography), same dark moody atmosphere. The OTHER text elements (eyebrow, pills, disclaimer) keep the cream letterpress slab texture — ONLY the main headline uses the geometric sans-serif with grunge texture.

Negative: do not use slab serif or traditional letterpress display font on the main headline (geometric sans-serif ONLY), do not lighten the background, do not omit the red Miami glow / palm silhouettes / skyline atmosphere, do not warp the MM logo, do not omit the gold stars, do not show any faces, no extra logos, no QR codes.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, CARD, MM_LOGO],
    _meta: { name: "muha-stack-your-entries" },
  },
];

fs.writeFileSync("muha-stack-your-entries.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
