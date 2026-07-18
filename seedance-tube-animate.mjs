#!/usr/bin/env node
import fs from "fs";
import path from "path";

const TOKEN = process.env.REPLICATE_API_TOKEN || fs.readFileSync(".env","utf8").split("\n").find(l=>l.startsWith("REPLICATE_API_TOKEN")).split("=")[1].trim();
const IMG = "generations/2026-05-15T19-54-43_A_cinematic_premium_product_photography.png";
const OUT = "generations/seedance-tube-launch.mp4";

const PROMPT = "A premium DIALED HEALTH protector tube is tossed upward and floats in mid-air against a deep moody cinematic backdrop. The tube slowly rotates 360 degrees around its vertical axis, revealing all sides of the cap and body. The embossed DIALED text on the black cap and HEALTH text on the white body glide into view and out as the tube turns. A luminous warm-white glow traces the edges of the tube and pulses along the DIALED HEALTH embossed lettering, energizing the silhouette. Dust particles and atmospheric haze drift past in slow motion. Subtle warm gold key-light from upper-left and cool blue rim-light from lower-right wrap around the tube as it rotates, with cinematic motion blur on the spin. Soft mirror ground reflection follows the tube's motion. Ultra-cinematic, hyper-realistic, premium product reveal, slow elegant motion.";

const dataUri = `data:image/png;base64,${fs.readFileSync(IMG).toString("base64")}`;

console.log("Submitting to Seedance 1 Pro...");
const create = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-1-pro/predictions", {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
  body: JSON.stringify({
    input: {
      image: dataUri,
      prompt: PROMPT,
      duration: 5,
      resolution: "1080p",
      fps: 24,
      camera_fixed: false,
    },
  }),
});

if (!create.ok) {
  console.error("Create failed:", create.status, await create.text());
  process.exit(1);
}

let pred = await create.json();
console.log("ID:", pred.id, "status:", pred.status);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
  pred = await r.json();
  console.log("status:", pred.status, pred.logs ? `(${pred.logs.split("\n").pop()})` : "");
}

if (pred.status !== "succeeded") {
  console.error("Prediction failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log("Video URL:", videoUrl);

const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(OUT, buf);
console.log(`Saved: ${OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
