#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE print design — v4
// Builds on v3 (faithful black-pinstripe ref template) and adds the user's fixes:
//  1. Von Dutch fully dropped (both top emblems = Muha).
//  2. Headline spelled "FORD F-150 XLT" (correct Ford trim).
//  3. Fruit-drama cast included (the giveaway THEME) gathered around the truck in the center.
//  4. Left + right SIDE RAILS reserved blank (pinstripe background only) for flavor badges later.
//  5. Bottom band "10 STRAINS" (matches the ref, not "STRAWS") + a small legal disclaimer.
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

const PROMPT = `Reproduce the EXACT design template of reference image 1 (a black master-case carton panel for a Ford F-150 truck giveaway) as a clean, high-detail AI-generated PRINT design — same layout, proportions, section order, and black/chrome/gold kustom style — but Muha-branded and themed around the Muha fruit-drama cast.

MATCH REFERENCE 1's TEMPLATE EXACTLY:
- PORTRAIT / near-square panel, deep BLACK background.
- Ornate Von Dutch-style KUSTOM PINSTRIPE FILIGREE in silver/chrome + gold (symmetrical scrollwork, flame/wing flourishes) filling the negative space.
- Thin ELECTRIC-BLUE accent border lines framing the panel and the central truck stage.
- Same top-to-bottom structure and spacing as reference 1.

RESERVED SIDE RAILS — IMPORTANT: keep a clear vertical RAIL down the FAR LEFT (~15% width) and FAR RIGHT (~15% width) that contains ONLY the black pinstripe-filigree background — NO truck, NO characters, NO crest, NO text in these rails. These two rails are intentionally left EMPTY so flavor badges can be placed there later. A slim electric-blue pinstripe separates each rail from the center.

CENTER COLUMN (~70% width) — all hero content, top to bottom (positions identical to reference 1):
1) TOP BANNER: two emblem lozenges side by side flanked by ornate gold winged crests. BOTH emblems are MUHA — LEFT = the MUHA MEMBERS logo from reference 2 (blue verification-checkmark + gold "M" monogram + gold cursive "Members"), pixel-faithful, NOT redrawn. RIGHT = a matching ornate MUHA gold winged "M" crest based on reference 4. (There is NO Von Dutch and NO third-party brand anywhere.)
2) HEADLINE: "FORD F-150 XLT" on one line, "GIVEAWAY" on the line below, in chunky chrome-and-gold beveled 3D display lettering with small gold star bullets — matching reference 1's headline treatment. Spell EXACTLY as shown: F-O-R-D  F-1-5-0  X-L-T  /  G-I-V-E-A-W-A-Y.
3) CENTER HERO: the black FORD pickup from reference 3 (glossy blackout, front three-quarter angle) on a spotlit stage inside the same ornate pinstripe-framed rectangular medallion as reference 1.
4) FRUIT-DRAMA CAST (the giveaway theme): the Muha Pixar-3D fruit-headed characters from references 5-14 gathered as an excited ensemble at the BASE of the truck / lower center — standing in front of and below the truck, clearly smaller than the truck so it stays the hero. Their bright Pixar 3D coloring pops against the black kustom panel. Every character stays INSIDE the center column — NONE may enter the reserved side rails.
5) CREST: a large gold winged "M" crest/medallion centered just below the cast, matching reference 1's winged-emblem placement.
6) BOTTOM BAND: the script word "ALL-IN-ONE" above a BLACK-AND-WHITE CHECKERED-FLAG band carrying gold text "100 UNITS  |  10 CASES  |  10 STRAINS" (exactly like reference 1). Beneath it, one small fine-print legal disclaimer line in light gray: "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS. PLEASE CONSUME RESPONSIBLY." — small but legible, correctly spelled.

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

STYLE: glossy automotive-kustom print poster — black + chrome silver pinstripe + gold, thin electric-blue line accents — with the cast rendered in their bright unified PIXAR / CINEMA 4D / OCTANE 3D look. Crisp, premium, screen-print quality.

NEGATIVE: do NOT place truck, characters, crest, headline, or text in the reserved left/right side rails (pinstripe background ONLY there). Do NOT write "Von Dutch" or any third-party brand. Do NOT add Miami-neon / Vegas purple-magenta-teal as the panel color scheme (keep it the black/chrome/gold kustom look of reference 1). Do NOT change the layout, proportions, or section order from reference 1. Do NOT misspell MUHA, FORD, F-150, XLT, GIVEAWAY, STRAINS. Do NOT duplicate any character. Do NOT add phone numbers, dates, URLs, barcodes, or real Ford dealership logos. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = template, 2 = logo, 3 = truck, 4 = gold crest, 5-14 = characters
form.append("image[]", new Blob([fs.readFileSync(LAYOUT_REF)], { type: "image/png" }), "master-case-template.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v4 (faithful template + fruit-drama cast + reserved badge rails)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v4.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
