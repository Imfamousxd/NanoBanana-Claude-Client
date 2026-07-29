#!/usr/bin/env node

import fs from "fs";
import path from "path";
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
// Default to the FAST tier: $0.12/s vs $0.40/s for standard — the same price as
// seedance-1.5-pro. The repo previously pinned standard AND never sent `resolution`,
// which silently defaults to 720p, so every Veo clip cost 3.3x for a lower-res result.
// Override with --model when you specifically want the standard or lite tier.
// Live on this key: veo-3.1-generate-preview | veo-3.1-fast-generate-preview | veo-3.1-lite-generate-preview
const MODEL = (() => {
  const i = process.argv.indexOf("--model");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "veo-3.1-fast-generate-preview";
})();
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const OUTPUT_DIR = path.join(__dirname, "generations");
const OPERATION_FILE = path.join(__dirname, "veo_operation.txt");
const POLL_INTERVAL_MS = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function loadImageAsBase64(filepath) {
  const abs = path.resolve(filepath);
  if (!fs.existsSync(abs)) throw new Error(`Image not found: ${abs}`);
  const data = fs.readFileSync(abs).toString("base64");
  const ext = path.extname(abs).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return { bytesBase64Encoded: data, mimeType: mimeMap[ext] || "image/png" };
}

// ─── Submit video generation ──────────────────────────────────────────────────
async function submitVideoGeneration({ prompt, refImage, identityRefs, aspectRatio, duration, resolution }) {
  const url = `${BASE_URL}/models/${MODEL}:predictLongRunning`;

  const ar = aspectRatio || "9:16";
  const secs = duration || 8;
  let vres = resolution || "1080p";

  // Documented constraint: 1080p and 4k are 8-second-duration ONLY; 720p is the
  // default and the only option for video extension. Downgrade rather than 400.
  if (vres !== "720p" && secs !== 8) {
    console.log(`  note: ${vres} requires durationSeconds 8 (got ${secs}) — falling back to 720p`);
    vres = "720p";
  }

  const instance = { prompt };

  // `image` (first frame) and `referenceImages` (identity assets) are mutually
  // exclusive. referenceImages takes up to 3 asset images of a single person,
  // character or product and preserves that subject's appearance — it is the only
  // reference-image identity lock in the paid stack, and it was previously unused.
  if (identityRefs?.length) {
    if (refImage) throw new Error("--ref (first frame) and --identity (reference images) are mutually exclusive");
    if (identityRefs.length > 3) throw new Error(`referenceImages accepts at most 3 (got ${identityRefs.length})`);
    // NOTE: ai.google.dev documents this as { image: { inlineData: {mimeType, data} } },
    // but that is the `generateContent` shape. On `:predictLongRunning` the API replies
    // 400 "`inlineData` isn't supported by this model" — verified by probe 2026-07-28.
    // This endpoint takes the same Vertex-style image object as `instance.image`.
    instance.referenceImages = identityRefs.map((p) => ({
      image: loadImageAsBase64(p),
      referenceType: "asset",
    }));
  } else if (refImage) {
    instance.image = loadImageAsBase64(refImage);
  }

  const body = {
    instances: [instance],
    parameters: { aspectRatio: ar, durationSeconds: secs, resolution: vres },
  };

  console.log(`\n  Submitting video generation to ${MODEL}...`);
  console.log(`  Prompt: "${prompt}"`);
  console.log(`  AR: ${ar} | Duration: ${secs}s | Resolution: ${vres}`);
  if (refImage) console.log(`  First frame: ${refImage}`);
  if (identityRefs?.length) console.log(`  Identity refs (${identityRefs.length}): ${identityRefs.join(", ")}`);
  console.log();

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

  const data = await res.json();
  const operationName = data.name;
  if (!operationName) {
    throw new Error(`No operation name returned: ${JSON.stringify(data)}`);
  }

  // Save operation name for resume
  fs.writeFileSync(OPERATION_FILE, operationName);
  console.log(`  Operation: ${operationName}`);
  console.log(`  Saved to: ${OPERATION_FILE}\n`);

  return operationName;
}

// ─── Poll for completion ──────────────────────────────────────────────────────
async function pollOperation(operationName) {
  const url = `${BASE_URL}/${operationName}`;

  console.log(`  Polling for completion (every ${POLL_INTERVAL_MS / 1000}s)...`);

  while (true) {
    const res = await fetch(url, {
      headers: { "x-goog-api-key": API_KEY },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Poll error ${res.status}: ${err}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(`Operation failed: ${JSON.stringify(data.error)}`);
    }

    if (data.done) {
      console.log(`  Generation complete!\n`);
      return data;
    }

    // Show progress
    const meta = data.metadata;
    if (meta?.progress) {
      process.stdout.write(`\r  Progress: ${Math.round(meta.progress * 100)}%`);
    } else {
      process.stdout.write(`\r  Still processing...`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ─── Download and save video ──────────────────────────────────────────────────
async function saveVideo(response, label) {
  ensureOutputDir();
  const ts = timestamp();
  const saved = [];

  const videos = response.response?.generateVideoResponse?.generatedSamples
    || response.response?.generatedSamples
    || response.response?.generateVideoResponse?.generatedVideos
    || response.response?.generatedVideos
    || [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    // Handle URI-based response
    if (video.video?.uri) {
      const uri = video.video.uri;
      console.log(`  Downloading video from URI...`);

      const dlRes = await fetch(uri + `&key=${API_KEY}`, {
        redirect: "follow",
      });

      if (!dlRes.ok) {
        console.error(`  Download failed: ${dlRes.status}`);
        continue;
      }

      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const filename = `${ts}_${label}${i > 0 ? `_${i}` : ""}.mp4`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      saved.push(filepath);
      console.log(`  Saved: ${filepath}`);
    }

    // Handle inline base64 response
    if (video.video?.bytesBase64Encoded) {
      const filename = `${ts}_${label}${i > 0 ? `_${i}` : ""}.mp4`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(video.video.bytesBase64Encoded, "base64"));
      saved.push(filepath);
      console.log(`  Saved: ${filepath}`);
    }
  }

  if (saved.length === 0) {
    console.log(`  No videos found in response. Raw structure:`);
    console.log(`  ${JSON.stringify(response, null, 2).slice(0, 800)}`);
  }

  return saved;
}

// ─── Commands ─────────────────────────────────────────────────────────────────
async function generate(opts) {
  const operationName = await submitVideoGeneration(opts);
  const result = await pollOperation(operationName);
  const slug = (opts.prompt || "video").slice(0, 30).replace(/[^a-zA-Z0-9]+/g, "_");
  return saveVideo(result, slug);
}

async function resume() {
  if (!fs.existsSync(OPERATION_FILE)) {
    throw new Error(`No operation file found at ${OPERATION_FILE}`);
  }
  const operationName = fs.readFileSync(OPERATION_FILE, "utf-8").trim();
  console.log(`\n  Resuming operation: ${operationName}\n`);
  const result = await pollOperation(operationName);
  return saveVideo(result, "resumed");
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY not set. Add it to .env or export it.");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args[0] === "--resume") {
    await resume();
    return;
  }

  if (args[0] === "--status") {
    if (!fs.existsSync(OPERATION_FILE)) {
      console.log("No pending operation.");
      return;
    }
    const op = fs.readFileSync(OPERATION_FILE, "utf-8").trim();
    const res = await fetch(`${BASE_URL}/${op}`, {
      headers: { "x-goog-api-key": API_KEY },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // Default: parse --prompt, --ref, --identity, --ar, --duration, --resolution
  const opts = {
    prompt: "",
    refImage: null,
    identityRefs: [],
    aspectRatio: "9:16",
    duration: 8,
    resolution: "1080p",
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prompt" && args[i + 1]) opts.prompt = args[++i];
    if (args[i] === "--ref" && args[i + 1]) opts.refImage = args[++i];
    if (args[i] === "--identity" && args[i + 1]) opts.identityRefs.push(args[++i]);
    if (args[i] === "--ar" && args[i + 1]) opts.aspectRatio = args[++i];
    if (args[i] === "--duration" && args[i + 1]) opts.duration = parseInt(args[++i]);
    if (args[i] === "--resolution" && args[i + 1]) opts.resolution = args[++i];
  }

  if (!opts.prompt) {
    console.log("Usage:");
    console.log("  node nanobanana-video.mjs --prompt \"...\" [--ref first-frame.png] [--ar 9:16] [--duration 8] [--resolution 1080p]");
    console.log("  node nanobanana-video.mjs --prompt \"...\" --identity a.jpg --identity b.jpg   # identity lock, up to 3");
    console.log("  node nanobanana-video.mjs --resume       # resume last operation");
    console.log("  node nanobanana-video.mjs --status       # check operation status");
    console.log("\nOptions:");
    console.log("  --model <id>       veo-3.1-fast-generate-preview (default, $0.12/s) | veo-3.1-generate-preview ($0.40/s) | ...-lite-...");
    console.log("  --identity <img>   repeatable, max 3. Locks a person/character/product's appearance.");
    console.log("                     Mutually exclusive with --ref. 1080p/4k require --duration 8.");
    process.exit(1);
  }

  await generate(opts);
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
