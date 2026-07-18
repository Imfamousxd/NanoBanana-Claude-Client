#!/usr/bin/env node
// Dialed x UFC — clip 02 v2: cinematic drone follow of a runner on a wet street at night
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

const VIDEO_OUT = path.join(__dirname, "clips/clip02-drone-runner-rain-v3-1080p.mp4");

const VIDEO_PROMPT = `Raw hyperrealistic in-motion drone shot of a male MMA athlete sprinting at FULL SPEED along an empty wet road on the outskirts of a city before dawn. Documentary intensity, not polished — gritty, urgent, alive. The runner is a fully photoreal human — NOT a silhouette, NOT a cutout — lit dimly by ambient cool pre-dawn light and distant streetlamps; his identity reads vaguely because of the low light, weather, and speed, but his muscular athletic build, real running mechanics, pumping arms, and explosive stride are completely readable, with visible muscle tone, soaked fabric texture, sweat and rain sheen on his skin. He wears a dark moisture-wicking long-sleeve training shirt soaked through and clinging to his frame, dark athletic joggers, and dark running shoes; wet hair plastered to his head; faint steam rising off his shoulders and out of his mouth in hard fogged exhales. ACTION: he is running AS FAST AS HE CAN — not jogging — every stride a powerful explosive piston, body leaned forward in a hard sprint, arms pumping HARD and FAST at chest level, feet hammering down through shallow puddles, each footfall blasting clean sharp arcs of water spray into the air around his legs. His face is tense and focused. INTENSE SLOW-SHUTTER MOTION BLUR driven by the speed of his moving body: his arms streak with long motion-blur trails on every pump because they are moving so fast; his pumping legs blur from the knee down with each stride; the rain falling around him becomes long luminous teal-blue streaks because of the long exposure; the wet asphalt under him smears into a horizontal speed-streak; only his torso and head stay relatively sharp (because the drone is tracking with him at his exact speed). The motion blur comes from the visibly moving limbs and the camera-relative movement of the world, NOT from a static overlay. CAMERA: aggressive low-altitude drone follow — roughly 3–4 metres up, just behind and slightly above him at ~35° downward angle, tracking with him at exactly his sprint speed so he stays anchored in the lower-centre of the 9:16 frame while the wet road blasts past beneath him with violent horizontal motion blur; very subtle organic gimbal float for raw documentary feel, occasional micro-shake; ~28mm equivalent wide lens for a slightly intense, immersive POV feel. SETTING: long straight wet asphalt road on the edge of a city before dawn — low warehouses, chainlink fence, a row of distant cool-blue sodium-vapor streetlamps spaced down the road that streak past in the motion blur; the wet road mirror-reflects the lights as long smeared streaks; thin mist hangs over the pavement. WEATHER: steady moderate rain falling through the entire frame, every droplet becoming a long luminous streak from the slow shutter. LIGHTING: dominant cool teal-blue ambient pre-dawn light with rim accents from the streetlights raking across the runner's shoulders and back of his head as he passes under each one; deep low-key shadows, the runner is dim and underexposed but still photoreal and detailed. COLOR: raw cinematic grade — cool teal-blue shadows, slightly desaturated, controlled highlight rolloff on wet asphalt and rain streaks, visible 35mm film grain, slight chromatic aberration at the edges for raw documentary realism. HYPER-REALISTIC AND RAW — feels like a real high-end DSLR slow-shutter drone frame, not animation. No text, no logos, no watermarks, no other people in frame, no vehicles. AUDIO: steady rain hissing on pavement, sharp wet footfalls splashing through puddles at rapid sprint cadence, the athlete's hard fast controlled breathing audible under the rain, distant low ambient city rumble, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (drone runner, 1080p)...`);
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
