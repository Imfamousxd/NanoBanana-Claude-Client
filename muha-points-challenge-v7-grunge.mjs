#!/usr/bin/env node
import fs from "fs";

const V6 = "Muha Giveaway Redesigned/muha-points-challenge.png";

const PROMPT = `Reference 1 is the layout TARGET. Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the change below.

ONLY CHANGE: the massive "EARN POINTS" headline keeps its big bold geometric sans-serif font (Poppins/Montserrat-style heavy weight, uppercase, generous letterspacing) — but ADD the same GRUNGY LETTERPRESS TEXTURE that appears on the rest of the cream typography in this image (the eyebrow line, the disclaimer, the sub-instruction). The headline letters should look like they were printed on a slightly rough surface — subtle ink-scatter, micro-texture, soft edge erosion, a few faint scratches/grit within the letterforms. Same warm cream color, same warm-gold glow halo around the letters. Just the letterpress GRUNGE texture is added.

Everything else stays IDENTICAL — same MM monogram, same gold stars, same eyebrow, same sub-instruction, same card placement, same two stacked reward pills, same backdrop, same disclaimer. Only the EARN POINTS headline gets the grunge texture applied.

Negative: do not change the font/weight of the headline, do not change the headline color, do not change the layout, do not change any other element, do not over-distress (subtle grunge only).`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "1:1",
    imageSize: "4K",
    refImages: [V6],
    _meta: { name: "muha-points-challenge-v7-grunge" },
  },
];

fs.writeFileSync("muha-points-challenge-v7-grunge.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
