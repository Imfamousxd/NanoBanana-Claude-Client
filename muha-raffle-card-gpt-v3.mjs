#!/usr/bin/env node
// gpt-image-2 — Muha Members Giveaway raffle card v3
// Canvas 2048x1024 = 90mm x 43mm full card. Ticket border traces the 82x32mm peel-sticker
// boundary (≈1866x762 inner rectangle), centered, with ~91px L/R + ~131px T/B outer margin
// filled with complementary decoration.
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

const LOCKED_TYPOGRAPHY = `LOCKED HERO TYPOGRAPHY — the hero text "MUHA MEMBERS GIVEAWAY" rendered in chunky 3D vintage-Vegas display lettering: rich golden-yellow fill with subtle 3D bevel and inner-shine, thick deep-red drop shadow behind each letter, slight cream/white outline for pop. Vintage casino-jackpot energy. Two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom — slightly larger). Subtitle text in cream / off-white display lettering. ALL text must be perfectly spelled, exact letterforms — confirm "MUHA" is M-U-H-A (not "MWHA" or any garbled variant). Identical hero typography style across A, B, C, D.`;

const LOCKED_BORDER = `LOCKED TICKET-CARD BORDER LAYOUT — VERY IMPORTANT, applies consistently to all variations:
- The full canvas is 2048 x 1024 pixels (representing the full 90mm x 43mm raffle card).
- The ORNATE GOLD TICKET BORDER (Art-Deco / Vegas-jackpot flourishes — corner ornaments, fine gold inner rule, small starburst accents at midpoints of each edge) sits along the boundary of the INNER 82mm x 32mm PEELABLE STICKER area, which is approximately 1866 x 762 pixels, centered in the canvas. So the border is inset roughly 91 pixels from the left/right edges of the canvas, and roughly 131 pixels from the top/bottom edges.
- The OUTER MARGIN (the ~91px ring on left/right and ~131px ring on top/bottom, between the border and the canvas edge) is filled with a complementary decorative treatment: a subtle warm dark crimson + gold ornamental pattern, faint repeating Muha-themed motifs (small fruit-icon dots or pinstripes), or a clean solid deep crimson with small gold corner micro-flourishes — this is the "card body around the peel-off sticker." It should read as a different layer from the inner hero scene but still feel cohesive.
- The HERO ARTWORK (cast + text + scene) lives INSIDE the inner border (inside the peel-off sticker zone).
- Border placement and weight must be identical across all variations — consistent border treatment is locked.`;

const SHARED_STYLE = `STYLE LOCK — every element rendered in UNIFIED PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style, matching the locked design of the 10 character references. Not photoreal, not live-action. All characters, props, and environment are stylized animated. Each character must remain visually recognizable from their reference image.

${LOCKED_TYPOGRAPHY}

${LOCKED_BORDER}

CHARACTER ROSTER — exactly ONE instance of EACH of the 10 characters: Aloha Passion Rush, Arctic Blueberry, Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum. NO duplicates — every character appears exactly ONCE. All 10 distinct characters present.

NEGATIVE — do NOT add any real-world brand logos (no Ford emblems, no "Chicago Motor Cars" text, no real automotive branding). Do NOT include phone numbers, dates, URLs, barcodes. Do NOT misspell anything — verify "MUHA MEMBERS GIVEAWAY" is exactly spelled correctly. Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub on the right edge.`;

const VARIATIONS = [
  {
    label: "A-characters-only-v3",
    includeTruck: false,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A (CHARACTERS ONLY, no vehicle).

INSIDE THE INNER STICKER BORDER (the 82x32mm peel-off zone): a wide cinematic ensemble of all 10 Muha fruit-drama characters from the reference images, ONE instance of each, posed together in a dynamic hero lineup — some leaning in, some peeking around, in a tiered cast-group arrangement. No truck, no vehicle. Hero text "MUHA MEMBERS GIVEAWAY" stacked center with subtitle "ENTER TO WIN" in cream beneath.

OUTSIDE THE INNER BORDER (the card body around the sticker): subtle deep crimson background with faint gold ornamental pinstripes / small fruit-icon motifs as the card body around the peel-sticker zone.

BACKGROUND inside the border — rich vintage casino warmth: deep crimson red + golden glow + cream, sparkles and floating confetti, atmospheric haze.

${SHARED_STYLE}`,
  },
  {
    label: "B-characters-and-truck-v3",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN B (CAST + TRUCK IN BACK).

INSIDE THE INNER STICKER BORDER: all 10 Muha fruit-drama characters from the reference images, ONE instance of each, posed in/around the BLACK FORD F-150 PICKUP TRUCK from the truck reference. Tailgate down, cast arranged across the truck bed as an ensemble group portrait. Strip all real-world branding from the truck (no Ford emblem text, no dealership text, no plates). Truck rendered in PIXAR 3D animated style.

Hero text "MUHA MEMBERS GIVEAWAY" stacked in the upper-left or upper portion with subtitle "WIN THE TRUCK" in cream.

OUTSIDE THE INNER BORDER: subtle deep crimson card body with faint gold ornamental pinstripes / small fruit-icon motifs around the sticker zone.

BACKGROUND inside the border — vibrant Pixar golden-hour sunset, palm trees blurred in the distance, soft bokeh, warm cinematic atmosphere.

${SHARED_STYLE}`,
  },
  {
    label: "C-truck-hero-v3",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C (TRUCK-HERO, DYNAMIC CAR-FOCUSED SHOT — UNIQUE FROM B).

INSIDE THE INNER STICKER BORDER: a DRAMATIC HERO PORTRAIT of the BLACK FORD F-150 PICKUP TRUCK from the truck reference as the visual STAR of the scene — the truck takes center stage, larger and more visually dominant than in design B. Use a fresh angle: a THREE-QUARTER FRONT-VIEW HERO SHOT of the truck (looking at the truck from the front-right angle, headlights forward) so you can see the grille / hood / front + side — NOT the back/tailgate view used in design B. The truck is rendered in PIXAR-3D animated style, the headlights glowing, parked slightly tilted as if just rolled up — confident hero-car energy. Strip all real-world branding (no Ford emblems, no dealership text, no plates).

The 10 Muha fruit-drama characters (ONE instance of each) are arranged dynamically AROUND the truck — some perched on the hood, some leaning against the side, some standing in front in cool poses, some peeking out from behind. The truck remains the dominant element with the cast acting as supporting players.

Hero text "MUHA MEMBERS GIVEAWAY" stacked in the upper portion with subtitle "WIN THIS TRUCK" in cream.

OUTSIDE THE INNER BORDER: matching deep crimson card body with faint gold ornamental pinstripes / small fruit-icon motifs.

BACKGROUND inside the border — high-octane Miami neon sunset / Vegas strip glow palette: deep magenta, hot pink, neon teal, with stylized neon-light signage shapes blurred in the deep background (no readable text). Light volumetric beams catching the truck's glossy paint. Action-poster energy.

${SHARED_STYLE}`,
  },
  {
    label: "D-with-qr-v3",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN D (CAST + TRUCK + QR CODE PANEL ON RIGHT).

INSIDE THE INNER STICKER BORDER: the design is split into two zones:

- LEFT ZONE (approximately 70% of the inner-border width): a cinematic ensemble of all 10 Muha fruit-drama characters (ONE instance of each) posed in/around the BLACK FORD F-150 PICKUP TRUCK from the truck reference — tailgate-down hero group shot, similar energy to design B. Hero text "MUHA MEMBERS GIVEAWAY" in the locked gold-on-red Vegas typography sits in the upper portion of this left zone, with subtitle "WIN THE TRUCK" in cream below it.

- RIGHT ZONE (approximately 30% of the inner-border width): a dedicated QR CODE PANEL with a deep crimson + gold inner background. The panel contains:
  • A large square QR CODE placeholder (a stylized realistic-looking square QR code pattern — black-and-white square pixels in a recognizable QR layout — does NOT need to encode anything real, just visually look like a believable QR code, centered in the upper portion of the panel)
  • Beneath the QR code: stacked text reading "SCAN" (large) then "TO ENTER" (smaller) in chunky cream / gold display lettering matching the hero typography style
  • Small gold ornament accents around the panel edges

A thin gold vertical divider line separates the LEFT zone from the QR panel.

OUTSIDE THE INNER BORDER: matching deep crimson card body with faint gold ornamental pinstripes / small fruit-icon motifs.

BACKGROUND inside the LEFT zone — Pixar golden-hour sunset with palm trees blurred behind the truck.

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
