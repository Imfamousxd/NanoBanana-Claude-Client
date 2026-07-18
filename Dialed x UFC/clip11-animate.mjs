#!/usr/bin/env node
// Dialed x UFC — clip 11: realistic aerial drone shot of a city skyline + stadium at night, fight-night atmosphere.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip11-stadium-skyline-1080p.mp4");

const VIDEO_PROMPT = `Hyperrealistic cinematic aerial DRONE shot of a major modern indoor sports ARENA on the edge of a dense city skyline at night, on the night of a sold-out big-ticket combat-sports event. The arena is the visual anchor of the frame — a large modern round-rectangular bowl-shaped venue with a glowing roofline and a fully lit exterior facade, sitting in the foreground/mid-ground of the shot. Its dome and concourse blaze with bright white and cool blue exterior light, warm interior glow leaking out from concourse windows, with massive cool-blue and warm-orange architectural floodlights pointing skyward from the rooftop and the surrounding plaza. Beyond/behind the arena, a dense modern city skyline of dark high-rise towers with thousands of warm-yellow and cool-blue window lights pricks the night, extending toward the horizon. The deep night sky above is a rich navy-to-black gradient with a faint warm sodium light-pollution wash glowing along the horizon.

EVENT ATMOSPHERE: surrounding the arena, the plaza and parking lots are clearly busy with a fight-night crowd — thousands of tiny pedestrian dot-silhouettes streaming in toward the venue entrances, brake-light rivers and headlights flowing along the streets feeding the arena, packed parking lots, the queue lines snaking around the building lit by the building's exterior glow. There is a strong sense of event arrival — but no readable brand logos, no recognizable sponsor names on the building, no text on any banners or screens.

CAMERA: cinematic high-end production drone shot, buttery smooth gimbal stabilisation (DJI-Inspire / Sony FX6 drone-cam feel), the drone moves in a slow controlled FORWARD push toward the arena from a slightly elevated position (~150 metres up), gradually descending and closing distance over the full 5 seconds so the arena grows in frame and more of the surrounding city and crowd activity reveals itself; very subtle organic gimbal float, no shake; ~24mm equivalent wide lens, real production-drone footage feel. REAL-TIME normal playback speed, NOT slow motion, NOT timelapse.

LIGHTING + COLOR: a moody cinematic night palette — cool teal-cyan and warm-amber city lights mixing across the cityscape, the arena itself the dominant pool of bright light in the frame. Deep navy shadows in the sky and unlit building faces. Light atmospheric haze softens the distant skyline. The grade is a cinematic Alexa LogC look — slightly desaturated, controlled highlight rolloff on the bright stadium lights, fine 35mm film-grade grain, very gentle chromatic aberration at the frame edges. Hyper-realistic, IMAX-grade real-camera drone cinematography.

TECHNICAL: shot on an ARRI Alexa Mini LF mounted on a high-end cinema drone, 24fps natural in-camera motion blur consistent with a slow forward drone push.

NO real-world venue names, NO real-world brand names or sponsor logos, NO text overlays of any kind. Generic but believable modern arena and modern city skyline. No watermarks. AUDIO: distant low rumble of city ambient — faint car traffic on the streets feeding the arena, the distant murmur of a huge gathering crowd, occasional faint car horn, distant police-escort siren in the background, a low cinematic atmospheric drone-rotor whoosh and a deep ambient pad, no music.`;

console.log(`Submitting clip 11 to ${REPLICATE_MODEL} (stadium skyline, 1080p)...`);
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
console.log(`clip 11 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 11 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 11 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 11 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
