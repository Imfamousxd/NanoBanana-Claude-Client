#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v5 SIDE PANEL
// Same kustom black/chrome/gold template style as the front, but built as the box SIDE panel:
// a vertical column of reserved, empty ornate frames where the 10 fruit-drama FLAVOR BADGES
// get dropped in later. This panel carries the fruit-drama theme via the badge slots.
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
const CREST_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";

const PROMPT = `Design the SIDE PANEL of the same Muha Members master-case carton whose FRONT panel is reference image 1. The side panel MUST use the IDENTICAL kustom print style as reference 1 so it reads as the same box: deep BLACK background, ornate silver/chrome + gold Von Dutch-style PINSTRIPE FILIGREE scrollwork, thin ELECTRIC-BLUE accent border lines, gold beveled detailing. Same materials, same palette, same premium screen-print quality.

PANEL SHAPE: tall vertical rectangle (portrait), the long narrow side face of the master case.

LAYOUT, top to bottom:
1) TOP: the MUHA MEMBERS logo from reference 2 (blue verification-checkmark + gold "M" monogram + gold cursive "Members"), pixel-faithful, centered, flanked by small gold winged-crest flourishes — matching the front panel's emblem styling.
2) A short chrome-and-gold beveled sub-header reading "10 FLAVORS" in the same display lettering style as the front headline. Correctly spelled.
3) MAIN AREA (the important part): a clean, evenly-spaced VERTICAL COLUMN of TEN (10) EMPTY ornate frames / placeholder slots — each an identical gold-and-chrome pinstripe-bordered rounded rectangle on the black background, arranged in a neat single column (or two columns of 5) with even gaps. These frames are INTENTIONALLY EMPTY (just black interior, no artwork inside) — they are reserved placeholders where fruit-drama flavor badges will be added later. Make the empty slots obvious, tidy, and uniform in size so badges can be dropped in cleanly. Do NOT draw any fruit, characters, or badge artwork inside them — leave them blank.
4) BOTTOM: a slim BLACK-AND-WHITE CHECKERED-FLAG accent strip with thin gold rules (echoing the front panel's bottom band), and a small light-gray fine-print line: "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS." correctly spelled.

STYLE: matches reference 1 exactly — glossy black/chrome/gold automotive-kustom print, electric-blue accent lines, ornate pinstripe filigree. Crisp, premium.

NEGATIVE: do NOT fill the placeholder frames with any artwork — keep all 10 slots EMPTY/blank for later badge placement. Do NOT add the truck or any cartoon characters on this side panel. Do NOT use Miami-neon / Vegas colors. Do NOT write "Von Dutch" or any third-party brand. Do NOT misspell MUHA or FLAVORS. Do NOT add phone numbers, dates, URLs, or barcodes. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1024x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = front-panel style ref, 2 = logo, 3 = gold crest
form.append("image[]", new Blob([fs.readFileSync(LAYOUT_REF)], { type: "image/png" }), "master-case-front-style.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");

console.log("Generating Master Case v5 SIDE (reserved badge-slot panel, matching template)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v5-SIDE.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
