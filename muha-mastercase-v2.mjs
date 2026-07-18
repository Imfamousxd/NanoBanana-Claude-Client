#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE print design — v2
// Fixes vs v1: PORTRAIT/square box panel (matches refs/master case ref.png), truck kept as
// clear hero, cast clustered low-center, "FORD F-150 XLT GIVEAWAY" headline, and TWO clean
// reserved blank side rails (background only) for the user's 10 flavor badges.
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
const LAYOUT_REF = "AI Fruit VIdeos Muha/refs/master case ref.png";
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

const PROMPT = `MUHA MEMBERS GIVEAWAY — MASTER CASE FRONT PANEL PRINT DESIGN (portrait).

Printed front face of a retail MASTER CASE (shipping carton) for the Muha Members fruit-drama giveaway; grand prize is a Ford F-150 XLT truck. Premium full-bleed print artwork.

USE REFERENCE 1 (master case ref) FOR THE PRINT LAYOUT / STRUCTURE ONLY — same vertical poster composition (logo + headline up top, framed truck hero in the middle, winged crest, checkered spec band at the bottom, ornate filigree frame). But RE-SKIN it into the Muha Members Miami-neon Vegas world (do NOT copy the black Von Dutch color scheme, do NOT include the Von Dutch logo).

CANVAS — 1536 x 1536 square portrait panel.

THREE VERTICAL ZONES:
- LEFT BADGE RAIL (~16% width, far left): BACKGROUND ONLY — deep navy-purple + faint gold ornamental pattern, separated by a slim vertical gold pinstripe. Leave it completely EMPTY of characters, truck, logo and text (reserved so 5 flavor badges can be added here later).
- RIGHT BADGE RAIL (~16% width, far right): IDENTICAL mirrored empty background rail for the other 5 flavor badges.
- CENTER HERO COLUMN (~68% width): ALL hero content lives here, framed by an ornate GOLD art-deco / pinstripe filigree border with corner flourishes (echoing reference 1's frame).

CENTER HERO COLUMN, top to bottom:
1) TOP: the MUHA MEMBERS LOGO from reference 2 (blue verification-checkmark badge + gold "M" monogram + gold cursive "Members") placed BIG and CENTERED, pixel-faithful, NOT redrawn or garbled.
2) HEADLINE: "FORD F-150 XLT" on one line then "GIVEAWAY" below it, in chunky 3D vintage-Vegas display lettering — golden-yellow fill, subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline, small gold star accents flanking. Spell-check EXACTLY: F-O-R-D  F-1-5-0  X-L-T  and  G-I-V-E-A-W-A-Y.
3) HERO (centerpiece): the FORD F-150 XLT pickup from reference 3 — glossy blackout truck in a dramatic front three-quarter hero angle — large and prominent inside a tasteful gold-framed medallion with cinematic showroom lighting and gold/teal rim-light. The truck is clearly the star.
4) LOWER: the Muha fruit-drama cast clustered as an excited ensemble along the BASE of the truck / bottom of the hero column (in front of and below the truck, smaller than the truck so it stays hero). Every character must stay INSIDE the center column — none may enter the side badge rails.
5) BOTTOM: a horizontal SPEC BAND spanning the center column — black-and-white CHECKERED-FLAG racing edge with thin gold rules, carrying gold Vegas text: "ALL-IN-ONE   •   100 UNITS   •   10 CASES   •   10 STRAWS". Clean and correctly spelled.

CHARACTERS — the Muha fruit-drama cast from references 4-13, exactly ONE instance of each, TEN (10) distinct individuals, no duplicates, all at roughly the same scale:
1. Aloha Passion Rush — passionfruit head, hibiscus crown (female)
2. Arctic Blueberry — EXACTLY ONE: blue blueberry head with snow tuft, blue button-up (male). Only ONE blueberry-blue character total.
3. Blue Slushie — pink/blue cotton-candy slushie hair (female)
4. Frosted Mint Cookies — cookie-textured head, shy (female)
5. Frozen Pomegranate — buff red pomegranate head with crown, red muscle tank (male)
6. Galactic Diesel — cosmic-purple planet head with Saturn rings, leather jacket (male)
7. Guava Mango — half-yellow/half-green split head, laughing, leafy hair (male)
8. Horchata — creamy cinnamon-swirl head, cinnamon curls, red flamenco dress (female)
9. Lemon Cherry Fizz — lemon head, tortoiseshell glasses, cherry earrings (female)
10. Watermelon Bubblegum — watermelon head, pink bubblegum quiff, green bomber (male)
CRITICAL: COUNT exactly 10, zero duplicates, only one blueberry-blue head.

PALETTE (fills entire panel incl. the empty side rails) — Miami-neon Vegas-strip luxe: deep MIDNIGHT NAVY-PURPLE base, faint GOLD checkered/pinstripe ornament, hot MAGENTA + electric TEAL/CYAN neon bursts, floating gold sparkles, atmospheric haze, rich GOLD framing. NO Christmas red, NO holiday crimson, NO black Von Dutch color scheme.

STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style matching the character references; the truck is a sleek 3D hero render in the same world. Cinematic hero-poster lighting. Not flat 2D, not photoreal.

NEGATIVE — do NOT place any character, the truck, the logo, headline or spec text inside the reserved left/right badge rails (background only there). Do NOT misspell MUHA, FORD, F-150, XLT or GIVEAWAY. Do NOT duplicate any character. Do NOT use the Von Dutch logo or its black colorway. Do NOT use Christmas red dominantly. Do NOT add real Ford dealership logos, phone numbers, dates, URLs, or barcodes. Do NOT redraw the Muha Members logo — reference 2 placed as-is.`;

const SIZE = "1536x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = layout ref, 2 = logo, 3 = truck, 4-13 = characters
form.append("image[]", new Blob([fs.readFileSync(LAYOUT_REF)], { type: "image/png" }), "master-case-layout-ref.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v2 (portrait, reserved badge rails, truck hero)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v2.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
