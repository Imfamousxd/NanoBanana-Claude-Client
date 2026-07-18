#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const BATCH_FILE = path.join(BASE, "capsule-trio-batch.json");

const products = [
  { file: "Clomiphene Citrate", label: "Clomiphene Citrate" },
  { file: "Dihexa", label: "Dihexa" },
  { file: "Dihexa-Tesofensine", label: "Dihexa/Tesofensine" },
];

const variants = ["man-gym", "man-track", "man-kitchen", "woman-gym", "woman-track", "woman-kitchen"];

function buildPrompt(productLabel, variantName) {
  return `Edit REFERENCE 2 by CHANGING ONLY the product name text on the capsule pill bottle's label from '5-Amino 1MQ' to '${productLabel}'. Make ONLY that text change and keep absolutely everything else in REFERENCE 2 IDENTICAL: same hand (same gender, skin tone, nails if present), same palm-wrap grip with all four fingers on one side and thumb on the other, same finger positions, same capsule pill bottle (same clear glass body, same brushed silver screw cap, same white capsules visible inside, same matte black label, same hand-sized scale, same orientation), same scene and background, same top-down overhead camera angle, same tight close-up crop, same composition, same lighting, same depth of field, same color grade, same 5:4 framing, same mood. Do NOT alter the hand, pose, grip, bottle, or scene.

TEXT SIZE (CRITICAL): match the EXACT text size, weight, and proportion of the '5-Amino 1MQ' product name as rendered in REFERENCE 2. Do NOT scale the new text up or down — it must occupy the same approximate vertical height and visual weight on the label as the original text did. If '${productLabel}' is longer than '5-Amino 1MQ', it may break cleanly onto two centered lines at natural slash boundaries, but the per-character size stays the same as REFERENCE 2. Same font family, same weight, same white color, same centered alignment, same kerning. The goal is a plug-in text swap, not a resize.

The Dialed Health heartbeat/ECG logo above the product name stays exactly the same. That is ALL on the label — no dosing, no mg, no mcg, no count, no Rx, no QR, no barcode, no extra text. Do NOT invent new label text.

REFERENCE 1 is the '${productLabel}' studio product shot. Use it ONLY to confirm the correct spelling of the product name. Do NOT copy pixels from REFERENCE 1 — the bottle should remain the exact bottle from REFERENCE 2, just with updated label text. Photorealistic, seamless label text swap only, editorial lifestyle quality, crisp focus, no artifacts.`;
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
      console.log(`\n  [${vi + 1}/${variants.length}] ${variantName} — already exists, skipping`);
      continue;
    }
    const anchor = `./DH Shots/Capsules Lifestyle/5-Amino 1MQ/${variantName}.jpg`;
    const batchJob = {
      prompt: buildPrompt(product.label, variantName),
      aspectRatio: "5:4",
      imageSize: "4K",
      refImages: [productRef, anchor],
    };
    fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
    console.log(`\n  [${vi + 1}/${variants.length}] ${variantName} — generating...`);
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

console.log(`\n\n==================== CAPSULE TRIO SUMMARY ====================`);
console.log(`Succeeded: ${allResults.length}`);
console.log(`Failed:    ${allFailures.length}`);
if (allFailures.length) {
  console.log(`Failures:`);
  for (const f of allFailures) console.log(`  - ${f}`);
}
console.log(`All done.`);
