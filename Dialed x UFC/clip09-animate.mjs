#!/usr/bin/env node
// Dialed x UFC — clip 09: battle ropes hammering the floor, low-angle close-up.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip09-battle-ropes-1080p.mp4");

const VIDEO_PROMPT = `Raw documentary cinematic close-up shot of two thick heavy black BATTLE ROPES being hammered violently up and down against a dark resin floor inside a dim training room. A male athlete grips one rope end in each hand and snaps both arms up and down at maximum cadence — sending continuous powerful undulating waves rippling down the length of both ropes, each undulation crashing the rope ends into the floor with a heavy slap and kicking up a fine puff of dust. Shot on an ARRI Alexa Mini LF with a vintage Cooke S7/i anamorphic prime at T2.3, 24fps, normal 180-degree shutter, REAL-TIME normal playback speed — NOT slow motion.

FRAMING: low ground-level 9:16 camera positioned roughly 2 metres in front of the athlete, lens angled slightly UP toward him; the bottom third of the frame holds the dark resin floor where the rope ends slam down; the middle third holds the two thick ropes undulating in dynamic snake-like waves rising and falling; the top third holds the athlete's LOWER BODY — bare knees, thighs, the hem of his plain matte-black training shorts, the lower edge of a sweat-darkened dark grey training shirt — and a clear view of both his BARE HANDS gripping the rope ends down at his hips, arms pumping up and down fast in tight controlled pistons; his face, chest and head are entirely above the top of the frame and not visible.

ACTION — CONTINUOUS HIGH-INTENSITY ROPE WORK (5 SECONDS UNBROKEN): the ropes never stop moving for the entire clip. Both arms snap up to about waist height and slam back down toward the floor in fast continuous pistons at maximum rep cadence — roughly 8–10 full up-down cycles across the 5 seconds. Each downstroke whips a powerful wave down the rope, the rope end on the floor LIFTS and SLAMS hard with each cycle, a heavy thud and a small dust-puff popping off the floor on each slam. The two ropes move in slightly offset alternating rhythm so the visual is constant continuous kinetic motion. His thighs and calves visibly tense and shift weight with every rep; his shorts swing slightly with each effort; sweat droplets fling off his forearms and shins on each downstroke. Natural in-camera motion blur on the moving rope and the moving arms at real-time 24fps playback — NOT slow motion. The ropes themselves smear into clear directional waves during their fastest motion phases.

CAMERA: handheld operator-held documentary feel, very subtle organic micro-shake; slight occasional flinch each time the rope ends SLAM the floor in front of camera; anamorphic 2x squeeze giving vertical streaks on the cool light highlights and oval out-of-focus bokeh in the background; ~28mm anamorphic-equivalent wide lens for an immersive low-angle feel; shallow depth of field with the sharp plane on the rope ends and the floor in front of camera, the athlete's lower body slightly softer.

LIGHTING: a single hard cool teal-blue practical key (motivated as a tungsten work-light gel'd full CTB) positioned high camera-LEFT, raking down across the ropes, the floor, and the athlete's thighs — every undulation catches the cool key as it crests; deep navy shadows everywhere else; a faint cooler-still rim from camera-right kissing the back edge of the ropes. Sharp anamorphic horizontal LENS FLARE streaks across the frame whenever the rope ends snap through the brightest part of the key beam. Subtle halation glow around bright highlights. Fine dust motes from the floor drift through the cool beam continuously, scattered fresh with each rope slam.

SETTING: dim industrial training-room interior — dark grey painted brick wall faintly visible in the deep out-of-focus background (continuity with the gym established in earlier clips), dark resin/concrete floor with subtle scuff marks and dust scatter, the ropes anchored to a heavy iron ring or post somewhere off-frame behind the athlete; no other people, no other equipment in frame.

COLOR: Alexa LogC graded with cool teal shadow lift and slightly desaturated midtones, controlled highlight rolloff, organic 35mm film-grade grain, slight sensor noise in the deepest shadows, gentle chromatic aberration at the frame edges. Raw, gritty, imperfect — like a real cinematographer's b-camera grab during a fight-camp shoot, NOT a polished render.

NO text, NO logos, NO watermarks, NO face. AUDIO: heavy continuous rhythmic THUMP-THUMP-THUMP-THUMP of the two ropes slamming the floor in tight overlapping cadence, a low whip-snap sound from the ropes cutting through the air on each cycle, the athlete's hard rhythmic breathing through his nose synced to the cadence (HFF-HFF-HFF), the faint dry scuff of his bare feet on the resin floor as his weight shifts, ambient gym room tone in the background, no music.`;

console.log(`Submitting clip 9 to ${REPLICATE_MODEL} (battle ropes, 1080p)...`);
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
console.log(`clip 9 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 9 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 9 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 9 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
