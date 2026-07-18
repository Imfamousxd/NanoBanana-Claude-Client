#!/usr/bin/env node
// Dialed x UFC — clip 03: cast shadow of jumping jacks on a dark wall, cool light.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip03-jump-rope-shadow-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic cinematic MMA fight-trailer clip. The hero subject of the entire shot is the CAST SHADOW of a boxer skipping rope — projected sharp and large onto a dark interior wall inside a dim training room. The person themselves is OFF-SCREEN; we only see their crisp dark silhouette shadow on the wall and a faint kiss of shadow from their feet landing on the floor along the bottom edge of the frame. ACTION (in shadow only): a male athlete is JUMPING ROPE at a confident boxer cadence — his shadow stands compact, arms held low at his sides with elbows lightly tucked, wrists making small fast circular flicks as he turns the rope, body executing small efficient bouncing hops on the balls of his feet. The ROPE itself is clearly visible in shadow — a thin sharp dark arc that whips OVER the head and back UNDER the feet on each rotation, the rope's shadow snapping crisply as it passes the floor with each rep. Roughly 6–8 quick rope-skip reps over the 5-second clip. The shadow stays sharp-edged with subtle soft falloff at the rope's farthest extension. SURFACE: a dark gray painted concrete or brick wall with subtle texture, faint imperfections, a slight cool sheen from the light — same gym wall feel as the previous bag clip for continuity. The wall fills the entire 9:16 frame, the cast shadow occupies the centre of the frame from roughly knee-height to just above the head of the shadow, with the rope's arc reaching up near the top of the frame at full extension. LIGHTING: a single HARD cool teal-blue practical light source positioned off-screen camera-LEFT, low, and somewhat distant — this is the only meaningful light source, motivated as if from a single industrial wall sconce or a fight-prep work light; it bathes the entire wall in a cool teal-cyan wash with subtle hot-spot near the left edge of the frame and gentle falloff into deeper navy on the right. Fine dust motes drift through the beam. Atmospheric haze. CAMERA: locked off, almost still, with very subtle organic handheld float and a slow controlled push-in toward the wall over the duration of the clip — feels like a real cinema camera on sticks with a hint of micro-shake. ~35mm equivalent lens, sharp focus on the wall texture and the shadow edge. COLOR: cinematic filmic grade — deep cool teal shadows, midnight-blue blacks, slightly desaturated, controlled highlight rolloff, visible fine 35mm grain. The shadow itself is rich pure black; the lit wall is moody cool blue-teal. Hyper-realistic, raw, gritty premium MMA trailer aesthetic. NO FACE visible (the person is entirely off-screen — only the shadow is in frame). No text, no logos, no watermarks. AUDIO: the rhythmic light SLAP of a skipping rope hitting the gym floor on each rotation, soft quick footfalls of the athlete bouncing on the balls of his feet, the faint whoosh of the rope cutting through the air, controlled steady breathing of the off-screen athlete, faint distant gym ambient hum, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (jumping-jacks shadow, 1080p)...`);
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
