#!/usr/bin/env node
// seedance-batch.mjs — engine tool. Batch runner for Seedance video, matching
// the shape of gpt-image.mjs / nanobanana.mjs so briefs compile to it the same way.
//
//   env -u OPENAI_API_KEY node seedance-batch.mjs --batch batches/x.video.json
//   env -u OPENAI_API_KEY node seedance-batch.mjs --batch batches/x.video.json --dry-run
//
// batch.json — array of:
//   { "prompt": "...", "image": "./first-frame.png", "duration": 10,
//     "aspect_ratio": "9:16", "resolution": "1080p", "generate_audio": true,
//     "id": "REC-ugc-01" }
//
// Why this exists: the repo had CLI batch runners for both image back-ends but
// nothing for video, so every video job hand-rolled its own fetch to Replicate
// (dh-video-ads.mjs did exactly that, at 720p on the wrong model slug). This
// puts video on the same contract as images.
//
// Contract notes taken from Brand Context/00_ENGINE.md, not guessed:
//   - exact slug is `bytedance/seedance-2.0` — the dot matters, `-2-pro` and
//     `-2` do NOT resolve
//   - max resolution IS 1080p; always use it
//   - `image` (first frame) CANNOT be combined with `reference_*` inputs
//   - reference images must be downscaled to <=1024px or the API 504s
//   - accounts under ~$5 credit throttle to ~1 create/min, so creates are
//     staggered and 429s are retried rather than dropped
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry-run");
// DEFAULT IS 1.5-pro, not 2.0. Verified 2026-07-28 by isolation: the identical
// first frame + identical prompt fails on `seedance-2.0` with E005 ("input or
// output flagged as sensitive") and succeeds on `seedance-1.5-pro`. 2.0 refuses
// photoreal human first frames — a likeness filter. Every talking-head clip that
// has ever shipped from this repo used 1.5-pro; 00_ENGINE.md calling 2.0 "the
// workhorse" is correct for object/scene video and wrong for people.
const MODEL = arg("model", "bytedance/seedance-1.5-pro");
const OUT = path.join(ROOT, "generations");
const H = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` };

const batchFile = arg("batch");
if (!batchFile) { console.error("usage: node seedance-batch.mjs --batch <file>.video.json [--dry-run]"); process.exit(1); }
const jobs = JSON.parse(fs.readFileSync(path.resolve(batchFile), "utf-8"));

function dataUri(p) {
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  const mime = /\.png$/i.test(abs) ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

async function createWithRetry(body, label) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Prefer: "wait=5" },
      body: JSON.stringify({ input: body }),
    });
    if (res.status === 429) {          // low-credit throttle, not a failure
      const wait = 20000 * (attempt + 1);
      console.log(`    throttled, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 200)}`);
    return json;
  }
  throw new Error(`${label}: still throttled after 6 attempts`);
}

console.log(`\nSeedance batch — ${jobs.length} clip(s) · ${MODEL}`);
for (const j of jobs) {
  const secs = j.duration ?? 10;
  console.log(`  ${j.id ?? "(unnamed)"}  ${secs}s · ${j.aspect_ratio ?? "9:16"} · ${j.resolution ?? "1080p"}`
    + `${j.image ? " · first-frame" : ""}${j.generate_audio === false ? "" : " · audio"}`);
}
if (DRY) { console.log("\nDRY RUN — nothing billed.\n"); process.exit(0); }

fs.mkdirSync(OUT, { recursive: true });
for (const [i, j] of jobs.entries()) {
  const id = j.id ?? `clip${i + 1}`;
  try {
    // `camera_fixed`/`fps` are 1.5-pro + 1-pro only; absent on 2.0.
    const HAS_CAMERA = MODEL.includes("1.5-pro") || MODEL.includes("1-pro");

    const input = {
      prompt: j.prompt,
      duration: j.duration ?? 10,
      aspect_ratio: j.aspect_ratio ?? "9:16",
      generate_audio: j.generate_audio !== false,
      // ALWAYS send resolution, including to 1.5-pro which does not declare it. Measured
      // 2026-07-28: identical first frame -> 1080x1920 with it, 720x1280 without. Replicate
      // tolerates undeclared keys and the model honours this one.
      resolution: j.resolution ?? "1080p",
    };
    // See seedance-run.mjs: 1.5-pro re-renders the first frame, so composition drifts.
    // camera_fixed enforces a locked camera structurally instead of by prompt suffix.
    if (HAS_CAMERA) {
      if (j.camera_fixed != null) input.camera_fixed = j.camera_fixed;
      if (j.fps != null) input.fps = j.fps;
    }
    // first frame and reference_images are mutually exclusive per the contract
    if (j.image) input.image = dataUri(j.image);
    else if (j.reference_images?.length) input.reference_images = j.reference_images.map(dataUri);
    if (j.last_frame_image && j.image) input.last_frame_image = dataUri(j.last_frame_image);
    if (j.seed != null) input.seed = j.seed;

    console.log(`\n${id} …`);
    const pred = await createWithRetry(input, id);

    let p = pred;
    for (let t = 0; t < 240 && !["succeeded", "failed", "canceled"].includes(p.status); t++) {
      await new Promise((r) => setTimeout(r, 5000));
      p = await (await fetch(pred.urls.get, { headers: H })).json();
    }
    if (p.status !== "succeeded") throw new Error(`${p.status}: ${p.error ?? "timeout"}`);

    const url = Array.isArray(p.output) ? p.output[0] : p.output;
    const file = path.join(OUT, `${id}.mp4`);
    fs.writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log(`  ✓ ${path.relative(ROOT, file)}`);
  } catch (e) {
    console.log(`  ✗ ${id}: ${e.message}`);
  }
  if (i < jobs.length - 1) await new Promise((r) => setTimeout(r, 20000));  // stagger
}
console.log(`\nOutput: generations/\n`);
