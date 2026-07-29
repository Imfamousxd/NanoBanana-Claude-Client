#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

// ─── Load .env ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview"; // Nanobanana Pro

const VALID_RATIOS = [
  "1:1","1:4","1:8","2:3","3:2","3:4","4:1",
  "4:3","4:5","5:4","8:1","9:16","16:9","21:9",
];
const VALID_SIZES = ["512", "1K", "2K", "4K"];
const OUTPUT_DIR = process.env.OUTPUT_DIR
  ? (path.isAbsolute(process.env.OUTPUT_DIR) ? process.env.OUTPUT_DIR : path.join(__dirname, process.env.OUTPUT_DIR))
  : path.join(__dirname, "generations");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function slug(text) {
  return text.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "_").replace(/_+$/, "");
}

function ask(rl, question, defaultVal) {
  return new Promise((resolve) => {
    const suffix = defaultVal ? ` [${defaultVal}]` : "";
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || "");
    });
  });
}

function loadImageAsBase64(filepath) {
  const abs = path.resolve(filepath);
  if (!fs.existsSync(abs)) throw new Error(`Reference image not found: ${abs}`);
  const data = fs.readFileSync(abs).toString("base64");
  const ext = path.extname(abs).toLowerCase();
  const mimeMap = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
  const mimeType = mimeMap[ext] || "image/png";
  return { inline_data: { mime_type: mimeType, data } };
}

// ─── API Call ─────────────────────────────────────────────────────────────────
async function generateImage({ prompt, aspectRatio, imageSize, refImages }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  // Build parts: reference images first, then the text prompt
  const parts = [];
  for (const img of refImages) {
    parts.push(loadImageAsBase64(img));
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio, imageSize },
    },
  };

  const refLabel = refImages.length > 0 ? ` | Refs: ${refImages.length} image(s)` : "";
  console.log(`\n  Generating with Nanobanana Pro...`);
  console.log(`  Prompt: "${prompt}"`);
  console.log(`  AR: ${aspectRatio} | Size: ${imageSize}${refLabel}\n`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  return res.json();
}

// ─── Save results ─────────────────────────────────────────────────────────────
// `dest` is optional. When a batch job carries an `_id`, runBatch passes
// { dir, base } and candidates land at <dir>/<base>.png — a stable, addressable
// path. With no `_id` the legacy timestamped flat naming is used unchanged, so
// every existing batch file and every downstream consumer keeps working.
function saveResults(response, promptText, dest = null) {
  if (!dest) ensureOutputDir();
  else fs.mkdirSync(dest.dir, { recursive: true });

  const ts = timestamp();
  const name = slug(promptText);
  const saved = [];

  const candidates = response.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    let imgIndex = 0;

    for (const part of parts) {
      if (part.text) console.log(`  Model says: ${part.text}`);

      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        const ext = mimeType === "image/png" ? "png" : "jpg";
        const filename = dest
          ? `${dest.base}${imgIndex > 0 ? `_${imgIndex}` : ""}.${ext}`
          : `${ts}_${name}${imgIndex > 0 ? `_${imgIndex}` : ""}.${ext}`;
        const filepath = path.join(dest ? dest.dir : OUTPUT_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(data, "base64"));
        saved.push(filepath);
        imgIndex++;
        console.log(`  Saved: ${filepath}`);
      }
    }
  }

  if (saved.length === 0) {
    console.log("  No images returned. Response snippet:");
    console.log("  " + JSON.stringify(response, null, 2).slice(0, 400));
  }

  return saved;
}

// ─── Batch mode ───────────────────────────────────────────────────────────────
// batch.json format:
// [
//   { "prompt": "a cat in space", "aspectRatio": "16:9", "imageSize": "2K", "refImages": [] },
//   { "prompt": "modify this image to add a hat", "refImages": ["./ref.png"] },
//   { "_id": "REC-ugc-01", "n": 6, "prompt": "..." }        // <- candidates
// ]
//
// `n` and `_id` (both optional, added 2026-07-28):
//   `n`    — how many candidates to render for this shot. CLAUDE.md rule 3 and
//            00_ENGINE.md rule 4 both mandate 2-3 candidates for anything subjective;
//            until now that was not expressible here, so every asset this repo ever
//            shipped was n=1. Gemini returns one image per call, so this loops.
//   `_id`  — a stable name for the shot. Candidates land at
//            generations/<batch>/<_id>/c1.png … cN.png, plus a HERO.png copy of c1
//            so downstream video jobs have a fixed path that does not depend on a
//            human renaming a timestamped file by hand.
// Omit both and behaviour is byte-for-byte what it was before.
async function runBatch(batchFile) {
  const abs = path.resolve(batchFile);
  if (!fs.existsSync(abs)) {
    console.error(`Batch file not found: ${abs}`);
    process.exit(1);
  }

  const jobs = JSON.parse(fs.readFileSync(abs, "utf-8"));
  const batchName = path.basename(abs).replace(/\.(batch\.)?json$/i, "");
  const totalCandidates = jobs.reduce((sum, j) => sum + Math.max(1, j.n ?? 1), 0);
  console.log(`\n=== Batch Mode: ${jobs.length} job(s), ${totalCandidates} candidate(s) ===\n`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const n = Math.max(1, job.n ?? 1);
    const id = job._id;
    console.log(`--- Job ${i + 1}/${jobs.length}${id ? ` [${id}]` : ""}${n > 1 ? ` x${n}` : ""} ---`);

    const produced = [];
    for (let c = 0; c < n; c++) {
      if (n > 1) console.log(`  candidate ${c + 1}/${n}`);
      try {
        const response = await generateImage({
          prompt: job.prompt,
          aspectRatio: job.aspectRatio || "1:1",
          imageSize: job.imageSize || "2K",
          refImages: job.refImages || [],
        });
        const dest = id
          ? { dir: path.join(OUTPUT_DIR, batchName, id), base: `c${c + 1}` }
          : null;
        produced.push(...saveResults(response, job.prompt, dest));
      } catch (err) {
        console.error(`  Error on job ${i + 1} candidate ${c + 1}: ${err.message}`);
      }
      if (c < n - 1) await new Promise((r) => setTimeout(r, 1000));
    }

    // Stable hero path for the frame->clip handoff. A copy, not a symlink, because
    // the video runners base64 the file and some tools do not follow links.
    if (id && produced.length) {
      const hero = path.join(OUTPUT_DIR, batchName, id, `HERO${path.extname(produced[0])}`);
      fs.copyFileSync(produced[0], hero);
      console.log(`  Hero: ${hero}${produced.length > 1 ? "  (c1 — repoint after review)" : ""}`);
    }

    // Small delay between batch requests to be nice to the API
    if (i < jobs.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nBatch complete!");
}

// ─── Interactive mode ─────────────────────────────────────────────────────────
async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("=== Nanobanana Pro Image Generator ===");
  console.log(`Model: Nanobanana Pro (${MODEL})`);
  console.log(`Aspect Ratios: ${VALID_RATIOS.join(", ")}`);
  console.log(`Resolutions: ${VALID_SIZES.join(", ")}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('Type "quit" to exit.\n');

  while (true) {
    const prompt = await ask(rl, "\nPrompt");
    if (!prompt || prompt.toLowerCase() === "quit") break;

    const aspectRatio = await ask(rl, "Aspect ratio", "1:1");
    if (!VALID_RATIOS.includes(aspectRatio)) {
      console.log(`  Warning: "${aspectRatio}" may not be supported.`);
    }

    const imageSize = await ask(rl, "Resolution (512/1K/2K/4K)", "2K");

    const refInput = await ask(rl, "Reference images (comma-separated paths, or Enter to skip)", "");
    const refImages = refInput
      ? refInput.split(",").map((p) => p.trim()).filter(Boolean)
      : [];

    try {
      const response = await generateImage({ prompt, aspectRatio, imageSize, refImages });
      saveResults(response, prompt);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  rl.close();
  console.log("Bye!");
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY not set. Add it to .env or export it.");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args[0] === "--batch" && args[1]) {
    await runBatch(args[1]);
  } else if (args[0] === "--batch") {
    console.error("Usage: node nanobanana.mjs --batch batch.json");
    process.exit(1);
  } else {
    await runInteractive();
  }
}

main();
