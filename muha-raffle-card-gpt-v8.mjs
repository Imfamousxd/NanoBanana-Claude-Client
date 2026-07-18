#!/usr/bin/env node
// gpt-image-2 — Muha raffle card v8 — re-run with updated cast (Blueberry chad, Pomegranate buff, Mango laughing class-clown)
// Recipes preserved from the finalized v5/v4/v7/v4 set:
//   A — characters only, no subtitle
//   B — tailgate (cast in truck bed)
//   C — truck-hero (front-three-quarter, Galactic back-layer, no chars on truck, Ford logo)
//   D — QR panel on right
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

const LOCKED_PALETTE = `LOCKED COLOR PALETTE (constant across all 4 variations) — Miami-neon / Vegas-strip luxe nightlife: deep MIDNIGHT NAVY-PURPLE base, vibrant HOT MAGENTA / electric PINK accents, electric TEAL / CYAN glow notes, rich GOLD typography and ornamentation. NO Christmas red, NO holiday crimson.`;

const LOCKED_TYPOGRAPHY = `LOCKED HERO TYPOGRAPHY — headline "MUHA MEMBERS GIVEAWAY" in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel, thick deep magenta-purple drop shadow, slight cream/white outline. Two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom slightly larger). Subtitle (where present) in cream/off-white matching display lettering.

SPELLING CHECK — "MUHA" is exactly M-U-H-A (four letters: M, U, H, A). Verify each letter individually. No typos like MUIHA, MWHA, MUUHA, MUHIA. Triple-check.

Same identical typography style across A, B, C, D.`;

const LOCKED_LAYOUT = `LOCKED LAYOUT — Canvas 2048 x 1024 pixels = full 90mm x 43mm raffle card.
- INNER PEEL-OFF STICKER AREA: 82mm x 32mm ≈ 1866 x 762 pixels, centered. Leaves ~91 px L/R margin and ~131 px T/B margin.
- ALL hero artwork (characters, truck if present, hero text, subtitle, QR panel D-only, scene background) is FULLY CONTAINED INSIDE the inner 1866 x 762 sticker area, with a ~30-40px safe-zone inset.
- An ORNATE GOLD ART-DECO TICKET BORDER (corner flourishes, fine gold inner rule, starburst midpoint accents) traces the boundary of the inner sticker area.
- OUTER MARGIN (~91px L/R, ~131px T/B between gold border and canvas edge) is deep midnight-navy-purple with faint gold ornamental pinstripes / micro-dots. Identical card-body treatment across all 4.`;

const SHARED_STYLE = `STYLE LOCK — UNIFIED PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. Match the new locked design of the 10 character references (note that Arctic Blueberry is now a chill smooth-talker chad in an unbuttoned blue button-up, Frozen Pomegranate is now a hyper-buff red-skinned gym-bro in a red muscle tank, Guava Mango is now a laughing class-clown guy with a half-mango-yellow/half-guava-green head). Not photoreal. Hands are PIXAR-CARTOON hands. Clothes are PIXAR-CARTOON clothes.

${LOCKED_PALETTE}

${LOCKED_TYPOGRAPHY}

${LOCKED_LAYOUT}

CHARACTER ROSTER — exactly ONE instance of EACH of the 10 characters: Aloha Passion Rush, Arctic Blueberry (chad smooth-talker), Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate (buff gym-bro), Galactic Diesel, Guava Mango (laughing class-clown), Horchata, Lemon Cherry Fizz, Watermelon Bubblegum. NO duplicates. Render each per their updated reference image.

NEGATIVE — do NOT use Christmas red. Do NOT add Ford emblems on truck body (except where explicitly required for C). Do NOT include phone numbers / dates / URLs / barcodes / dealership signage. Do NOT misspell MUHA. Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub. Hero artwork must NOT bleed into the outer margin.`;

const VARIATIONS = [
  {
    label: "A-characters-only-v8",
    includeTruck: false,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A v8 (CHARACTERS ONLY, no vehicle, no subtitle).

INSIDE THE INNER STICKER AREA: cinematic ensemble of all 10 Muha fruit-drama characters from the (updated) reference images, ONE instance of each, in a hero lineup — each character clearly visible and uncluttered, balanced left-to-right composition. Horchata gets a prominent feature spot (front-and-center or clean left-feature) with her flamenco arm-raised pose fully visible.

HERO TEXT — locked "MUHA MEMBERS GIVEAWAY" typography. NO SUBTITLE — only the hero headline, no "ENTER TO WIN" or any secondary line.

BACKGROUND inside the inner area — Miami-neon glow: deep midnight navy-purple gradient with hot magenta + electric teal light bursts, floating sparkles, atmospheric haze. No red.

${SHARED_STYLE}`,
  },
  {
    label: "B-tailgate-v8",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN B v8 (TAILGATE — cast in the truck bed).

INSIDE THE INNER STICKER AREA: all 10 characters posed IN the open truck bed of the BLACK FORD F-150 XLT pickup truck. TAILGATE DOWN, three-quarter rear view — you can see the tailgate, bed full of characters, rear lights, rear bumper. The truck must be CLEARLY VISIBLE and recognizable. Strip Ford emblem text + dealership text from the truck body. Truck rendered in PIXAR 3D animated style.

HERO TEXT — locked typography "MUHA MEMBERS GIVEAWAY" in upper portion, subtitle "WIN A FORD F-150 XLT" in cream beneath.

BACKGROUND — Miami-neon golden-hour Vegas strip: deep navy-purple sky with hot magenta + electric teal sunset glow, palm trees blurred in distance, atmospheric particles. No red.

${SHARED_STYLE}`,
  },
  {
    label: "C-truck-hero-v8",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C v8 (TRUCK-HERO with Ford logo, no chars on truck, Galactic back-layer).

INSIDE THE INNER STICKER AREA: dramatic HERO PORTRAIT of the BLACK FORD F-150 XLT pickup truck — three-quarter FRONT-RIGHT view (grille + hood + side from a low cool angle), headlights glowing. Truck is dominant.

FORD LOGO REQUIRED — render the iconic FORD oval emblem (blue oval badge with cursive "Ford" wordmark in white) in the CENTER of the truck's front GRILLE, clean and clearly visible. This is the only real-world branding allowed.

CHARACTER PLACEMENT — NO CHARACTERS ON THE TRUCK ITSELF (no hood, roof, bed, windshield). All 10 characters posed ON THE GROUND around the truck — standing in front, beside, and slightly behind in dynamic poses.

GALACTIC DIESEL LAYER — Galactic Diesel is the FURTHEST-BACK character in the composition. Behind the others, partially obscured, peeking from the deepest layer. He appears smaller / further from camera. All other 9 characters are in front of him.

HERO TEXT — locked typography "MUHA MEMBERS GIVEAWAY" in upper portion, subtitle "WIN A FORD F-150 XLT" in cream beneath.

BACKGROUND — Miami-neon Vegas strip: deep midnight navy + hot magenta + electric teal neon haze, blurred neon-shape suggestions in deep background (no readable signage text), volumetric light beams. No red.

${SHARED_STYLE}`,
  },
  {
    label: "D-with-qr-v8",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN D v8 (CAST + TRUCK + QR PANEL on right).

INSIDE THE INNER STICKER AREA, split:

LEFT ZONE (~70% width): ensemble of all 10 characters posed in/around the BLACK FORD F-150 XLT (tailgate down, cast in the bed and around it). Truck CLEARLY VISIBLE. Strip Ford emblem / dealership text. Locked typography "MUHA MEMBERS GIVEAWAY" in upper portion of left zone, subtitle "WIN A FORD F-150 XLT" in cream below.

RIGHT ZONE (~30% width): QR CODE PANEL with darker midnight-navy + gold-accent background. Contains:
- Large square QR CODE in the upper-middle (visually believable square QR pattern with corner finder squares — doesn't need to encode anything real, just look like a clean QR)
- Stacked beneath: "SCAN" (large) above "TO ENTER" (smaller) in chunky cream / gold display lettering matching hero typography
- Thin gold vertical divider line between left zone and QR panel
- Small gold ornament accents around the panel edges

BACKGROUND inside the LEFT zone — Miami-neon: deep navy-purple + hot magenta + electric teal, palm trees blurred. No red.

${SHARED_STYLE}`,
  },
];

const SIZE = "2048x1024";

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

function buildForm(prompt, includeTruck) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  if (includeTruck) {
    const truckBuf = fs.readFileSync(TRUCK_REF);
    form.append("image[]", new Blob([truckBuf], { type: mimeForExt(path.extname(TRUCK_REF)) }), "truck.jpg");
  }
  for (const charFile of CHARACTERS) {
    const p = path.join(CHAR_DIR, charFile);
    const buf = fs.readFileSync(p);
    form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
  }
  return form;
}

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

for (const v of VARIATIONS) {
  console.log(`Generating ${v.label}${v.includeTruck ? " (with truck)" : ""}...`);
  const form = buildForm(v.prompt, v.includeTruck);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} (${v.label}): ${(await res.text()).slice(0, 400)}`);
    continue;
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.label})`); continue; }
  const outPath = `${outDir}/${stamp}_muha-raffle-${v.label}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
