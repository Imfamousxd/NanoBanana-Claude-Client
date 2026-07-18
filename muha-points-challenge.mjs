#!/usr/bin/env node
// Muha Members points challenge graphic — 1:1 max res via gpt-image-2.
// Show the GTA Muha card asset prominently with two reward callouts:
// POST IT = 50 PTS, SHARE IT = 100 PTS. Locked to the Vice City Miami-night
// design language used across the rest of the giveaway set.
import fs from "fs";

const CARD = "Muha Giveaway Assets/gta muha card.png";
const MM_LOGO = "Muha Giveaway Assets/mm-gold.png";

const PROMPT = `Instagram square 1:1 promo graphic for the Muha Members giveaway points challenge. Same locked design language as the rest of the Muha Vice City giveaway set — GTA Vice City Miami-night atmosphere, cream/gold letterpress typography, red neon glow, deep navy / black background with palm tree silhouettes and a hint of a Miami skyline at sunset/twilight on the horizon, subtle atmospheric haze, faint stars.

LAYOUT (top to bottom):

1) TOP — Muha MM gold/cream monogram logo (reference 2) centered horizontally at ~7% from top, sized at ~22% of canvas width, with a soft red rim-glow

2) Just below the logo, a small caps eyebrow line "MUHA MEMBERS · POINTS CHALLENGE" in tracked-out caps, warm cream #E8D5A8, ~36% canvas width centered, flanked by two small gold five-point star symbols

3) MAIN HEADLINE centered horizontally at ~22% from top: "EARN POINTS" set in massive bold condensed sans-serif (the same display weight used on "SECURE THE BAG" in the other graphics), uppercase, warm cream #E8D5A8 with subtle letterpress/printed texture, slight warm red outer glow halo, generous letterspacing. Sized so it spans ~78% of canvas width.

4) Below the headline at ~34% from top, a thin warm red horizontal hairline rule ~55% canvas width centered

5) HERO CARD CENTERED in the middle of the canvas at roughly 35-65% from top — display the GTA Muha card from reference 1 PROMINENTLY. Use reference 1 EXACTLY for the card's design (the horizontal rectangular ticket showing the red Challenger photo on the left half with "CASH PRIZE $25,000 & ALL NEW DODGE CHALLENGER" text, and the right half showing the encrypted ticket / QR scanner section with "Your Encrypted Raffle Entry Ticket — Scan In Members App To Redeem 10 Entries! WITH SCAN — No Purchase Necessary"). Render the card pixel-faithful to reference 1, sized to span ~78% of canvas width, gently tilted ~4° clockwise for dynamism, with a soft warm red glow underneath it on the background.

6) Below the card at ~70% from top, TWO REWARD CALLOUT PILLS arranged side by side horizontally, each in a thin red rounded-rectangle outline pill matching the style of "WIN THE GRAND PRIZE" pills in the other Muha graphics — but each pill containing TWO STACKED LINES of text:
   - LEFT PILL: line 1 (smaller caps eyebrow) "POST IT", line 2 (bold display) "50 POINTS" — pill spans ~36% of canvas width
   - RIGHT PILL: line 1 "SHARE IT", line 2 "100 POINTS" — pill spans ~36% of canvas width
   Both pills: warm cream text on the dark background, thin red outline, soft red glow. Centered horizontally with a comfortable gap between them.

7) Bottom — a thin warm-gold horizontal hairline rule centered, then the styled disclaimer "✦  SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM  ✦" in tracked-out caps warm cream at 80% opacity, the standard locked disclaimer used on every Muha graphic

NEGATIVE: no extra logos beyond the MM monogram, no extra cars beyond the one in the card asset, no warped typography, no incorrect card design, no captions/numbers/arrows beyond what is specified, no biohazard, no different aspect ratio.

Style: high-end social campaign poster, GTA Vice City night-photography vibe, crisp gold letterpress typography, premium finish. The card is the hero asset; the headline and the two reward pills frame it.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [CARD, MM_LOGO],
    _meta: { name: "muha-points-challenge" },
  },
];

fs.writeFileSync("muha-points-challenge.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
