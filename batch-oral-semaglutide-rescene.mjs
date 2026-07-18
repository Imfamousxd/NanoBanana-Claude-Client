#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(BASE, "DH Shots", "Oral Drops Lifestyle", "Semaglutide");
const BATCH_FILE = path.join(BASE, "oral-semaglutide-rescene-batch.json");
const PRODUCT_REF = "./DH Shots/Oral Drops/Semaglutide.jpg";

const scenes = {
  track: {
    sceneDesc: "an outdoor running track / athletics stadium",
    sceneDetails: "red-orange rubberized track surface with crisp white lane lines running diagonally through the softly blurred background, possibly a turf infield or distant stadium rails",
    keyLight: "bright warm natural outdoor sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus cool blue sky ambient from above",
    shadow: "a defined directional shadow of the bottle on the hand, falling away from the sun direction, consistent with harder outdoor daylight",
    colorGrade: "cinematic athletic color grade, warm natural daylight, saturated reds/oranges from the track, clean whites",
  },
  kitchen: {
    sceneDesc: "a bright modern indoor home kitchen",
    sceneDetails: "a softly blurred warm white marble or light oak kitchen counter with hints of a tasteful clean minimalist kitchen in the background (a small green plant, a ceramic mug, a glass of water, or a white backsplash — mostly out of focus)",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    shadow: "a soft, diffused shadow of the bottle on the hand/counter, falling away from the side window light",
    colorGrade: "warm inviting editorial wellness-brand color grade, natural morning daylight, soft whites, gentle highlights",
  },
};

const jobs = [
  { name: "man-track", anchor: "./DH Shots/Oral Drops Lifestyle/Semaglutide/man-gym.jpg", scene: "track" },
  { name: "man-kitchen", anchor: "./DH Shots/Oral Drops Lifestyle/Semaglutide/man-gym.jpg", scene: "kitchen" },
  { name: "woman-track", anchor: "./DH Shots/Oral Drops Lifestyle/Semaglutide/woman-gym.jpg", scene: "track" },
  { name: "woman-kitchen", anchor: "./DH Shots/Oral Drops Lifestyle/Semaglutide/woman-gym.jpg", scene: "kitchen" },
];

function buildPrompt(job) {
  const s = scenes[job.scene];
  return `Edit REFERENCE 2 by CHANGING ONLY the scene/background and lighting — from the indoor gym in REFERENCE 2 to ${s.sceneDesc}. Everything else in REFERENCE 2 must be preserved EXACTLY: the same hand (same gender, skin tone, nails if present), same natural grip and finger placement on the Dialed Health oral drop bottle, same bottle scale and orientation, same top-down overhead camera angle, same tight close-up crop, same composition and framing, same 5:4 ratio. Do NOT change the hand's pose, grip, or finger positions. Do NOT change the bottle's size or position in frame.

NEW SCENE: ${s.sceneDetails}. Replace the blurred gym background in REFERENCE 2 with this new blurred background at the same depth of field and blur intensity.

NEW LIGHTING: the scene's key light is ${s.keyLight} and the ambient fill is ${s.ambientTint}. RE-LIGHT the hand AND the bottle to match this new scene — specular highlights on skin, nails (if any), glass, the white plastic cap, and the rubber bulb tip must all point in the same direction consistent with the new key light. The bottle's white plastic surfaces and the hand's skin pick up ${s.ambientTint}. Cast shadow from the bottle: ${s.shadow}. The image's dynamic range, contrast, and grain should now reflect ${s.colorGrade} — the whole photo (hand + bottle) should read as if it was taken in the new scene, not composited.

REFERENCE 1 is the oral drop product studio shot: use it ONLY to confirm the label artwork. Do NOT paste REFERENCE 1 pixels; the label on the bottle in the output should be rendered fresh in the new scene's lighting. The label contains EXACTLY two elements: the Dialed Health heartbeat/ECG logo on top ('DIALED' on the left and 'HEALTH' on the right split by a thin white ECG pulse line) and the product name 'Semaglutide' in clean bold white sans-serif centered below on a single line. The product name must be sized LARGE and prominent, not small or cramped. That is ALL on the label — no dosing, no mg, no mL, no Rx, no QR, no barcode, no extra text. Do NOT invent label text.

Photorealistic, seamless scene-integrated lifestyle photograph. Editorial lifestyle quality, 4K, crisp focus, no artifacts, no hint of compositing. STRICTLY ONE SINGLE HAND.`;
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
    refImages: [PRODUCT_REF, job.anchor],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${jobs.length}] ${job.name} — generating (scene: ${job.scene}, anchor: ${path.basename(job.anchor)})...`);
  try {
    const stdout = execSync(
      `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
      { cwd: BASE, encoding: "utf-8" }
    );
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) { console.log(`  !! Could not parse Saved path`); continue; }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) { console.log(`  !! Saved file missing: ${savedPath}`); continue; }
    fs.copyFileSync(savedPath, destPath);
    console.log(`  -> ${path.basename(savedPath)} -> Semaglutide/${job.name}.jpg`);
  } catch (err) {
    console.log(`  !! Generation error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
