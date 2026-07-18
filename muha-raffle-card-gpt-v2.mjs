#!/usr/bin/env node
// gpt-image-2 — Muha Members Giveaway raffle card v2 — locked C-style typography + ticket borders across all 3
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

const LOCKED_TYPOGRAPHY = `LOCKED HERO TYPOGRAPHY (constant across all variations) — the hero text "MUHA MEMBERS GIVEAWAY" rendered in chunky 3D vintage-Vegas display lettering: rich golden-yellow fill with subtle 3D bevel and inner-shine, thick deep-red drop shadow behind each letter, slight cream/white outline for pop. Vintage casino-jackpot energy. Tightly kerned, two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom — slightly larger), centered or positioned per the variation's layout. Subtitle text in cream / off-white serif or chunky display lettering. ALL text must be perfectly spelled, exact letterforms. This is the same hero typography style as variation C — apply identically across A, B, and C.`;

const LOCKED_BORDER = `LOCKED TICKET-CARD BORDER (constant across all variations) — a stylized vintage raffle-ticket border framing the entire canvas: ornate GOLD-FOIL corner flourishes (Art-Deco / Vegas-jackpot motif) in all four corners, a thin gold inner-rule outlining the full edge of the card just inside the canvas margin, and small starburst or scrollwork accents at the midpoints of the top and bottom edges. Rich premium feel — like a real raffle/lottery ticket. Same border treatment on A, B, and C.`;

const SHARED_STYLE = `STYLE LOCK — every element rendered in UNIFIED PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style, matching the locked design of the 10 character references. Not photoreal, not live-action. All characters, props, and environment are stylized animated. Each character must remain visually recognizable from their reference image (same head fruit, same outfit, same personality cues).

${LOCKED_TYPOGRAPHY}

${LOCKED_BORDER}

CHARACTER ROSTER — exactly ONE instance of EACH of the 10 characters: Aloha Passion Rush, Arctic Blueberry, Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum. NO duplicates — Aloha appears only ONCE, every other character appears only ONCE. All 10 distinct characters present, no extras, no duplicates, no missing.

PRINT FORMAT — artwork for a tiny RAFFLE CARD (90mm x 43mm physical print, 2:1 wide landscape). Composition must read clearly at small print size. Hero text is the focal point.

NEGATIVE — do NOT add any real-world brand logos (no Ford emblems, no "Chicago Motor Cars" text, no real automotive branding, no real-life logos other than the "MUHA MEMBERS GIVEAWAY" lettering we want). Do NOT include phone numbers, dates, URLs, QR codes, or barcodes. Do NOT misspell anything. Do NOT lose any character's locked design. Do NOT duplicate any character (especially Aloha — exactly one Aloha in the frame). Do NOT include an "ADMIT ONE" ticket stub on the right edge — the entire canvas is one unified hero panel framed by the locked ticket border.`;

const VARIATIONS = [
  {
    label: "A-characters-only-v2",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A (CHARACTERS ONLY, no vehicle).

A wide 2:1 landscape raffle card featuring exactly the 10 Muha fruit-drama characters from the reference images — ONE INSTANCE OF EACH, no duplicates. The cast clusters together in a hero ensemble layout, posing energetically — some leaning in, some peeking out, some on a slight tier — like an animated movie poster cast lineup. No truck, no vehicle.

HERO TEXT — the locked "MUHA MEMBERS GIVEAWAY" hero typography (gold-on-red Vegas style, see locked-style) centered in the design. Beneath it a subtitle in cream reading "ENTER TO WIN" in matching style.

LAYOUT — characters frame the left and right sides, hero typography stacked in the middle. OR cast across the bottom 60-65% with text taking the upper 35-40%. Use whichever flows best as a wide 2:1 hero card with locked ticket border.

BACKGROUND — rich vintage-casino warm color palette: deep crimson red + golden glow + cream + accents of watermelon pink and tropical orange. Sparkles and floating confetti. Atmospheric haze. Vegas-jackpot warmth.

${SHARED_STYLE}`,
  },
  {
    label: "B-characters-and-truck-v2",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN B (CHARACTERS + TRUCK, with ticket borders).

A wide 2:1 landscape raffle card with exactly the 10 Muha fruit-drama characters from the reference images (ONE INSTANCE OF EACH, no duplicates) posed in/around the BLACK FORD F-150 PICKUP TRUCK from the truck reference. Tailgate down, characters arranged together in the truck bed and around it as a hero cast ensemble. Strip all real-world branding from the truck (no Ford emblem text, no dealership text, no "Chicago Motor Cars", no license-plate text). The truck is rendered in PIXAR-3D animated style.

HERO TEXT — the locked "MUHA MEMBERS GIVEAWAY" hero typography (gold-on-red Vegas style, see locked-style) positioned prominently in the upper portion of the design — above or beside the truck. Beneath it a subtitle in cream reading "WIN THE TRUCK" in matching style.

LAYOUT — truck and cast occupy the lower 60-70% of the canvas, hero text spans the upper 30-40%. The locked ticket border frames the entire canvas.

BACKGROUND — vibrant Pixar-style golden-hour outdoor scene with palm trees blurred in the distance, warm sunset gradient sky, soft bokeh, dust particles. Hero-poster lighting.

${SHARED_STYLE}`,
  },
  {
    label: "C-freestyle-no-stub-v2",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C (FREESTYLE — SINGLE-PANEL VINTAGE-RAFFLE-POSTER, NO STUB).

A wide 2:1 landscape raffle card styled as a vintage casino / lottery hero poster — but as ONE UNIFIED FULL-WIDTH PANEL framed by the locked ornate ticket border. Do NOT split the design into a hero panel + a separate "ADMIT ONE" stub on the right. The whole canvas is one unified hero scene.

INSIDE THE BORDER — a cinematic ensemble shot of exactly the 10 Muha fruit-drama characters from the reference images (ONE INSTANCE OF EACH, no duplicates) arranged dynamically around the black PIXAR-3D pickup truck from the truck reference (tailgate down, cast posing in/around the truck bed). Strip all real-world branding from the truck. Strong cinematic hero-poster composition.

HERO TEXT — the locked "MUHA MEMBERS GIVEAWAY" hero typography (gold-on-red Vegas style, see locked-style) prominently placed in the upper portion of the design. Beneath it a subtitle in cream reading "GRAND PRIZE DRAWING" in matching style.

COLOR PALETTE — rich vintage Vegas / Miami-neon warmth: deep crimson red + golden yellow + cream + accents of watermelon pink and tropical orange. Warm dramatic hero-poster lighting.

BACKGROUND inside the border — Pixar-stylized warm sunset / neon-Miami atmosphere behind the cast and truck. Sparkles, confetti, palm-tree silhouettes blurred in the deep background.

LAYOUT — one full-width hero panel, no stub on the right, framed all-around by the locked ticket border with gold corner flourishes.

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
  const includeTruck = !v.label.startsWith("A-");
  console.log(`Generating ${v.label}${includeTruck ? " (with truck)" : ""}...`);
  const form = buildForm(v.prompt, includeTruck);
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
