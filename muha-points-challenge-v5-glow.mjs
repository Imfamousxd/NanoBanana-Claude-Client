#!/usr/bin/env node
// v5 — anchor back to v3 layout (on-theme) and ONLY add subtle glow polish to
// the typography + backdrop to make it pop. No layout changes, no arcade
// stickers, no burst rays.
import fs from "fs";

const V3 = "Muha Giveaway Redesigned/muha-points-challenge.png";

const PROMPT = `Reference 1 is the layout TARGET (a Muha Members Points Challenge poster in the Vice City style with MM monogram + gold stars + "MUHA MEMBERS // POINTS CHALLENGE" eyebrow + massive "EARN POINTS" cream/gold headline + "POST & SHARE YOUR MUHA CARD TO EARN" sub-instruction + the GTA Muha card centered + two stacked reward pills + bottom disclaimer).

Reproduce reference 1 PIXEL-FAITHFULLY — same layout, same composition, same typography, same colors, same Vice City Miami-night backdrop, same MM logo, same stars, same card placement, same two stacked reward pills, same disclaimer. The structure does NOT change.

ONLY ENHANCEMENT — add subtle, refined polish:
- Add a soft warm-gold GLOW around the cream/gold "EARN POINTS" headline letters (subtle outer halo, like neon spotlight wash)
- Add a soft warm-red glow around each of the two reward pills (slightly stronger than reference 1)
- Slightly intensify the red Miami skyline / palm silhouette ambient glow in the backdrop — a touch more atmospheric
- Add a small lens-flare sparkle accent on the corner of the GTA Muha card (one small, tasteful)
- Sharpen the cream letterpress texture on the eyebrow + disclaimer slightly

Negative: do NOT change the layout, do NOT change the headline copy, do NOT change the card design or position, do NOT change the pill copy or arrangement (still stacked vertically: "POST CARD TO STORY → +50 POINTS" above "SHARE CARD WITH A FRIEND → +100 POINTS"), do NOT add starburst stickers, do NOT add radiant burst rays, do NOT lighten the background, do NOT add new graphic elements. Just subtle glow polish.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [V3],
    _meta: { name: "muha-points-challenge-v5-glow" },
  },
];

fs.writeFileSync("muha-points-challenge-v5-glow.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
