#!/usr/bin/env node
// Dialed x UFC — clip 08: front-facing close-up of hands shadow boxing AT camera, real-time lightning hands.
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

const VIDEO_OUT = path.join(__dirname, "clips/clip08-front-shadowbox-v3-1080p.mp4");

const VIDEO_PROMPT = `Raw documentary extreme close-up of a man's BARE WRAPPED FISTS punching the air at incomprehensible speed inside a moody dark studio space. The entire 5-second clip is one CONTINUOUS UNBROKEN FLURRY of punches into empty air — no pauses, no resets, no settled guard positions, no impact, no targets, no equipment. His fists are thrown forward and pulled back so fast in continuous succession that the air itself seems to ripple. The space in front of him is empty — only dark cool atmosphere and shadow ahead. He does not touch anything. There is nothing to hit.

FRAMING: 9:16 medium close-up on the man's upper chest, collarbone, base of neck, and BOTH of his arms — face/jaw entirely cropped above the top edge of the frame, but his shirtless upper-chest, deltoids, traps and clavicles VISIBLY ANCHOR THE BOTTOM AND SIDES of the frame so it is unmistakable that BOTH of the moving fists belong to ONE single fighter standing directly in front of the camera. The hands are BARE with thin black hand wraps wound tightly around his knuckles and wrists — NO gloves, NO equipment, just wrapped fists. Wraps are slightly frayed, sweat-darkened, scuffed. He is bare-chested or in a thin dark moisture-wicking tank — sweat sheen on chest and shoulders, visible deltoid and pec definition catching the cool rim light. Both fists clearly originate from his high guard position — both gloves stacked up near the centre-top of the frame at chin/temple level (his off-frame face), with both elbows tucked down in front of his chest visible in the lower half of the frame. When a punch fires, the fist extends forward from this centred guard position toward the lens, then retracts back to the SAME centred guard position. Both fists always come from the SAME centre-top region of the frame — they do NOT enter from the left or right edges of the frame.

CAMERA: shot on an ARRI Alexa Mini LF with a vintage Cooke S7/i anamorphic prime at T2.3, 24fps, normal 180-degree shutter, REAL-TIME normal playback — explicitly NOT slow motion, NOT high-frame-rate. Handheld documentary feel, very subtle organic micro-shake, occasional brief autofocus hunt as a fast fist enters the close plane, anamorphic 2x squeeze giving vertical streaks on the cool light highlights and oval out-of-focus bokeh in the background, ~35mm anamorphic-equivalent lens, very shallow depth of field.

ACTION — UNBROKEN LIGHTNING-FAST PUNCH FLURRY (5 SECONDS STRAIGHT OF NONSTOP PUNCHING INTO AIR): the SAME ONE FIGHTER fires BOTH of his fists forward toward the camera and snaps them back over and over and over without stopping. World-class fight-camp hand speed — Lomachenko / Roy Jones Jr / McGregor flurry-speed — so fast the eye can barely separate one punch from the next. Roughly 18–24 punches across the 5 seconds, alternating between his lead (right) and rear (left) fists, with both fists always originating from his centred high guard position near his face/chin (top-centre of frame) and extending FORWARD toward the lens — every punch travels straight forward and retracts straight back, NEVER entering from the left or right edges of the frame. Mostly straight punches (jabs and crosses) with a couple of quick tight hooks where the fist arcs from his temple guard position forward-and-across toward the lens, but always starting and ending at his high guard. Each individual punch's forward-and-back arc takes well under 0.25 seconds. NO pauses, NO settled rests — as soon as one fist snaps back to guard, the other fist is already firing forward from guard; the hands are in continuous overlapping motion for the entire 5-second runtime. Every fist stops short of the camera and never makes contact with anything. The hands rarely come fully crisp because they're in continuous high-speed motion — most of the time at least one fist is mid-arc and smeared into a long directional motion-blur streak (real-camera in-camera blur from the fast-moving limb at 24fps real-time, NOT slow motion, NOT high-frame-rate). Forearms ripple, veins ride proud, tiny sweat droplets fling off the wraps with every retract. His shirtless chest and shoulders subtly torque and dip with each punch — the body is one continuous coordinated unit driving both fists.

LIGHTING: a single hard cool teal-blue practical light positioned high camera-LEFT, raking across the tops of the forearms and catching the leading edge of each wrapped fist as it punches into the lit zone. Deep navy shadows everywhere else. A subtle cooler back-rim catches the outside edge of the fists at the back of their stroke. Sharp anamorphic horizontal LENS FLARE streaks across the frame whenever a fist crosses the key light. Subtle halation glow around the brightest knuckle highlights. Fine dust motes drift through the cool beam.

SETTING: an unspecified dark interior space — completely OUT OF FOCUS into deep bokeh'd cool-tinted void in the background. The background is just dark air and shadow — no walls, no floor markers, no equipment, no furniture, no people, no targets visible.

COLOR: Alexa LogC graded with cool teal shadow lift and slightly desaturated midtones, controlled highlight rolloff, organic 35mm film-grade grain, slight sensor noise in deepest shadows, gentle chromatic aberration at the frame edges. Raw, gritty, imperfect — like a real cinematographer's b-camera grab.

NO text, NO logos, NO watermarks, NO face, NO bag, NO targets, NO opponent, NO equipment, NO gloves. AUDIO: a rapid continuous unbroken barrage of sharp air-WHIPS as the bare wrapped fists cut through empty air at full speed (whp-whp-whp-whp-whp-whp-whp-whp-whp continuously for the whole 5 seconds). NO impact thuds whatsoever — there is nothing being hit. Fast clipped nose exhales (sh-sh-sh-sh) timed to the punches, the faint creak of damp wraps stretching, ambient room tone, no music.`;

console.log(`Submitting clip 8 to ${REPLICATE_MODEL} (front shadowbox, 1080p)...`);
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
console.log(`clip 8 pred id: ${pred.id} status: ${pred.status}`);

while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`clip 8 status: ${pred.status}${last ? ` (${last})` : ""}`);
}

if (pred.status !== "succeeded") {
  console.error("Clip 8 failed:", pred.error);
  process.exit(1);
}

const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log(`clip 8 video url: ${videoUrl}`);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(VIDEO_OUT, buf);
console.log(`✓ Saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
