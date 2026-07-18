#!/usr/bin/env node
// gpt-image-2 — Muha Members Giveaway raffle card, 3 design variations at 2048x1024 (~577 DPI for 90mm x 43mm card).
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

const SHARED_STYLE = `STYLE LOCK — every element rendered in UNIFIED PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style, matching the locked design of the 10 character references. Not photoreal, not live-action. All characters, props, and environment elements are stylized animated. Each character must remain visually recognizable from their reference image (same head fruit, same outfit, same personality cues).

TYPOGRAPHY — bold modern chunky 3D display lettering, integrated cleanly into the design (not just slapped on flat). Easy-to-read at a glance even at a small raffle-card size. Text must be perfectly spelled — exact letterforms, no garbled or invented words.

PRINT FORMAT — this is artwork for a tiny RAFFLE CARD (90mm x 43mm physical print size, 2:1 wide landscape). Composition must read clearly at small size. Hero text is the focal point. Cast should fit gracefully in the space without crowding the text.

NEGATIVE — do NOT add any real-world brand logos (no Ford emblems, no "Chicago Motor Cars" text, no real automotive branding, no real-life logos of any kind beyond the Muha Members text we want). Do NOT include phone numbers, dates, URLs, QR codes, or barcodes. Do NOT misspell anything. Do NOT lose any character's locked design.`;

const VARIATIONS = [
  {
    label: "A-characters-only",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A (CHARACTERS ONLY).

A wide 2:1 landscape raffle card design featuring ALL TEN of the Muha fruit-drama characters from the reference images, arranged in a dynamic ensemble group portrait WITHOUT any vehicle. The cast clusters together in a hero-poster layout, posing energetically — some leaning in, some peeking out, some on a slightly elevated tier — like the cast of an animated movie poster.

HERO TEXT — large bold chunky 3D display headline reading exactly "MUHA MEMBERS GIVEAWAY" placed prominently in the design. Use rich vibrant typography in a bright color (golden yellow or hot magenta-pink) with subtle 3D bevel, deep drop shadow, slight outline. Beneath it, a smaller subtitle line reading "ENTER TO WIN" in a complementary color. The typography is the focal point — characters frame around it.

LAYOUT — characters occupy left and right halves of the frame, hero typography centered between them. OR characters across the bottom third with hero text taking the top two-thirds. Use whichever flows best as a wide 2:1 hero card.

BACKGROUND — vibrant Pixar-style sunset / golden-hour gradient sky (warm pink/orange/purple) with subtle floating sparkles and confetti, soft bokeh. Joyful celebratory mood. Maybe a hint of palm tree silhouettes blurred in deep background.

LIGHTING — bright cinematic hero-poster lighting from the front, warm rim light, glow effects around the typography.

${SHARED_STYLE}`,
  },
  {
    label: "B-characters-and-truck",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN B (CHARACTERS + TRUCK).

A wide 2:1 landscape raffle card design with ALL TEN Muha fruit-drama characters (from the reference images) posed in/around the BLACK FORD F-150 PICKUP TRUCK from the truck reference. Tailgate down, characters arranged together in the truck bed and around it — like a hero cast group photo. Strip all real-world branding from the truck (no Ford emblem text, no dealership text, no "Chicago Motor Cars," no license-plate text).

HERO TEXT — large bold chunky 3D display headline reading exactly "MUHA MEMBERS GIVEAWAY" placed prominently in the upper portion of the design (above or beside the truck). Use rich vibrant typography in golden yellow or bright pink with 3D bevel, drop shadow, outline. Beneath it, a smaller subtitle line reading "WIN THE TRUCK" or "ENTER TO WIN" in a complementary color.

LAYOUT — truck and cast across the lower 60-70% of the frame, hero text across the upper 30-40%. The truck is rendered in PIXAR-3D animated style (NOT photoreal), matching the character world.

BACKGROUND — vibrant Pixar-style golden-hour outdoor scene — warm sunset sky, palm trees, soft bokeh, dust particles in the air. Hero-poster lighting.

LIGHTING — warm cinematic golden-hour key light, soft pink rim, dramatic hero-poster glow.

${SHARED_STYLE}`,
  },
  {
    label: "C-freestyle-ticket",
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C (FREESTYLE — VINTAGE-RAFFLE-TICKET MEETS PIXAR HERO POSTER).

A wide 2:1 landscape raffle card design styled as a STYLIZED VINTAGE RAFFLE TICKET — with ornate gold-foil corner flourishes, an "ADMIT ONE" / "GRAND PRIZE" feel, decorative ticket-style borders, and a faux PERFORATION DOTTED LINE running vertically about 8mm from the right edge to suggest a peel-off / tear-off coupon portion.

LEFT MAIN PANEL (about 75% of the width) — the hero design: a tight cinematic ensemble shot of the 10 Muha fruit-drama characters from the reference images, arranged dynamically around the black PIXAR-3D pickup truck from the truck reference (tailgate down, characters posing in/around the truck bed). HERO TEXT in big bold chunky 3D letters across the upper portion reads exactly "MUHA MEMBERS GIVEAWAY" in rich golden yellow with deep red drop shadow and slight 3D bevel — vintage casino / Vegas raffle aesthetic. Smaller subtitle below it: "GRAND PRIZE DRAWING" in cream white.

RIGHT TICKET STUB (about 25% of the width, separated by a faux perforation line) — a vertically-oriented stub with: ornate gold corner flourishes, a stylized starburst, the text "ADMIT ONE" stacked vertically in bold serif gold letters, and a small "MUHA" wordmark at the bottom of the stub (stylized custom lettering, not a real logo). The stub has a slightly different darker / parchment background tone to differentiate it from the hero panel.

COLOR PALETTE — rich vintage-Vegas vibe: deep crimson red + golden yellow + cream + accents of watermelon pink and tropical orange. Warm dramatic lighting.

BACKGROUND — Pixar-stylized warm golden-hour or neon-Miami atmosphere behind the hero scene. Sparkles, confetti, a hint of palm trees, atmospheric haze.

LAYOUT — hero panel left, stub right, perforation line clearly suggested.

Bring the playful Muha fruit-drama Pixar cast energy together with classic raffle-ticket / casino-jackpot graphic design language for a card that feels FUN and PREMIUM and PRINT-WORTHY.

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
  const includeTruck = v.label !== "A-characters-only";
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
