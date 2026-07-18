#!/usr/bin/env node
// gpt-image-2 — Muha raffle card v7: C re-roll.
// - Galactic Diesel placed behind everyone else (back layer)
// - Spelling lock: "MUHA" must be M-U-H-A
// - No chars on truck
// - Ford oval emblem on grille kept
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

const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck.jpg";
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

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C v7 (TRUCK-HERO, NO chars on truck, Galactic Diesel as back-layer character).

INSIDE THE INNER STICKER AREA (1866 x 762 px centered in a 2048 x 1024 canvas representing the 82mm x 32mm peel-off sticker of a 90mm x 43mm raffle card): a dramatic HERO PORTRAIT of the BLACK FORD F-150 XLT pickup truck from the truck reference as the STAR of the scene — three-quarter FRONT-RIGHT view (front grille + hood + side visible from a low cool angle). The truck is dominant.

FORD LOGO REQUIRED — the iconic FORD oval emblem (blue oval badge with cursive "Ford" wordmark in white) rendered in the CENTER of the truck's front GRILLE, clean and clearly visible.

CHARACTER PLACEMENT — NO CHARACTERS ON THE TRUCK. All 10 Muha fruit-drama characters (ONE instance each: Aloha Passion Rush, Arctic Blueberry, Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum) are posed ON THE GROUND around the truck — standing in front, beside, and slightly behind. None of them are on the hood, roof, bed, windshield, or any part of the vehicle.

GALACTIC DIESEL LAYER — IMPORTANT: Galactic Diesel (the cosmic-purple planet-head guy with Saturn rings, leather jacket, smirk) is the FURTHEST-BACK character in the composition. He sits behind everyone else in the depth order — partially obscured by other characters in front of him, peeking out from the deepest layer of the group like he just arrived from the back. He appears smaller / further from camera. Galactic Diesel is the back-layer character; all other 9 characters are in front of him in the scene depth.

HERO TEXT — render text reading "MUHA MEMBERS GIVEAWAY" in chunky 3D vintage-Vegas display lettering. SPELLING CHECK — the first word has FOUR letters in this exact order: M, U, H, A. Render the letters individually: capital M (with two distinct V-shapes meeting at center), then capital U (a curved U), then capital H (two vertical bars with a horizontal crossbar in the middle), then capital A (a triangular peak with a horizontal crossbar). Do NOT render "MUIHA" (no extra I), do NOT render "MWHA" (no W in place of M+U), do NOT render "MUUHA" (no double U). Just four letters: M-U-H-A. Then "MEMBERS" (M-E-M-B-E-R-S, seven letters). Then "GIVEAWAY" (G-I-V-E-A-W-A-Y, eight letters). Subtitle "WIN A FORD F-150 XLT" in cream beneath.

Style: golden-yellow letterfill with subtle 3D bevel, deep magenta-purple drop shadow, slight cream/white outline. Two-line stack with "MUHA MEMBERS" on top and "GIVEAWAY" slightly larger below.

LAYOUT — inner sticker area 1866x762 px contains all hero artwork. ORNATE GOLD ART-DECO TICKET BORDER traces the boundary of the inner sticker zone (corner flourishes, fine gold rule, starburst midpoint accents). OUTER MARGIN (~91px L/R, ~131px T/B between gold border and canvas edge) is deep midnight-navy-purple with faint gold pinstripes — identical to the other variations in the set.

STYLE — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. Truck rendered in Pixar 3D animated style matching the character world.

PALETTE — Miami-neon Vegas strip: deep midnight navy + hot magenta + electric teal neon haze, faint blurred neon-shape suggestions in deep background, volumetric light beams. NO Christmas red.

NEGATIVE — do NOT place any character on the truck (no hood/roof/bed/windshield). Do NOT make Galactic Diesel front-and-center — he is back-layer. Do NOT use Christmas red. Do NOT include dealership signage. Do NOT misspell MUHA — must be exactly M-U-H-A. Do NOT duplicate any character. Hero artwork must stay inside the inner sticker zone.`;

const SIZE = "2048x1024";

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");
const truckBuf = fs.readFileSync(TRUCK_REF);
form.append("image[]", new Blob([truckBuf], { type: mimeForExt(path.extname(TRUCK_REF)) }), "truck.jpg");
for (const charFile of CHARACTERS) {
  const p = path.join(CHAR_DIR, charFile);
  const buf = fs.readFileSync(p);
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating C-truck-hero-v7 (Galactic back, MUHA spelled correctly)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-raffle-C-truck-hero-v7.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
