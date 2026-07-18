#!/usr/bin/env node
// Dialed x UFC — clip 02: shadow runner, night, rain, cool teal lighting (faceless)
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

const VIDEO_OUT = path.join(__dirname, "clips/clip02-shadow-runner-rain-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic cinematic MMA fight-trailer clip. A lone athletic SHADOW FIGURE — a fighter on a late-night training run — sprints along a wet empty city street. The figure is rendered almost entirely as a black SILHOUETTE against the rain and the cool backlight; their face is completely obscured, hidden inside the hood of a dark soaked hoodie pulled low, and never visible. Build, posture, athletic stride and clenched fists read clearly through the silhouette. They wear a dark hooded sweatshirt, plain dark joggers, and running shoes; the soaked clothing clings to their muscular frame. Steam rises off their shoulders. ACTION: full-speed running, real athletic gait, hard exhales misting in the cold air, arms pumping, feet hammering puddles — each footfall sends a sharp spray of water up into the rim light. The runner moves left-to-right across the frame in a controlled sprint. SETTING: a deserted nighttime city block — slick black wet asphalt mirror-reflecting the lights, narrow puddles all over the road, a chainlink fence and dark industrial buildings receding into the background, a single distant cool-blue sodium-vapor streetlight casting a halo of light through the heavy rain, faint vapor and mist hanging in the air. Heavy steady rain falls through the entire frame, individual rain streaks catching the cool light. LIGHTING: backlit / rim-lit setup — the dominant light source is the distant cool teal-blue streetlight BEHIND the runner, throwing a cinematic rim around their hood, shoulders and the silhouette of their arm pump; their front is in deep shadow. A faint warm sodium kick from off-screen camera-right edges just barely on the wet pavement. Rain droplets sparkle as they pass through the backlight. CAMERA: low side-tracking shot, parallel to the runner, locked on roughly hip-to-shoulder height, dolly tracking alongside them at running speed so they stay framed while the background streaks past with strong horizontal motion blur; very subtle organic handheld float; slight rack-focus that resolves crisp on the figure mid-clip. ~35mm equivalent lens, shallow depth of field, deep cinematic 2.39 wide feel inside the 9:16 frame. COLOR: cool teal-blue shadows, slightly desaturated, controlled highlight rolloff on the wet asphalt reflections and rain streaks, fine 35mm grain — matches the dark cool theme of the gym clips. Hyper-realistic human running mechanics, no cartoonish exaggeration. NO FACE visible at any point, NO TEXT, NO LOGOS, NO WATERMARKS. AUDIO: heavy rain hissing on pavement, sharp wet footfalls splashing through puddles, the runner's rhythmic controlled breathing and short fogged-breath exhales, distant low ambient city rumble, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (text-to-video, 1080p)...`);
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
