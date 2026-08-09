#!/usr/bin/env node
// Build camera-in-motion v2 batch — 3 variations per ref, 1:1 and 4:3 (landscape).
import fs from "fs";

const ROOT = "Nulumin lifestyle shots";
const OUT = "nulumin-cam-motion-v2.json";

// 3 prompt variations per ref — different pan direction / tilt / intensity
// to ensure each variation is visibly distinct (not a near-duplicate).
const VARIATIONS = [
  { tag: "v1", pan: "lateral left-to-right horizontal pan", tilt: "slight Dutch tilt ~6° clockwise", intensity: "moderate" },
  { tag: "v2", pan: "lateral right-to-left horizontal pan",  tilt: "slight Dutch tilt ~7° counter-clockwise", intensity: "stronger" },
  { tag: "v3", pan: "diagonal upward pan (camera sweeping up and across the scene)", tilt: "near level (~3° tilt)", intensity: "subtle but clearly present" },
];

const buildPrompt = ({ aspectLabel, aspectDesc, idx, variant }) => `nul-cam-motion-v2-${aspectLabel}-${String(idx).padStart(2, "0")}-${variant.tag}: ${aspectDesc} editorial lifestyle/fitness action photograph. Recreate the scene, subject, pose, clothing, setting, and color palette of the provided reference image — same person, same activity, same environment, same lighting direction. The output should look like the same moment but a NEW frame caught a fraction of a second later, with a different camera-pan trajectory than the original — do NOT produce a near-identical copy of the source image.

THE BLUR IS FROM THE CAMERA — NOT FROM THE PERSON. The photograph reads as if the CAMERA was moving fast through the scene (a slow-shutter pan from a fast-moving camera, ~1/30s exposure), while the subject was relatively still or moving naturally. The motion blur is a property of the CAMERA's movement, not localized blur on a single moving limb. The subject is the relative anchor (most legible region of the frame) but everything in the frame — subject, foreground, background — carries soft directional smear in the same overall direction set by the camera's pan.

For this variation: ${variant.pan}; ${variant.tilt}; blur intensity is ${variant.intensity}. The directional smear across the entire frame follows the pan direction consistently. Backgrounds (walls, equipment, partner figures) are heavily smeared into soft directional streaks. The subject is softer than tack-sharp — they should look like the camera was tracking them imperfectly through its sweep. Nothing in the frame is rigorously sharp.

Style: documentary action photography, gritty editorial, painterly low-key lighting with warm/cool contrast, fine Cinestill 35mm grain, subtle halation on highlights, no text, no logos.`;

const sets = [
  { dir: "1 by 1",  label: "1x1",  aspectRatio: "1:1", aspectDesc: "Square 1:1" },
  { dir: "3 by 4",  label: "4x3",  aspectRatio: "4:3", aspectDesc: "Landscape 4:3" },
];

const jobs = [];
for (const s of sets) {
  const refs = fs.readdirSync(`${ROOT}/${s.dir}`).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  for (let i = 0; i < refs.length; i++) {
    const idx = i + 1;
    for (const variant of VARIATIONS) {
      jobs.push({
        prompt: buildPrompt({ aspectLabel: s.label, aspectDesc: s.aspectDesc, idx, variant }),
        aspectRatio: s.aspectRatio,
        imageSize: "4K",
        refImages: [`${ROOT}/${s.dir}/${refs[i]}`],
        _meta: { aspect: s.label, refIndex: idx, variant: variant.tag, refFile: refs[i] },
      });
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs → ${OUT}`);
