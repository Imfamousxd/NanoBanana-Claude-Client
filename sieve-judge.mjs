#!/usr/bin/env node
// sieve-judge.mjs — the selection half of the engine.
//
//   node sieve-judge.mjs --rubric realism-ugc --candidates 'generations/<batch>/<id>/c*.jpg'
//   node sieve-judge.mjs --rubric product-lock --refs canonical.jpg --candidates '<dir>' --rank
//   node sieve-judge.mjs --rubric realism-ugc --candidates '<dir>' --gate      # exit 1 if none pass
//
// WHY THIS EXISTS
// The runners can now render N candidates per shot (batch `n` + `_id`). Generating many
// without a way to surface few is half a feature — it just moves the eyeballing cost onto
// you. This is the other half: a rubric-driven vision critic, generalised from `nh-qc.mjs`,
// which already had the right instinct (binary criteria, measured ratios, temperature 0)
// but was hardcoded to one brand's vial and unreachable from anything else.
//
// REPORT FIRST, GATE LATER — deliberate.
// By default this only PRINTS and writes a report; it never blocks. A miscalibrated gate
// that rejects everything on a deadline is worse than no gate, because you route around it
// and go back to hand-written scripts. Run it in report mode until you trust the rubric,
// then add --gate.
//
// WHEN EVERYTHING FAILS
// At n=6 against a model whose average IS the defect, "no candidate passes" is a likely
// outcome, not an edge case. This never returns nothing: if all candidates fail it says so
// loudly and still ranks them, so you get the least-bad plus the specific reason.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CONCURRENCY = 6;

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(`--${n}`);

const rubricId = arg("rubric");
const candidateArg = arg("candidates");
const refArg = arg("refs");
const doRank = has("rank");
const doGate = has("gate");

if (!API_KEY) { console.error("GEMINI_API_KEY not set in .env"); process.exit(1); }
if (!rubricId || !candidateArg) {
  console.error("usage: node sieve-judge.mjs --rubric <id> --candidates <glob|dir> [--refs <img>] [--rank] [--gate]");
  console.error(`rubrics: ${fs.existsSync(path.join(ROOT, "sieve/rubrics")) ? fs.readdirSync(path.join(ROOT, "sieve/rubrics")).map(f => f.replace(/\.md$/, "")).join(", ") : "(none yet)"}`);
  process.exit(1);
}

const rubricPath = path.join(ROOT, "sieve/rubrics", `${rubricId}.md`);
if (!fs.existsSync(rubricPath)) { console.error(`No rubric at ${rubricPath}`); process.exit(1); }
const rubric = fs.readFileSync(rubricPath, "utf-8");

const IMG_RE = /\.(png|jpe?g|webp)$/i;
function resolveCandidates(spec) {
  const abs = path.isAbsolute(spec) ? spec : path.join(ROOT, spec);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    return fs.readdirSync(abs).filter((f) => IMG_RE.test(f) && !/^HERO\./i.test(f))
      .sort().map((f) => path.join(abs, f));
  }
  // Glob. fs.globSync exists on Node 22+; fall back to manual dir scan + regex.
  try {
    return [...fs.globSync(abs)].filter((f) => IMG_RE.test(f)).sort();
  } catch {
    const dir = path.dirname(abs);
    const pat = new RegExp("^" + path.basename(abs).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$", "i");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => pat.test(f) && IMG_RE.test(f)).sort().map((f) => path.join(dir, f));
  }
}

function inlineImage(p) {
  const ext = path.extname(p).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return { inline_data: { mime_type: mime, data: fs.readFileSync(p).toString("base64") } };
}

// MEDIA_RESOLUTION_HIGH is load-bearing, not a tweak. The default tiles an image to
// roughly 768px (258 tokens), at which a chest-up 9:16 frame gives ~20px of eye — so
// skin-texture and catchlight questions return confident noise. HIGH is ~2322 tokens
// and makes those questions answerable, and they are the ones that carry realism.
async function callGemini(parts, attempt = 1) {
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
      mediaResolution: "MEDIA_RESOLUTION_HIGH",
    },
  };
  let res;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 2000 * attempt)); return callGemini(parts, attempt + 1); }
    return { __error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      return callGemini(parts, attempt + 1);
    }
    return { __error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { __error: `Parse: ${text.slice(0, 160)}` }; }
}

const SCHEMA_NOTE = `
Return ONLY JSON of exactly this shape:
{
  "blocks": [ { "name": "<BLOCK NAME>", "pass": true|false, "failed_questions": ["<verbatim question that failed>"] } ],
  "pass": true|false,
  "failures": ["<short specific defect>"],
  "weakest": "<the single weakest thing about this image, REQUIRED even when pass is true, phrased as a prompt change>"
}
Rules: answer every block. "pass" is true only if EVERY block passed. Judge only what you can
actually see at this resolution — if a question cannot be resolved, fail it and say so rather
than guessing. "weakest" must name a concrete change to the prompt, not a vague quality note.`;

async function judgeOne(file, refs) {
  const parts = [];
  if (refs.length) {
    parts.push({ text: `REFERENCE IMAGE${refs.length > 1 ? "S" : ""} (the canonical target) follow:` });
    for (const r of refs) parts.push(inlineImage(r));
  }
  parts.push({ text: "CANDIDATE IMAGE to judge follows:" });
  parts.push(inlineImage(file));
  parts.push({ text: `${rubric}\n${SCHEMA_NOTE}` });
  const out = await callGemini(parts);
  return { file, ...out };
}

// Pairwise forced choice. Absolute VLM scores cannot reliably order near-identical
// candidates; a forced A-or-B choice can. Single elimination, ~N-1 comparisons.
// Treat the stated reason as decoration: pairwise judgments are non-transitive and the
// rationale will confabulate. The ORDER is the signal, not the explanation.
async function rank(files) {
  if (files.length < 2) return files;
  let field = [...files];
  while (field.length > 1) {
    const next = [];
    for (let i = 0; i < field.length; i += 2) {
      if (i + 1 >= field.length) { next.push(field[i]); continue; }
      const [a, b] = [field[i], field[i + 1]];
      const out = await callGemini([
        { text: "IMAGE A:" }, inlineImage(a),
        { text: "IMAGE B:" }, inlineImage(b),
        { text: `Which image is more likely a real, unedited photograph taken by a person who was in the room — not a generated or heavily retouched image?\n\nReturn ONLY JSON: {"winner":"A"|"B","deciding_artifact":"<the single visual detail that decided it>"}` },
      ]);
      const winner = out?.winner === "B" ? b : a;
      next.push(winner);
      console.log(`    ${path.basename(a)} vs ${path.basename(b)} -> ${path.basename(winner)}`
        + (out?.deciding_artifact ? `  (${String(out.deciding_artifact).slice(0, 70)})` : ""));
    }
    field = next;
  }
  return field;
}

// ─── run ──────────────────────────────────────────────────────────────────────
const candidates = resolveCandidates(candidateArg);
const refs = refArg ? resolveCandidates(refArg) : [];
if (!candidates.length) { console.error(`No candidate images matched: ${candidateArg}`); process.exit(1); }

console.log(`\nsieve-judge — rubric "${rubricId}" · ${candidates.length} candidate(s)`
  + `${refs.length ? ` · ${refs.length} reference(s)` : ""} · ${MODEL} @ HIGH res\n`);

const results = [];
const queue = [...candidates];
await Promise.all(Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(async () => {
  while (queue.length) {
    const f = queue.shift();
    if (!f) break;
    results.push(await judgeOne(f, refs));
  }
}));
results.sort((a, b) => a.file.localeCompare(b.file));

const passed = results.filter((r) => r.pass === true);
const failed = results.filter((r) => r.pass === false);
const errored = results.filter((r) => r.__error);

for (const r of results) {
  const name = path.basename(r.file);
  if (r.__error) { console.log(`  ERROR  ${name} — ${r.__error}`); continue; }
  console.log(`  ${r.pass ? "PASS " : "FAIL "}  ${name}`);
  for (const b of r.blocks || []) {
    if (!b.pass) console.log(`           ${b.name}: ${(b.failed_questions || []).join("; ").slice(0, 150)}`);
  }
  if (r.weakest) console.log(`           weakest: ${r.weakest}`);
}

const outDir = path.join(ROOT, "sieve/reports");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const reportFile = path.join(outDir, `${rubricId}_${stamp}.jsonl`);
fs.writeFileSync(reportFile, results.map((r) => JSON.stringify(r)).join("\n"));

console.log(`\nPASS ${passed.length} · FAIL ${failed.length}${errored.length ? ` · ERROR ${errored.length}` : ""}`);
console.log(`Report: ${path.relative(ROOT, reportFile)}`);

if (!passed.length && !errored.length) {
  console.log(`\n!! NO CANDIDATE PASSED. That is a signal about the prompt or the rubric, not a dead end.`);
  console.log(`   Most common cause at n>=4 is one over-strict block — check which one repeats above.`);
  console.log(`   Ranking anyway so you have the least-bad option and a specific thing to change.`);
}

if (doRank) {
  const field = passed.length ? passed.map((r) => r.file) : results.filter((r) => !r.__error).map((r) => r.file);
  if (field.length > 1) {
    console.log(`\n  Pairwise ranking ${field.length} candidate(s):`);
    const [best] = await rank(field);
    console.log(`\n  WINNER: ${path.relative(ROOT, best)}`);
    const hero = path.join(path.dirname(best), `HERO${path.extname(best)}`);
    fs.copyFileSync(best, hero);
    console.log(`  Hero repointed: ${path.relative(ROOT, hero)}`);
  }
}

if (doGate && !passed.length) {
  console.error(`\nGATE: no candidate passed "${rubricId}" — not promoting. Re-run without --gate to inspect.`);
  process.exit(1);
}
