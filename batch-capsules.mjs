#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(BASE, "DH Shots", "Capsules");
const STYLE_REF = "./generations/2026-04-17T21-31-37_Create_a_new_photorealistic_product_shot.jpg";
const BATCH_FILE = path.join(BASE, "capsules-batch.json");

const products = [
  { name: "Ondansetron (GLP-1 Support)", file: "Ondansetron (GLP-1 Support)" },
  { name: "BPC-157/TB500", file: "BPC-157-TB500" },
  { name: "BPC-157", file: "BPC-157" },
  { name: "Methylene Blue", file: "Methylene Blue" },
  { name: "Ibutamoren (MK-677)", file: "Ibutamoren (MK-677)" },
  { name: "Dihexa", file: "Dihexa" },
  { name: "Dihexa/Tesofensine", file: "Dihexa-Tesofensine" },
  { name: "5-Amino 1MQ", file: "5-Amino 1MQ" },
  { name: "SLU-PP 332", file: "SLU-PP 332" },
  { name: "SLU-PP 332/BAM 15", file: "SLU-PP 332-BAM 15" },
  { name: "Enclomiphene", file: "Enclomiphene" },
  { name: "Clomiphene Citrate", file: "Clomiphene Citrate" },
  { name: "Sildenafil/Tadalafil/Oxytocin", file: "Sildenafil-Tadalafil-Oxytocin" },
  { name: "Sildenafil/Tadalafil/Bremelanotide", file: "Sildenafil-Tadalafil-Bremelanotide" },
  { name: "Apomorphine/Bremelanotide/Tadalafil/Oxy", file: "Apomorphine-Bremelanotide-Tadalafil-Oxy" },
  { name: "Sildenafil (Commercial)", file: "Sildenafil (Commercial)" },
  { name: "Tadalafil (Commercial)", file: "Tadalafil (Commercial)" },
];

function buildPrompt(name) {
  return `Edit the reference image of the Dialed Health capsule / pill bottle. Make ONLY one change to the black label and keep everything else in the image identical (same clear glass pill bottle shape, same brushed silver screw cap, same white pharmaceutical capsules visible inside the clear glass, same soft grey studio background, same camera angle, same soft diffused studio lighting, same shadows, same reflections, same matte black label material wrapping the front of the bottle body, same label position, same label proportions, same white ink color, same centered alignment, same Dialed Health heartbeat/ECG logo on top, same clean bold sans-serif font used for the product name, same letter-spacing, same font weight). Replace the product name text 'Tesofensine' with '${name}' in the exact same font, same weight, same white color, same letter-spacing, same centered alignment, sized proportionally to fit on the label. If the name fits comfortably at the reference size on one single centered line, keep it on one line. If the name is too long to fit cleanly at that size, break it across two centered lines at a natural slash, space, or parenthesis boundary, keeping the typography identical. Do NOT add any dosing line, do NOT add mg, do NOT add mcg, do NOT add count, do NOT add any other word, do NOT add any other text. The label must contain only two elements stacked: the Dialed Health logo on top, and '${name}' centered below it. The Dialed Health logo (the 'DIALED' and 'HEALTH' wordmark split by the white heartbeat/ECG line) must stay perfectly intact, unchanged, same size, same position. Photorealistic, pharmaceutical-grade product photography, sharp focus, crisp label text, no artifacts, no extra text anywhere.`;
}

const results = [];
const failures = [];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const job = {
    prompt: buildPrompt(p.name),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [STYLE_REF],
  };
  fs.writeFileSync(BATCH_FILE, JSON.stringify([job], null, 2));
  console.log(`\n\n====================================================`);
  console.log(`[${i + 1}/${products.length}] Generating: ${p.name}`);
  console.log(`====================================================`);
  try {
    const stdout = execSync(`node "${path.join(BASE, "nanobanana.mjs")}" --batch "${BATCH_FILE}"`, {
      cwd: BASE,
      encoding: "utf-8",
    });
    process.stdout.write(stdout);
    const match = stdout.match(/Saved:\s+(.+\.jpg)\s*$/m);
    if (!match) {
      console.log(`  !! Could not parse saved filename for ${p.name}`);
      failures.push(p);
      continue;
    }
    const savedPath = match[1].trim();
    if (!fs.existsSync(savedPath)) {
      console.log(`  !! Parsed file does not exist: ${savedPath}`);
      failures.push(p);
      continue;
    }
    const dest = path.join(OUT_DIR, `${p.file}.jpg`);
    fs.copyFileSync(savedPath, dest);
    console.log(`  -> Copied ${path.basename(savedPath)} to DH Shots/Capsules/${p.file}.jpg`);
    results.push({ product: p.name, dest: `${p.file}.jpg` });
  } catch (err) {
    console.log(`  !! Generation failed for ${p.name}: ${err.message}`);
    failures.push(p);
  }
}

console.log(`\n\n========== CAPSULES SUMMARY ==========`);
console.log(`Succeeded: ${results.length} / ${products.length}`);
if (failures.length) {
  console.log(`Failed:`);
  for (const f of failures) console.log(`  - ${f.name}`);
}
console.log(`All done.`);
