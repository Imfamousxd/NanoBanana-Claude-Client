#!/usr/bin/env node
// v6 — can FLOATS/POPS in mid-air with explosive splashes, fruit, ice, and
// continuous rotation. Tight close-up angles. Simple cream backdrop but
// cranked dynamism around the product.
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
const REPLICATE_MODEL = "bytedance/seedance-2.0";

const CAN_REF = "Dialed Moods Drink Short Animation/Dialed_Seltzer_LDopa_Front_Lemonade.png";
const STILL_OUT = "Dialed Moods Drink Short Animation/lemonade-still-v6.png";  // reuse
const VIDEO_OUT = "Dialed Moods Drink Short Animation/lemonade-reveal-single-cuts-v7.mp4";

const STILL_PROMPT = `Cinematic 9:16 vertical hero still. Reference image 1 shows the EXACT Dialed Moods Lemonade can — preserve its label artwork pixel-faithfully (yellow "CLEAN ENERGY & CALM FOCUS" top banner, gold/cream "DIALED" wordmark with black drop-shadow, "LEMONADE" vertical ribbon on the left, lemon-slice illustration, "COGNITION ELIXIR" subtitle, yellow bottom band, metallic black top cap). 12 fl oz tall slim aluminum can.

SCENE: the can FLOATS / IS SUSPENDED in MID-AIR at the dead center of the 9:16 frame, tilted at a dynamic 8° angle, NO surface beneath it, NO ledge. The can hangs in the air as if frozen mid-air in the middle of an action moment.

AROUND THE CAN, mid-action frozen at 1/8000s shutter:
- A sculptural arc of crystal-clear water cascades around the can in slow motion, wrapping like a fluid ribbon — droplets, suspended ribbons of water, and a swirling mid-air liquid crown
- 4 large clear ice cubes (cubic with rounded edges) suspended at varying heights and angles around the can, catching sharp specular highlights
- 3 fresh lemons — one whole lemon at upper-left, one halved lemon (cut side facing camera with juicy yellow flesh and small seeds) at upper-right, one halved lemon at lower-right, all suspended in mid-air

BACKDROP: clean simple seamless studio sweep — soft neutral cream-to-light-warm-gray gradient (#F0EBE2 fading to #D6D2CB). No environment, no neon, no skyline. Just an empty premium product-photography studio.

LIGHTING: bright soft diffused studio daylight, cool rim down the can's left edge, warm fill on the right. Glass-clear reflections in every droplet and ice cube. The DIALED gold wordmark gleams.

Style: premium beverage commercial hero still, magazine-grade product photography, hyper-realistic, glossy crisp finish. Negative: no surface beneath the can, no ledge, no podium, no shadow on a floor, no extra logos, no text overlays, no captions, no environment, no neon, no cobalt or yellow gradient backdrop — just the floating can with action around it on a clean cream studio sweep.`;

async function genStill() {
  console.log("Stage 1: generating floating-can hero still via NB...");
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

const VIDEO_PROMPT = `Cinematic dynamic product reveal for a tall slim Dialed Moods Lemonade can — ONE continuous video built as a flowing 3-shot sequence where each cut is a MATCH CUT or motion-match transition that BLENDS shots seamlessly through continuous camera motion. NO jarring hard cuts — every cut occurs ON motion that continues into the next shot, so the energy carries through. Hyper-realistic, premium beverage commercial.

CRITICAL — DO NOT start with the can already revealed. The intro must build anticipation BEFORE revealing the can. The can ENTERS the visual story progressively.

GOLDEN RULES — apply throughout:
- Once revealed, the can FLOATS / LEVITATES in mid-air center frame for the rest of the video — never resting on a surface, never landing, no surface visible
- Once revealed, the can SPINS CONTINUOUSLY on its vertical axis at a smooth steady rate, label artwork rotating into and out of view
- Around the floating spinning can, water cascades and splashes, ice cubes drift and tumble, fresh lemons (whole + halved with juicy yellow flesh) whip and rotate around it with believable inertia
- Cream studio backdrop throughout — clean, neutral, no environment

DO NOT add any text overlays, graphic overlays, logos, captions, watermarks, subtitles, or floating words on top of the video. Only the can's actual physical label is visible.

[SHOT 1 — INTRO — abstract macro build-up, ~3 seconds]
Open on an EXTREME MACRO close-up on a single fresh halved lemon (juicy yellow flesh facing camera, tiny seeds visible) — the lemon slowly rotates in mid-air in slow motion, droplets of crystal-clear water drip and bounce off its surface, a single clear ice cube tumbles past behind it in soft focus. THE CAN IS NOT YET VISIBLE. The camera slowly begins to PULL BACK and DRIFT LATERALLY toward the right, the lemon staying in frame at the edge as a new shape begins to enter from the left — a hint of the chilled DIALED MOODS LEMONADE can rising into frame at the very end of the shot. Anticipatory, atmospheric, slow-mo feel.

MATCH CUT on the lateral camera drift — the camera motion continues seamlessly into shot 2 —

[SHOT 2 — MID — close-up reveal + orbit, ~3 seconds]
The camera continues its lateral drift, now showing the TIGHT WAIST-UP framing of the floating, spinning DIALED MOODS LEMONADE can FULLY in frame for the first time. A sculptural arc of crystal-clear water sweeps powerfully around the can in slow motion, droplets scattering, two halved lemons and several large clear ice cubes rotate and drift past in motion blur. The camera continues into a smooth steady 90-degree orbit around the spinning can, perfectly stable gimbal arc, ROCK STEADY. Cinematic layered motion. Hyper-real fluid physics.

WHIP-PAN MATCH CUT — a brief soft motion-blur whip transitions the camera continuously into shot 3 —

[SHOT 3 — OUTRO — pull-back to floating hero, ~4 seconds]
Coming out of the whip-pan, the camera SMOOTHLY DOLLIES BACKWARD revealing the full floating spinning DIALED MOODS LEMONADE can with the complete action tableau: water arc wrapping the can, 4 large clear ice cubes suspended around it, 3 fresh lemons (one whole, two halved) floating in a tasteful symmetric tableau, all locked mid-air. The can keeps spinning. Camera ends on a confident hero framing — floating can at center surrounded by suspended splash, ice, and lemons. Premium reveal climax.

Throughout: hyper-cinematic, hyper-realistic, deep depth of field, polished motion blur, glossy crisp highlights. Cream studio backdrop consistent across all three shots. Cuts are SEAMLESS match cuts and whip-pans, not jarring hard cuts. NO text overlays anywhere. Audio: gentle droplet ping on shot 1, water-rush + ice clink on shot 2, ambient reveal swell on shot 3.`;

async function animate(stillPath) {
  console.log(`Stage 2: animating with ${REPLICATE_MODEL} (reference-image mode)...`);
  const dataUri = `data:image/png;base64,${fs.readFileSync(stillPath).toString("base64")}`;
  // Use reference_images instead of image so Seedance can build its own opening
  // frame (intro should NOT start with the can already revealed).
  const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
    body: JSON.stringify({
      input: {
        reference_images: [dataUri],
        prompt: VIDEO_PROMPT + "\n\nThe can in the video MUST match the DIALED MOODS LEMONADE can shown in [Image1] — preserve its label artwork (yellow top/bottom bands, gold DIALED wordmark, LEMONADE vertical ribbon, lemon-slice illustration, metallic black cap) pixel-faithfully.",
        duration: 10,
        resolution: "720p",
        aspect_ratio: "9:16",
        generate_audio: true,
      },
    }),
  });
  if (!create.ok) throw new Error(`Replicate HTTP ${create.status}: ${(await create.text()).slice(0, 300)}`);
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
  const vr = await fetch(videoUrl);
  const buf = Buffer.from(await vr.arrayBuffer());
  fs.writeFileSync(VIDEO_OUT, buf);
  console.log(`  ✓ video saved: ${VIDEO_OUT} (${(buf.length/1024/1024).toFixed(2)} MB)`);
  return VIDEO_OUT;
}

try {
  // reuse v6 still if present
  if (!fs.existsSync(STILL_OUT)) {
    await genStill();
  } else {
    console.log(`Reusing existing still: ${STILL_OUT}`);
  }
  await animate(STILL_OUT);
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
