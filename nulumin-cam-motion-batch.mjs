#!/usr/bin/env node
// Build the camera-in-motion batch for Nulumin lifestyle shots.
// One job per source ref across both aspect ratios.

import fs from "fs";
import path from "path";

const ROOT = "Nulumin lifestyle shots";
const OUT = "nulumin-cam-motion-all.json";

const buildPrompt = (idx, aspectLabel) => `nul-cam-motion-${aspectLabel}-${String(idx).padStart(2, "0")}: ${aspectLabel === "1x1" ? "Square 1:1" : "3:4 horizontal"} editorial lifestyle/fitness action photograph. RECREATE the scene, subject, pose, clothing, setting, and composition from the provided reference image faithfully — same person doing the same action in the same environment, same lighting direction, same color palette. The output should look like a parallel-universe shot of the same moment.

ADD CAMERA-IN-MOTION MOTION BLUR (this is the key effect — describe carefully): the photograph reads as a slow-shutter pan from a MOVING CAMERA, NOT as localized blur on a single moving body part. Subtle directional motion blur permeates the ENTIRE frame, distributed evenly across foreground, subject, and background. The subject is the relative anchor (the most legible region of the frame, but still softer than tack-sharp). Their actively-moving limbs trail into soft secondary exposures following the natural motion arc. Background elements (gym walls, partner figures, equipment, environment) are heavily smeared from the camera pan into soft directional streaks. The whole image breathes movement; NOTHING is rigorously tack-sharp; the blur is a property of the entire frame and originates from the camera's motion. Slight Dutch tilt (~5-8° clockwise) reinforces the dynamic in-motion feel. Camera shutter feels like ~1/30s captured during a lateral pan track.

Style: documentary action photography, gritty editorial, painterly low-key lighting with warm/cool color contrast, fine Cinestill 35mm grain, subtle halation on highlights, no text, no logos.`;

const sets = [
  { dir: "1 by 1", label: "1x1", aspect: "1:1" },
  { dir: "3 by 4", label: "3by4", aspect: "3:4" },
];

const jobs = [];
for (const s of sets) {
  const refs = fs.readdirSync(`${ROOT}/${s.dir}`).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  for (let i = 0; i < refs.length; i++) {
    const idx = i + 1;
    jobs.push({
      prompt: buildPrompt(idx, s.label),
      aspectRatio: s.aspect,
      imageSize: "4K",
      refImages: [`${ROOT}/${s.dir}/${refs[i]}`],
      _meta: { aspect: s.label, refIndex: idx, refFile: refs[i] },
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs → ${OUT}`);
