#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE print design — v3
// NEW DIRECTION: faithfully REPRODUCE the exact design template of refs/master case ref.png
// (black Von Dutch-style pinstripe F-150 giveaway panel) — AI-generated, Muha-branded, our truck.
// No Vegas neon, no cartoon characters. The ref is passed as the PRIMARY reference (image 1).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";

const LAYOUT_REF = "AI Fruit VIdeos Muha/refs/master case ref.png";
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck frront.png";
const CREST_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";

const PROMPT = `Reproduce the EXACT design template of reference image 1 (a black master-case carton panel for a Ford F-150 truck giveaway). Recreate it as a clean, high-detail, AI-generated PRINT design — same layout, same proportions, same section placement, same art style — but Muha-branded.

MATCH REFERENCE 1 EXACTLY:
- PORTRAIT / near-square panel with a deep BLACK background.
- Ornate Von Dutch-style KUSTOM PINSTRIPE FILIGREE in silver/chrome and gold — symmetrical scrollwork, flame/wing flourishes filling the negative space, exactly like reference 1.
- Thin BLUE accent border lines framing the composition and the central truck stage, like reference 1.
- The same top-to-bottom structure and spacing as reference 1.

CONTENT, top to bottom (keep positions identical to reference 1):
1) TOP BANNER: two emblem lozenges side by side flanked by ornate eagle/wing crests. LEFT emblem = the MUHA MEMBERS logo from reference 2 (blue verification-checkmark + gold "M" monogram + gold cursive "Members"), pixel-faithful, NOT redrawn. RIGHT emblem = an ornate matching MUHA gold winged "M" crest based on reference 4 (so the whole panel is Muha-branded — do NOT write "Von Dutch").
2) HEADLINE: "FORD F-150 XLT" on one line, "GIVEAWAY" on the line below, in the same chunky chrome-and-gold beveled 3D display lettering with small star bullets, exactly matching reference 1's headline treatment. Spell EXACTLY: F-O-R-D  F-1-5-0  X-L-T  /  G-I-V-E-A-W-A-Y.
3) CENTER HERO: the black FORD F-150 XLT pickup from reference 3 (glossy blackout, front three-quarter angle) sitting on a stage/dais inside the same ornate pinstripe-framed rectangular medallion as reference 1, with dramatic spotlight lighting.
4) CREST: a large gold winged "M" crest/medallion centered just below the truck, matching reference 1's winged emblem placement.
5) BOTTOM BAND: the script word "ALL-IN-ONE" above a BLACK-AND-WHITE CHECKERED-FLAG band carrying gold text "100 UNITS    10 CASES    10 STRAWS", exactly like reference 1's bottom strip.

STYLE: glossy automotive-kustom print poster, black + chrome silver pinstripe + gold, thin electric-blue line accents. Photorealistic-rendered metal/chrome and a sleek 3D truck. Crisp, premium, screen-print quality.

NEGATIVE: do NOT add Miami-neon / Vegas purple-magenta-teal colors. Do NOT add any cartoon fruit characters or mascots. Do NOT write "Von Dutch" or use any non-Muha brand name. Do NOT change the layout, proportions, or section order from reference 1. Do NOT misspell MUHA, FORD, F-150, XLT, GIVEAWAY. Do NOT add phone numbers, dates, URLs, barcodes, or real Ford dealership logos. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = layout/template, 2 = logo, 3 = truck, 4 = gold crest
form.append("image[]", new Blob([fs.readFileSync(LAYOUT_REF)], { type: "image/png" }), "master-case-template.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");

console.log("Generating Master Case v3 (faithful ref-template replication, Muha-branded)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Master Case Designs";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-mastercase-v3.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
