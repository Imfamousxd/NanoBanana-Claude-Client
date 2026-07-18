#!/usr/bin/env node
// v2 — pass an existing approved Muha graphic as the visual style anchor so
// gpt-image-2 actually captures the locked Vice City key-art look (pure black
// background with red-tinted Miami skyline + palms, big gold MM monogram with
// flourishes, cream/gold letterpress display headlines, red Challenger).
import fs from "fs";

const STYLE_REF = "Muha Giveaway Redesigned/Approved/Muha Members Giveaway.png";
const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway points challenge.

Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact look pixel for pixel: pure deep black background with a red-tinted nighttime Miami / Vice City skyline + dark palm tree silhouettes + neon red glow, a hint of atmospheric haze. The MM gold monogram lockup at the top with its decorative crown-flourish styling. A row of small gold five-point stars beneath the monogram. Cream-and-gold thin double horizontal divider lines around an eyebrow line. Massive cream/gold letterpress display HEADLINE typography (heavy slab serif/display with subtle italic, letterpress texture, slight warm-gold glow). Bottom: another row of small gold stars + the styled "SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM" disclaimer. Same dramatic Vice City cinematic mood as reference 1.

WHAT CHANGES from reference 1 (only the content; the visual treatment is identical):

1) MM monogram (top) — match reference 3 PRECISELY for the logo lockup. Same size/position as in reference 1.

2) Row of gold stars beneath the logo — keep as in reference 1.

3) Eyebrow line between two thin cream divider lines: "MUHA MEMBERS // POINTS CHALLENGE" in tracked-out cream caps with letterpress texture, matching the typography of "CLASSIFIED // MUHA MEMBERS" in reference 1.

4) MASSIVE HEADLINE — replace reference 1's "$25,000 / AND DODGE CHALLENGER" with a TWO-LINE stacked headline:
   - Line 1: "EARN" (massive, all caps, cream/gold letterpress display)
   - Line 2: "POINTS" (massive, all caps, cream/gold letterpress display)
   Same display font, same letterpress texture, same warm-gold glow, same scale as reference 1's headline. Tightly stacked.

5) BENEATH THE HEADLINE — display the GTA Muha card (reference 2) as the hero ASSET, centered horizontally, sized to span ~75% of canvas width, gently tilted ~4° clockwise. Render the card pixel-faithful to reference 2 (the horizontal rectangular giveaway entry ticket with the red Challenger photo + "$25,000 CASH PRIZE & ALL NEW DODGE CHALLENGER" text on the left and the encrypted-ticket / QR scanner area on the right). The card hovers on the dark background with a subtle warm red glow underneath.

6) BELOW THE CARD — TWO REWARD CALLOUT PILLS arranged side by side horizontally, each in a thin red rounded-rectangle outline matching the pill style used on "WIN THE GRAND PRIZE" / similar pills in the Muha set:
   - LEFT PILL: line 1 (smaller tracked cream caps) "POST IT", line 2 (large bold cream display) "50 POINTS"
   - RIGHT PILL: line 1 "SHARE IT", line 2 "100 POINTS"
   Each pill ~36% canvas width, thin red outline, soft red glow halo, cream typography inside.

7) BOTTOM — row of small gold stars + the styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked cream caps with letterpress texture, matching reference 1's disclaimer style exactly.

Style: match reference 1 PRECISELY — same GTA Vice City key-art cinematic vibe, same color palette (deep black + red Miami glow + cream/gold typography), same letterpress display headlines, same dark moody atmosphere, same star ornaments, same divider lines, same disclaimer treatment. The only NEW content is the POINTS CHALLENGE headline, the card asset, and the two reward pills.

Negative: do not lighten the background, do not change to cream/white background, do not use modern minimal sans-serif (use the locked slab/display letterpress style from reference 1), do not omit the red Miami glow / palm silhouettes / skyline atmosphere, do not warp the MM logo, do not omit the gold stars, do not change the card's design, no extra logos.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [STYLE_REF, CARD, MM_LOGO],
    _meta: { name: "muha-points-challenge-v2" },
  },
];

fs.writeFileSync("muha-points-challenge-v2.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
