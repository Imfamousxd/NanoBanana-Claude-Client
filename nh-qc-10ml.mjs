#!/usr/bin/env node
// QC the 10ml set by comparing each <Product>_10ml_<color>.jpg against its OWN 5ml twin.
// PASS = same vial/framing/bg/label, with ONLY the volume text changed to "10 ml".
// Usage: node nh-qc-10ml.mjs            # all 297
//        node nh-qc-10ml.mjs --sample 20

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
const ROOT = "Noble Harbor Wholesale";
const colors = ["navy","black","white","red","green","babyblue","yellow","pink","purple"];

const PROMPT = `You QC a pharmaceutical vial product photo. Two images of the SAME product are provided:
- IMAGE 1 (reference): the approved "5 ml" version.
- IMAGE 2 (candidate): the new "10 ml" version. It should be IDENTICAL to IMAGE 1 in every way EXCEPT the printed volume text was changed from "5 ml" to "10 ml".

PASS only if ALL are true:
1. VOLUME TEXT: in IMAGE 2 the dose-and-volume line reads "xx mg · 10 ml" — literal lowercase "xx", a middle dot, and "10 ml". FAIL if it still says "5 ml", says a real dose number instead of "xx", is misspelled (e.g. "1O ml", "10 mI", "10ml l"), garbled, or doubled.
2. FRAMING/SCALE: the vial is at essentially the same camera zoom, position and scale as IMAGE 1 (the vial occupies about the same area of the frame). FAIL if IMAGE 2 is noticeably more zoomed-in/out or the vial is a clearly different size/crop than IMAGE 1.
3. BACKGROUND: clean, pure white, seamless. FAIL if there are grey smudges, dust, marks, patches, blotches, or stray shadows anywhere in the background (other than the soft contact shadow directly under the vial).
4. LABEL/VIAL UNCHANGED: same cap color & shape, same product name, same two compliance lines, same "LOT: NH-1024" line, same bottom accent bar, same label wrap and layout, same typography — all matching IMAGE 1. FAIL if any other text or element changed, moved, or got distorted, or if the label has dark patches / ghosting / bleed-through.
5. QUALITY: sharp, undistorted, no warping, no extra/duplicate vials or objects.

Output ONLY this JSON, no markdown:
{"pass": <true|false>, "reason": "<one short sentence; if fail, name the specific problem>"}`;

function loadB64(p) { return fs.readFileSync(p).toString("base64"); }

async function check(refPath, candPath, attempt = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: "image/jpeg", data: loadB64(refPath) } },
      { inline_data: { mime_type: "image/jpeg", data: loadB64(candPath) } },
      { text: PROMPT },
    ] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  };
  let res;
  try {
    res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 2000)); return check(refPath, candPath, attempt + 1); }
    return { pass: null, reason: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429 && attempt < 5) { await new Promise(r => setTimeout(r, 5000 * attempt)); return check(refPath, candPath, attempt + 1); }
    return { pass: null, reason: `HTTP ${res.status}: ${text.slice(0, 120)}` };
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { pass: null, reason: `Parse: ${text.slice(0, 120)}` }; }
}

// Build target list: every product's 10ml files that have a 5ml twin
const products = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith("_")).map(d => d.name);
let targets = [];
for (const p of products) {
  const stem = p.replace(/\s+/g, "_");
  for (const c of colors) {
    const cand = path.join(ROOT, p, `${stem}_10ml_${c}.jpg`);
    const ref = path.join(ROOT, p, `${stem}_5ml_${c}.jpg`);
    if (fs.existsSync(cand) && fs.existsSync(ref)) targets.push({ product: p, color: c, cand, ref });
  }
}

const args = process.argv.slice(2);
if (args[0] === "--sample") {
  const n = parseInt(args[1]) || 20;
  targets = [...targets].sort(() => Math.random() - 0.5).slice(0, n);
} else if (args[0] === "--paths") {
  const wanted = new Set(fs.readFileSync(args[1], "utf-8").split("\n").map(l => l.trim()).filter(Boolean));
  targets = targets.filter(t => wanted.has(path.relative(ROOT, t.cand)));
}

console.log(`QC ${targets.length} 10ml images (each vs its own 5ml twin), concurrency 6\n`);

const CONCURRENCY = 6;
const queue = [...targets];
const results = [];
let done = 0;
async function worker() {
  while (queue.length) {
    const t = queue.shift();
    if (!t) break;
    const r = await check(t.ref, t.cand);
    results.push({ file: path.relative(ROOT, t.cand), product: t.product, color: t.color, ...r });
    done++;
    if (done % 25 === 0 || done === targets.length) console.log(`  ${done}/${targets.length}`);
  }
}
await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));

const passed = results.filter(r => r.pass === true);
const failed = results.filter(r => r.pass === false);
const errored = results.filter(r => r.pass === null);

fs.writeFileSync("nh-qc-10ml-results.jsonl", results.map(r => JSON.stringify(r)).join("\n"));
fs.writeFileSync("nh-qc-10ml-failures.txt", failed.map(f => f.file).join("\n"));

console.log(`\n=== 10ml QC complete ===`);
console.log(`PASS: ${passed.length}  FAIL: ${failed.length}  ERROR: ${errored.length}  (of ${results.length})`);
console.log(`Results: nh-qc-10ml-results.jsonl`);
console.log(`Failure paths: nh-qc-10ml-failures.txt`);
if (failed.length) {
  console.log(`\nFailures:`);
  for (const f of failed) console.log(`  ${f.file} — ${f.reason}`);
}
if (errored.length) {
  console.log(`\nErrors (${errored.length}):`);
  for (const e of errored.slice(0, 10)) console.log(`  ${e.file} — ${e.reason}`);
}
