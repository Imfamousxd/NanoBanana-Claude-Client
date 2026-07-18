#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const BASE = path.dirname(fileURLToPath(import.meta.url));
const GEN_DIR = path.join(BASE, "generations");
const OUT_DIR = path.join(BASE, "DH Shots", "Vials");
const STYLE_REF = "./generations/2026-04-17T21-19-49_Edit_the_reference_image_of_the_Dialed_H.jpg";

const products = [
  { name: "Epithalon", file: "Epithalon" },
  { name: "GHK-Cu", file: "GHK-Cu" },
  { name: "GHK-Cu/Epithalon", file: "GHK-Cu-Epithalon" },
  { name: "NAD+", file: "NAD+" },
  { name: "SS-31", file: "SS-31" },
  { name: "MOTS-C", file: "MOTS-C" },
  { name: "MOTS-C/Tesamorelin", file: "MOTS-C-Tesamorelin" },
  { name: "Glutathione", file: "Glutathione" },
  { name: "Thymosin Alpha-1", file: "Thymosin Alpha-1" },
  { name: "CJC-1295/Ipamorelin", file: "CJC-1295-Ipamorelin" },
  { name: "Sermorelin", file: "Sermorelin" },
  { name: "Tesamorelin", file: "Tesamorelin" },
  { name: "Tesamorelin/Ipamorelin", file: "Tesamorelin-Ipamorelin" },
  { name: "IGF-LR3", file: "IGF-LR3" },
  { name: "Semax/Selank", file: "Semax-Selank" },
  { name: "Pinealon/PE22-28/Selank", file: "Pinealon-PE22-28-Selank" },
  { name: "DSIP", file: "DSIP" },
  { name: "DSIP/BPC-157/CJC", file: "DSIP-BPC-157-CJC" },
  { name: "AOD 9604", file: "AOD 9604" },
  { name: "AOD-9604/MOTS-C", file: "AOD-9604-MOTS-C" },
  { name: "AOD-9604/MOTS-C/Tesamorelin", file: "AOD-9604-MOTS-C-Tesamorelin" },
  { name: "LIPO-B", file: "LIPO-B" },
  { name: "Testosterone Cyp MCT Oil", file: "Testosterone Cyp MCT Oil" },
  { name: "Testosterone Cyp Cottonseed", file: "Testosterone Cyp Cottonseed" },
  { name: "Pregnyl (HCG)", file: "Pregnyl (HCG)" },
  { name: "Gonadorelin", file: "Gonadorelin" },
  { name: "Kisspeptin", file: "Kisspeptin" },
  { name: "PT-141", file: "PT-141" },
];

function buildPrompt(name) {
  return `Edit the reference image of the Dialed Health injectable vial. Make ONLY one change to the black label and keep everything else in the image identical (same vial shape, same clear glass, same black rubber cap with gold metal band, same soft grey studio background, same camera angle, same soft diffused studio lighting, same shadows, same reflections, same label material, same label position, same label proportions, same white ink color, same centered alignment, same Dialed Health heartbeat/ECG logo on top, same clean bold sans-serif font used for the product name, same letter-spacing, same font weight). Replace the product name text 'Semaglutide + B12' with '${name}' in the exact same font, same weight, same white color, same letter-spacing, same centered alignment, sized proportionally to fit on the label. If the name fits comfortably at the reference size on one single centered line, keep it on one line. If the name is too long to fit cleanly at that size, break it across two centered lines at a natural slash or word boundary, keeping the typography identical. Do NOT add any dosing line, do NOT add mg, do NOT add ml, do NOT add any other word, do NOT add any other text. The label must contain only two elements stacked: the Dialed Health logo on top, and '${name}' centered below it. The Dialed Health logo (the 'DIALED' and 'HEALTH' wordmark split by the white heartbeat/ECG line) must stay perfectly intact, unchanged, same size, same position. Photorealistic, pharmaceutical-grade product photography, sharp focus, crisp label text, no artifacts, no extra text anywhere.`;
}

function newestJpg(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".jpg"))
    .map(f => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return files[0]?.f;
}

const results = [];
const failures = [];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const beforeFile = newestJpg(GEN_DIR);
  const job = {
    prompt: buildPrompt(p.name),
    aspectRatio: "5:4",
    imageSize: "4K",
    refImages: [STYLE_REF],
  };
  fs.writeFileSync(path.join(BASE, "frames-batch.json"), JSON.stringify([job], null, 2));
  console.log(`\n\n====================================================`);
  console.log(`[${i + 1}/${products.length}] Generating: ${p.name}`);
  console.log(`====================================================`);
  try {
    execSync(`node "${path.join(BASE, "nanobanana.mjs")}" --batch "${path.join(BASE, "frames-batch.json")}"`, {
      stdio: "inherit",
      cwd: BASE,
    });
    const latest = newestJpg(GEN_DIR);
    if (!latest || latest === beforeFile) {
      console.log(`  !! No new file produced for ${p.name}`);
      failures.push(p);
      continue;
    }
    const dest = path.join(OUT_DIR, `${p.file}.jpg`);
    fs.copyFileSync(path.join(GEN_DIR, latest), dest);
    console.log(`  -> Copied ${latest} to DH Shots/Vials/${p.file}.jpg`);
    results.push({ product: p.name, src: latest, dest: `${p.file}.jpg` });
  } catch (err) {
    console.log(`  !! Generation failed for ${p.name}: ${err.message}`);
    failures.push(p);
  }
}

console.log(`\n\n========== SUMMARY ==========`);
console.log(`Succeeded: ${results.length} / ${products.length}`);
if (failures.length) {
  console.log(`Failed:`);
  for (const f of failures) console.log(`  - ${f.name}`);
}
console.log(`All done.`);
