#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(BASE, "DH Shots", "Capsules Lifestyle", "5-Amino 1MQ");
const BATCH_FILE = path.join(BASE, "capsule-5amino1mq-from-mantrack.json");
const PRODUCT_REF = "./DH Shots/Capsules/5-Amino 1MQ.jpg";
const ANCHOR = "./DH Shots/Capsules Lifestyle/5-Amino 1MQ/man-track.jpg";

const scenes = {
  gym: {
    sceneDesc: "indoor gym / athletic training",
    sceneDetails: "softly blurred gym background — out-of-focus hints of dumbbells on a rack, a barbell plate, rubber-matted flooring, a squat rack, or turf lane, charcoal/black/concrete tones",
    keyLight: "strong directional overhead gym lighting, cooler color temperature",
    ambientTint: "cool charcoal/grey ambient wash from the gym environment",
    shadow: "a soft directional drop shadow angled away from the overhead key light",
    colorGrade: "cinematic athletic color grade, cooler with rich blacks and charcoal tones",
  },
  track: {
    sceneDesc: "outdoor running track / athletics stadium",
    sceneDetails: "red-orange rubberized track surface with crisp white lane lines running diagonally through the softly blurred background, possibly a turf infield or distant stadium rails",
    keyLight: "bright warm natural outdoor sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus cool blue sky ambient from above",
    shadow: "a defined directional shadow falling away from the sun direction, consistent with harder outdoor daylight",
    colorGrade: "cinematic athletic color grade, warm natural daylight, saturated reds/oranges from the track, clean whites",
  },
  kitchen: {
    sceneDesc: "bright modern indoor home kitchen",
    sceneDetails: "softly blurred warm white marble or light oak kitchen counter with hints of a tasteful clean minimalist kitchen in the background (small green plant, ceramic mug, glass of water, or white backsplash — mostly out of focus)",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    shadow: "a soft, diffused shadow falling away from the side window light",
    colorGrade: "warm inviting editorial wellness-brand color grade, natural morning daylight, soft whites, gentle highlights",
  },
};

const jobs = [
  { name: "man-gym", scene: "gym", gender: "man", changeGender: false },
  { name: "man-kitchen", scene: "kitchen", gender: "man", changeGender: false },
  { name: "woman-gym", scene: "gym", gender: "woman", changeGender: true },
  { name: "woman-track", scene: "track", gender: "woman", changeGender: true },
  { name: "woman-kitchen", scene: "kitchen", gender: "woman", changeGender: true },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function buildPrompt(job) {
  const s = scenes[job.scene];
  const handInstruction = job.changeGender
    ? `REPLACE the hand in REFERENCE 2 with a WOMAN'S hand (slender and elegant with smooth skin, long manicured nails painted a clean crisp white polish) — but the GRIP AND HAND POSITION MUST BE IDENTICAL to the man's hand in REFERENCE 2: same full-hand palm-wrap grip with all four fingers curled around one side of the bottle body and the thumb on the opposite side, same finger angles, same bottle orientation, same relative position of hand and bottle in the frame. Do NOT change the grip type or finger layout — only change the skin/hand's gender characteristics and add white nails. The bottle remains the SAME hand-sized, palm-length scale shown in REFERENCE 2.`
    : `KEEP the man's hand from REFERENCE 2 — same skin tone, same grip (full-hand palm-wrap with all four fingers on one side and thumb on the other), same finger positions, same bottle orientation, same relative hand-and-bottle position in the frame. The bottle remains the SAME hand-sized, palm-length scale shown in REFERENCE 2.`;

  return `You are producing a new lifestyle photograph of a '5-Amino 1MQ' capsule pill bottle being held, based on REFERENCE 2 as the definitive composition and scale template. ${handInstruction}

CRITICAL: preserve REFERENCE 2's bottle size, grip, composition, crop, camera angle (top-down overhead POV), and hand-and-bottle layout exactly. The ONLY changes from REFERENCE 2 are (1) the ${job.changeGender ? "hand's gender and nails as described above, and (2) " : ""}the scene/background and scene lighting, switched from REFERENCE 2's outdoor track setting to a new ${s.sceneDesc} setting.

NEW SCENE: ${s.sceneDetails}. Replace REFERENCE 2's blurred track background with this new blurred background, at the same depth of field and blur intensity.

NEW LIGHTING: the scene's key light is ${s.keyLight}; the ambient fill is ${s.ambientTint}. RE-LIGHT the hand AND the capsule bottle to match this new scene — specular highlights on skin, nails (if any), the clear glass bottle body, the brushed silver screw cap, and the white capsules visible inside the clear glass must all align with the new key light direction. The white plastic and glass surfaces pick up ${s.ambientTint}. Cast shadow: ${s.shadow}. Color grade: ${s.colorGrade}. The whole photo (hand + bottle) should read as if taken in the new scene — not composited, not pasted. Match the dynamic range, contrast, and grain of a real photograph in this environment.

REFERENCE 1 is the '5-Amino 1MQ' studio product shot. Use it ONLY to confirm the bottle design and label artwork. Do NOT copy REFERENCE 1 pixels. The bottle in the output should be re-rendered in the new scene's lighting, NOT pasted in.

LABEL: matte black wraparound label with the Dialed Health heartbeat/ECG logo on top ('DIALED' on the left and 'HEALTH' on the right split by a thin white ECG pulse line), and the product name '5-Amino 1MQ' in clean bold white sans-serif centered below on a single line. The product name must be sized LARGE — bold, confidently filling the label's usable width, immediately legible. That is ALL on the label — no dosing, no mg, no mcg, no count, no Rx, no QR, no barcode, no extra text. Do NOT invent label text. The white ink picks up the scene's color temperature.

Bottle held UPRIGHT and VERTICAL, label facing SQUARELY toward camera, fully legible. STRICTLY ONE SINGLE HAND. Photorealistic, seamless scene-integrated lifestyle photograph, editorial lifestyle quality, 4K, crisp focus, no artifacts.`;
}

for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  const destPath = path.join(OUT_DIR, `${job.name}.jpg`);
  if (fs.existsSync(destPath)) {
    console.log(`[${i + 1}/${jobs.length}] ${job.name} — already exists, skipping`);
    continue;
  }
  const batchJob = {
    prompt: buildPrompt(job),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [PRODUCT_REF, ANCHOR],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${jobs.length}] ${job.name} — generating (scene: ${job.scene}, gender: ${job.gender})...`);
  try {
    const stdout = execSync(
      `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
      { cwd: BASE, encoding: "utf-8" }
    );
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) { console.log(`  !! Could not parse Saved path`); continue; }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) { console.log(`  !! Saved file missing`); continue; }
    fs.copyFileSync(savedPath, destPath);
    console.log(`  -> ${path.basename(savedPath)} -> 5-Amino 1MQ/${job.name}.jpg`);
  } catch (err) {
    console.log(`  !! Error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
