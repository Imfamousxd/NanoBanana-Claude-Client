#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(BASE, "DH Shots", "Capsules Lifestyle", "5-Amino 1MQ");
const BATCH_FILE = path.join(BASE, "capsule-5amino1mq-batch.json");
const PRODUCT_REF = "./DH Shots/Capsules/5-Amino 1MQ.jpg";

const variants = [
  {
    name: "man-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-gym.jpg",
    hand: "the hand (man), skin tone — holding the capsule pill bottle in a full-hand cradle / palm grip: fingers wrap around the bottle body with the thumb on one side and the other fingers curling around the opposite side, the bottle sitting comfortably in the palm area. Natural, relaxed grip appropriate for a hand-sized pill bottle",
    scene: "indoor gym scene and background",
    keyLight: "strong directional overhead gym lighting, cooler color temperature",
    ambientTint: "cool charcoal/grey ambient wash from the surrounding gym environment",
    shadow: "a soft directional drop shadow under the bottle angled away from the overhead key light",
    colorGrade: "cinematic athletic color grade, cooler with rich blacks and charcoal tones",
  },
  {
    name: "man-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-track.jpg",
    hand: "the hand (man), skin tone — holding the capsule pill bottle in a full-hand cradle / palm grip: fingers wrap around the bottle body with the thumb on one side and the other fingers curling around the opposite side, the bottle sitting comfortably in the palm area. Natural, relaxed grip appropriate for a hand-sized pill bottle",
    scene: "outdoor running track scene and background",
    keyLight: "bright warm natural outdoor sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus cool blue sky ambient from above",
    shadow: "a defined directional shadow of the bottle on the hand, falling away from the sun direction, consistent with harder outdoor daylight",
    colorGrade: "cinematic athletic color grade, warm natural daylight, saturated reds/oranges from the track, clean whites",
  },
  {
    name: "man-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-kitchen.jpg",
    hand: "the hand (man), skin tone — holding the capsule pill bottle in a full-hand cradle / palm grip: fingers wrap around the bottle body with the thumb on one side and the other fingers curling around the opposite side, the bottle sitting comfortably in the palm area. Natural, relaxed grip appropriate for a hand-sized pill bottle",
    scene: "bright modern indoor kitchen scene and background",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    shadow: "a soft, diffused shadow of the bottle on the hand/counter, falling away from the side window light",
    colorGrade: "warm inviting editorial wellness-brand color grade, natural morning daylight, soft whites, gentle highlights",
  },
  {
    name: "woman-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-gym.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding a LARGE hand-sized capsule pill bottle that takes up roughly the entire length of her hand from wrist to fingertip. Because the bottle is that big, she MUST hold it with a full-hand wrap / palm grip — ALL four fingers curled around one side of the bottle body and the thumb pressed against the opposite side, with the bottle sitting along the length of the palm. ABSOLUTELY NOT a dainty two-finger pinch. This is the same palm-wrap grip a man would use for a pill bottle of this size. The grip must visually communicate that the bottle is substantial — not a small item held between fingertips",
    scene: "indoor gym scene and background",
    keyLight: "strong directional overhead gym lighting, cooler color temperature",
    ambientTint: "cool charcoal/grey ambient wash from the surrounding gym environment",
    shadow: "a soft directional drop shadow under the bottle angled away from the overhead key light",
    colorGrade: "cinematic athletic color grade, cooler with rich blacks and charcoal tones",
  },
  {
    name: "woman-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-track.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding a LARGE hand-sized capsule pill bottle that takes up roughly the entire length of her hand from wrist to fingertip. Because the bottle is that big, she MUST hold it with a full-hand wrap / palm grip — ALL four fingers curled around one side of the bottle body and the thumb pressed against the opposite side, with the bottle sitting along the length of the palm. ABSOLUTELY NOT a dainty two-finger pinch. This is the same palm-wrap grip a man would use for a pill bottle of this size. The grip must visually communicate that the bottle is substantial — not a small item held between fingertips",
    scene: "outdoor running track scene and background",
    keyLight: "bright warm natural outdoor sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus cool blue sky ambient from above",
    shadow: "a defined directional shadow of the bottle on the hand, falling away from the sun direction, consistent with harder outdoor daylight",
    colorGrade: "cinematic athletic color grade, warm natural daylight, saturated reds/oranges from the track, clean whites",
  },
  {
    name: "woman-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-kitchen.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding a LARGE hand-sized capsule pill bottle that takes up roughly the entire length of her hand from wrist to fingertip. Because the bottle is that big, she MUST hold it with a full-hand wrap / palm grip — ALL four fingers curled around one side of the bottle body and the thumb pressed against the opposite side, with the bottle sitting along the length of the palm. ABSOLUTELY NOT a dainty two-finger pinch. This is the same palm-wrap grip a man would use for a pill bottle of this size. The grip must visually communicate that the bottle is substantial — not a small item held between fingertips",
    scene: "bright modern indoor kitchen scene and background",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    shadow: "a soft, diffused shadow of the bottle on the hand/counter, falling away from the side window light",
    colorGrade: "warm inviting editorial wellness-brand color grade, natural morning daylight, soft whites, gentle highlights",
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function buildPrompt(variant) {
  return `You are producing a new photograph inside REFERENCE 2's scene, with one change: the small glass vial in REFERENCE 2's hand is replaced by a small Dialed Health '5-Amino 1MQ' capsule pill bottle. Think of this as a brand-new photo taken at the same instant, in the same ${variant.scene}, with the same hand and same camera — the capsule bottle is not pasted in from elsewhere, it was physically in the hand when the shutter fired.

DO NOT COPY PIXELS FROM REFERENCE 1. REFERENCE 1 is a studio product shot and MUST NOT be transplanted into the scene. Use REFERENCE 1 ONLY to learn the bottle's design (clear glass pill bottle, brushed silver screw-on metal cap, filled with small white pharmaceutical capsules visible through the clear glass, matte black wraparound label) and the exact label artwork. Then RENDER THE BOTTLE FROM SCRATCH inside REFERENCE 2's scene using only REFERENCE 2's light, grain, color grade, contrast, and atmosphere as the paintbrush. The final image MUST NOT look like a product sticker, cutout, or composite.

SIZING: the capsule pill bottle is HAND-SIZED — approximately the length of a full hand from wrist to fingertip (roughly 4–5 inches / 10–12 cm tall), noticeably LARGER than the vial in REFERENCE 2. It is substantial enough that the hand cradles it with ALL fingers wrapping around the body rather than pinching it between two fingertips. The bottle's length in the frame should visually match the length of the hand holding it — if you laid the bottle alongside the hand, the bottle would run from roughly the base of the palm to near the fingertips. Do NOT render it as a small finger-length vial — this is a real pill bottle, hand-sized. The HOLD must look natural for a hand-sized bottle: fingers comfortably wrap around the body with the thumb on one side and the other four fingers on the opposite side, the bottle sits securely along the palm, NO pinch grip, NO two-finger hold, NO floating.

KEEP FROM REFERENCE 2 EXACTLY: ${variant.hand}, top-down overhead camera angle, tight close-up crop, composition, ${variant.scene}, all scene background elements, the scene's actual light direction and color temperature, the photo's exposure, contrast, shadow density, color grade, film-like grain, depth of field blur pattern, 5:4 framing, and overall mood.

SCENE LIGHTING INTEGRATION: key light is ${variant.keyLight}; ambient fill is ${variant.ambientTint}. Every surface of the capsule bottle must respond to this lighting, not studio lighting:
- The clear glass body picks up the scene's ambient color cast; specular highlights on the curved glass align with the key light direction.
- The white capsules visible inside the bottle also pick up the scene's ambient color (they should NOT look pure studio-white).
- The brushed silver metal screw cap reflects the scene's tones (warmer in warm scenes, cooler in cool scenes), with specular highlights aligned to the key light.
- The matte black label has a subtle rim-highlight along the key-light-facing edge and deeper shadow on the opposite edge.
- Cast shadow: ${variant.shadow}. The bottle shares the same dynamic range, contrast, and grain as the hand and scene — not brighter, not flatter, not more evenly lit.
- Color grade: ${variant.colorGrade}. The bottle should sit inside this grade.

LABEL ARTWORK (render fresh, do not copy): matte black wraparound label, the Dialed Health heartbeat/ECG logo on top ('DIALED' on the left and 'HEALTH' on the right split by a thin white ECG pulse line), and the product name '5-Amino 1MQ' in clean bold white sans-serif centered below on a single line. The product name text must be sized LARGE — bold, confidently filling the label's usable width, immediately legible, proportionally similar to the prominence of the product name on the vial label in REFERENCE 2. Do NOT render the product name small or cramped. That is ALL on the label — no dosing, no mg, no mL, no count, no Rx, no QR, no barcode, no extra text. Do NOT invent label text. The white ink on the label picks up the scene's color temperature (slightly warm in warm scenes, slightly cool in cool scenes).

Bottle held UPRIGHT and VERTICAL, label facing SQUARELY toward camera, fully legible. STRICTLY ONE SINGLE HAND in frame — no second hand, no extra fingers. Photorealistic, seamless scene-integrated lifestyle photograph, editorial lifestyle quality, crisp focus, no artifacts.`;
}

for (let i = 0; i < variants.length; i++) {
  const variant = variants[i];
  const destPath = path.join(OUT_DIR, `${variant.name}.jpg`);
  if (fs.existsSync(destPath)) {
    console.log(`[${i + 1}/${variants.length}] ${variant.name} — already exists, skipping`);
    continue;
  }
  const batchJob = {
    prompt: buildPrompt(variant),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [PRODUCT_REF, variant.anchor],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${variants.length}] ${variant.name} — generating...`);
  try {
    const stdout = execSync(
      `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
      { cwd: BASE, encoding: "utf-8" }
    );
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) { console.log(`  !! Could not parse Saved path`); continue; }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) { console.log(`  !! Saved file missing`); continue; }
    fs.copyFileSync(savedPath, destPath);
    console.log(`  -> ${path.basename(savedPath)} -> 5-Amino 1MQ/${variant.name}.jpg`);
  } catch (err) {
    console.log(`  !! Error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
