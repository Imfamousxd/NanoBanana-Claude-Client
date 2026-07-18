#!/usr/bin/env node
// gpt-image-2 — Muha raffle card v6: targeted re-roll of C only.
// No characters on the truck hood — all characters posed on the ground around the truck.
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

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C v6 (TRUCK-HERO with Ford logo, NO characters on the truck).

INSIDE THE INNER STICKER AREA (1866 x 762 px centered in a 2048 x 1024 canvas representing the 82mm x 32mm peel-off sticker area of a 90mm x 43mm raffle card): a dramatic HERO PORTRAIT of the BLACK FORD F-150 XLT pickup truck from the truck reference as the STAR of the scene — three-quarter FRONT-RIGHT view (front grille + hood + side visible from a low cool angle). The truck is dominant. Headlights glowing.

FORD LOGO REQUIRED — render the iconic FORD oval emblem (blue oval badge with the cursive "Ford" wordmark in white) prominently in the CENTER of the truck's front GRILLE — clean, clearly visible. This is the only real-world branding allowed. NO dealership text, NO "Chicago Motor Cars," NO plates.

CHARACTER PLACEMENT — NO CHARACTERS ON THE TRUCK ITSELF. Do NOT place any character on the hood, roof, windshield, bed, or any other part of the vehicle. All 10 Muha fruit-drama characters (ONE instance of each: Aloha Passion Rush, Arctic Blueberry, Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum) are posed ON THE GROUND around the truck:
- Some standing in FRONT of the truck (closer to camera than the front bumper)
- Some standing TO THE SIDES of the truck (next to the wheels / doors at ground level)
- Some standing slightly BEHIND, peeking out
- A few can be in a slight tier closer to camera — kneeling, sitting on a small curb suggestion, or in dynamic standing poses
- All characters maintain their locked design from the references
- The truck remains the dominant element; the cast is supporting around it on the ground

HERO TEXT — chunky 3D vintage-Vegas display lettering: "MUHA MEMBERS GIVEAWAY" in golden-yellow with subtle 3D bevel, deep magenta-purple drop shadow, cream/white outline. Two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom slightly larger). Place in the upper portion. Subtitle "WIN A FORD F-150 XLT" in cream beneath. Spell-check: M-U-H-A is four letters M, U, H, A — verify exact spelling. Same typography style as the other v4/v5 variations in the set.

LAYOUT — Inner sticker area 1866 x 762 px contains all hero artwork (truck, cast, hero text). An ORNATE GOLD ART-DECO TICKET BORDER traces the boundary of the inner sticker zone. The OUTER MARGIN (~91px L/R, ~131px T/B between gold border and canvas edge) is deep midnight-navy-purple with faint gold pinstripes — identical card-body treatment as the other v4/v5 variations.

STYLE — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. Truck rendered in Pixar 3D animated style matching the character world.

PALETTE — Miami-neon Vegas strip: deep midnight navy + hot magenta + electric teal neon haze, faint blurred neon-shape suggestions in deep background (no readable signage text), volumetric light beams. NO Christmas red. NO holiday crimson.

NEGATIVE — do NOT place any character on the truck (no hood, no roof, no bed, no windshield, no fender). Do NOT use Christmas red. Do NOT include dealership text. Do NOT misspell MUHA. Do NOT duplicate any character. Do NOT include any "ADMIT ONE" stub. Hero artwork must stay inside the inner sticker zone.`;

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

console.log("Generating C-truck-hero-v6 (no chars on hood)...");
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
const outPath = `${outDir}/${stamp}_muha-raffle-C-truck-hero-v6.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
