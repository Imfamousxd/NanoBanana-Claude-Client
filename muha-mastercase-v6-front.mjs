#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v6 FRONT PANEL  (FRUIT-DRAMA RESKIN)
// Keeps the approved v5 box-panel LAYOUT/STRUCTURE but drops the black/chrome Von Dutch kustom
// style. Reskinned into the fruit-drama world: Pixar/C4D cinematic 3D, Miami-Vice neon
// background, CENTERED on the 10 characters gathered around the Ford F-150 XLT prize.
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

const PROMPT = `MUHA MEMBERS GIVEAWAY — MASTER CASE FRONT PANEL. A premium printed retail shipping-carton front panel for a Ford F-150 XLT truck giveaway, themed around the Muha fruit-drama cartoon cast.

KEEP THIS PRINT-PANEL LAYOUT/STRUCTURE (top to bottom) — this box-panel skeleton is locked:
1) TOP DUST-FLAP STRIP (very top edge): a thin band with a small fine-print tagline.
2) TOP BANNER: the MUHA MEMBERS logo from reference 1 (blue verification-checkmark + gold "M" monogram + gold cursive "Members") placed BIG and CENTERED, pixel-faithful, NOT redrawn, flanked by ornate gold winged-M crest flourishes (based on reference 3).
3) HEADLINE: "FORD F-150 XLT" on one line, "GIVEAWAY" on a banner line below, in chunky 3D vintage display lettering — golden-yellow fill, subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline, small gold star bullets. Spell EXACTLY: F-O-R-D  F-1-5-0  X-L-T  /  G-I-V-E-A-W-A-Y.
4) CENTER HERO (the focus): the 10 Muha fruit-drama characters as an excited cinematic ensemble CENTERED in the panel — they are the stars. Gathered with and slightly in front of the FORD F-150 XLT pickup from reference 2 (glossy blackout, front three-quarter angle) which sits behind/among them as the PRIZE. Characters are the heroes; the truck is the trophy they surround. Hero-poster composition, dynamic depth.
5) CREST: a gold winged "M" crest/medallion centered just below the group.
6) BOTTOM BAND: the script word "ALL-IN-ONE" above a BLACK-AND-WHITE CHECKERED-FLAG band carrying gold text "100 UNITS  |  10 CASES  |  10 STRAINS".
7) DISCLAIMER: one small fine-print line in light gray under the band: "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS. PLEASE CONSUME RESPONSIBLY." correctly spelled.

STYLE / THEME — THIS IS THE BIG CHANGE: render the whole panel in the unified PIXAR / CINEMA 4D / OCTANE animated-feature-film 3D look that matches the character references — glossy, colorful, cinematic. The BACKGROUND is a MIAMI-VICE / retro-80s-Miami neon scene: deep midnight navy-to-purple gradient sky, a hot-magenta-and-orange retro sunset, electric teal/cyan neon glow, silhouetted palm trees, art-deco Miami skyline, neon grid, floating gold sparkles, atmospheric haze. Warm cinematic key light on the cast, neon rim-light. Rich gold framing and ornamentation on the headline, crest, and bottom band tie it to a premium giveaway poster.

DO NOT use the black Von Dutch kustom pinstripe / chrome-filigree style at all. This panel is bright, neon, Pixar-cinematic — NOT the dark chrome carton look.

CAST ROSTER — references 4-13, exactly ONE instance of each, TEN (10) distinct individuals, no duplicates, all roughly the same scale (balanced peers):
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

NEGATIVE: do NOT use the black chrome Von Dutch kustom style. Do NOT write "Von Dutch" or any third-party brand. Do NOT misspell MUHA, FORD, F-150, XLT, GIVEAWAY, STRAINS. Do NOT duplicate any character. Do NOT add Christmas red as a dominant color. Do NOT add phone numbers, dates, URLs, barcodes, or real Ford dealership logos. Do NOT redraw the Muha Members logo — reference 1 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = logo, 2 = truck, 3 = gold crest, 4-13 = characters
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v6 FRONT (fruit-drama reskin, Miami-Vice neon, characters centered)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v6-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
