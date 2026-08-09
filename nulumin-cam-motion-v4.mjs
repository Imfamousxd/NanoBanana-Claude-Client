#!/usr/bin/env node
// Camera-motion v4 — active fitness activity emphasized, divergent from refs, blur dialed back so action is clearly readable.
import fs from "fs";

const ROOT = "Nulumin lifestyle shots";
const OUT = "nulumin-cam-motion-v4.json";

const VARIATIONS = [
  {
    tag: "v1",
    cam: "fast lateral left-to-right camera pan; slight Dutch tilt ~5° clockwise; MODERATE blur intensity (clearly present but the action and subject remain readable)",
    divergence: "subject is a DIFFERENT person than in the ref (different hair, build, ethnicity), wearing DIFFERENT clothing colors and silhouette than the ref (use deep olive, charcoal grey, or dusty mauve athletic wear)",
  },
  {
    tag: "v2",
    cam: "fast right-to-left camera pan; slight Dutch tilt ~5° counter-clockwise; MODERATE blur intensity (action stays readable)",
    divergence: "subject is a DIFFERENT person, wearing DIFFERENT clothing colors than the ref (use warm cream + black accents, or dusty rust, or deep navy)",
  },
  {
    tag: "v3",
    cam: "fast diagonal upward camera sweep; near level (~3° tilt); SUBTLE blur intensity (lightest of the three — action is very clearly visible)",
    divergence: "subject is a DIFFERENT person, wearing DIFFERENT clothing colors and the action captured is a slightly different beat of the same exercise/activity (different phase of the rep, different angle, different gesture)",
  },
];

const buildPrompt = ({ aspectLabel, aspectDesc, idx, variant }) => `nul-cam-motion-v4-${aspectLabel}-${String(idx).padStart(2, "0")}-${variant.tag}: ${aspectDesc} editorial FITNESS/ACTION photograph. Use the provided reference image AS INSPIRATION ONLY for the activity type, setting, lighting direction, and atmospheric mood — DO NOT replicate the ref one-for-one.

CRITICAL — the subject MUST be visibly DOING AN ACTIVE WORKOUT / EXERCISE / FITNESS ACTIVITY. Identify the activity in the reference (e.g. yoga pose, dumbbell lift, stretching, running, push-up, plank, jump rope, hamstring stretch, kettlebell swing, sprint start, climbing, etc.) and recreate that ACTIVE moment with a clearly readable workout/exercise gesture. The shot must read instantly as "someone working out", not as a candid lifestyle photo of someone standing or walking around. Body posture, equipment if present, muscle engagement, and exertion cues must all reinforce that this is mid-action fitness photography.

DIVERGE from the reference: ${variant.divergence}. Same activity type, same setting type, but a clearly different subject in clearly different attire.

CAMERA-IN-MOTION blur (the blur is from the CAMERA, not from the subject): the photograph reads as if the CAMERA was moving fast through the scene (slow-shutter pan from a fast-moving camera, ~1/40s exposure — a tick faster than v3 so the action stays readable). The motion blur is a property of the camera's movement. The subject and the activity must remain CLEARLY READABLE through the blur — keep them as the most legible region of the frame; backgrounds smear more heavily. For this variant: ${variant.cam}.

Style: documentary action/fitness photography, gritty editorial, painterly low-key lighting with warm/cool contrast, fine Cinestill 35mm grain, subtle halation on highlights, no text, no logos.`;

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
for (let i = 0; i < 5; i++) {
  fs.writeFileSync(`nulumin-cm-v4-p${i+1}.json`, JSON.stringify(jobs.filter((_, idx) => idx % 5 === i), null, 2));
}
console.log(`Wrote ${jobs.length} jobs, split into 5 parallel batches`);
