#!/usr/bin/env node
// Dialed x UFC — clip 01: heavy bag cross→hook→cross combo (faceless)
// Text-to-video via bytedance/seedance-2.0, 9:16, 5s, native audio.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(repoRoot, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = "bytedance/seedance-2.0";

const VIDEO_OUT = path.join(__dirname, "clips/clip01-bag-combo-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic MMA fight-trailer clip, fast-paced and cinematic, shot in a dim modern training gym. FRAMING: low-angle handheld camera at roughly chest height, tight on a single lean athletic male fighter's TORSO, SHOULDERS, ARMS and GLOVES as he punches a large black heavy bag — his FACE IS CROPPED OUT ABOVE THE TOP OF THE FRAME and never enters shot at any point. Only his body from the upper chest / collarbone down is visible, plus his bare feet pivoting on a dark resin-coated concrete floor. He wears plain matte-black training shorts, a fitted dark heather-grey t-shirt with no graphics, black hand wraps, and matte-black boxing-style bag gloves. ACTION: he fires a fast, real-mechanics three-punch combo into the bag — sharp REAR CROSS (right glove driving straight through frame into the canvas with a heavy thudding impact, lat and rear deltoid flexing under the rim light, hip rotating fully), immediate retraction back to a tight guard, then a short whipping LEAD HOOK (left glove arcs across frame with a clear motion-blur trail from the fast limb, knuckles smacking into the side of the bag), then a final HARD REAR CROSS straight into the bag's centre mass — bag jolts off-axis, twists hard on its thick black chain, the chain creaks and rattles overhead, fine puffs of canvas dust kick off each impact. Bare feet shuffle and pivot in small controlled steps. Sweat sheens his forearms and shoulders. CAMERA: subtle organic handheld float with a slow controlled push-in toward the fighter and bag over the duration of the clip; camera flinches almost imperceptibly with each strike. LIGHTING: single cool teal-white key light from camera-left raking across the deltoids, lat, and the side of the bag; deep moody shadows everywhere else; soft warm rim on the back shoulder; atmospheric haze; fine dust motes catching the key light. Background: dark gray painted brick wall, deep matte-black recessed security door receded into shadow. COLOR: cinematic filmic grade, cool teal shadows, slightly desaturated midtones, controlled highlight rolloff, fine 35mm grain. Real martial-arts mechanics — no cartoonish exaggeration, no slow-motion (full speed combo), no extra people, no text or logos visible anywhere, no watermarks. ABSOLUTELY NO FACE visible at any point — head stays cropped above the frame for the entire shot. AUDIO: heavy meaty glove-on-canvas THUD on each punch, audible chain creak and rattle as the bag swings, sharp short breath exhales through the nose timed to each strike, faint background rumble of an empty gym, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (text-to-video, no start frame)...`);
const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
  body: JSON.stringify({
    input: {
      prompt: VIDEO_PROMPT,
      duration: 5,
      resolution: "1080p",
      aspect_ratio: "9:16",
      generate_audio: true,
    },
  }),
});

if (!create.ok) {
  console.error("Create failed:", create.status, await create.text());
  process.exit(1);
}

let pred = await create.json();
console.log(`pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
