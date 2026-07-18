#!/usr/bin/env node
// Dialed x UFC — clip 04: rear-view jump rope, deep low-key with cool rim light.
// Text-to-video via bytedance/seedance-2.0, 9:16, 5s, 1080p, native audio.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip04-rearview-jumprope-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic cinematic MMA fight-trailer clip. The camera sits BEHIND a male boxer who is jumping rope inside a dim training room. We see him from directly behind — his BACK, shoulders, the top of his head, the back of his arms — filling the centre of the 9:16 frame. He is a fully photoreal human (NOT a flat silhouette, NOT a cutout), but he is DEEPLY UNDEREXPOSED — rendered as a dark shape against a brighter background, with just enough subtle rim light to read his muscular back, traps, shoulders, and the curve of his arms. He wears plain matte-black training shorts and is shirtless; bare feet bouncing on a dark resin gym floor; small drops of sweat catch the rim light occasionally. ACTION: confident boxer cadence — small efficient hops on the balls of his feet, elbows tucked at his sides, wrists making small fast circular flicks. The ROPE is clearly visible as it whips OVER his head and back UNDER his feet on each rotation, the rope catching the cool light at its highest point — a thin sharp arc carving through the cool atmosphere above him. Roughly 6–8 quick rope-skip reps over the 5-second clip. His body bobs subtly with each jump. LIGHTING: deep low-key dramatic — the dominant light source is a single hard cool teal-blue practical light placed BEHIND HIM and slightly to his right, motivated as a gym work light or industrial wall sconce on the back wall; it throws a strong cool teal-cyan halo of light AROUND his body, blooms into volumetric haze, and rim-lights the edges of his shoulders, arms, head, and the rope at full extension. A second softer cool blue ambient bounce barely catches the side of his back. Everything in front of the camera (his back side) is buried in moody deep shadow — readable, but very dark. Fine dust motes drift through the cool beam, slow swirls in the volumetric atmosphere. SETTING: same dim concrete training-room aesthetic as the previous bag clips — dark resin floor, faint suggestion of a gray brick wall and a dark recessed door visible in the distance ahead of him, but mostly lost in the cool atmospheric haze and the bloom of the backlight. CAMERA: locked off, almost still, with very subtle organic handheld float and a slow controlled push-in toward the back of the fighter over the duration of the clip — feels like a real cinema camera on sticks with a hint of micro-shake. ~35mm equivalent lens, sharp focus on the fighter's back and the rope at full arc, shallow depth of field softening the background. COLOR: cinematic filmic grade — cool teal-blue highlights, deep navy blacks, slightly desaturated midtones, controlled highlight rolloff, visible fine 35mm grain. Hyper-realistic, raw, gritty premium MMA trailer aesthetic. NO FACE visible (he is facing away from camera the entire time). No text, no logos, no watermarks. AUDIO: the rhythmic light SLAP of the skipping rope hitting the gym floor on each rotation, soft quick footfalls of the athlete bouncing on the balls of his feet, the faint whoosh of the rope cutting through the air, the fighter's steady controlled breathing, faint distant gym ambient hum, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (rear-view jump rope, 1080p)...`);
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
