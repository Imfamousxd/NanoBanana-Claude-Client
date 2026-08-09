#!/usr/bin/env node
// Calibration v2: MUCH heavier motion blur + MUCH heavier grain, all ACTION shots.
// Anchor blur shots to the most extreme/abstract refs (boxer r09, cyclist r03).
import fs from "fs";
const R = "Nulumin lifestyle shots";
const REF = {
  r03: `${R}/1 by 1/3bcd045bdf96fdf2b4571e657ce74af8.jpeg`, // cyclist, aggressive directional blur
  r04: `${R}/1 by 1/501466320a6fdd52c8331cb69b2106b2.jpeg`, // dark teal moody, heavy blur, glow
  r09: `${R}/1 by 1/ee1ac568636ed4848282817f51ee7968.jpeg`, // boxer, near-ABSTRACT smear, ghosting
};
for (const [k, v] of Object.entries(REF)) if (!fs.existsSync(v)) { console.error("MISSING", k, v); process.exit(1); }

const GRAIN = `EXTREMELY heavy, coarse, OBVIOUS 35mm film grain across the ENTIRE frame — push-processed high-ISO film (ISO 1600-3200 pushed), gritty and noisy, chunky visible grain structure, like a grainy scanned film negative. The grain must be clearly, unmistakably present everywhere.`;

const FILM = `A real, raw, scanned 35mm FILM photograph — Cinestill 800T / pushed Portra. Soft film focus, halation/bloom on highlights, muted desaturated faded color (NOT vivid, NOT HDR, NOT clean digital), candid and unposed, imperfect amateur framing, natural imperfect skin. It must NOT look polished, cinematic, or AI. Use the reference ONLY as a film-look + motion-blur anchor — match its grain, grade and blur character — but IGNORE its scene, people and composition.`;

const EXTREME_BLUR = `THIS IS A LONG-EXPOSURE MOTION SHOT WHERE MOTION IS THE SUBJECT. The moving person is almost entirely DISSOLVED into long directional motion-blur streaks with ghosted, doubled, smeared edges — barely recognizable as a figure, abstracted into streaks of color and light exactly like the reference. The WHOLE frame is swept with heavy motion. Do NOT keep the subject sharp or legible anywhere — it must be aggressively, obviously, heavily blurred and smeared across a large part of the frame. Embrace abstraction and ambiguity. The blur is by far the dominant feature.`;

const FROZEN = `A split-second candid ACTION shot frozen sharp at a fast shutter, catching the person in the very middle of doing something physical and dynamic — caught in the act, body clearly in motion but frozen crisp (the heavy grain still fully present). NOT posed, NOT static, NOT calm.`;

const jobs = [
  { refImages: [REF.r09], aspectRatio: "4:3", imageSize: "4K",
    prompt: `nul-grit2-T1-surf: A surfer in his early 30s smacks the lip of a breaking wave, board and body whipping hard through the turn with a huge fan of spray exploding off the back. ${EXTREME_BLUR}\n\n${GRAIN}\n\n${FILM}\n\nMatch the near-abstract heavy smear and grain of the reference, but render this surfing action.` },
  { refImages: [REF.r09], aspectRatio: "4:5", imageSize: "4K",
    prompt: `nul-grit2-T2-dance: A contemporary dancer in her mid-20s explodes through a powerful leap in a bright sunlit studio, limbs and loose fabric and hair flying outward mid-air. ${EXTREME_BLUR}\n\n${GRAIN}\n\n${FILM}\n\nMatch the near-abstract heavy smear and grain of the reference, but render this dance-leap action.` },
  { refImages: [REF.r04], aspectRatio: "4:5", imageSize: "4K",
    prompt: `nul-grit2-T3-plunge: A strong-built man in his mid-30s bursts explosively up out of an icy steel cold-plunge tub, water exploding and spraying off his head and shoulders, mouth caught mid-gasp, dim concrete bathhouse with a cold shaft of window light through rising steam. ${FROZEN}\n\n${GRAIN}\n\n${FILM}\n\nMatch the dark, moody, grainy film grade of the reference, but render this cold-plunge action frozen sharp.` },
];
fs.writeFileSync("nulumin-grit2-test.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote nulumin-grit2-test.json (${jobs.length} jobs)`);
