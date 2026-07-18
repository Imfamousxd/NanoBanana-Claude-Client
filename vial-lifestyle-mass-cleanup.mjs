#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(BASE, "DH Shots", "Vials Lifestyle");
const BATCH_FILE = path.join(BASE, "vial-mass-cleanup-batch.json");

const products = fs.readdirSync(ROOT).filter(f => fs.statSync(path.join(ROOT, f)).isDirectory()).sort();
const variants = ["man-kitchen", "woman-kitchen", "man-track", "woman-track"];

const PROMPT = `Edit REFERENCE 1 to CLEAN UP the vial — remove any minor scratches, smudges, scuff lines, wear marks, dust specks, small imperfections, or blemishes on the glass, cap, or label surfaces, so the vial looks like a pristine, brand-new, unblemished product. Keep absolutely everything else in REFERENCE 1 IDENTICAL: same hand, skin, grip, fingers, vial shape and size, cap, label text and logo, label position, scene, background, top-down camera angle, composition, lighting (direction, color temperature, contrast, shadows, specular highlights), depth of field, color grade, 5:4 framing. The cleaned-up vial must STILL look naturally lit by the scene — the bottle remains a scene-integrated object, not studio-clean or artificially bright. Photorealistic, seamless product retouch only, scene-integrated lighting preserved, editorial lifestyle quality, crisp focus, no artifacts.`;

let success = 0, fail = 0, skipped = 0;
const failures = [];

const total = products.length * variants.length;
let done = 0;

for (const product of products) {
  for (const variant of variants) {
    done++;
    const destPath = path.join(ROOT, product, `${variant}.jpg`);
    if (!fs.existsSync(destPath)) {
      console.log(`[${done}/${total}] ${product}/${variant} — SOURCE MISSING, skipping`);
      skipped++;
      continue;
    }
    const refPath = `./DH Shots/Vials Lifestyle/${product}/${variant}.jpg`;
    const batchJob = { prompt: PROMPT, aspectRatio: "5:4", imageSize: "4K", refImages: [refPath] };
    fs.writeFileSync(BATCH_FILE, JSON.stringify([batchJob], null, 2));
    console.log(`[${done}/${total}] ${product}/${variant} — cleaning...`);
    try {
      const stdout = execSync(
        `node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`,
        { cwd: BASE, encoding: "utf-8" }
      );
      const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
      if (!match) { console.log(`  !! parse fail`); failures.push(`${product}/${variant}`); fail++; continue; }
      const savedPath = match[1].trim();
      if (!fs.existsSync(savedPath)) { console.log(`  !! saved missing`); failures.push(`${product}/${variant}`); fail++; continue; }
      fs.copyFileSync(savedPath, destPath);
      console.log(`  -> overwrote ${product}/${variant}.jpg`);
      success++;
    } catch (err) {
      console.log(`  !! Error: ${err.message.slice(0, 200)}`);
      failures.push(`${product}/${variant}`);
      fail++;
    }
  }
}

console.log(`\n\n==================== VIAL MASS CLEANUP SUMMARY ====================`);
console.log(`Products:  ${products.length}`);
console.log(`Variants:  ${variants.length} per product`);
console.log(`Total:     ${total}`);
console.log(`Succeeded: ${success}`);
console.log(`Skipped:   ${skipped}`);
console.log(`Failed:    ${fail}`);
if (failures.length) { for (const f of failures) console.log(`  - ${f}`); }
console.log(`All done.`);
