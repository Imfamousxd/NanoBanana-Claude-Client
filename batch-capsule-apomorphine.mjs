#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_FILE = "Apomorphine-Bremelanotide-Tadalafil-Oxy";
const PRODUCT_LABEL = "Apomorphine/Bremelanotide/Tadalafil/Oxy";
const OUT_DIR = path.join(BASE, "DH Shots", "Capsules Lifestyle", PRODUCT_FILE);
const BATCH_FILE = path.join(BASE, "capsule-apomorphine-batch.json");
const PRODUCT_REF = `./DH Shots/Capsules/${PRODUCT_FILE}.jpg`;

const variants = ["man-gym", "man-track", "man-kitchen", "woman-gym", "woman-track", "woman-kitchen"];

fs.mkdirSync(OUT_DIR, { recursive: true });

function buildPrompt(variant) {
  return `Edit REFERENCE 2 by CHANGING ONLY the product name text on the capsule pill bottle's label from '5-Amino 1MQ' to '${PRODUCT_LABEL}'. Make ONLY that text change and keep absolutely everything else in REFERENCE 2 IDENTICAL: same hand (same gender, skin tone, nails if present), same palm-wrap grip with all four fingers on one side and thumb on the other, same finger positions, same capsule pill bottle (same clear glass body, same brushed silver screw cap, same white capsules visible inside, same matte black label, same hand-sized scale, same orientation), same scene and background, same top-down overhead camera angle, same tight close-up crop, same composition, same lighting (direction, color temperature, contrast, shadows, specular highlights), same depth of field, same color grade, same 5:4 framing, same mood. Do NOT alter the hand, pose, grip, bottle, or scene in any way. The final image should be IDENTICAL to REFERENCE 2 except that the product name on the matte black label now reads '${PRODUCT_LABEL}' instead of '5-Amino 1MQ' — in the SAME font, SAME weight, SAME white color, SAME centered alignment, SAME prominence/size as the '5-Amino 1MQ' text was rendered in REFERENCE 2. Because the new name is longer, it may break cleanly onto two centered lines at natural slash boundaries if needed, keeping the typography identical. The Dialed Health heartbeat/ECG logo above the product name stays exactly the same. That is ALL on the label — no dosing, no mg, no mcg, no count, no Rx, no QR, no barcode, no extra text. Do NOT invent new label text.

REFERENCE 1 is the '${PRODUCT_LABEL}' studio product shot. Use it ONLY to confirm the correct spelling of the product name. Do NOT copy pixels from REFERENCE 1 — the bottle should remain the exact bottle from REFERENCE 2, just with updated label text. Photorealistic, seamless label text swap only, editorial lifestyle quality, crisp focus, no artifacts.`;
}

for (let i = 0; i < variants.length; i++) {
  const variantName = variants[i];
  const destPath = path.join(OUT_DIR, `${variantName}.jpg`);
  if (fs.existsSync(destPath)) {
    console.log(`[${i + 1}/${variants.length}] ${variantName} — already exists, skipping`);
    continue;
  }
  const anchor = `./DH Shots/Capsules Lifestyle/5-Amino 1MQ/${variantName}.jpg`;
  const batchJob = {
    prompt: buildPrompt(variantName),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [PRODUCT_REF, anchor],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${variants.length}] ${variantName} — generating...`);
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
    console.log(`  -> ${path.basename(savedPath)} -> ${PRODUCT_FILE}/${variantName}.jpg`);
  } catch (err) {
    console.log(`  !! Error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
