#!/usr/bin/env node
// sieve-longform.mjs — 30/45/60-second pieces out of a model capped at 12 seconds.
//
//   node sieve-longform.mjs --spec sieve/longform/rec-01.json [--dry-run] [--mode chain|anchor]
//
// WHY THIS EXISTS
// Hard API ceilings, probed 2026-07-28: `seedance-1.5-pro` (the ONLY model that renders people)
// caps at 12s, `seedance-2.0` at 15s. Anything longer is stitched, and stitching has exactly three
// failure modes. This tool exists to close all three:
//
//   1. VOICE SEAM — the voice re-rolls every call. `1.5-pro` has no `reference_audios` (that is
//      2.0-only, and 2.0 refuses humans), so the ONLY lever is `seed`. E6 measured it: unseeded,
//      two runs of the identical prompt came back "different speaker, high confidence"; with a
//      fixed seed and DIFFERENT dialogue, "same speaker, no seam". So every segment carries the
//      SAME seed. This is not tunable — vary the words, never the seed.
//   2. FACE DRIFT — identity wanders across segments. Every hop is verified against the avatar
//      canonical and the run stops rather than shipping a piece that changes person halfway.
//   3. LOOK DRIFT — 1.5-pro RE-RENDERS its first frame (~0.98 scale, framed wider, ~9 levels
//      darker), so naive chaining compounds that every hop: by segment 4 the shot is visibly
//      wider and darker than segment 1. Hence two modes, below.
//
// MODES — pick by what the piece needs:
//   --mode chain   (default) each segment starts from the PREVIOUS segment's last frame.
//                  Best continuity of pose/gesture. Drift COMPOUNDS — fine to ~3 segments.
//   --mode anchor  every segment restarts from the ORIGINAL first frame. Zero compounding
//                  drift, but pose resets at each cut. Better for 5+ segments, and it reads
//                  fine when cuts are intentional (talking heads cut all the time).
//
// SPEC:
//   { "id":"REC-01", "avatar":"Marcus", "firstFrame":"path.png", "seed":424242,
//     "voice":"<verbatim voice descriptor>", "resolution":"1080p", "aspect_ratio":"9:16",
//     "segments":[ {"dialogue":"...","duration":10,"action":"optional stage direction"} ] }
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "bytedance/seedance-1.5-pro";     // people only; 2.0 refuses photoreal humans (E1)
const MAX_SEG = 12;                              // hard API cap, probed
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry-run");
const MODE = arg("mode", "chain");

const specPath = arg("spec");
if (!specPath) { console.error("usage: node sieve-longform.mjs --spec <spec.json> [--dry-run] [--mode chain|anchor]"); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.isAbsolute(specPath) ? specPath : path.join(ROOT, specPath), "utf-8"));

// ─── validate before spending ────────────────────────────────────────────────
const errs = [];
if (!spec.segments?.length) errs.push("no segments");
if (spec.seed == null) errs.push("no `seed` — REQUIRED. Without one the voice re-rolls every segment (E6).");
if (!spec.firstFrame) errs.push("no `firstFrame`");
else if (!fs.existsSync(path.join(ROOT, spec.firstFrame))) errs.push(`firstFrame not found: ${spec.firstFrame}`);
spec.segments?.forEach((s, i) => {
  const d = s.duration ?? 10;
  if (d > MAX_SEG) errs.push(`segment ${i + 1} is ${d}s — ${MODEL} caps at ${MAX_SEG}s. Split it.`);
  if (!s.dialogue && !s.action) errs.push(`segment ${i + 1} has neither dialogue nor action`);
});
if (!["chain", "anchor"].includes(MODE)) errs.push(`--mode must be chain or anchor`);
if (errs.length) { console.error("\nSPEC REJECTED:\n" + errs.map((e) => `  - ${e}`).join("\n") + "\n"); process.exit(2); }

const total = spec.segments.reduce((n, s) => n + (s.duration ?? 10), 0);
const OUT = path.join(ROOT, "generations", "longform", spec.id);
console.log(`\n${spec.id} — ${spec.segments.length} segment(s), ${total}s total · ${MODE} mode · seed ${spec.seed}`);
console.log(`  avatar: ${spec.avatar ?? "(none declared)"}   model: ${MODEL}`);
spec.segments.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(s.duration ?? 10).padStart(2)}s  ${(s.dialogue || s.action).slice(0, 68)}`));
console.log(`  est. cost ~$${(total * 0.12).toFixed(2)} at $0.12/s\n`);
if (DRY) { console.log("DRY RUN — nothing billed.\n"); process.exit(0); }

fs.mkdirSync(OUT, { recursive: true });
const dataUri = (p) => {
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  return `data:image/${/\.png$/i.test(abs) ? "png" : "jpeg"};base64,${fs.readFileSync(abs).toString("base64")}`;
};

async function createWithRetry(input, label) {
  for (let a = 0; a < 6; a++) {
    const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST", headers: { ...H, Prefer: "wait=5" }, body: JSON.stringify({ input }),
    });
    if (res.status === 429) { const w = 20000 * (a + 1); console.log(`    throttled, retry in ${w / 1000}s`); await new Promise((r) => setTimeout(r, w)); continue; }
    const j = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 200)}`);
    return j;
  }
  throw new Error(`${label}: still throttled after 6 attempts`);
}

const made = [];
let frame = spec.firstFrame;                       // the image fed to the NEXT segment

for (const [i, seg] of spec.segments.entries()) {
  const n = i + 1;
  const secs = seg.duration ?? 10;
  const out = path.join(OUT, `seg${String(n).padStart(2, "0")}.mp4`);
  console.log(`seg${n}/${spec.segments.length} — ${secs}s, from ${path.basename(frame)}`);

  const promptParts = [
    spec.voice || "",
    "He/she talks straight to the camera, natural conversational energy, small natural head movement.",
    "Same person, same wardrobe, same room and same framing as the input image throughout.",
    seg.action || "",
    seg.dialogue ? `They say: "${seg.dialogue}"` : "",
    "Shot-on-phone look, not cinematic. Quiet room ambience, no music, no on-screen text, no captions, no subtitles.",
  ].filter(Boolean);

  const input = {
    prompt: promptParts.join(" "),
    image: dataUri(frame),
    duration: secs,
    aspect_ratio: spec.aspect_ratio ?? "9:16",
    resolution: spec.resolution ?? "1080p",   // undeclared on 1.5-pro but honoured — always send (E4)
    generate_audio: true,                      // 1.5-pro defaults this to FALSE
    camera_fixed: seg.camera_fixed ?? true,
    seed: spec.seed,                           // SAME every segment — this is what holds the voice
  };

  try {
    let p = await createWithRetry(input, `seg${n}`);
    for (let t = 0; t < 240 && !["succeeded", "failed", "canceled"].includes(p.status); t++) {
      await new Promise((r) => setTimeout(r, 5000));
      p = await (await fetch(p.urls.get, { headers: H })).json();
    }
    if (p.status !== "succeeded") throw new Error(`${p.status}: ${p.error ?? "timeout"}`);
    const url = Array.isArray(p.output) ? p.output[0] : p.output;
    fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
    made.push(out);
    console.log(`  ✓ ${path.relative(ROOT, out)}`);
  } catch (e) {
    console.error(`  ✗ seg${n}: ${e.message}`);
    console.error(`    Stopping — a piece missing its middle is not deliverable.`);
    break;
  }

  // Next segment's starting image.
  if (MODE === "chain" && n < spec.segments.length) {
    const tail = path.join(OUT, `seg${String(n).padStart(2, "0")}_last.png`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-sseof", "-0.2", "-i", out, "-frames:v", "1", tail]);
    frame = path.relative(ROOT, tail);
  }
  // anchor mode leaves `frame` on the original throughout — no compounding drift.
}

if (made.length !== spec.segments.length) {
  console.error(`\nOnly ${made.length}/${spec.segments.length} segments rendered — not concatenating.\n`);
  process.exit(1);
}

// ─── concat ──────────────────────────────────────────────────────────────────
const listFile = path.join(OUT, "segments.txt");
fs.writeFileSync(listFile, made.map((f) => `file '${path.basename(f)}'`).join("\n"));
const final = path.join(OUT, `${spec.id}_FINAL.mp4`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", final], { cwd: OUT });

const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=width,height", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", final]).toString().trim().split("\n");
console.log(`\n✓ ${path.relative(ROOT, final)}  ${probe[0]}x${probe[1]}  ${Number(probe[2]).toFixed(1)}s`);
console.log(`\nNow verify identity held across the whole piece:`);
console.log(`  node sieve-avatar.mjs verify ${spec.avatar ?? "<Avatar>"} --candidates '${path.relative(ROOT, OUT)}/*_last.png'`);
console.log(`Whisper-QC the audio before shipping — the seed holds the voice, it does not check the words.\n`);
