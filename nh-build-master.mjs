#!/usr/bin/env node
// Build a master Noble Harbor batch JSON spanning every peptide product.
// Reads the peptide list from `nh-peptides.txt` (one name per line, '#' comments allowed).
// Concatenates 27 jobs per peptide (9 colors × 3 vial styles) into a single batch JSON.
// Usage: node nh-build-master.mjs [outfile]   (default: nh-master.json)

import fs from "fs";
import { execSync } from "child_process";

const outFile = process.argv[2] || "nh-master.json";

const peptides = fs.readFileSync("nh-peptides.txt", "utf8")
  .split("\n")
  .map(l => l.replace(/#.*$/, "").trim())
  .filter(Boolean);

const allJobs = [];
for (const peptide of peptides) {
  const tmpFile = `nh-tmp-${Math.random().toString(36).slice(2, 10)}.json`;
  execSync(`node nh-build-batch.mjs ${JSON.stringify(peptide)} ${tmpFile}`, { stdio: "inherit" });
  const jobs = JSON.parse(fs.readFileSync(tmpFile, "utf8"));
  allJobs.push(...jobs);
  fs.unlinkSync(tmpFile);
}

fs.writeFileSync(outFile, JSON.stringify(allJobs, null, 2));
console.log(`\nMaster batch: ${allJobs.length} jobs (${peptides.length} peptides × 27 variants) → ${outFile}`);
