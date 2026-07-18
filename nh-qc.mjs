#!/usr/bin/env node
// QC pass: compare each generation against the canonical reference using Gemini Vision.
// Usage:
//   node nh-qc.mjs --sample 30   # test on 30 random images
//   node nh-qc.mjs --all         # check every image
//   node nh-qc.mjs --paths file  # check files listed in `file` (one path per line)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
// Use the dark-amber navy baseline as reference: amber variants are the tricky ones for
// label-wrap, and clear-glass variants visually have a wider label by default so they
// pass anyway. Comparing amber-to-amber gives the model a fair apples-to-apples target.
const REF_PATH = "Noble Harbor Wholesale/_baselines/baseline_3ml-dark_navy.jpg";
const ROOT = "Noble Harbor Wholesale";

const PROMPT = `You are a QC reviewer for pharmaceutical vial product photography in the Noble Harbor wholesale "xx mg placeholder" line.

Two images are provided:
- IMAGE 1 (reference): the canonical correct baseline (3ml clear, navy cap, 'xx mg · 3 ml' placeholder dose).
- IMAGE 2 (candidate): the image to QC.

Examine the LABEL and overall composition of the vial in IMAGE 2 and judge it against the reference. The candidate may legitimately differ from the reference in: product name (any peptide name, not just BPC-157), cap color (any of: navy, black, white, red/crimson, green, baby blue, yellow, pink, purple), bottom-bar color (matches the cap, except for white-cap which uses medium grey), and glass color (clear OR amber/dark-brown for the dark variant).

PASS criteria — IMAGE 2 must satisfy ALL:
1. LABEL WRAP (most important — examine carefully, this is the most common failure mode):
   - In the region of the vial where the label is, measure the label's horizontal width at its widest visible point.
   - Measure the visible vial body's horizontal width at the same vertical position.
   - The label width must be AT LEAST 85% of the vial body width at the same vertical level. The label should look like a wrapping strip that goes nearly edge-to-edge across the visible front, with only a small curve/perspective falloff at the very left and right where it wraps around.
   - FAIL if you can see a strip of naked glass (clear or amber) wider than ~7% of the vial body on EITHER the left or right side of the label, in the same vertical band as the label.
   - The reference image (IMAGE 1) shows the correct wrap. The candidate must match its wrap proportions.
   - DO NOT pass a candidate where the label is a narrow centered rectangle floating on the front of the vial with substantial glass visible on both sides.
2. LAYOUT: text block sits in the LOWER portion of the label, with the UPPER ~60-75% of the label being mostly empty pristine white space (the "logo zone").
3. CONTENT: the dose-and-volume line shows the literal placeholder 'xx mg · 3 ml' OR 'xx mg · 5 ml' — the 'xx' must be two lowercase letter x characters, NOT a real dose number.
4. TEXT BLOCK: in order — bold product name, bold dose line ('xx mg · X ml'), two-line compliance ('FOR RESEARCH USE ONLY' / 'NOT FOR HUMAN CONSUMPTION'), single lot line ('LOT: NH-1024'). All horizontally centered.
5. BAR: a single solid colored bar at the very bottom edge of the label, running uninterrupted EDGE-TO-EDGE across the full label width with no gap, fade, or truncation. Bar color matches the cap (white-cap exception → medium grey bar).
6. LABEL MATERIAL: pristine clean white surface, fully opaque, no dark patches / ghosting / amber bleed-through (even on the dark amber vial).
7. NO extra hairlines, horizontal rules, or graphics anywhere on the label other than the single bottom bar.
8. TYPOGRAPHY: clean Helvetica-like medical sans-serif. Bold weight for product name + dose; thin/light weight for compliance + lot.

FAIL if any of:
- LABEL DOES NOT WRAP: the label is rendered as a small/medium-width centered rectangle on the front of the vial with significant naked glass (amber or clear) visible to the left and right of the label in the same vertical band. The label does not extend to the visible left/right edges of the vial body.
- Dose line shows a real number instead of literal 'xx' (e.g. '5 mg · 3 ml', '10 mg · 3 ml').
- Text positioned too high — text block centered on label, or empty zone < ~50% of label.
- Bar truncates / has white gap on either edge / does not wrap fully.
- Label has dark patches, ghosting, amber bleed-through, or visible non-white tinting on its main face.
- Extra hairlines or rules above the bar (only the single bar is allowed).
- Compliance is one line, three lines, or wraps unexpectedly.
- Lot line is left- or right-aligned, or missing.
- Text is left- or right-aligned anywhere.
- Cap color shifts noticeably from the spec (we don't expect the QC to match cap exactly, but obvious wrong color e.g. green cap on a job clearly intended to be red is a fail).
- Layout meaningfully different (text block sideways, on the side, or absent).

Output ONLY this JSON, no markdown, no extra text:
{"pass": <true|false>, "reason": "<one short sentence>"}`;

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/\.jpg$/i.test(f.name)) yield p;
  }
}

function loadB64(p) {
  return fs.readFileSync(p).toString("base64");
}

const refB64 = loadB64(REF_PATH);

async function checkImage(filepath, attempt = 1) {
  const candidateB64 = loadB64(filepath);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: "image/jpeg", data: refB64 } },
        { inline_data: { mime_type: "image/jpeg", data: candidateB64 } },
        { text: PROMPT },
      ],
    }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  };
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 2000)); return checkImage(filepath, attempt + 1); }
    return { pass: null, reason: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429 && attempt < 4) { await new Promise(r => setTimeout(r, 5000 * attempt)); return checkImage(filepath, attempt + 1); }
    return { pass: null, reason: `HTTP ${res.status}: ${text.slice(0, 120)}` };
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try { return JSON.parse(text); }
  catch { return { pass: null, reason: `Parse: ${text.slice(0, 120)}` }; }
}

// Determine target list
const args = process.argv.slice(2);
// Only QC top-level peptide masters: Noble Harbor Wholesale/<Product>/<file>.jpg.
// Skip the _baselines/ folder and any dose subfolders.
const allFiles = [...walk(ROOT)]
  .filter(f => f !== path.normalize(REF_PATH))
  .filter(f => {
    const rel = path.relative(ROOT, f).split(path.sep);
    return rel.length === 2 && !rel[0].startsWith("_");
  });
let targets;
let outSuffix = "";
if (args[0] === "--all") {
  targets = allFiles;
  outSuffix = "all";
} else if (args[0] === "--sample") {
  const n = parseInt(args[1]) || 30;
  // Random sample across products for diversity
  const shuffled = [...allFiles].sort(() => Math.random() - 0.5);
  targets = shuffled.slice(0, n);
  outSuffix = `sample${n}`;
} else if (args[0] === "--paths") {
  const lines = fs.readFileSync(args[1], "utf-8").split("\n").map(l => l.trim()).filter(Boolean);
  targets = lines.map(l => path.join(ROOT, l));
  outSuffix = "paths";
} else {
  console.error("Usage: node nh-qc.mjs --all | --sample N | --paths file");
  process.exit(1);
}

console.log(`Reference: ${REF_PATH}`);
console.log(`Checking ${targets.length} images, concurrency 6\n`);

const CONCURRENCY = 6;
const queue = [...targets];
const results = [];
let done = 0;

async function worker() {
  while (queue.length) {
    const file = queue.shift();
    if (!file) break;
    const rel = path.relative(ROOT, file);
    const r = await checkImage(file);
    results.push({ file: rel, ...r });
    done++;
    if (done % 25 === 0 || done === targets.length) console.log(`  ${done}/${targets.length}`);
  }
}

await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));

const passed = results.filter(r => r.pass === true);
const failed = results.filter(r => r.pass === false);
const errored = results.filter(r => r.pass === null);

const resultsFile = `nh-qc-results-${outSuffix}.jsonl`;
const failuresFile = `nh-qc-failures-${outSuffix}.txt`;
fs.writeFileSync(resultsFile, results.map(r => JSON.stringify(r)).join("\n"));
fs.writeFileSync(failuresFile, failed.map(f => f.file).join("\n"));

console.log(`\n=== QC complete ===`);
console.log(`PASS: ${passed.length}  FAIL: ${failed.length}  ERROR: ${errored.length}`);
console.log(`Results: ${resultsFile}`);
console.log(`Failures (paths): ${failuresFile}`);

if (failed.length) {
  console.log(`\nFirst 10 failures:`);
  for (const f of failed.slice(0, 10)) console.log(`  ${f.file} — ${f.reason}`);
}
if (errored.length) {
  console.log(`\nErrors: ${errored.length} (see results file)`);
}
