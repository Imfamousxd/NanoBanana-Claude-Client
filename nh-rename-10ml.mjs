#!/usr/bin/env node
// Move 10ml batch outputs from nh-outputs/ into Noble Harbor Wholesale/<Peptide>/<stem>_10ml_<color>.jpg
// Matches each job to its output by the slug tag at the start of the prompt (parallel-worker safe).
// Usage: node nh-rename-10ml.mjs <batch.json>

import fs from "fs";
import path from "path";

const batchFile = process.argv[2];
if (!batchFile) { console.error("Usage: node nh-rename-10ml.mjs <batch.json>"); process.exit(1); }

const jobs = JSON.parse(fs.readFileSync(batchFile, "utf8"));
const GENS = process.env.OUTPUT_DIR || "nh-outputs";
if (!fs.existsSync(GENS)) { console.error(`Output directory not found: ${GENS}`); process.exit(1); }

const allGens = fs.readdirSync(GENS).filter(f => /\.(jpg|png)$/i.test(f));
const tagToSlug = (tag) => tag.replace(/-/g, "_");
const stemOf = (name) => name.replace(/\s+/g, "_");

console.log(`Batch jobs: ${jobs.length}  |  output candidates in ${GENS}: ${allGens.length}`);

let moved = 0, skipped = 0, collisions = 0;
const usedFiles = new Set();

for (const job of jobs) {
  const meta = job._meta;
  if (!meta) { skipped++; continue; }
  const truncated = tagToSlug(meta.tag).slice(0, 40);
  const re = new RegExp(`_${truncated.replace(/[-.]/g, "\\$&")}(_|\\.)`);
  const matches = allGens.filter(f => re.test(f) && !usedFiles.has(f));
  if (matches.length === 0) { console.warn(`  ${meta.tag}: no matching output`); skipped++; continue; }
  if (matches.length > 1) collisions++;
  matches.sort();
  const match = matches[matches.length - 1];
  usedFiles.add(match);

  const folder = path.join("Noble Harbor Wholesale", meta.peptide);
  fs.mkdirSync(folder, { recursive: true });
  const ext = path.extname(match);
  const dst = path.join(folder, `${stemOf(meta.peptide)}_10ml_${meta.color}${ext}`);
  fs.renameSync(path.join(GENS, match), dst);
  moved++;
  if (moved <= 3) console.log(`  ${meta.tag} → ${dst}`);
  else if (moved === 4) console.log("  …");
}

console.log(`\nDone: ${moved} moved, ${skipped} skipped, ${collisions} multi-match (latest used).`);
