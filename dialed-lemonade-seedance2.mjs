#!/usr/bin/env node
// Stage 2 only — animate the existing lemonade hero still with Seedance 2.0
// on Replicate, with native audio (water splash + ice + ambient).
// Max resolution for Seedance 2.0 is 720p (720×1280 for 9:16).
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

const STILL = "Dialed Moods Drink Short Animation/lemonade-reveal-still.png";
const VIDEO_OUT = "Dialed Moods Drink Short Animation/lemonade-reveal-seedance2.mp4";

const VIDEO_PROMPT = `Cinematic product reveal of a tall slim DIALED MOODS lemonade can. The camera slowly dollies in toward the can while gently arcing 15 degrees around it. The sculptural water ribbon already wrapping the can flows and reforms in elegant slow motion, droplets shimmer and refract warm yellow light. Several large clear ice cubes drift gently in mid-air around the can. Three fresh lemons — one whole, two halved with juicy yellow flesh visible — slowly rotate revealing their cut sides as they suspend around the can. The gold DIALED wordmark catches a luminous warm-white pulse of light that travels across the lettering. Subtle atmospheric mist and tiny dust particles drift past in slow motion. The deep cobalt-to-warm-yellow gradient backdrop pulses subtly with a warm bloom. Hyper-cinematic, hyper-realistic, slow elegant motion, polished motion blur, deep depth of field, premium beverage commercial. Soft ambient swelling synth music with delicate water-droplet sound design and a gentle ice clink as the cubes drift.`;

const dataUri = `data:image/png;base64,${fs.readFileSync(STILL).toString("base64")}`;

console.log(`Submitting to ${REPLICATE_MODEL}...`);
const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
  body: JSON.stringify({
    input: {
      image: dataUri,
      prompt: VIDEO_PROMPT,
      duration: 8,
      resolution: "720p",
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
