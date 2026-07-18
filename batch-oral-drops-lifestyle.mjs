#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(BASE, "DH Shots", "Oral Drops Lifestyle");
const BATCH_FILE = path.join(BASE, "oral-drops-lifestyle-batch.json");

const products = [
  { label: "Semaglutide", file: "Semaglutide" },
  { label: "Tirzepatide", file: "Tirzepatide" },
];

const variants = [
  {
    name: "man-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-gym.jpg",
    hand: "the hand (man), skin tone — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "indoor gym scene and background",
    keyLight: "strong directional overhead gym lighting, cooler color temperature",
    ambientTint: "cool charcoal/grey ambient wash from the surrounding gym environment",
    surfaceBehavior: "the frosted silver-white glass body picks up a subtle cool/grey ambient wash, specular highlights on the curved glass run vertically along the side facing the key overhead light; the white plastic collar and dropper cap show slight cool-toned highlights on top and small rim-shadows on the underside; the rounded rubber bulb tip catches a small sharp highlight from overhead; the matte black label shows a very subtle top-edge rim highlight from the overhead light and deeper shadow where it wraps under the hand",
    groundShadow: "a soft, directional drop shadow under the bottle angled away from the overhead key light",
  },
  {
    name: "man-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-track.jpg",
    hand: "the hand (man), skin tone — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "outdoor running track scene and background",
    keyLight: "bright warm natural sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus a soft blue sky ambient from above",
    surfaceBehavior: "the frosted silver-white glass body picks up a warm golden tint on the sunlit side and cooler shadow on the opposite side, with a bright specular highlight along the sunlit edge; the white plastic collar and dropper cap show clear warm highlights on the sunward side and a subtle orange color cast from the track below; the rounded rubber bulb tip has a sharp crisp sun highlight; the matte black label shows a warm rim highlight along the sunward edge",
    groundShadow: "a defined directional shadow of the bottle on the hand, falling away from the sun direction, consistent with harder outdoor daylight",
  },
  {
    name: "man-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-kitchen.jpg",
    hand: "the hand (man), skin tone — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "bright modern indoor kitchen scene and background",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    surfaceBehavior: "the frosted silver-white glass body picks up a warm soft highlight on the window-facing side and gentle cool shadow on the opposite side, with a soft diffused specular band rather than a sharp highlight; the white plastic collar and dropper cap glow softly in the warm morning light with gentle falloff to shadow; the rounded rubber bulb tip shows a soft highlight; the matte black label has a warm rim-light along the window-facing edge and deeper shadow on the opposite edge",
    groundShadow: "a soft, diffused shadow of the bottle on the hand/counter, falling away from the side window light",
  },
  {
    name: "woman-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-gym.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "indoor gym scene and background",
    keyLight: "strong directional overhead gym lighting, cooler color temperature",
    ambientTint: "cool charcoal/grey ambient wash from the surrounding gym environment",
    surfaceBehavior: "the frosted silver-white glass body picks up a subtle cool/grey ambient wash, specular highlights on the curved glass run vertically along the side facing the key overhead light; the white plastic collar and dropper cap show slight cool-toned highlights on top and small rim-shadows on the underside; the rounded rubber bulb tip catches a small sharp highlight from overhead; the matte black label shows a very subtle top-edge rim highlight from the overhead light and deeper shadow where it wraps under the hand",
    groundShadow: "a soft, directional drop shadow under the bottle angled away from the overhead key light",
  },
  {
    name: "woman-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-track.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "outdoor running track scene and background",
    keyLight: "bright warm natural sunlight from slightly above and to one side",
    ambientTint: "warm red-orange bounce from the track surface below plus a soft blue sky ambient from above",
    surfaceBehavior: "the frosted silver-white glass body picks up a warm golden tint on the sunlit side and cooler shadow on the opposite side, with a bright specular highlight along the sunlit edge; the white plastic collar and dropper cap show clear warm highlights on the sunward side and a subtle orange color cast from the track below; the rounded rubber bulb tip has a sharp crisp sun highlight; the matte black label shows a warm rim highlight along the sunward edge",
    groundShadow: "a defined directional shadow of the bottle on the hand, falling away from the sun direction, consistent with harder outdoor daylight",
  },
  {
    name: "woman-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-kitchen.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails — holding the small bottle naturally, in whatever grip reads as real and comfortable for a bottle of that size (let the model choose the finger placement freely as long as it looks like a genuine, relaxed hold)",
    scene: "bright modern indoor kitchen scene and background",
    keyLight: "soft warm morning sunlight streaming in from a side window",
    ambientTint: "warm white/cream ambient wash from marble/quartz counter and white walls",
    surfaceBehavior: "the frosted silver-white glass body picks up a warm soft highlight on the window-facing side and gentle cool shadow on the opposite side, with a soft diffused specular band rather than a sharp highlight; the white plastic collar and dropper cap glow softly in the warm morning light with gentle falloff to shadow; the rounded rubber bulb tip shows a soft highlight; the matte black label has a warm rim-light along the window-facing edge and deeper shadow on the opposite edge",
    groundShadow: "a soft, diffused shadow of the bottle on the hand/counter, falling away from the side window light",
  },
];

function buildPrompt(productLabel, variant) {
  return `You are producing a new photograph inside REFERENCE 2's scene, with one change: the small glass vial in REFERENCE 2's hand is replaced by a small Dialed Health '${productLabel}' oral drop / sublingual dropper bottle. Think of this as a brand-new photo taken at the same instant, in the same ${variant.scene}, with the same hand and same camera — the dropper bottle is not pasted in from elsewhere, it was physically in the hand when the shutter fired.

DO NOT COPY PIXELS FROM REFERENCE 1. REFERENCE 1 is a studio product shot and MUST NOT be transplanted into the scene. Use REFERENCE 1 ONLY to learn the bottle's design vocabulary (what it looks like as a product) and to learn the exact label artwork. Then RENDER THE BOTTLE FROM SCRATCH inside REFERENCE 2's scene using only REFERENCE 2's light, grain, color grade, contrast, and atmosphere as the paintbrush. The bottle must emerge from the scene's photons, not be imported. The final image MUST NOT look like a product sticker, a cutout, or a composite.

The bottle's design (used for guidance only, render fresh): small cylindrical dropper bottle, silver-white frosted glass cylindrical body, white ribbed screw-on collar just above the body, white plastic dropper cap sitting on the collar, rounded white rubber bulb tip on top of the cap. Matte black wraparound label on the front of the body.

SIZING: the bottle is small — roughly the length of an index finger (slightly longer than a finger, not oversized), thin, clearly dwarfed by the hand. The bottle's apparent size relative to the hand must match the vial's apparent size in REFERENCE 2. The HOLD must look natural: the bottle looks like it genuinely belongs in the hand holding it, comfortably gripped, no awkward finger geometry, no impossible physics, no "floating in a hand" look. Prioritize a natural-looking hold over any specific finger placement.

KEEP FROM REFERENCE 2 EXACTLY: ${variant.hand}, top-down overhead camera angle, tight close-up crop, composition, ${variant.scene}, all scene background elements, the scene's actual light direction and color temperature, the photo's exposure, contrast, shadow density, color grade, film-like grain, depth of field blur pattern, 5:4 framing, and overall mood. Match every one of these on the bottle.

PHOTOGRAPHIC INTEGRATION TESTS — the result should pass ALL of these to prove the bottle is native to the scene:
- Light direction: specular highlights on the bottle's glass, collar, cap, and bulb must point in EXACTLY the same direction as the highlights on the hand's skin, fingernails, and every other object in REFERENCE 2.
- Ambient color: pick up ${variant.ambientTint}. The white plastic surfaces should NOT be pure studio-white — they should carry the scene's ambient color cast.
- Key light: the scene's key light is ${variant.keyLight}. The side of the bottle facing that key light is brighter; the opposite side is in shadow. No flat all-around studio lighting.
- Shadows on the bottle: ${variant.surfaceBehavior}.
- Shadow cast BY the bottle: ${variant.groundShadow}. This contact shadow must look like it was made by the scene's light, not by studio lighting.
- Contrast/dynamic range: the bottle's darkest dark and brightest bright must fall within the same tonal envelope as the rest of REFERENCE 2 — not brighter, not more contrasty, not crisper than the hand and surrounding scene.
- Grain and micro-focus: match the exact noise level, focus falloff, and sharpness of REFERENCE 2. If REFERENCE 2 has subtle film grain, the bottle has the same grain; if REFERENCE 2 is slightly soft at the vial, the bottle is slightly soft at the same focal plane.
- Edge rendering: the bottle's silhouette against the background should have the same micro-contrast and atmospheric haze as the hand's silhouette, not a cut-out edge.

LABEL ARTWORK (render fresh, do not copy): matte black wraparound label, the Dialed Health heartbeat/ECG logo on top ('DIALED' on the left and 'HEALTH' on the right split by a thin white ECG pulse line), and the product name '${productLabel}' in clean bold white sans-serif centered below on a single line. The product name text must be SIZED LARGE — bold, confidently filling the label's usable width, immediately legible at a glance, proportionally similar to the prominence of the product name on the vial label in REFERENCE 2. Do NOT render the product name small or cramped. That is ALL on the label — no dosing, no mg, no mL, no Rx, no QR, no barcode, no other text anywhere. Do NOT invent any label text. The white ink on the label picks up the scene's color temperature (slightly warm in warm scenes, slightly cool in cool scenes) — not pure studio-white.

Bottle held UPRIGHT and VERTICAL, label facing SQUARELY toward camera, fully legible and crisp. STRICTLY ONE SINGLE HAND in frame — no second hand, no extra fingers. Final image: a photorealistic, fully scene-integrated lifestyle photograph where the bottle reads as a genuinely present object, indistinguishable in lighting integrity from the hand holding it. Editorial lifestyle quality, 4K, no artifacts, no hint of compositing or pasted product.`;
}

const allResults = [];
const allFailures = [];

for (let pi = 0; pi < products.length; pi++) {
  const product = products[pi];
  const productRef = `./DH Shots/Oral Drops/${product.file}.jpg`;
  const productDir = path.join(OUT_ROOT, product.file);
  fs.mkdirSync(productDir, { recursive: true });

  console.log(`\n\n############################################################`);
  console.log(`# PRODUCT ${pi + 1}/${products.length}: ${product.label} (Oral Drop)`);
  console.log(`############################################################`);

  for (let vi = 0; vi < variants.length; vi++) {
    const variant = variants[vi];
    const destPath = path.join(productDir, `${variant.name}.jpg`);
    if (fs.existsSync(destPath)) {
      console.log(`\n  [${vi + 1}/${variants.length}] ${variant.name} — already exists, skipping`);
      continue;
    }

    const job = {
      prompt: buildPrompt(product.label, variant),
      aspectRatio: "5:4",
      imageSize: "4K",
      refImages: [productRef, variant.anchor],
    };
    fs.writeFileSync(BATCH_FILE, JSON.stringify([job], null, 2));

    console.log(`\n  [${vi + 1}/${variants.length}] ${variant.name} — generating...`);

    try {
      const stdout = execSync(
        `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
        { cwd: BASE, encoding: "utf-8" }
      );
      const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
      if (!match) {
        console.log(`    !! Could not parse Saved path`);
        allFailures.push(`${product.label} ${variant.name}`);
        continue;
      }
      const savedPath = match[1].trim();
      if (!fs.existsSync(savedPath)) {
        console.log(`    !! Saved file missing: ${savedPath}`);
        allFailures.push(`${product.label} ${variant.name}`);
        continue;
      }
      fs.copyFileSync(savedPath, destPath);
      console.log(`    -> ${path.basename(savedPath)} -> ${product.file}/${variant.name}.jpg`);
      allResults.push(`${product.label} ${variant.name}`);
    } catch (err) {
      console.log(`    !! Generation error: ${err.message.slice(0, 200)}`);
      allFailures.push(`${product.label} ${variant.name}`);
    }
  }
}

console.log(`\n\n==================== ORAL DROPS LIFESTYLE SUMMARY ====================`);
console.log(`Total products: ${products.length}`);
console.log(`Total variants: ${products.length * variants.length}`);
console.log(`Succeeded:      ${allResults.length}`);
console.log(`Failed:         ${allFailures.length}`);
if (allFailures.length) {
  console.log(`\nFailures:`);
  for (const f of allFailures) console.log(`  - ${f}`);
}
console.log(`\nAll done.`);
