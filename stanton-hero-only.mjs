#!/usr/bin/env node
// Stanton Prep Kit — standalone HERO PRODUCT RENDER matching the flyer's exact hero.
// Uses the approved flyer as a ref so the standalone hero composition matches it precisely.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "1024x1024";
const FLYER_REF = "Stanton Assets/Peptide Kit Label/2026-06-09T21-44-45_stanton-peptide-kit-E-list.png";
const outDir = "Stanton Assets/Peptide Kit Label";

const PROMPT = `REFERENCE IMAGE 1 is the approved Stanton Prep Kit flyer. In its UPPER-MIDDLE section there is a HERO PRODUCT RENDER showing four sterile prep-kit items arranged together on white background — reproduce ONLY that hero product render, isolated by itself on a pure flat white #FFFFFF background, square framing.

Match the reference HERO composition EXACTLY:
- The clear glass Bacteriostatic Water vial STANDS UPRIGHT with its label facing forward (white wrap-label, "Bacteriostatic Water for Injection, USP" + "30 mL" in navy text).
- TWO 3 mL luer-lock draw syringes LAY HORIZONTALLY in front of / beside the vial, both with 24G hypodermic draw needles attached, translucent clear plastic body.
- THREE U-100 insulin syringes (all same size) LAY HORIZONTALLY together with their realistic ORANGE needle caps visible.
- A slightly offset cascaded stack of 3–4 white alcohol prep pad sachets labeled "Sterile Alcohol Prep Pad" (corners of underlying sachets visible so it reads as multiple).

Reproduce the exact same arrangement, same scale relationships, same lighting and shadows, same item positions as shown in the reference flyer's hero block. Centered on a pure flat WHITE background — NO label chrome, NO logo, NO title text, NO contents list, NO URL, NO frame, NO footer — JUST the four product items as shown in the hero render, isolated. Photorealistic, clinical-premium product photography aesthetic, generous whitespace around the composition.`;

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
console.log(`Generating Stanton hero-only (match flyer)...`);

const refBuf = fs.readFileSync(FLYER_REF);
const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");
form.append("image[]", new Blob([refBuf], { type: "image/png" }), "flyer-ref.png");

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}
const item = ((await res.json()).data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }
const png = `${outDir}/${stamp}_stanton-prep-kit-hero-only.png`;
fs.writeFileSync(png, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${png}`);
const pdf = `${outDir}/stanton-prep-kit-hero-only.pdf`;
execSync(`sips -s format pdf "${png}" --out "${pdf}"`, { stdio: "ignore" });
console.log(`✓ ${pdf}`);
try { execSync(`open -a Preview "${pdf}"`); } catch {}
