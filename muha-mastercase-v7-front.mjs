#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v7 FRONT PANEL
// FIX: v6 abandoned the template structure (became a flat poster). v7 passes the APPROVED
// v5-FRONT as the structural template (image 1) and instructs the model to KEEP that exact
// box-panel layout — dust flaps, ornate framed border, sectioned banner/headline/medallion/
// crest/checkered-band — while re-rendering ONLY the visual STYLE into Pixar Miami-Vice
// fruit-drama, with the characters as the centered hero inside the central medallion.
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

const STRUCT_REF = "AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T02-28-28_muha-mastercase-v5-FRONT.png";
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck frront.png";
const CREST_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const CHARACTERS = [
  "Aloha Passion Rush.png",
  "Arctic Blueberry.png",
  "Blue Slushie.png",
  "Frosted Mint Cookies.png",
  "Frozen Pomegranate.png",
  "Galactic Diesel.png",
  "Guava Mango.png",
  "Horchata.png",
  "Lemon Cherry Fizz.png",
  "Watermelon Bubblegum.png",
];

const PROMPT = `Redesign the master-case FRONT PANEL shown in reference image 1. You MUST keep reference 1's EXACT PANEL LAYOUT AND STRUCTURE, and ONLY change its visual style/theme.

KEEP FROM REFERENCE 1 — EXACTLY (this is the locked print-panel template, do not rearrange):
- The overall carton-panel shape, including the angled TOP DUST-FLAP strip and BOTTOM DUST-FLAP strip at the very top and bottom edges.
- The ORNATE FRAMED BORDER that runs around the whole panel.
- The same top-to-bottom SECTION LAYOUT and proportions:
  (a) top flap tagline strip,
  (b) TOP BANNER with two emblem lozenges flanked by winged crests,
  (c) the big stacked HEADLINE block,
  (d) the CENTRAL ORNATE FRAMED RECTANGULAR MEDALLION / stage that holds the hero,
  (e) the gold winged-M CREST medallion directly below the central frame,
  (f) the BOTTOM BAND: script word above a checkered-flag spec strip,
  (g) the fine-print disclaimer line at the very bottom.
- The same positions, sizes, and framing of every one of those sections as reference 1.

CHANGE ONLY THE STYLE/THEME — re-render the entire panel in the unified PIXAR / CINEMA 4D / OCTANE animated-feature-film 3D look, with a MIAMI-VICE / retro-80s-Miami NEON treatment: deep midnight navy-to-purple, hot magenta + orange retro sunset, electric teal/cyan neon glow, silhouetted palm trees, art-deco Miami skyline and neon grid, gold sparkles, glossy cinematic lighting. The ornate border, frames, crests, and bottom band become glowing neon-and-gold versions of the same shapes (NOT black chrome Von Dutch pinstripe — drop that style entirely).

FILL THE SECTIONS WITH:
- TOP FLAP: small fine-print tagline.
- TOP BANNER: LEFT emblem = the MUHA MEMBERS logo from reference 2 (blue verification-checkmark + gold "M" monogram + gold cursive "Members"), pixel-faithful, NOT redrawn. RIGHT emblem = a matching gold winged "M" crest based on reference 4. Both Muha; no Von Dutch.
- HEADLINE: "FORD F-150 XLT" on one line, "GIVEAWAY" on the banner line below — chunky 3D gold-and-cream Vegas display lettering with magenta-purple drop shadow and star bullets. Spell EXACTLY: F-O-R-D  F-1-5-0  X-L-T  /  G-I-V-E-A-W-A-Y.
- CENTRAL FRAMED MEDALLION (the hero, CENTERED ON THE CHARACTERS): the 10 Muha fruit-drama characters as an excited cinematic ensemble are the STARS inside this framed stage, gathered around the FORD F-150 XLT pickup from reference 3 (glossy blackout, front three-quarter) which sits behind them as the PRIZE. Characters = heroes, truck = trophy. The whole scene stays INSIDE the central ornate frame, with the Miami-Vice neon scene behind them.
- CREST below: gold winged "M" medallion.
- BOTTOM BAND: script "ALL-IN-ONE" above a BLACK-AND-WHITE CHECKERED-FLAG strip reading "100 UNITS  |  10 CASES  |  10 STRAINS".
- DISCLAIMER: small light-gray line "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS. PLEASE CONSUME RESPONSIBLY."

CAST ROSTER — references 5-14, exactly ONE instance of each, TEN (10) distinct individuals, no duplicates, all roughly the same scale:
1. Aloha Passion Rush — passionfruit head, hibiscus crown (female)
2. Arctic Blueberry — EXACTLY ONE: blue blueberry head w/ snow tuft, blue button-up (male). Only ONE blueberry-blue character total.
3. Blue Slushie — pink/blue cotton-candy slushie hair (female)
4. Frosted Mint Cookies — cookie-textured head, shy (female)
5. Frozen Pomegranate — buff red pomegranate head w/ crown, red muscle tank (male)
6. Galactic Diesel — cosmic-purple planet head w/ Saturn rings, leather jacket (male)
7. Guava Mango — half-yellow/half-green split head, laughing, leafy hair (male)
8. Horchata — creamy cinnamon-swirl head, cinnamon curls, red flamenco dress (female)
9. Lemon Cherry Fizz — lemon head, tortoiseshell glasses, cherry earrings (female)
10. Watermelon Bubblegum — watermelon head, pink bubblegum quiff, green bomber (male)
CRITICAL: COUNT exactly 10, zero duplicates, only one blueberry-blue head.

NEGATIVE: do NOT change the panel layout, section order, framing, or proportions from reference 1 — keep the exact template structure including dust flaps, ornate border, central framed medallion, crest, and checkered band. Do NOT keep reference 1's black chrome Von Dutch pinstripe style — reskin to Pixar Miami-Vice neon. Do NOT make it a flat full-bleed poster collage — the sections and frames must remain. Do NOT write "Von Dutch" or any third-party brand. Do NOT misspell MUHA, FORD, F-150, XLT, GIVEAWAY, STRAINS. Do NOT duplicate any character. Do NOT add phone numbers, dates, URLs, barcodes, or real Ford dealership logos. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = structural template (v5 front), 2 = logo, 3 = truck, 4 = crest, 5-14 = chars
form.append("image[]", new Blob([fs.readFileSync(STRUCT_REF)], { type: "image/png" }), "structure-template.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v7 FRONT (keep v5 template structure, reskin Pixar Miami-Vice, chars as hero)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v7-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
