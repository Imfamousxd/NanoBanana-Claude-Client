#!/usr/bin/env node
// Re-fire the 3 missing Seedance shots SEQUENTIALLY with delays to respect
// the low-credit Replicate rate limit (1 burst / minute).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = "bytedance/seedance-2.0";

const SHOTS_DIR = "Dialed Moods Drink Short Animation/shots";
const STILL = "Dialed Moods Drink Short Animation/lemonade-reveal-still.png";
const dataUri = `data:image/png;base64,${fs.readFileSync(STILL).toString("base64")}`;

const SHOTS = [
  {
    name: "01-macro-drop",
    prompt: "EXTREME MACRO close-up of the top half of a tall slim Dialed Moods Lemonade can with metallic black cap. A single fat crystal-clear water droplet falls from above in ULTRA slow motion and lands on the cap with a crystalline ripple radiating outward. Tiny suspended droplets shimmer in the air. Warm yellow rim-light catches the droplet mid-fall. Subtle DIALED gold wordmark glints in the lower frame. Deep cobalt-to-yellow gradient backdrop with soft warm bloom. Hyper-realistic slow-motion product macro, 240fps slow-mo feel, deep depth of field, glossy specular highlights. No camera shake.",
    duration: 5,
  },
  {
    name: "02-whirl-fast",
    prompt: "DYNAMIC LOW-ANGLE shot of a tall slim Dialed Moods Lemonade can at center frame. A powerful sculptural water arc WHIRLS rapidly around the can in a fast spiraling motion, ice cubes streak past in punchy motion blur, fresh lemon halves whip into frame from the left and right. The camera does a tight aggressive 90-degree orbit around the can while the water spirals. The DIALED gold wordmark flashes with light. Hyper-cinematic FAST PACED energy, snappy motion blur, deep saturated cobalt-to-yellow gradient backdrop with warm bloom. Premium beverage commercial speed. No camera shake.",
    duration: 5,
  },
  {
    name: "04-hero-pullback",
    prompt: "Begin with an EXTREME close-up on the gold 'DIALED' wordmark on the can's label — a luminous warm-white pulse of light travels across the gold letters. The camera SLOWLY DOLLIES BACKWARD and PULLS UP to reveal the full tall slim Dialed Moods Lemonade can in its hero composition: water arcing around it, large clear ice cubes suspended in mid-air, three fresh lemons (one whole, two halved) drifting around it, all against a deep cobalt-to-yellow gradient backdrop with a warm halo. The reveal feels controlled, confident, premium. Hyper-cinematic, hyper-realistic, smooth gimbal-like motion, deep depth of field, polished motion blur. No camera shake.",
    duration: 5,
  },
];

async function fireShot(shot, attempt = 1) {
  console.log(`[${shot.name}] submitting (attempt ${attempt})...`);
  const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
    body: JSON.stringify({
      input: {
        image: dataUri,
        prompt: shot.prompt,
        duration: shot.duration,
        resolution: "720p",
        aspect_ratio: "9:16",
        generate_audio: false,
      },
    }),
  });
  if (create.status === 429) {
    if (attempt > 5) throw new Error(`[${shot.name}] still rate-limited after 5 retries`);
    console.log(`[${shot.name}] 429 throttled, waiting 30s...`);
    await new Promise(r => setTimeout(r, 30000));
    return fireShot(shot, attempt + 1);
  }
  if (!create.ok) throw new Error(`[${shot.name}] HTTP ${create.status}: ${(await create.text()).slice(0, 200)}`);
  let pred = await create.json();
  console.log(`[${shot.name}] id=${pred.id} status=${pred.status}`);
  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    await new Promise(r => setTimeout(r, 5000));
    const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
    pred = await r.json();
  }
  if (pred.status !== "succeeded") throw new Error(`[${shot.name}] failed: ${JSON.stringify(pred.error)}`);
  const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const vr = await fetch(videoUrl);
  const buf = Buffer.from(await vr.arrayBuffer());
  const out = path.join(SHOTS_DIR, `${shot.name}.mp4`);
  fs.writeFileSync(out, buf);
  console.log(`[${shot.name}] ✓ saved ${out} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  return out;
}

for (const shot of SHOTS) {
  try {
    await fireShot(shot);
  } catch (e) {
    console.error(e.message);
  }
  // Pace between submissions to respect 1-burst/min limit
  console.log("waiting 15s before next shot...");
  await new Promise(r => setTimeout(r, 15000));
}

console.log("\nAll retry shots done.");
