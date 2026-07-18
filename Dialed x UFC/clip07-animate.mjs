#!/usr/bin/env node
// Dialed x UFC — clip 07: profile side-on shadow boxing, full kinetic chain visible.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip07-profile-shadowbox-1080p.mp4");

const VIDEO_PROMPT = `Raw documentary-style cinematic side-PROFILE shot of a male boxer shadow boxing inside a dim training gym. The camera sits at chest height directly to the boxer's LEFT side so we see his full body in PROFILE — he stands centered in the 9:16 frame and faces camera-RIGHT, throwing his punches out toward the right edge of the frame. Visible: head, shoulders, full torso, both arms, hips, legs, feet — the whole kinetic chain of every punch. His face stays in DEEP SHADOW (the cool key light is behind/above him so the front of his head and face are heavily underexposed and not readable); the chin, jawline and back of the head edge with a thin rim of cool light but his identity is obscured by the low light. Shot on an ARRI Alexa Mini LF with a vintage Cooke S7/i anamorphic prime at T2.3, 180-degree shutter at 24fps producing real slow-shutter motion blur on the moving limbs. He is SHIRTLESS, lean and muscular with visible sweat sheen across his back, shoulders, chest and abs (lit cool by the rim); he wears plain matte-black boxing-style bag gloves, black hand wraps poking out at the wrists, plain matte-black training shorts, bare feet on a dark resin gym floor. ACTION: he is shadow boxing at FULL FIGHT-CAMP INTENSITY — fast and heavy combos with the entire body driving every shot. Mix of fast setup jabs and committed power shots: jab-jab-CROSS (rear-hand cross firing straight to camera-right with full hip rotation), slip, jab-CROSS-HOOK (lead hook whipping across in front of him with the shoulder dipping into the rotation), reset on the back foot, jab-CROSS-HOOK-CROSS finishing on a maximum-effort kill-shot rear cross. Roughly 8–11 punches in the 5 seconds. On EVERY committed punch the full kinetic chain is visible: rear foot pivots hard on the resin floor (heel lifting, ball of foot torquing as the hip rotates), hips rotate fully through the shot, the obliques and lats contract visibly, the rear shoulder drives forward as the arm extends, the wrist locks out at full extension. Between combos he bobs his head, slips off the centerline, dips and resets stance. The lead foot stays planted, the rear foot pivots violently. Sweat droplets fling off his shoulders, hair and forearms on every retract — fat heavy droplets propelled hard, themselves streaking in the long exposure. At peak velocity arms smear into long aggressive directional motion-blur streaks with multiple ghost trails — blur comes entirely from real fast limb movement, NOT a static overlay. CAMERA: handheld operator-held documentary feel, framed slightly low so we look slightly UP at him, very subtle organic micro-shake throughout; on EACH heavy committed power shot the camera FLINCHES ever so slightly; very subtle slow push-in over the 5 seconds; anamorphic 2x squeeze giving vertical streaks to the cool light highlights and oval out-of-focus bokeh in the background. ~35mm anamorphic-equivalent lens, shallow depth of field with the fighter's torso and rear shoulder in sharp plane, the front fist softening just slightly at full extension because of the shallow DOF. LIGHTING: a single hard cool teal-blue practical key (motivated as a tungsten work-light gel'd full CTB) positioned BEHIND and slightly ABOVE the fighter, rim-lighting his back, shoulders, lats, biceps, hamstrings, calves, the top of his head and the back of his gloves with a strong cool teal halo and a bloom of volumetric atmosphere; the front of his body (the camera-left side) and his face are buried in deep navy shadow with just enough cool bounce to read muscle definition and sweat sheen — readable but very dark. Sharp anamorphic horizontal LENS FLARE streaks across the frame from the cool key whenever the fighter's body passes through the brightest part of the beam. Subtle halation glow around the rim-lit highlights. Fine dust motes drift through the cool beam, scattered by his sudden movements. SETTING: dim concrete training-room interior — dark grey painted brick wall in the deep background (continuity with the gym established in earlier clips), dark resin floor, a hint of a heavy bag hanging just off-frame to the right, a faint suggestion of a recessed door receded into shadow further back; the background mostly lost in cool atmospheric haze and shallow-DOF bokeh. COLOR: Alexa LogC graded with a cool teal shadow lift and slightly desaturated midtones, controlled highlight rolloff, organic 35mm film-grade grain, very slight sensor noise in the deepest shadows, gentle chromatic aberration at the frame edges. Raw, gritty, imperfect — feels like a real cinematographer's b-camera grab during a fight-camp shoot, NOT a polished render. NO text, NO logos, NO watermarks, NO readable face. AUDIO: a barrage of punches mixing sharp light air-WHIPS on the fast jabs with deep heavy thudding air-POPS on the committed power shots (whp-whp-THWUMP, whp-THWUMP-WHUMP), fast clipped nose exhales (sh sh) on the jabs and harder gut-driven exhales (HUH! HFF!) on the power shots, the squeak and torque of bare feet pivoting on the resin floor, the creak of damp leather gloves, a quiet gym ambient hum in the background, no music.`;

console.log(`Submitting clip 7 to ${REPLICATE_MODEL} (profile shadow box, 1080p)...`);
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
console.log(`clip 7 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 7 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 7 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 7 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
