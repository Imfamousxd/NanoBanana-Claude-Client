#!/usr/bin/env node
import fs from "fs";

const V7 = "Muha Giveaway Redesigned/muha-points-challenge.png";

const PROMPT = `Reference 1 is the layout TARGET. Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the changes below.

ONLY CHANGES — update the TWO stacked reward pills and add one small line beneath them:

TOP PILL: replace the current text with "EARN 50 POINTS BY SHARING THE POST" — same thin red rounded-rectangle outline pill style, same warm cream letterpress caps, same soft red glow, same width (~70% canvas).

BOTTOM PILL: replace the current text with "EARN 100 POINTS WHEN YOU POST A PICTURE OF YOUR CARD IN THE COMMENTS" — same pill style. If the text is long, slightly reduce the tracking/letterspacing or font size within the pill so it fits cleanly on ONE line inside the pill. Do NOT break it to two lines or shrink the pill.

NEW LINE beneath the two pills: add a small centered line of cream tracked-out caps reading "ONE TIME PER CHALLENGE" — same letterpress texture as the eyebrow and disclaimer text, same warm cream color, slightly smaller than the pill text. Position it in the gap between the bottom pill and the disclaimer, with comfortable breathing room above and below.

Everything else stays IDENTICAL — same MM monogram, same gold stars, same eyebrow, same "EARN POINTS" headline (with the grungy letterpress geometric sans-serif from v7), same sub-instruction, same card placement, same Vice City backdrop, same disclaimer. Only the pill copy changes and the new "ONE TIME PER CHALLENGE" line is added.

Negative: do not change the headline font or texture, do not change the layout structure, do not change the card, do not change the backdrop, do not remove any existing elements, do not break pill text onto multiple lines.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [V7],
    _meta: { name: "muha-points-challenge-v8-copy" },
  },
];

fs.writeFileSync("muha-points-challenge-v8-copy.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
