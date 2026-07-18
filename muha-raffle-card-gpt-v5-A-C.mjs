#!/usr/bin/env node
// gpt-image-2 — Muha raffle card v5: targeted re-rolls of A and C only.
// A: drop "ENTER TO WIN" subtitle, give Horchata a clear prominent placement
// C: add Ford oval logo on the grille, move Frosted Mint Cookies off the hood
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

const LOCKED_PALETTE = `LOCKED COLOR PALETTE — Miami-neon / Vegas-strip luxe nightlife: deep MIDNIGHT NAVY-PURPLE base, vibrant HOT MAGENTA / electric PINK accents, electric TEAL / CYAN glow notes, rich GOLD typography and ornamentation. Absolutely NO Christmas red, NO holiday-festive crimson. Premium nightlife / vape-brand / Y2K-cool. Identical palette to the other v4 variations (B tailgate and D QR).`;

const LOCKED_TYPOGRAPHY = `LOCKED HERO TYPOGRAPHY — headline "MUHA MEMBERS GIVEAWAY" in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel, thick deep magenta-purple drop shadow, slight cream/white outline. Two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom slightly larger). Subtitle text (where present) in cream / off-white display lettering matching the hero style.

CRITICAL SPELLING — confirm "MUHA MEMBERS GIVEAWAY" is exactly spelled M-U-H-A space M-E-M-B-E-R-S space G-I-V-E-A-W-A-Y. Verify each letter shape. No typos. Same identical typography style as the other v4 variations.`;

const LOCKED_LAYOUT = `LOCKED LAYOUT — Canvas 2048 x 1024 pixels = full 90mm x 43mm raffle card.
- INNER PEEL-OFF STICKER AREA: 82mm x 32mm ≈ 1866 x 762 pixels, centered. Leaves ~91 px L/R margin and ~131 px T/B margin.
- All hero artwork (characters, truck where present, hero text, subtitle, scene background) MUST be FULLY CONTAINED INSIDE the inner 1866 x 762 sticker area. Allow a ~30-40px safe-zone inset inside the inner border.
- An ORNATE GOLD ART-DECO TICKET BORDER (corner flourishes, fine gold inner rule, small starburst accents at midpoints) traces the BOUNDARY of the inner sticker area.
- The OUTER MARGIN (~91px L/R, ~131px T/B between gold border and canvas edge) is deep midnight-navy-purple with faint gold ornamental pinstripes — same treatment as v4 B and D for consistency.`;

const SHARED_STYLE = `STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style, matching the locked design of the 10 character references. Not photoreal, not live-action.

${LOCKED_PALETTE}

${LOCKED_TYPOGRAPHY}

${LOCKED_LAYOUT}

CHARACTER ROSTER — exactly ONE instance of EACH of the 10 characters. NO duplicates, all 10 distinct.

NEGATIVE — do NOT use Christmas red. Do NOT include "Chicago Motor Cars" text or dealership signage, no plates. Do NOT include phone numbers / dates / URLs / barcodes. Do NOT misspell "MUHA" (M-U-H-A four letters). Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub. Hero artwork must NOT bleed into the outer margin.`;

const VARIATIONS = [
  {
    label: "A-characters-only-v5",
    includeTruck: false,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A v5 (CHARACTERS ONLY, no vehicle).

INSIDE THE INNER STICKER AREA: a wide cinematic ensemble of all 10 Muha fruit-drama characters from the reference images, ONE instance of each, arranged in a balanced HERO LINEUP. Each character occupies a clear, deliberate position in the composition with breathing room around them — none awkwardly cropped, none half-hidden behind another. Pose them on a faint suggested ground line / tier so the composition feels confident and posed, like an animated film's cast group portrait.

HORCHATA PLACEMENT — Horchata (the flamenco-dancer woman with the creamy cinnamon-swirl head, cinnamon-stick curls + red rose, plain red flamenco dress, mid-flamenco arm-up pose) must be placed in a CLEAR, PROMINENT spot in the lineup — not at the very bottom, not cropped, not crowded between other characters. Either place her in the FRONT-CENTER hero spot OR cleanly to the left of the typography in a feature position where her full upper body and her raised flamenco arm are clearly visible and uncluttered.

HERO TEXT — locked "MUHA MEMBERS GIVEAWAY" typography centered. NO SUBTITLE — do NOT include any "ENTER TO WIN" or other secondary text. Just the hero headline alone.

BACKGROUND inside the inner area — Miami-neon glow palette: deep midnight navy-purple gradient with hot magenta + electric teal light bursts, floating sparkles, atmospheric haze. No red.

${SHARED_STYLE}`,
  },
  {
    label: "C-truck-hero-v5",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C v5 (TRUCK-HERO with Ford logo).

INSIDE THE INNER STICKER AREA: a dramatic HERO PORTRAIT of the BLACK FORD F-150 XLT pickup truck from the truck reference as the STAR of the scene — three-quarter FRONT-RIGHT view (looking at the front grille + hood + side from a low cool angle). The truck is dominant. Headlights glowing.

FORD LOGO REQUIRED — render the iconic FORD oval emblem (a blue oval badge with the cursive "Ford" wordmark) prominently in the CENTER of the truck's front GRILLE — clean, clearly visible, the well-known Ford oval shape and color (blue oval, white "Ford" cursive script inside). This is the only real-world branding allowed in this design. NO other dealership text, NO "Chicago Motor Cars," NO plates.

The 10 Muha fruit-drama characters (ONE instance of each) are arranged dynamically AROUND the truck. KEY PLACEMENT RULE — FROSTED MINT COOKIES (the bashful character with the cookie-textured head and shy sweet expression) must be placed STANDING TO ONE SIDE of the truck on the ground (next to the front wheel or just in front of the bumper, demure pose) — she is NOT on the truck's hood, NOT on the roof, NOT standing on any part of the truck. The hood is occupied by other characters (Watermelon Bubblegum and/or Galactic Diesel are good candidates to pose on the hood instead). Move her away from the hood entirely.

HERO TEXT — locked typography "MUHA MEMBERS GIVEAWAY" in the upper portion, subtitle "WIN A FORD F-150 XLT" in cream beneath.

BACKGROUND inside the inner area — Miami-neon Vegas strip: deep midnight navy + hot magenta + electric teal neon haze, faint blurred neon-shape suggestions in the deep background (no readable signage text), volumetric light beams. No red.

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
