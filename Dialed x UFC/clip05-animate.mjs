#!/usr/bin/env node
// Dialed x UFC — clip 05: close-up hands shadow boxing, raw real-camera feel.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip05-hands-shadowbox-v3-1080p.mp4");

const VIDEO_PROMPT = `Raw documentary-style close-up shot of a male boxer's HANDS and FOREARMS shadow-boxing at full speed inside a dim training gym. Shot on an ARRI Alexa Mini LF with a vintage Cooke S7/i anamorphic prime at T2.3, 180-degree shutter at 24fps producing real slow-shutter motion blur on the moving limbs. The frame holds his hands, wrists, FOREARMS, ELBOWS, UPPER ARMS, and the front edge of his shoulder/upper chest/lat — pulled back just enough that the body-torque behind every punch is visible through the rotating upper arm and dipping shoulder. Face, head and the rest of his torso stay entirely above and outside frame and never appear. He is bare-handed with thin black hand wraps wound tightly around his knuckles and wrists; the wraps are scuffed, slightly frayed at the edges, and stained with old sweat; veins ride visibly along the forearms; faint sweat sheen and a hairline scrape on one knuckle. He wears a dark heather-grey moisture-wicking long-sleeve pushed up to the elbows, the fabric creased and damp. ACTION: this is FAST AND HEAVY shadow boxing — world-class hand speed with full-bodied POWER behind every shot. The cadence mixes fast set-up jabs with bone-rattling committed bombs: jab-jab-CROSS (huge), slip, jab-CROSS-HOOK (huge), reset, double jab, jab-CROSS-HOOK-CROSS (the last cross a maximum-effort kill shot). Roughly 9–12 punches over the 5 seconds, with several being clearly heavy power shots, not pitter-patter. On EVERY committed punch you can see the body-torque drive it: his upper arm rotates HARD into extension, the elbow whipping forward as the shoulder and lat visibly dip and torque inside the frame (hinting at the hip rotation off-frame); the rear-hand cross commits his entire body into the line of the punch; the lead hook arcs across the frame with the whole shoulder rotating behind it; the wrist LOCKS OUT crisply at full extension, knuckles aligned, forearm visibly tensed with veins and tendons popping under the strain. The retraction is a violent snap-back, not a gentle return — the fist whips back to a tight high guard at his temple with as much force as the throw. At peak velocity the hands and forearms smear into long aggressive directional motion-blur streaks with multiple ghost trails layered behind each fist; the blur is intense but the wrist crisps up clean at the lock-out moment of each power shot before re-blurring on the retract. Fat heavy droplets of sweat fling OFF the forearms and out of the air around each big punch on the retract — propelled hard, not gently misted, and themselves streaking from the slow shutter. Forearm muscles bulge, veins ride proud, tendons strain in close-up detail. The blur comes entirely from real fast limb movement and the long-exposure shutter — not a painted overlay. CAMERA: handheld operator-held documentary feel, framed loose with the arms drifting slightly off-centre, very subtle organic micro-shake; on EACH heavy committed power shot the camera FLINCHES ever so slightly — a tiny involuntary jolt as if the air-pop and recoil of the punch reaches the camera op — adding to the feel of impact; occasional very brief focus-hunt micro-moment as the autofocus catches a fast fist; anamorphic 2x squeeze giving slight vertical streak to the cool light highlights and oval out-of-focus bokeh in the background. ~35mm anamorphic-equivalent lens, very shallow depth of field — the sharp plane is on the knuckles and forearm at full extension, the background falls into deep bokeh'd void. LIGHTING: a single hard cool teal-blue practical key (motivated as a tungsten work-light gel'd full CTB) positioned high camera-LEFT, raking across the top of the forearms and gilding the edge of each knuckle as it punches into the lit zone; deep navy shadows everywhere else; a faint cooler-still rim from behind kissing the outside edge of the rear hand. Sharp anamorphic horizontal LENS FLARE streaks across the frame each time a fist punches into the key light. Subtle halation glow around the brightest knuckle highlights. Fine dust motes drift through the cool beam. SETTING: dark out-of-focus interior gym wall in the deep background — barely readable, dark grey concrete texture, lost in shadow and anamorphic bokeh. COLOR: Alexa LogC graded with a cool teal shadow lift and slightly desaturated midtones, controlled highlight rolloff, organic 35mm film-grade grain, very slight sensor noise in the deepest shadows, gentle chromatic aberration at the frame edges. Raw, gritty, imperfect — feels like a real cinematographer's b-camera grab during a real fight-camp shoot, NOT a polished render. NO text, NO logos, NO watermarks, NO face. AUDIO: a barrage of punches mixing sharp light air-WHIPS on the fast jabs with deep heavy thudding air-POPS on the committed power shots (whp-whp-THWUMP, whp-THWUMP-WHUMP, whp-whp-THWUMP-WHUMP), real boxing-room acoustics — you can hear the difference between a setup tap and a kill shot. Fast clipped breath exhales through the nose on the jabs (sh-sh) and harder gut-driven exhales (HUH! HFF!) on the power shots, the creak of damp fabric stretching with each torque, a quiet gym ambient hum in the background, no music.`;

console.log(`Submitting to ${REPLICATE_MODEL} (hands shadow-boxing close-up, 1080p)...`);
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
