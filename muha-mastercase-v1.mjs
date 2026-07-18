#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE print design — v1
// Front panel of the shipping master case. Truck-hero (Ford F-150 XLT prize) + Muha Members
// logo + fruit-drama cast, Miami-neon Vegas palette. Reserved blank side columns (background
// only) for the user to drop the 10 flavor badges later.
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

const PROMPT = `MUHA MEMBERS GIVEAWAY — MASTER CASE FRONT PANEL PRINT DESIGN.

This is the printed front panel of a retail MASTER CASE (shipping carton) for the Muha Members fruit-drama giveaway whose grand prize is a Ford F-150 XLT truck. Premium print artwork, full-bleed.

CANVAS — 2048 x 1024 landscape, representing the rectangular front face of the master case.

OVERALL LAYOUT — THREE VERTICAL ZONES:
- LEFT SIDE COLUMN (~15% of width, far left): BACKGROUND ONLY. Keep this strip clear of characters, truck, logo and text — fill it with the same deep navy-purple + gold ornamental background pattern as the rest of the card so flavor badges can be added here later. A thin vertical gold pinstripe / divider separates it from the center.
- RIGHT SIDE COLUMN (~15% of width, far right): IDENTICAL treatment — BACKGROUND ONLY, reserved blank for flavor badges, same vertical gold divider. Left and right columns must mirror each other and stay empty of hero content.
- CENTER HERO ZONE (~70% of width, middle): all the hero content lives here.

CENTER HERO ZONE — top to bottom:
1) TOP: the actual MUHA MEMBERS LOGO from reference 1 (blue verification-checkmark badge + gold "M" monogram + gold cursive "Members" lettering) placed BIG and CENTERED — render it pixel-faithful to reference 1, NOT redrawn, NOT garbled. Directly beneath it the word "GIVEAWAY" in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline. Spell-check exactly: G-I-V-E-A-W-A-Y.

2) MIDDLE (the hero): the FORD F-150 XLT pickup truck from reference 2 — a glossy blackout/black truck shown in a dramatic front three-quarter hero angle — as the centerpiece prize, large and prominent with cinematic showroom lighting and a subtle gold/teal rim-light. Gathered around and slightly in front of the truck (NOT on top of it) are the Muha fruit-drama characters as an excited ensemble. Keep every character INSIDE the center zone — none may spill into the reserved side columns.

3) BOTTOM: a horizontal SPEC BAND across the center zone — a darker navy banner edged with a black-and-white CHECKERED-FLAG racing accent and thin gold rules, carrying gold Vegas-style text reading: "ALL-IN-ONE   •   100 UNITS   •   10 CASES   •   10 STRAWS". Clean, legible, correctly spelled.

CHARACTERS — include the Muha fruit-drama cast from references 3-12, exactly ONE instance of each, TEN (10) distinct individuals, no duplicates. Roster (all rendered at roughly the SAME visual scale as balanced peers):
1. Aloha Passion Rush — passionfruit head, hibiscus crown, tropical look (female)
2. Arctic Blueberry — EXACTLY ONE: chad smooth-talker, deep purple-blue blueberry head with snow tuft, blue button-up (male). Only ONE blueberry-blue character in the whole image.
3. Blue Slushie — pastel pink/blue cotton-candy slushie hair, brain-freeze drama (female)
4. Frosted Mint Cookies — cookie-textured head, shy (female)
5. Frozen Pomegranate — buff red-skinned gym-bro, deep red pomegranate head with crown, red muscle tank (male)
6. Galactic Diesel — cosmic-purple planet head with Saturn rings, leather jacket (male)
7. Guava Mango — half-mango-yellow / half-guava-green split head, laughing class-clown, leafy hair, yellow tee + coral-pink overshirt (male)
8. Horchata — creamy cinnamon-swirl head, cinnamon-stick curls, red flamenco dress (female)
9. Lemon Cherry Fizz — lemon head, tortoiseshell glasses, cherry earrings, book (female)
10. Watermelon Bubblegum — whole green-striped watermelon head with pink bubblegum quiff hair, green bomber + pink crew (male)
CRITICAL: COUNT exactly 10 characters total, zero duplicates, only one blueberry-blue head.

BACKGROUND / PALETTE (fills the whole panel including the reserved side columns) — Miami-neon Vegas-strip luxe: deep MIDNIGHT NAVY-PURPLE base with a faint GOLD checkered / pinstripe ornamental pattern, hot MAGENTA + electric TEAL/CYAN neon light bursts, floating gold sparkles, atmospheric haze. Rich GOLD ornamentation. NO Christmas red, NO holiday crimson.

STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style matching the character references. The truck is a sleek 3D hero render consistent with that world. Cinematic hero-poster lighting. Not flat 2D, not photoreal.

NEGATIVE — do NOT place any character, the truck, the logo, or text inside the reserved left/right side columns (those stay background-only for flavor badges). Do NOT misspell MUHA or GIVEAWAY. Do NOT duplicate any character. Do NOT use Christmas red as a dominant color. Do NOT add real Ford dealership logos, phone numbers, dates, URLs or barcodes. Do NOT redraw the Muha Members logo — reference 1 placed as-is.`;

const SIZE = "2048x1024";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// reference order: 1 = logo, 2 = truck, 3-12 = characters
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v1 (truck-hero, reserved badge side columns)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v1.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
