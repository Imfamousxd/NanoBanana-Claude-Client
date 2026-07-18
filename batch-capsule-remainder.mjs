#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const BATCH_FILE = path.join(BASE, "capsule-remainder-batch.json");

const products = [
  { file: "Enclomiphene", label: "Enclomiphene", multiline: false },
  { file: "Ibutamoren (MK-677)", label: "Ibutamoren (MK-677)", multiline: false },
  { file: "Methylene Blue", label: "Methylene Blue", multiline: false },
  { file: "Ondansetron (GLP-1 Support)", label: "Ondansetron (GLP-1 Support)", multiline: true },
  { file: "Sildenafil (Commercial)", label: "Sildenafil (Commercial)", multiline: false },
  { file: "Sildenafil-Tadalafil-Bremelanotide", label: "Sildenafil/Tadalafil/Bremelanotide", multiline: true },
  { file: "Sildenafil-Tadalafil-Oxytocin", label: "Sildenafil/Tadalafil/Oxytocin", multiline: true },
  { file: "SLU-PP 332", label: "SLU-PP 332", multiline: false },
  { file: "SLU-PP 332-BAM 15", label: "SLU-PP 332/BAM 15", multiline: false },
  { file: "Tadalafil (Commercial)", label: "Tadalafil (Commercial)", multiline: false },
  { file: "Tesofensine", label: "Tesofensine", multiline: false },
];

const variants = ["man-gym", "man-track", "man-kitchen", "woman-gym", "woman-track", "woman-kitchen"];

function buildPrompt(productLabel, multiline) {
  const lineInstruction = multiline
    ? `The product name may break cleanly onto TWO centered lines at natural slash or space boundaries if it doesn't fit on one line at a readable size. Prefer one line if it fits; otherwise two lines maximum. Keep per-character size consistent with '5-Amino 1MQ' as rendered in REFERENCE 2.`
    : `The product name MUST appear on ONE SINGLE CENTERED LINE — do NOT break onto two lines. If it doesn't fit at the same size as '5-Amino 1MQ' in REFERENCE 2, scale the text down SLIGHTLY to fit on one line while staying large, bold, and prominently legible.`;

  return `Edit REFERENCE 2 by CHANGING ONLY the product name text on the capsule pill bottle's label from '5-Amino 1MQ' to '${productLabel}'. Make ONLY that text change; keep absolutely everything else IDENTICAL: same hand (same gender, skin tone, nails if present), same palm-wrap grip, same bottle (clear glass, silver cap, white capsules inside, matte black label, hand-sized scale, same orientation), same scene and background, same top-down overhead camera angle, same tight close-up crop, same composition, same lighting, same depth of field, same color grade, same 5:4 framing, same mood. Do NOT alter the hand, pose, grip, bottle, or scene.

CRITICAL CASING: render the product name text EXACTLY as written: '${productLabel}'. Preserve the exact mix of uppercase, lowercase, hyphens, slashes, parentheses, spaces, and numbers. DO NOT render it in ALL CAPS unless the original name is already in all caps. DO NOT render it in all lowercase. Match the casing style of '5-Amino 1MQ' on REFERENCE 2's label — mixed case where appropriate.

TEXT LAYOUT: ${lineInstruction}

Same font family, same weight, same white color, same centered alignment, same kerning as REFERENCE 2. The Dialed Health heartbeat/ECG logo above the product name stays exactly the same. No dosing, no mg, no mcg, no count, no Rx, no QR, no barcode, no extra text on the label. Do NOT invent new label text.

REFERENCE 1 is the '${productLabel}' studio product shot. Use it ONLY to confirm the correct spelling and casing of the product name. Do NOT copy pixels from REFERENCE 1 — the bottle should remain the exact bottle from REFERENCE 2, just with updated label text. Photorealistic, seamless label text swap only, editorial lifestyle quality, crisp focus, no artifacts.`;
}

const allResults = [];
const allFailures = [];

for (let pi = 0; pi < products.length; pi++) {
  const product = products[pi];
  const productRef = `./DH Shots/Capsules/${product.file}.jpg`;
  const productDir = path.join(BASE, "DH Shots", "Capsules Lifestyle", product.file);
  fs.mkdirSync(productDir, { recursive: true });

  console.log(`\n\n############################################################`);
  console.log(`# PRODUCT ${pi + 1}/${products.length}: ${product.label}`);
  console.log(`############################################################`);

  for (let vi = 0; vi < variants.length; vi++) {
    const variantName = variants[vi];
    const destPath = path.join(productDir, `${variantName}.jpg`);
    if (fs.existsSync(destPath)) {
      console.log(`  [${vi + 1}/${variants.length}] ${variantName} — already exists, skipping`);
      continue;
    }
    const anchor = `./DH Shots/Capsules Lifestyle/5-Amino 1MQ/${variantName}.jpg`;
    const batchJob = {
      prompt: buildPrompt(product.label, product.multiline),
      aspectRatio: "5:4",
      imageSize: "4K",
      refImages: [productRef, anchor],
    };
    fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
    console.log(`  [${vi + 1}/${variants.length}] ${variantName} — generating...`);
    try {
      const stdout = execSync(
        `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
        { cwd: BASE, encoding: "utf-8" }
      );
      const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
      if (!match) { console.log(`    !! Could not parse Saved path`); allFailures.push(`${product.label} ${variantName}`); continue; }
      const savedPath = match[1].trim();
      if (!fs.existsSync(savedPath)) { console.log(`    !! Saved file missing`); allFailures.push(`${product.label} ${variantName}`); continue; }
      fs.copyFileSync(savedPath, destPath);
      console.log(`    -> ${path.basename(savedPath)} -> ${product.file}/${variantName}.jpg`);
      allResults.push(`${product.label} ${variantName}`);
    } catch (err) {
      console.log(`    !! Error: ${err.message.slice(0, 200)}`);
      allFailures.push(`${product.label} ${variantName}`);
    }
  }
}

console.log(`\n\n==================== CAPSULE REMAINDER SUMMARY ====================`);
console.log(`Total:     ${products.length * variants.length}`);
console.log(`Succeeded: ${allResults.length}`);
console.log(`Failed:    ${allFailures.length}`);
if (allFailures.length) {
  console.log(`Failures:`);
  for (const f of allFailures) console.log(`  - ${f}`);
}
console.log(`All done.`);
