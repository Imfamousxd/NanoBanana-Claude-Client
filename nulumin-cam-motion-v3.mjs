#!/usr/bin/env node
// Camera-in-motion v3 — explicit divergence from refs: different clothing,
// different people, slightly different actions across 3 variants per ref.
import fs from "fs";

const ROOT = "Nulumin lifestyle shots";
const OUT = "nulumin-cam-motion-v3.json";

const VARIATIONS = [
  {
    tag: "v1",
    divergence: "Use the reference image ONLY for the setting, lighting direction, and overall mood. DO NOT copy the subject's appearance from the reference. The subject in this generation must wear DIFFERENT clothing — different colors and silhouette than what the ref shows (e.g. if ref shows pastel cream, use deep olive or dusty mauve or charcoal grey; if ref shows tank-top, use long-sleeve or vice versa). Subject's pose may match the ref activity but use a slightly different framing/angle.",
    cam: "fast lateral left-to-right camera pan; slight Dutch tilt ~6° clockwise; moderate blur intensity",
  },
  {
    tag: "v2",
    divergence: "Use the reference image ONLY for the setting, lighting direction, and overall mood. DO NOT copy the subject's appearance. The subject in this generation must be a DIFFERENT PERSON than the one in the ref — different hair color/length, different build, different facial features, different ethnicity if it helps differentiate. Clothing should also differ from the ref. Activity should be similar but the moment captured is mid-different-action (e.g. if ref shows hand wiping forehead, show hands tying hair back or hands gripping a towel).",
    cam: "fast right-to-left lateral camera pan; slight Dutch tilt ~7° counter-clockwise; stronger blur intensity",
  },
  {
    tag: "v3",
    divergence: "Use the reference image ONLY for the setting, lighting direction, and overall mood. The subject should look DIFFERENT from the ref (different person, different clothing colors, different framing) AND the action captured should be a slightly different moment in the same broader activity (a different phase of the exercise, a different gesture, a different beat of the same workout). Maintain the same atmospheric scene type but with clear visual divergence from the source.",
    cam: "fast diagonal upward camera sweep; near level (~3° tilt); subtle but clearly present blur",
  },
];

const buildPrompt = ({ aspectLabel, aspectDesc, idx, variant }) => `nul-cam-motion-v3-${aspectLabel}-${String(idx).padStart(2, "0")}-${variant.tag}: ${aspectDesc} editorial lifestyle/fitness action photograph.

${variant.divergence}

THE BLUR IS FROM THE CAMERA — NOT FROM THE PERSON. The photograph reads as if the CAMERA was moving fast through the scene (slow-shutter pan from a fast-moving camera, ~1/30s exposure), while the subject was relatively still or moving naturally. The motion blur is a property of the CAMERA's movement, not localized blur on a single moving limb. Subject is the relative anchor (most legible region) but everything in the frame carries soft directional smear in the same overall direction set by the camera's pan. For this variant: ${variant.cam}. Backgrounds (walls, equipment, partner figures) heavily smeared into soft directional streaks. NOTHING in the frame is rigorously sharp.

Style: documentary action photography, gritty editorial, painterly low-key lighting with warm/cool contrast, fine Cinestill 35mm grain, subtle halation on highlights, no text, no logos.`;

const sets = [
  { dir: "1 by 1", label: "1x1", aspectRatio: "1:1", aspectDesc: "Square 1:1" },
  { dir: "3 by 4", label: "4x3", aspectRatio: "4:3", aspectDesc: "Landscape 4:3" },
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
// Split into 5 parallel chunks
for (let i = 0; i < 5; i++) {
  const chunk = jobs.filter((_, idx) => idx % 5 === i);
  fs.writeFileSync(`nulumin-cm-v3-p${i+1}.json`, JSON.stringify(chunk, null, 2));
}
console.log(`Wrote ${jobs.length} jobs, split into 5 parallel batches`);
