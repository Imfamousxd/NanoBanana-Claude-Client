#!/usr/bin/env node
// Dialed x UFC — clip 06: bag-POV — fighter throws power combos straight into the camera plane.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip06-bag-pov-v3-1080p.mp4");

const VIDEO_PROMPT = `Raw documentary-style POV close-up shot looking from the HEAVY BAG'S point of view as a male boxer pounds it during a training round inside a dim gym. The camera is mounted exactly where the heavy bag hangs, lens facing the fighter, so every punch he throws lands directly AT the camera plane — his knuckles smash forward into the lens with each strike. Shot on an ARRI Alexa Mini LF with a vintage Cooke S7/i anamorphic prime at T2.3, 24fps with a standard 180-degree shutter — natural in-camera motion blur on fast-moving limbs at REAL-TIME normal playback speed. THIS IS NOT SLOW MOTION. Everything plays at real boxing speed. The fighter's FACE and head are completely cropped ABOVE the frame and never visible — only his upper chest, shoulders, lats, arms, gloves and the front of his dark sweat-soaked t-shirt are in shot, filling the centre of the 9:16 frame. He wears matte-black boxing-style bag gloves (worn, scuffed, slightly dust-marked), black hand wraps poking out at the wrists, and a fitted dark heather-grey moisture-wicking shirt with no graphics, the fabric darkened and creased with sweat. Visible muscle tension in the deltoids, traps, and lats. ACTION: TWO full jab-hook-cross combos at REAL BOXING SPEED, executed back-to-back across the 5 seconds at normal real-time playback. NOT slow motion. Each individual combo takes about 1.0–1.3 seconds total — fast, fluid, professional fight-camp tempo.

FIRST COMBO (roughly 0.2s–1.4s):
- ~0.2s: settled stance, gloves up at temples in a tight high guard.
- ~0.3s: JAB — LEAD hand (the glove on the camera-RIGHT side of frame) snaps straight forward and smashes the centre of the lens. Wrist locks out, knuckles aligned, then snaps back to guard in a single fast motion (~0.2s arc total).
- ~0.6s: LEAD HOOK — same lead hand reloads briefly and whips around in a tight horizontal arc, the glove cutting from camera-right to camera-left across the frame and smashing the side of the lens at the apex. Lead shoulder rotates aggressively. (~0.3s arc total).
- ~1.0s: REAR CROSS — KILL SHOT — REAR hand (the glove on the camera-LEFT side of frame) explodes diagonally forward with full body torque behind it: rear shoulder drives forward, off-frame rear hip rotates fully, lat and oblique contract, wrist locks out at maximum extension as the glove SMASHES dead centre into the lens with the heaviest impact of the three. (~0.4s arc, slightly longer travel because it's the power shot).
- ~1.4s: snap-back to high guard.

BAG/CAMERA REACTION + BRIEF RESET (1.4s–2.6s): the camera (mounted to the bag) swings back hard on the chain from the kill-shot impact then slowly settles, chain rattling overhead, faint dust pops drifting through the cool light, fighter exhales hard and briefly resets stance shifting his weight, still in fighting posture — readable BREATHING-ROOM moment, not slow motion, just a real pause between combos.

SECOND COMBO (roughly 2.6s–3.8s): same JAB → LEAD HOOK → REAR CROSS combo, identical mechanics, identical pacing — ~0.3s, ~0.3s, ~0.4s for the three punches. The second cross also smashes the centre of the lens hard.

POST-SECOND-COMBO (3.8s–5.0s): snap-back to guard, bag swings/chain rattles again, fighter holds high guard breathing hard and ready to throw again, slight stance reset — this is NOT a slow-mo coda, the bag continues to swing and the fighter continues moving naturally at real-time speed.

Throughout: NATURAL motion blur on the fast-moving fists from the 180-degree shutter — directional streaks behind each glove at peak velocity, crisping up sharply at lock-out and at the guard position. This is real-camera in-camera motion blur, NOT slow motion. Forearms ripple, veins ride proud, no extra random punches — only the six total named strikes (two combos of three). Sweat droplets fling off the gloves, forearms and shoulders toward the lens on each snap-back, propelled hard. Visible puffs of canvas dust pop off the bag (just below the lens) with each strike. CAMERA: rock-mounted to the bag so the entire frame TRANSLATES slightly with each impact — the camera SWINGS subtly back on the chain with every committed punch then settles, transferring the kinetic feel of the strike to the viewer; on the biggest power shots the camera flinches and shudders harder; subtle organic micro-shake throughout; occasional brief focus-hunt micro-moment as a fast fist enters the close plane; anamorphic 2x squeeze giving vertical streaks to the cool light highlights and oval out-of-focus bokeh in the background. ~35mm anamorphic-equivalent lens, very shallow depth of field — the sharp plane is on the knuckles and forearm at full extension, the body and background soften into bokeh. LIGHTING: a single hard cool teal-blue practical key (motivated as a tungsten work-light gel'd full CTB) positioned high camera-LEFT, raking down across the fighter's shoulders, lats and the side of his torso; deep navy shadows everywhere else; a faint cooler-still rim from camera-right kissing the outside edge of the rear shoulder. Sharp anamorphic horizontal LENS FLARE streaks across the frame each time a glove punches into the key light. Subtle halation glow around the brightest highlights. Fine dust motes drift through the cool beam, scattered by the bag-impact concussions. SETTING: dark out-of-focus interior gym in the deep background — barely readable, dark grey concrete texture lost in shadow and anamorphic bokeh; a hint of the bag's chain may be visible at the very top edge of the frame. COLOR: Alexa LogC graded with a cool teal shadow lift and slightly desaturated midtones, controlled highlight rolloff, organic 35mm film-grade grain, very slight sensor noise in the deepest shadows, gentle chromatic aberration at the frame edges. Raw, gritty, imperfect — feels like a real cinematographer's bag-cam grab during a fight-camp shoot, NOT a polished render. NO text, NO logos, NO watermarks, NO face. AUDIO: real-time real-boxing sound design with no slow-motion processing. Two combos packed close together. Combo 1: a rapid whp-THWAP-WHUMP (jab, hook, cross) with clipped nose exhales (sh-HFF-HUH) timed to each — the whole combo lands in just over a second. Then chain rattling, the fighter breathing hard, a brief beat. Combo 2: another rapid whp-THWAP-WHUMP cluster with the same exhale cadence. The chain creaks and rattles overhead between and after the combos as the bag swings from impact, the creak of damp leather gloves and fabric stretching with each torque, a quiet gym ambient hum in the background, no music.`;

console.log(`Submitting clip 6 to ${REPLICATE_MODEL} (bag-POV, 1080p)...`);
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
console.log(`clip 6 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 6 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 6 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 6 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
