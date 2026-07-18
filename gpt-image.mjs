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
const API_KEY = process.env.OPENAI_API_KEY;
// gpt-image-2 supports max edge 3840px, both edges multiples of 16, max ratio 3:1, 655K–8.29M pixels.
// Override via OPENAI_IMAGE_MODEL=gpt-image-1 in .env if needed.
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

const VALID_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "auto"];
// Sizes chosen for gpt-image-2 to maximize resolution within constraints
// (≤3840px edge, multiples of 16, ≤8.29MP). For gpt-image-1 fallback, the API
// only accepts 1024x1024, 1024x1536, 1536x1024, auto — set OPENAI_IMAGE_MODEL=gpt-image-1
// AND override sizes manually if needed.
const SIZE_MAP = {
  "1:1": "2880x2880",     // 8.3MP square (max for gpt-image-2)
  "2:3": "2048x3072",     // 6.3MP portrait
  "3:2": "3072x2048",     // 6.3MP landscape
  "3:4": "2160x2880",     // 6.2MP portrait (3:4)
  "4:3": "2880x2160",     // 6.2MP landscape (4:3)
  "4:5": "2560x3200",     // 8.2MP portrait (4:5)
  "5:4": "3200x2560",     // 8.2MP landscape (5:4)
  "9:16": "2160x3840",    // 8.3MP portrait 4K
  "16:9": "3840x2160",    // 8.3MP landscape 4K
  "auto": "auto",
};

// Map Gemini-style imageSize to OpenAI quality
const QUALITY_MAP = {
  "512": "low",
  "1K": "low",
  "2K": "medium",
  "4K": "high",
  "auto": "auto",
};

const OUTPUT_DIR = path.join(__dirname, "generations");

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

function mimeForExt(ext) {
  const map = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
  return map[ext.toLowerCase()] || "image/png";
}

// ─── API call ─────────────────────────────────────────────────────────────────
async function generateImage({ prompt, aspectRatio, imageSize, refImages, background }) {
  if (!API_KEY) throw new Error("OPENAI_API_KEY not set in .env");

  const size = SIZE_MAP[aspectRatio] || "auto";
  const quality = QUALITY_MAP[imageSize] || "auto";

  const useEdits = refImages.length > 0;
  const url = useEdits
    ? "https://api.openai.com/v1/images/edits"
    : "https://api.openai.com/v1/images/generations";

  const refLabel = refImages.length > 0 ? ` | Refs: ${refImages.length} image(s)` : "";
  const bgLabel = background ? ` | Background: ${background}` : "";
  console.log(`\n  Generating with OpenAI (${MODEL})...`);
  console.log(`  Prompt: "${prompt}"`);
  console.log(`  Size: ${size} | Quality: ${quality}${refLabel}${bgLabel}\n`);

  let res;
  if (useEdits) {
    const form = new FormData();
    form.append("model", MODEL);
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", quality);
    form.append("n", "1");
    if (background) form.append("background", background);
    for (const ref of refImages) {
      const abs = path.resolve(ref);
      if (!fs.existsSync(abs)) throw new Error(`Reference image not found: ${abs}`);
      const buf = fs.readFileSync(abs);
      const ext = path.extname(abs);
      const blob = new Blob([buf], { type: mimeForExt(ext) });
      form.append("image[]", blob, path.basename(abs));
    }
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    });
  } else {
    const payload = { model: MODEL, prompt, size, quality, n: 1 };
    if (background) payload.background = background;
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  return res.json();
}

// ─── Notes on gpt-image-2 ────────────────────────────────────────────────────
// • Endpoints: /v1/images/generations (text-only) and /v1/images/edits (with refs).
// • Supports flexible sizes; edges multiples of 16, max 3840 per edge, ratio ≤ 3:1, 655K–8.29MP.
// • Quality: low / medium / high / auto.
// • Output formats: png (default), jpeg (faster), webp.
// • Do NOT pass input_fidelity for gpt-image-2 — it always uses high fidelity automatically.

// ─── Save results ─────────────────────────────────────────────────────────────
function saveResults(response, promptText) {
  ensureOutputDir();
  const ts = timestamp();
  const name = slug(promptText);
  const saved = [];

  const items = response.data || [];
  let imgIndex = 0;
  for (const item of items) {
    let buf;
    if (item.b64_json) {
      buf = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      console.log(`  Note: response returned URL instead of b64; cannot save inline. URL: ${item.url}`);
      continue;
    } else {
      continue;
    }
    const ext = "png"; // gpt-image-1 default output
    const filename = `${ts}_${name}${imgIndex > 0 ? `_${imgIndex}` : ""}.${ext}`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buf);
    saved.push(filepath);
    imgIndex++;
    console.log(`  Saved: ${filepath}`);
  }

  if (saved.length === 0) {
    console.log("  No images returned. Response snippet:");
    console.log("  " + JSON.stringify(response, null, 2).slice(0, 400));
  }

  return saved;
}

// ─── Batch mode ───────────────────────────────────────────────────────────────
async function runBatch(batchFile) {
  const abs = path.resolve(batchFile);
  if (!fs.existsSync(abs)) {
    console.error(`Batch file not found: ${abs}`);
    process.exit(1);
  }

  const jobs = JSON.parse(fs.readFileSync(abs, "utf-8"));
  console.log(`\n=== OpenAI Batch Mode: ${jobs.length} job(s) ===\n`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`--- Job ${i + 1}/${jobs.length} ---`);
    try {
      const response = await generateImage({
        prompt: job.prompt,
        aspectRatio: job.aspectRatio || "1:1",
        imageSize: job.imageSize || "2K",
        refImages: job.refImages || [],
        background: job.background,
      });
      saveResults(response, job.prompt);
    } catch (err) {
      console.error(`  Error on job ${i + 1}: ${err.message}`);
    }
    if (i < jobs.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nBatch complete!");
}

// ─── Interactive mode ─────────────────────────────────────────────────────────
async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("=== GPT Image Generator (OpenAI) ===");
  console.log(`Model: ${MODEL}`);
  console.log(`Aspect Ratios: ${VALID_RATIOS.join(", ")}`);
  console.log(`Quality (imageSize): 512/1K (low), 2K (medium), 4K (high), auto`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('Type "quit" to exit.\n');

  while (true) {
    const prompt = await ask(rl, "\nPrompt");
    if (!prompt || prompt.toLowerCase() === "quit") break;

    const aspectRatio = await ask(rl, "Aspect ratio", "1:1");
    const imageSize = await ask(rl, "Resolution (512/1K/2K/4K/auto)", "4K");

    const refInput = await ask(rl, "Reference images (comma-separated paths, or Enter to skip)", "");
    const refImages = refInput ? refInput.split(",").map((p) => p.trim()).filter(Boolean) : [];

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
    console.error("Error: OPENAI_API_KEY not set. Add it to .env or export it.");
    console.error("Optional: set OPENAI_IMAGE_MODEL=gpt-image-2 (or whichever model name you want).");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args[0] === "--batch" && args[1]) {
    await runBatch(args[1]);
  } else if (args[0] === "--batch") {
    console.error("Usage: node gpt-image.mjs --batch batch.json");
    process.exit(1);
  } else {
    await runInteractive();
  }
}

main();
