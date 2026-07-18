#!/usr/bin/env node
// Regenerate specific (product, dose, size, color) variants from scratch
// using the standard build prompt. Bypass fix-edit, just rerun original build.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const ROOT = "Noble Harbor Wholesale";
const colorSpec = JSON.parse(fs.readFileSync("nh-colors.json", "utf8"));
const LOT = "NH-1024";

const TARGETS = [
  { product: "Semax", dose: "10 mg", size: "5ml", color: "red", filename: "Semax/10mg/Semax_10mg_5ml_red.jpg" },
];

function buildPrompt(target) {
  const { product, dose, size, color } = target;
  const sizeLabel = size.replace("ml", " ml");
  const spec = colorSpec[color];
  const isWhite = color === "white";
  return `Pharmaceutical vial product photography, vertical 4:5 portrait composition. ${color === "navy" ? "" : "TWO REFERENCE IMAGES are provided. The FIRST reference (navy variant) is the canonical TYPOGRAPHY ANCHOR — copy from it exactly: the product-name typeface, font weight, letter shapes, letter spacing, and overall label layout. The SECOND reference is the CAP COLOR ANCHOR — match its " + spec.name + " cap color and bottom accent bar color exactly. Reproduce vial geometry, lighting, and shadow from either reference."} Cap color must be EXACTLY hex ${spec.cap}. Vial size: ${size}. The label has the following content laid out top to bottom: (1) Upper roughly 60 percent of the label is a blank pristine white logo zone with absolutely no graphics, text, lines, or marks. LOCKED TYPEFACE FOR ALL TEXT: Helvetica Neue. (2) Below the logo zone, the product name '${product}' rendered in HELVETICA NEUE BOLD (~700 weight) in dark charcoal grey, perfectly horizontally centered on the label, natural letter proportions. (3) Directly below, the dose-and-volume line '${dose} · ${sizeLabel}' rendered in HELVETICA NEUE BOLD at ~60 percent of product-name size, charcoal grey, perfectly centered. (4) Below the dose with a small visual gap, the compliance text rendered as TWO STACKED LINES, each line perfectly horizontally centered, both lines in HELVETICA NEUE LIGHT (~300 weight, NOT bold), all-caps, in medium grey, at roughly 22 percent of the product-name size. Line 1: 'FOR RESEARCH USE ONLY'. Line 2: 'NOT FOR HUMAN CONSUMPTION'. (5) Directly below with a small gap, the lot line 'LOT: ${LOT}' rendered in HELVETICA NEUE LIGHT (NOT bold), perfectly horizontally centered with EQUAL margins on both sides — never left-aligned. (6) At the very bottom edge, MUST INCLUDE a slim solid accent bar at exactly hex ${spec.bar}${isWhite ? " (medium grey since cap is white)" : ""} running edge to edge. The bottom bar is REQUIRED. NO hairlines anywhere. CRITICAL — typography weight and shape match the navy reference exactly across all text. Sharp focus, high resolution, premium pharmaceutical product shot.`;
}

async function regen(target, attempt = 1) {
  const navyExt = fs.existsSync(`${ROOT}/BPC-157/BPC-157_${target.size}_navy.jpg`) ? "jpg" : "png";
  const colorExt = fs.existsSync(`${ROOT}/BPC-157/BPC-157_${target.size}_${target.color}.jpg`) ? "jpg" : "png";
  const navyRef = `${ROOT}/BPC-157/BPC-157_${target.size}_navy.${navyExt}`;
  const colorRef = `${ROOT}/BPC-157/BPC-157_${target.size}_${target.color}.${colorExt}`;
  const refs = target.color === "navy" ? [colorRef] : [navyRef, colorRef];
  const parts = refs.map(p => ({
    inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") },
  }));
  parts.push({ text: buildPrompt(target) });
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: "4:5", imageSize: "4K" },
    },
  };
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 3000)); return regen(target, attempt + 1); }
    return { ok: false, error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429 && attempt < 4) { await new Promise(r => setTimeout(r, 5000 * attempt)); return regen(target, attempt + 1); }
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
  }
  const data = await res.json();
  const responseParts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, "base64");
      const dst = path.join(ROOT, target.filename);
      fs.writeFileSync(dst, buf);
      return { ok: true };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Regenerating ${TARGETS.length} targeted images...`);
let ok = 0, fail = 0;
for (const t of TARGETS) {
  const r = await regen(t);
  if (r.ok) { ok++; console.log(`  ✓ ${t.filename}`); }
  else { fail++; console.log(`  ✗ ${t.filename}: ${r.error}`); }
}
console.log(`\nDone: ${ok} regenerated, ${fail} failed`);
