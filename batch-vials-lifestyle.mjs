#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(BASE, "DH Shots", "Vials Lifestyle");
const BATCH_FILE = path.join(BASE, "lifestyle-batch.json");

const products = [
  { label: "AOD-9604/MOTS-C/Tesamorelin", file: "AOD-9604-MOTS-C-Tesamorelin" },
  { label: "DSIP", file: "DSIP" },
  { label: "DSIP/BPC-157/CJC", file: "DSIP-BPC-157-CJC" },
  { label: "Epithalon", file: "Epithalon" },
  { label: "GHK-Cu", file: "GHK-Cu" },
  { label: "GHK-Cu/Epithalon", file: "GHK-Cu-Epithalon" },
  { label: "Glutathione", file: "Glutathione" },
  { label: "Gonadorelin", file: "Gonadorelin" },
  { label: "IGF-LR3", file: "IGF-LR3" },
  { label: "Kisspeptin", file: "Kisspeptin" },
  { label: "LIPO-B", file: "LIPO-B" },
  { label: "LL-37", file: "LL-37" },
  { label: "MOTS-C", file: "MOTS-C" },
  { label: "MOTS-C/Tesamorelin", file: "MOTS-C-Tesamorelin" },
  { label: "NAD+", file: "NAD+" },
  { label: "Pinealon/PE22-28/Selank", file: "Pinealon-PE22-28-Selank" },
  { label: "Pregnyl (HCG)", file: "Pregnyl (HCG)" },
  { label: "PT-141", file: "PT-141" },
  { label: "Semax/Selank", file: "Semax-Selank" },
  { label: "Sermorelin", file: "Sermorelin" },
  { label: "SS-31", file: "SS-31" },
  { label: "Tesamorelin", file: "Tesamorelin" },
  { label: "Tesamorelin/Ipamorelin", file: "Tesamorelin-Ipamorelin" },
  { label: "Testosterone Cyp Cottonseed", file: "Testosterone Cyp Cottonseed" },
  { label: "Testosterone Cyp MCT Oil", file: "Testosterone Cyp MCT Oil" },
  { label: "Thymosin Alpha-1", file: "Thymosin Alpha-1" },
];

const variants = [
  {
    name: "man-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-gym.jpg",
    hand: "the hand (man), skin tone, grip",
    scene: "gym scene and background",
    sceneLight: "realistic reflections and refractions from the gym environment (charcoal tones, overhead gym lighting, ambient shadows). The gold metal band on the cap reflects the scene's warm/cool cast. Subtle specular highlights on the glass align with the scene's light direction. Soft realistic shadow of the vial on the hand consistent with the scene's light",
  },
  {
    name: "man-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-track.jpg",
    hand: "the hand (man), skin tone, grip",
    scene: "outdoor track scene and background",
    sceneLight: "realistic reflections and refractions of the warm natural outdoor daylight and red-orange track surface. The gold metal band on the cap reflects the scene's warm daylight. Subtle specular highlights on the glass align with the sun's direction. Soft realistic shadow of the vial on the hand consistent with outdoor daylight",
  },
  {
    name: "man-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/man-kitchen.jpg",
    hand: "the hand (man), skin tone, grip",
    scene: "indoor kitchen scene and background",
    sceneLight: "realistic reflections and refractions of the warm morning kitchen light, white marble/quartz counter color cast, soft window daylight. The gold metal band on the cap reflects the scene's warm morning light. Subtle specular highlights on the glass align with the window light direction. Soft realistic shadow of the vial on the hand/counter consistent with warm morning light",
  },
  {
    name: "woman-gym",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-gym.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails, grip",
    scene: "gym scene and background",
    sceneLight: "realistic reflections and refractions from the gym environment (charcoal tones, overhead gym lighting, ambient shadows). The gold metal band on the cap reflects the scene's warm/cool cast. Subtle specular highlights on the glass align with the scene's light direction. Soft realistic shadow of the vial on the hand consistent with the scene's light",
  },
  {
    name: "woman-track",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-track.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails, grip",
    scene: "outdoor track scene and background",
    sceneLight: "realistic reflections and refractions of the warm natural outdoor daylight and red-orange track surface. The gold metal band on the cap reflects the scene's warm daylight. Subtle specular highlights on the glass align with the sun's direction. Soft realistic shadow of the vial on the hand consistent with outdoor daylight",
  },
  {
    name: "woman-kitchen",
    anchor: "./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-kitchen.jpg",
    hand: "the hand (woman with long white-polished nails), skin tone, nails, grip",
    scene: "indoor kitchen scene and background",
    sceneLight: "realistic reflections and refractions of the warm morning kitchen light, white marble/quartz counter color cast, soft window daylight. The gold metal band on the cap reflects the scene's warm morning light. Subtle specular highlights on the glass align with the window light direction. Soft realistic shadow of the vial on the hand/counter consistent with warm morning light",
  },
];

function buildPrompt(productLabel, variant) {
  return `Edit REFERENCE 2 by REPLACING ONLY the vial in it with a Dialed Health '${productLabel}' vial. REFERENCE 1 is the product-design source: use it ONLY to know what the correct label artwork and vial design look like. Do NOT simply paste REFERENCE 1 flat into the scene — you must RE-LIGHT and RE-RENDER the vial so it belongs naturally in REFERENCE 2's environment. The liquid INSIDE the glass vial must be CLEAR and COLORLESS (like water) — not yellow, not amber, not tinted. KEEP from REFERENCE 2: ${variant.hand}, top-down overhead camera angle, tight close-up crop, composition, ${variant.scene}, the scene's actual light sources (direction, color temperature, intensity), depth of field, color grade, 5:4 framing, and overall mood. RE-LIGHT the vial TO MATCH the scene in REFERENCE 2: the clear glass body with clear colorless liquid inside picks up ${variant.sceneLight}. The LABEL ARTWORK itself must remain EXACT from REFERENCE 1 — matte black label, the Dialed Health heartbeat/ECG logo on top (word 'DIALED' on the left and 'HEALTH' on the right split by a thin white ECG pulse line), and the product name '${productLabel}' in clean bold white sans-serif centered below (may break onto two centered lines at slash or word boundaries as shown in REFERENCE 1 if the name is long). That is ALL on the label — no dosing, no mg, no mL, no Rx, no QR, no barcode, no other text. Do NOT invent label text. Vial held UPRIGHT and VERTICAL, label facing SQUARELY toward camera, fully legible. Realistic vial scale (vial only slightly longer than a finger, NOT oversized). STRICTLY ONE SINGLE HAND. Photorealistic, seamless scene-integrated product with clear colorless liquid, editorial lifestyle quality, crisp focus, no artifacts.`;
}

const allResults = [];
const allFailures = [];

for (let pi = 0; pi < products.length; pi++) {
  const product = products[pi];
  const productRef = `./DH Shots/Vials/${product.file}.jpg`;
  const productDir = path.join(OUT_ROOT, product.file);
  fs.mkdirSync(productDir, { recursive: true });

  console.log(`\n\n############################################################`);
  console.log(`# PRODUCT ${pi + 1}/${products.length}: ${product.label}`);
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

console.log(`\n\n==================== FINAL SUMMARY ====================`);
console.log(`Total products: ${products.length}`);
console.log(`Total variants: ${products.length * variants.length}`);
console.log(`Succeeded:      ${allResults.length}`);
console.log(`Failed:         ${allFailures.length}`);
if (allFailures.length) {
  console.log(`\nFailures:`);
  for (const f of allFailures) console.log(`  - ${f}`);
}
console.log(`\nAll done.`);
