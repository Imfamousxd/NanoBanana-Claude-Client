#!/usr/bin/env node
// NuLumin — restage every approved vial onto a PURE WHITE cut-out background.
// Locked relabel/anchor technique: feed each approved vial in as the reference and
// reproduce the vial EXACTLY (cap/glass/label/text), change ONLY the background to
// flat pure white #FFFFFF with NO shadow / NO reflection. 1:1, 4K. NB Pro.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
// NB writes clean uniform-field generations here; the rembg flatten step then turns
// each into the final pure-white cut-out one level up in "White BG/".
const OUT_DIR = path.join(__dirname, "NuLumin Generated", "White BG", "_raw");
const CONCURRENCY = 4;
const MAX_RETRIES = 2;

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Build the job list: every NuLumin Assets vial (skip logos + the streak hero) +
//    the two approved Glow/Klow studio blends. Raw out = source product base name.
const assetsDir = path.join(__dirname, "NuLumin Assets");
const assetJobs = fs.readdirSync(assetsDir)
  .filter((f) => /^NuL_.*\.png$/.test(f))
  .filter((f) => !/logo/i.test(f) && !/streak/i.test(f))
  .sort()
  .map((f) => ({ src: path.join(assetsDir, f), out: f }));

const blendDir = path.join(__dirname, "NuLumin Send", "Glow & Klow");
const blendJobs = [
  { src: path.join(blendDir, "NuLumin_Glow-Blend_70mg_studio.png"), out: "NuL_GlowBlend_70mg.png" },
  { src: path.join(blendDir, "NuLumin_Klow-Blend_80mg_studio.png"), out: "NuL_KlowBlend_80mg.png" },
].filter((j) => fs.existsSync(j.src));

let ALL_JOBS = [...assetJobs, ...blendJobs];
// ONLY=<substr[,substr...]> regenerates just the matching vial(s) (targeted re-runs/fixes).
if (process.env.ONLY) {
  const subs = process.env.ONLY.split(",").map((s) => s.trim()).filter(Boolean);
  ALL_JOBS = ALL_JOBS.filter((j) => subs.some((s) => j.src.includes(s)));
}
// JOB_LIMIT lets us smoke-test the prompt on the first N vials before the full run.
const JOBS = process.env.JOB_LIMIT ? ALL_JOBS.slice(0, parseInt(process.env.JOB_LIMIT, 10)) : ALL_JOBS;

const PROMPT = `The reference image is an APPROVED, FINISHED NuLumin Bio-Sciences product vial shot. Reproduce the VIAL exactly as a photo retouch — same vial, same clear glass and contents, and the same full label design: the white label, the thin vertical accent stripe, the "NuLumin BIO-SCIENCES" lockup, the divider line, the side spec text block, the "Manufactured by NuLumin" line, every typeface, and the exact product-name and dose text. The product name stays BLACK; only the dose keeps its accent color. Do not alter the vial, glass, contents, label, or any text in any way.

CAP — STANDARDIZED, IDENTICAL ON EVERY VIAL (change only its color): render the cap in ONE standard style regardless of how the reference cap looks. It is a LOW-PROFILE crimped aluminum vial seal — a flat circular top disc with a short, straight, vertical crimped skirt, sitting low on the neck. Smooth MATTE / SATIN finish — absolutely NOT metallic, NOT foil, NOT chrome, NOT glossy, NOT mirror-like, with no shiny specular hotspots. Do NOT make the cap tall, domed, rounded, or bulbous — keep it low and flat-topped, same height and diameter on every vial. Just below the colored cap, a thin brushed-aluminum crimp ring wraps the glass neck. Take ONLY the cap COLOR from the reference (its solid matte color); render the cap's shape, height, proportions, and matte finish in this exact standard way.

RE-STAGE the vial as a clean, NATURAL studio PRODUCT PHOTOGRAPH on a bright WHITE seamless background. It must look like a real photograph of the vial — soft, even, natural studio lighting with gentle realistic highlights and subtle reflections ON THE GLASS AND CAP themselves, so the vial reads as a genuine 3D object sitting in the scene, NOT a flat pasted-on sticker or a hard-edged cut-out. Keep the vial's natural soft edges and the way light wraps its glass.

The background is ONE single, smooth, seamless bright-white studio sweep that fills the entire square frame edge to edge. The reference vial is taller than it is wide, so fill the left and right side margins with the SAME continuous bright white. Bright clean white, not grey, not cream.

NO SHADOW: the vial casts NO shadow — no contact/grounding shadow beneath it, no drop shadow, and no mirror reflection on the floor or surface below. The vial sits on clean continuous white with no shadow at all. (Natural highlights/reflections ON the glass itself are good; a shadow or floor-reflection is not.)

Do NOT tile, repeat, mirror, panel, or texture the background; do NOT fill the side margins with grey blocks, rectangles, patches, or smeared/cloudy texture — one continuous seamless bright white only. No surface line, table edge, or horizon.

ASPECT RATIO: 1:1 square.

Negative: no shadow, no contact shadow, no drop shadow, no floor/surface reflection, no grey/cream background, no tiled/repeated/blocky panels or rectangles in the margins, no outpainted/duplicated backdrop, no cloudy/smeared texture, no surface/table/horizon line, no props, no extra text, no misspellings, no flat sticker/cut-out look, no change to the vial/cap/label/contents/text; do NOT put the product name in the accent color (BLACK only).${process.env.EXTRA ? "\n\n" + process.env.EXTRA : ""}`;

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(job, attempt = 1) {
  // CAP_REF=<path> adds a 2nd reference image whose cap color the new vial must match
  // (first image stays the product to reproduce). Pair with an EXTRA clause explaining roles.
  const parts = [inline(job.src)];
  if (process.env.CAP_REF) parts.push(inline(process.env.CAP_REF));
  parts.push({ text: PROMPT });
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    for (const part of data?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const outPath = path.join(OUT_DIR, job.out);
        fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
        return { ok: true, out: job.out };
      }
    }
    throw new Error("no image in response");
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return generateOne(job, attempt + 1);
    }
    return { ok: false, out: job.out, err: err.message };
  }
}

// ── Simple concurrency pool ──
console.log(`\n=== NuLumin white-BG cut-outs: ${JOBS.length} vials → ${OUT_DIR} ===\n`);
let idx = 0;
let done = 0;
const results = [];
async function worker() {
  while (idx < JOBS.length) {
    const job = JOBS[idx++];
    const r = await generateOne(job);
    results.push(r);
    done++;
    console.log(`  [${done}/${JOBS.length}] ${r.ok ? "✓" : "✗ " + r.err} ${r.out}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const failed = results.filter((r) => !r.ok);
console.log(`\nDone. ${results.length - failed.length}/${JOBS.length} saved to "${OUT_DIR}".`);
if (failed.length) console.log("Failed:\n" + failed.map((f) => `  - ${f.out}: ${f.err}`).join("\n"));
