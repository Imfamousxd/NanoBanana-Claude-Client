#!/usr/bin/env node
// Generic Seedance (Replicate) clip runner. Reads a job JSON and saves the mp4.
// usage: node seedance-run.mjs <job.json> [--model bytedance/seedance-1.5-pro]
// job: { prompt, out, image?(path), reference_images?[paths], duration?, aspect_ratio?, resolution?, generate_audio?, model? }
//
// MODEL ROUTING (verified against the Replicate schemas 2026-07-28 — do not guess):
//   bytedance/seedance-1.5-pro  → PEOPLE. Talking heads, UGC, any photoreal human.
//                                 Has `generate_audio`. Has NO `resolution` input:
//                                 output resolution tracks the FIRST FRAME, so a
//                                 1080x1920 frame is the only way to get a 1080p reel.
//   bytedance/seedance-2.0      → OBJECTS / SCENES. Has `resolution` (defaults 720p —
//                                 always set 1080p) and `reference_images`.
//                                 REFUSES photoreal human first frames with E005
//                                 "input or output flagged as sensitive".
//   bytedance/seedance-1-pro    → legacy, SILENT (no `generate_audio` input). Avoid.
// Default below is 1.5-pro because every talking-head clip that has ever shipped from
// this repo used it. Pass --model (or job.model) for object/scene work.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error("REPLICATE_API_TOKEN is not set in .env — Seedance video cannot run.\n" +
    "Get one at https://replicate.com/account/api-tokens and add it to .env.");
  process.exit(1);
}
const jobPath = process.argv[2];
if (!jobPath || jobPath.startsWith("--") || !fs.existsSync(jobPath)) {
  console.error(`usage: node seedance-run.mjs <job.json> [--model <slug>]

job.json: { prompt, out, image?, reference_images?[], duration?, aspect_ratio?,
            resolution?, generate_audio?, camera_fixed?, fps?, seed?, model? }

models:  bytedance/seedance-1.5-pro  (default — PEOPLE, has audio + camera_fixed)
         bytedance/seedance-2.0      (OBJECTS/SCENES — refuses photoreal humans, E005)
         bytedance/seedance-1-pro    (legacy, silent)`);
  process.exit(1);
}
const job = JSON.parse(fs.readFileSync(jobPath, "utf-8"));
const flagIdx = process.argv.indexOf("--model");
const MODEL = (flagIdx > -1 && process.argv[flagIdx + 1]) || job.model || "bytedance/seedance-1.5-pro";

const toDataUri = (p) => {
  const ext = path.extname(p).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${fs.readFileSync(p).toString("base64")}`;
};

// Capability gates from the live Replicate schemas — omitting a field a model honours
// silently loses control of it.
//   generate_audio: 2.0 + 1.5-pro. 1-pro has no audio input at all.
//   camera_fixed / fps: 1.5-pro + 1-pro. Absent on 2.0.
const HAS_AUDIO = !MODEL.includes("1-pro") || MODEL.includes("1.5-pro");
const HAS_CAMERA = MODEL.includes("1.5-pro") || MODEL.includes("1-pro");

const input = {
  prompt: job.prompt,
  duration: job.duration ?? 6,
  aspect_ratio: job.aspect_ratio ?? "16:9",
  // ALWAYS send resolution — including to 1.5-pro, which does NOT declare it.
  // Measured 2026-07-28: the identical 1536x2752 first frame yields 1080x1920 when
  // `resolution:"1080p"` is sent and 720x1280 when it is omitted. Replicate tolerates
  // undeclared keys and ByteDance honours this one, so "not in the schema" does NOT mean
  // "rejected", and output does NOT simply track the first frame. Do not gate this field.
  resolution: job.resolution ?? "1080p",
};
if (HAS_AUDIO) input.generate_audio = job.generate_audio ?? true;
// camera_fixed is the structural version of "the phone is propped and does not move".
// Measured: 1.5-pro RE-RENDERS the first frame rather than using it verbatim (~0.98
// scale, framed wider, graded ~9 levels darker), so composition drifts off the frame
// you approved. Setting this enforces a locked camera far harder than any prompt suffix.
if (HAS_CAMERA) {
  if (job.camera_fixed != null) input.camera_fixed = job.camera_fixed;
  if (job.fps != null) input.fps = job.fps;
}
if (job.image) input.image = toDataUri(job.image);
// first frame and reference_images are mutually exclusive
if (job.reference_images && !job.image) input.reference_images = job.reference_images.map(toDataUri);
if (job.seed != null) input.seed = job.seed;

if (MODEL.includes("seedance-2.0") && job.image) {
  console.log("  note: seedance-2.0 rejects photoreal HUMAN first frames (E005). If this frame\n" +
    "        has a person in it, re-run with --model bytedance/seedance-1.5-pro.");
}

console.log(`→ ${MODEL}: ${path.basename(job.out)} (${input.aspect_ratio}, ` +
  `${input.resolution}, ${input.duration}s, audio:${input.generate_audio ?? false}` +
  `${input.camera_fixed != null ? `, camera_fixed:${input.camera_fixed}` : ""})`);
const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
  body: JSON.stringify({ input }),
});
if (!create.ok) { console.error("Create failed:", create.status, await create.text()); process.exit(1); }
let pred = await create.json();
console.log(`pred ${pred.id}: ${pred.status}`);
while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`  ${pred.status}${last ? ` (${last})` : ""}`);
}
if (pred.status !== "succeeded") { console.error("FAILED:", pred.error); process.exit(1); }
const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
fs.mkdirSync(path.dirname(job.out), { recursive: true });
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.writeFileSync(job.out, buf);
console.log(`✓ Saved ${job.out} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
