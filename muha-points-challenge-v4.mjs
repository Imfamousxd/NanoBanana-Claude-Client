#!/usr/bin/env node
// v4 — crank up the visual energy. Cinematic radiant gold burst behind the
// card, two arcade-style burst-sticker reward badges flanking the card,
// directional sub-instruction tying the headline to the action.
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway points challenge — ARCADE / Vice City KEY-ART energy, dramatic and visually rich.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look: pure deep black background with a red-tinted nighttime Miami / Vice City skyline + dark palm tree silhouettes + neon red glow, atmospheric haze. Gold MM monogram with decorative crown-flourish styling. Gold five-point stars as ornaments. Cream-and-gold thin double horizontal divider lines around eyebrow text. Massive cream/gold letterpress display HEADLINE typography (heavy slab serif/display with subtle italic, letterpress texture, warm-gold glow). Styled disclaimer at bottom flanked by gold stars.

LAYOUT (top to bottom):

1) TOP (~6% from top): MM gold monogram (reference 3) horizontally centered, ~16% canvas width.

2) Row of small gold stars beneath the monogram.

3) EYEBROW LINE between two thin cream double-divider lines: "MUHA MEMBERS // POINTS CHALLENGE" tracked cream caps, letterpress texture.

4) MAIN HEADLINE at ~20-30% from top: TWO-line stacked "EARN / POINTS" in massive cream/gold letterpress display caps matching reference 1, tightly stacked, generous letterspacing, warm-gold glow.

5) SUB-INSTRUCTION arrow callout at ~32% from top: "POST & SHARE YOUR MUHA CARD" in tracked-out cream caps with letterpress texture, a small chevron "↓" beneath it pointing down to the card.

6) CINEMATIC HERO ZONE at ~40-72% from top:
   - BEHIND the card: a dramatic RADIANT BURST of warm-gold neon rays emanating outward in all directions from a central point behind the card — like a vintage arcade slot-machine win burst (~28 thin gold rays radiating at evenly spaced angles, soft warm-red bloom in the center, lens-flare sparkle accents). The burst sits on the dark Miami-night background.
   - The GTA Muha CARD (reference 2) hovers in the dead center of the burst, sized to span ~62% of canvas width, gently tilted ~6° clockwise for dynamism. Render the card PIXEL-FAITHFUL to reference 2 (red Challenger + $25,000 cash prize on the left, encrypted ticket / scanner area on the right). A subtle red glow halo wraps the card edges. The card looks like the JACKPOT centerpiece.

7) TWO BURST-STICKER REWARD BADGES flanking the lower portion of the card at ~62-78% from top:
   - LEFT BADGE (lower-left of the card, slight overlap): an explosive STAR-SHAPED burst sticker (a 12-point starburst silhouette) in solid warm-red #C8281F with a thin gold outline, sized ~22% canvas width, tilted slightly counter-clockwise. Inside the star, stacked cream letterpress text on two lines:
     • Top line: "POST IT" (small caps tracked)
     • Bottom line: "+50 PTS" (large bold display)
   - RIGHT BADGE (lower-right of the card, slight overlap): identical star-shaped burst sticker in solid warm-red with gold outline, sized ~22% canvas width, tilted slightly clockwise. Inside:
     • Top line: "SHARE IT" (small caps tracked)
     • Bottom line: "+100 PTS" (large bold display)
   Both badges look like classic Vice-City / vintage arcade promo stickers slapped onto the poster.

8) BOTTOM (~90% from top): row of small gold five-point stars + styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture.

Style: match reference 1 PRECISELY — same GTA Vice City key-art cinematic vibe, same color palette (deep black + red Miami glow + cream/gold typography), same letterpress display headlines, same dark moody atmosphere. The added elements (radiant gold burst behind the card, two starburst reward stickers) crank up the visual energy without changing the brand language.

Negative: do not lighten the background, do not use modern minimal sans-serif (use the locked slab/display letterpress style from reference 1), do not omit the red Miami glow / palm silhouettes / skyline atmosphere, do not warp the MM logo, do not omit the gold stars, do not change the card's design, do not place the reward pills as plain rectangles (must be ARCADE STARBURST STICKERS), no extra logos, no boring static layout.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, CARD, MM_LOGO],
    _meta: { name: "muha-points-challenge-v4" },
  },
];

fs.writeFileSync("muha-points-challenge-v4.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
