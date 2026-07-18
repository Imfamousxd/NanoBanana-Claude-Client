#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v5 FRONT PANEL
// FAITHFUL replication of refs/master case ref.png (the v3 direction the user approved).
// NO cartoon characters on the front (that was the v4 mistake). Only fixes vs v3:
//   - headline "FORD F-150 XLT" (correct trim)
//   - bottom band "10 STRAINS" (matches ref, not "STRAWS")
//   - small 21+ legal disclaimer line under the spec band
//   - both top emblems Muha (no Von Dutch)
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

const PROMPT = `Reproduce the EXACT design of reference image 1 (a black master-case carton FRONT PANEL for a Ford F-150 truck giveaway) as a clean, high-detail AI-generated PRINT design. Match its layout, proportions, section order, colors, and kustom art style PRECISELY — this must look like the same template. Only the brand and a few text lines change.

MATCH REFERENCE 1 EXACTLY:
- PORTRAIT / near-square panel, deep BLACK background.
- Ornate Von Dutch-style KUSTOM PINSTRIPE FILIGREE in silver/chrome + gold (symmetrical scrollwork, flame/wing flourishes) filling the negative space, including the vertical pinstripe side rails.
- Thin ELECTRIC-BLUE accent border lines framing the panel and the central truck stage.
- The SAME top-to-bottom structure, spacing, and proportions as reference 1.

CONTENT, top to bottom (keep positions identical to reference 1):
1) TOP FLAP STRIP (upside-down, at the very top edge, as in reference 1): small fine-print tagline text.
2) TOP BANNER: two emblem lozenges side by side flanked by ornate gold winged eagle crests. BOTH emblems are MUHA — LEFT = the MUHA MEMBERS logo from reference 2 (blue verification-checkmark + gold "M" monogram + gold cursive "Members"), pixel-faithful, NOT redrawn. RIGHT = a matching ornate MUHA gold winged "M" crest based on reference 4. NO Von Dutch, NO third-party brand anywhere.
3) HEADLINE: "FORD F-150 XLT" on one line, "GIVEAWAY" on a gold ribbon line below, in chunky chrome-and-gold beveled 3D display lettering with small gold star bullets — exactly matching reference 1's headline treatment. Spell EXACTLY: F-O-R-D  F-1-5-0  X-L-T  /  G-I-V-E-A-W-A-Y.
4) CENTER HERO: the black FORD F-150 pickup from reference 3 (glossy blackout, front three-quarter angle) on a spotlit stage inside the same ornate pinstripe-framed rectangular medallion as reference 1.
5) CREST: a large gold winged "M" crest/medallion centered just below the truck, matching reference 1's winged-emblem placement.
6) BOTTOM BAND: the script word "ALL-IN-ONE" above a BLACK-AND-WHITE CHECKERED-FLAG band carrying gold text "100 UNITS  |  10 CASES  |  10 STRAINS", exactly like reference 1.
7) DISCLAIMER: one small fine-print line in light gray directly under the spec band: "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS. PLEASE CONSUME RESPONSIBLY." — small but legible, correctly spelled.

STYLE: glossy automotive-kustom print poster — black + chrome silver pinstripe + gold, thin electric-blue line accents, photorealistic chrome/metal and a sleek 3D truck. Crisp, premium, screen-print quality.

NEGATIVE: do NOT add any cartoon fruit characters or mascots anywhere on this front panel. Do NOT add Miami-neon / Vegas purple-magenta-teal colors (keep the black/chrome/gold kustom look). Do NOT write "Von Dutch" or any third-party brand. Do NOT change the layout, proportions, or section order from reference 1. Do NOT misspell MUHA, FORD, F-150, XLT, GIVEAWAY, STRAINS. Do NOT add phone numbers, dates, URLs, barcodes, or real Ford dealership logos. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = template, 2 = logo, 3 = truck, 4 = gold crest
form.append("image[]", new Blob([fs.readFileSync(LAYOUT_REF)], { type: "image/png" }), "master-case-template.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");

console.log("Generating Master Case v5 FRONT (faithful template, no characters, fixes)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v5-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
