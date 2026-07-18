#!/usr/bin/env node
// Two-stage cinematic product reveal for Dialed Moods Lemonade.
// Stage 1: Nano Banana generates a 9:16 hero still — Lemonade can with water
// arcing, ice cubes, fresh lemons frozen in motion against a moody backdrop.
// Stage 2: Seedance on Replicate animates the still into a product-reveal
// video at 1080p (Seedance's max — true 4K isn't supported by current
// video models).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

const NB_MODEL = "gemini-3-pro-image-preview";
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || "bytedance/seedance-1-pro";

const OUT_DIR = "Dialed Moods Drink Short Animation";
const CAN_REF = `${OUT_DIR}/Dialed_Seltzer_LDopa_Front_Lemonade.png`;
const STILL_OUT = `${OUT_DIR}/lemonade-reveal-still.png`;
const VIDEO_OUT = `${OUT_DIR}/lemonade-reveal-seedance.mp4`;

// ─── Stage 1: hero still via Nano Banana ─────────────────────────────────────
const STILL_PROMPT = `Cinematic 9:16 vertical hero product photograph for Dialed Moods Lemonade. Reference image 1 shows the EXACT can — preserve its label artwork pixel-faithfully (the yellow "CLEAN ENERGY & CALM FOCUS" top banner, the gold/cream "DIALED" wordmark with black drop-shadow, the "LEMONADE" vertical ribbon on the left side, the lemon-slice illustration, the "COGNITION ELIXIR" subtitle, the yellow bottom band with "DIETARY SUPPLEMENT 5 CALORIE ZERO SUGAR 12 FL OZ", the metallic black top cap). The can is a 12 fl oz tall-slim aluminum can.

SCENE: the can stands tall and confident at the dead center of the 9:16 frame, slightly tilted 5° backward at a low up-angle (camera positioned just below the can looking up). Around the can, frozen mid-action in a stunning high-speed-capture moment:

- WATER: a sculptural arc of crystal-clear water cascades around the can in slow motion, wrapping like a ribbon — droplets, suspended ribbons, and a swirling mid-air liquid crown frozen at 1/8000s shutter. The water catches subtle yellow refraction from the lemons.
- ICE: 4-6 large clear ice cubes (cubic, slightly rounded edges) suspended at varying heights around the can, frozen mid-air, each cube catching sharp specular highlights and refracting the warm yellow light.
- LEMONS: 3 fresh juicy lemons — one whole lemon at upper-left, one halved lemon (cut side facing camera, juicy yellow flesh and small seeds visible) at upper-right, one halved lemon at lower-right, all suspended in mid-air around the can. Bright cheerful yellow rind with a slight green stem nub.

BACKGROUND: deep moody gradient — top of frame deep saturated electric cobalt #0B2A8C bleeding into mid-frame radiant warm yellow #F2B856, fading to deep golden amber at the bottom. A massive soft circular bloom of warm white light directly behind the can creating a halo. Subtle volumetric god-rays. Faint atmospheric haze. No environment, no surface — the can floats against this gradient.

LIGHTING: dramatic high-key cinematic — saturated cool blue rim on the can's left edge, hot warm yellow rim on the right edge, soft warm white glow behind. Reflections shimmer in every droplet and every ice cube. The DIALED gold wordmark gleams. Crisp specular highlights on the metallic can body.

Style: luxury beverage commercial poster meets editorial product photography. GQ-cover energy, Nike-keynote drama, hyper-realistic splash + ice + fruit rendering, glossy crisp finish, magazine-grade.

Negative: no extra logos, no people, no hands, no surface, no ledge, no environment, no clutter, no warped typography, no inaccurate label artwork, no second can.`;

async function genStill() {
  console.log("Stage 1: generating hero still via Nano Banana...");
  const b64 = fs.readFileSync(CAN_REF).toString("base64");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${NB_MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: "image/png", data: b64 } },
      { text: STILL_PROMPT },
    ]}],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: "9:16", imageSize: "4K" },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`NB HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      fs.writeFileSync(STILL_OUT, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ still saved: ${STILL_OUT}`);
      return STILL_OUT;
    }
  }
  throw new Error("NB: no image in response");
}

// ─── Stage 2: animate via Seedance on Replicate ──────────────────────────────
const VIDEO_PROMPT = `Cinematic product reveal of the Dialed Moods Lemonade can. The camera slowly dollies forward and arcs gently around the can while the water cascade continues to flow and reform around the can in slow motion, ice cubes drift gently in mid-air, and the lemons slowly rotate revealing their juicy interiors. The Dialed gold wordmark catches a luminous warm-white pulse of light that travels across the lettering. Atmospheric mist and gentle dust particles drift past in slow motion. The cobalt-to-yellow gradient backdrop pulses subtly with a warm bloom. Soft mirror reflection follows the can's motion. Hyper-cinematic, slow elegant motion, ultra-premium beverage commercial, hyper-realistic, polished motion blur, deep depth of field.`;

async function animateSeedance(imagePath) {
  console.log(`Stage 2: animating with ${REPLICATE_MODEL}...`);
  const dataUri = `data:image/png;base64,${fs.readFileSync(imagePath).toString("base64")}`;
  const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
    body: JSON.stringify({
      input: {
        image: dataUri,
        prompt: VIDEO_PROMPT,
        duration: 10,
        resolution: "1080p",
        fps: 24,
        aspect_ratio: "9:16",
        camera_fixed: false,
      },
    }),
  });
  if (!create.ok) throw new Error(`Replicate create HTTP ${create.status}: ${(await create.text()).slice(0, 400)}`);
  let pred = await create.json();
  console.log(`  pred id: ${pred.id} status: ${pred.status}`);
  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    await new Promise(r => setTimeout(r, 5000));
    const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
    pred = await r.json();
    const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
    console.log(`  status: ${pred.status}${last ? ` (${last})` : ""}`);
  }
  if (pred.status !== "succeeded") throw new Error(`Seedance failed: ${JSON.stringify(pred.error)}`);
  const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  console.log(`  video url: ${videoUrl}`);
  const vr = await fetch(videoUrl);
  const buf = Buffer.from(await vr.arrayBuffer());
  fs.writeFileSync(VIDEO_OUT, buf);
  console.log(`  ✓ video saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
  return VIDEO_OUT;
}

try {
  const still = await genStill();
  const video = await animateSeedance(still);
  console.log(`\nDone.\n  Still: ${still}\n  Video: ${video}`);
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
