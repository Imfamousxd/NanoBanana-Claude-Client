#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const BATCH_FILE = path.join(BASE, "vial-cleanup-2-batch.json");

const jobs = [
  { folder: "BPC-157-TB500", variant: "man-track" },
  { folder: "BPC-157-TB500", variant: "woman-track" },
  { folder: "CJC-1295-Ipamorelin", variant: "man-kitchen" },
  { folder: "CJC-1295-Ipamorelin", variant: "woman-kitchen" },
  { folder: "CJC-1295-Ipamorelin", variant: "woman-track" },
  { folder: "DSIP", variant: "man-kitchen" },
  { folder: "DSIP", variant: "woman-kitchen" },
  { folder: "DSIP", variant: "woman-track" },
];

const PROMPT = `Edit REFERENCE 1 to CLEAN UP the vial — remove any minor scratches, smudges, scuff lines, wear marks, dust specks, small imperfections, or blemishes on the glass, cap, or label surfaces, so the vial looks like a pristine, brand-new, unblemished product. Keep absolutely everything else in REFERENCE 1 IDENTICAL: same hand, skin, grip, fingers, vial shape and size, cap, label text and logo, label position, scene, background, top-down camera angle, composition, lighting (direction, color temperature, contrast, shadows, specular highlights), depth of field, color grade, 5:4 framing. The cleaned-up vial must STILL look naturally lit by the scene — the bottle remains a scene-integrated object, not studio-clean or artificially bright. Photorealistic, seamless product retouch only, scene-integrated lighting preserved, editorial lifestyle quality, crisp focus, no artifacts.`;

for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  const refPath = `./DH Shots/Vials Lifestyle/${job.folder}/${job.variant}.jpg`;
  const destPath = path.join(BASE, "DH Shots", "Vials Lifestyle", job.folder, `${job.variant}.jpg`);
  const batchJob = { prompt: PROMPT, aspectRatio: "5:4", imageSize: "4K", refImages: [refPath] };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
  console.log(`\n[${i + 1}/${jobs.length}] ${job.folder}/${job.variant} — cleaning...`);
  try {
    const stdout = execSync(
      `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
      { cwd: BASE, encoding: "utf-8" }
    );
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) { console.log(`  !! parse fail`); continue; }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) { console.log(`  !! saved missing`); continue; }
    fs.copyFileSync(savedPath, destPath);
    console.log(`  -> ${job.folder}/${job.variant}.jpg`);
  } catch (err) {
    console.log(`  !! Error: ${err.message.slice(0, 200)}`);
  }
}
console.log(`\nAll done.`);
