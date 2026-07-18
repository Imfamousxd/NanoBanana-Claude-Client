#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(BASE, "DH Shots", "Oral Drops Lifestyle", "Tirzepatide");
const BATCH_FILE = path.join(BASE, "oral-tirz-from-sema-batch.json");
const PRODUCT_REF = "./DH Shots/Oral Drops/Tirzepatide.jpg";

const jobs = ["man-gym", "man-track", "man-kitchen", "woman-gym", "woman-track", "woman-kitchen"].map(name => ({
  name,
  anchor: `./DH Shots/Oral Drops Lifestyle/Semaglutide/${name}.jpg`,
}));

fs.mkdirSync(OUT_DIR, { recursive: true });

function buildPrompt(job) {
  return `Edit REFERENCE 2 by CHANGING ONLY the product name text on the oral drop bottle's label from 'Semaglutide' to 'Tirzepatide'. Make ONLY that text change and keep absolutely everything else in REFERENCE 2 IDENTICAL: same hand (same gender, skin tone, nails if present), same natural grip and finger placement, same oral drop bottle (same shape, same frosted silver-white glass body, same white ribbed collar, same white dropper cap, same white rubber bulb tip, same scale, same orientation), same scene and background, same top-down overhead camera angle, same tight close-up crop, same composition, same lighting (direction, color temperature, contrast, shadows, specular highlights), same depth of field, same color grade, same 5:4 framing, same mood. Do NOT alter the hand, pose, grip, or scene in any way. The final image should be IDENTICAL to REFERENCE 2 except that the product name on the matte black label now reads 'Tirzepatide' instead of 'Semaglutide' — in the SAME font, SAME weight, SAME size, SAME kerning, SAME centered alignment, SAME white color as the 'Semaglutide' text was rendered in REFERENCE 2. The Dialed Health heartbeat/ECG logo above the product name stays exactly the same. That is ALL on the label — no dosing, no mg, no mL, no Rx, no QR, no barcode, no extra text. Do NOT invent new label text.

REFERENCE 1 is the Tirzepatide studio product shot. Use it ONLY to confirm the correct spelling and visual weight of the 'Tirzepatide' product name text. Do NOT copy pixels from REFERENCE 1 — the bottle in the output should remain the exact bottle from REFERENCE 2, just with the updated label text. Photorealistic, seamless label text swap only, editorial lifestyle quality, crisp focus, no artifacts.`;
}

for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  const destPath = path.join(OUT_DIR, `${job.name}.jpg`);
  if (fs.existsSync(destPath)) {
    console.log(`[${i + 1}/${jobs.length}] ${job.name} — already exists, skipping`);
    continue;
  }
  const batchJob = {
    prompt: buildPrompt(job),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [PRODUCT_REF, job.anchor],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${jobs.length}] ${job.name} — generating (anchor: Semaglutide/${job.name}.jpg)...`);
  try {
    const stdout = execSync(
      `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
      { cwd: BASE, encoding: "utf-8" }
    );
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) { console.log(`  !! Could not parse Saved path`); continue; }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) { console.log(`  !! Saved file missing: ${savedPath}`); continue; }
    fs.copyFileSync(savedPath, destPath);
    console.log(`  -> ${path.basename(savedPath)} -> Tirzepatide/${job.name}.jpg`);
  } catch (err) {
    console.log(`  !! Generation error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
