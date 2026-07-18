#!/usr/bin/env node
// Dialed x UFC — clip 10: exterior night shot of the Las Vegas Sphere lit up for a fight night.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip10-sphere-fightnight-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic cinematic establishing shot of the SPHERE in Las Vegas at night — the massive iconic spherical LED-wrapped venue on the Las Vegas Strip near the Venetian, the entire exterior surface covered in seamless wraparound LEDs that display full-resolution content across the giant ball. The Sphere completely fills and dominates the 9:16 frame, rising up from the Strip street level into the dusky Vegas night sky. The Sphere is currently displaying high-impact MMA fight-night imagery across its full wraparound LED surface: a colossal stylized graphic of two muscular fighters facing off in fighting stance, both bodies rendered in dark heroic silhouette with cool teal-blue rim light catching their shoulders and gloves, with a glowing dynamic octagon-cage outline behind them in fiery red-orange, a large stylized fight-night title card (no real-world brand names or logos, just dramatic abstract typography that reads as event branding), and dynamic flame, light-flare and graphic-shape elements pulsing rhythmically. The Sphere's content is alive — the graphics are not static, they pulse and shift continuously across the LED surface as if a real broadcast graphics package were playing in real time. The colors emanating from the Sphere itself glow in a mix of fiery red/orange (the octagon and the bottom of the sphere) and cool teal-cyan/electric blue (the fighters and the upper sphere), spilling warm and cool light onto the surrounding streetscape and crowd. The Sphere is so bright it lights the whole block.

SURROUNDING SCENE: a busy Las Vegas Strip night below the Sphere — a swarm of small distant pedestrian silhouettes streaming toward the building's entrances; faint distant taxi headlights streaking the road on the left side; nearby buildings of the Strip just barely visible in the cool night haze; a faint suggestion of the Venetian's facade and other Vegas neon in the deep distant background, all softened by atmospheric haze and shallow DOF; a sliver of palm-tree silhouettes; the orange-glow Vegas light pollution warming the upper night sky behind the Sphere.

CAMERA: cinematic AERIAL DRONE shot — buttery smooth, DJI-Inspire-grade gimbal stabilisation, the drone slowly ORBITS the Sphere from medium-high elevation (roughly building height, about 100 metres up), moving laterally across the front of the building from camera-LEFT to camera-RIGHT over the full 5 seconds, gradually revealing different angles of the Sphere's LED content and the city behind it. The orbit is slow and controlled, never frantic, real production-drone footage feel; very subtle organic gimbal float, no shake. ~24mm equivalent wide lens.

LIGHTING + COLOR: night, real Vegas light pollution palette — deep navy sky overhead transitioning to a warmer orange glow on the horizon from city lights; the dominant light source in the immediate scene is the Sphere itself, throwing strong fiery red-orange and cool cyan-teal light across the surrounding street and onto faint atmospheric haze. The color grade is cinematic — Alexa LogC look with slightly desaturated midtones, controlled highlight rolloff on the bright Sphere LEDs, deep navy shadows in the night sky, fine 35mm film-grade grain, very gentle chromatic aberration at the frame edges. Hyper-realistic, IMAX-grade real-camera drone cinematography.

TECHNICAL: shot on an ARRI Alexa Mini LF mounted on a high-end cinema drone, real-time normal playback (NOT slow motion, NOT timelapse), natural in-camera motion blur consistent with a slow controlled drone orbit at 24fps.

NO real-world brand names (no "UFC" text, no "MGM", no "Sphere" wordmark, no real sponsor logos), no watermarks, no text overlays — just abstract dramatic fight-night graphics on the LED surface. The Sphere itself, however, IS the real iconic Las Vegas Sphere building. AUDIO: distant low rumble of Las Vegas Strip nighttime city ambient — faint car traffic, the distant murmur of a large crowd, occasional distant car horn, a low cinematic atmospheric drone-tone bedding the scene, no music.`;

console.log(`Submitting clip 10 to ${REPLICATE_MODEL} (Sphere fight night, 1080p)...`);
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
console.log(`clip 10 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 10 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 10 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 10 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
