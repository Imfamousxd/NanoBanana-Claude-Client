#!/usr/bin/env node
// gpt-image-2 — Muha Members Giveaway raffle card v4
// Canvas 2048x1024 = full 90mm x 43mm card. Inner border at 82x32mm peel-sticker boundary
// (~1866x762 inner rectangle centered). All hero artwork CONFINED to inner zone; outer
// ~91px L/R + ~131px T/B ring is decorative card body. Miami neon palette (no Christmas red).
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

const LOCKED_PALETTE = `LOCKED COLOR PALETTE (constant across all 4 variations — NOT Christmas red) — Miami-neon / Vegas-strip luxe nightlife palette: deep MIDNIGHT NAVY-PURPLE base, vibrant HOT MAGENTA / electric PINK accents, electric TEAL / CYAN glow notes, rich GOLD typography and ornamentation, hints of CORAL sunset behind any background sky. Absolutely NO Christmas red, NO holiday-festive crimson. The mood is premium nightlife / vape-brand / Y2K-cool. Same palette unifies A, B, C, and D.`;

const LOCKED_TYPOGRAPHY = `LOCKED HERO TYPOGRAPHY (identical on all 4 variations) — the headline "MUHA MEMBERS GIVEAWAY" rendered in chunky 3D vintage-Vegas display lettering: rich golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow behind each letter, slight cream/white outline for pop. Two-line stack ("MUHA MEMBERS" top, "GIVEAWAY" bottom slightly larger). Subtitle text in cream / off-white in matching chunky display lettering.

CRITICAL SPELLING — confirm the hero text reads EXACTLY "MUHA MEMBERS GIVEAWAY" (M-U-H-A, four letters: M, U, H, A — NOT "MUHIA", NOT "MUIHA", NOT "MWHA", NOT "MUUHA"). Verify each letter shape: capital M, then capital U, then capital H, then capital A. Then "MEMBERS" with M-E-M-B-E-R-S. Then "GIVEAWAY" with G-I-V-E-A-W-A-Y. Triple-check spelling — this MUST be correct on every variation. ALL text must be perfectly spelled.

The hero typography is one constant font / treatment across A, B, C, and D — same letterforms, same gold + magenta-shadow + cream-outline style, same weight, same proportions.`;

const LOCKED_LAYOUT = `LOCKED LAYOUT — VERY IMPORTANT, applies consistently to all variations:
- Canvas is 2048 x 1024 pixels = full 90mm x 43mm raffle card.
- The INNER PEEL-OFF STICKER AREA is 82mm x 32mm = approximately 1866 x 762 pixels, centered in the canvas. This leaves a ~91 pixel margin on the LEFT and RIGHT, and ~131 pixel margin on the TOP and BOTTOM.
- The ENTIRE HERO ARTWORK — all character figures, the truck (where present), the hero typography, the subtitle, the QR code (variation D only), and any scene background — must be FULLY CONTAINED INSIDE the inner 1866 x 762 sticker area. Nothing important crosses outside that inner rectangle. Provide a small safe-zone inside (about 30-40px inset from the inner-border) for the actual hero content so nothing crowds the gold frame.
- An ORNATE GOLD ART-DECO TICKET BORDER (corner flourishes, fine gold inner rule, small starburst accents at midpoints) traces the BOUNDARY of the inner 1866 x 762 sticker area.
- The OUTER MARGIN (the ~91px ring on left/right and ~131px ring on top/bottom, between the gold border and the canvas edge) is filled with a subtle decorative card-body treatment: deep midnight-navy-purple background with faint gold ornamental pinstripes or tiny gold dot pattern. This represents the part of the card BEHIND/AROUND the peel-off sticker — visually quiet but premium.
- Border placement, weight, and outer-margin treatment are IDENTICAL across all 4 variations — locked constant.`;

const SHARED_STYLE = `STYLE LOCK — every element rendered in UNIFIED PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style, matching the locked design of the 10 character references. Not photoreal, not live-action. All characters, props, environment all stylized animated. Each character must remain visually recognizable from their reference image.

${LOCKED_PALETTE}

${LOCKED_TYPOGRAPHY}

${LOCKED_LAYOUT}

CHARACTER ROSTER — exactly ONE instance of EACH of the 10 characters: Aloha Passion Rush, Arctic Blueberry, Blue Slushie, Frosted Mint Cookies, Frozen Pomegranate, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum. NO duplicates, all 10 distinct characters.

NEGATIVE — do NOT use Christmas red / festive crimson as the dominant color (use the Miami neon palette). Do NOT add Ford emblems on the truck body, no "Chicago Motor Cars" text, no dealership signage, no plates. Do NOT include phone numbers, dates, URLs, barcodes. Do NOT misspell "MUHA" (check it's M-U-H-A four letters). Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub. Do NOT let hero artwork bleed into the outer margin — keep everything important inside the inner sticker zone.`;

const VARIATIONS = [
  {
    label: "A-characters-only-v4",
    includeTruck: false,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN A (CHARACTERS ONLY, no vehicle).

INSIDE THE INNER STICKER AREA (1866 x 762 px contained zone, ~91px L/R + ~131px T/B clear margin): a wide cinematic ensemble of all 10 Muha fruit-drama characters from the reference images, ONE instance of each, posed together in a dynamic hero lineup — some leaning in, some peeking around, tiered cast-group arrangement. No truck, no vehicle.

HERO TEXT — locked "MUHA MEMBERS GIVEAWAY" hero typography (gold + magenta-shadow + cream outline) centered, with subtitle "ENTER TO WIN" in cream beneath.

BACKGROUND inside the inner area — Miami-neon glow palette: deep midnight-navy-purple gradient with hot magenta + electric teal light bursts and floating sparkles. Atmospheric haze. No red.

${SHARED_STYLE}`,
  },
  {
    label: "B-tailgate-v4",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN B (TAILGATE — cast in the truck bed).

INSIDE THE INNER STICKER AREA: all 10 Muha fruit-drama characters from the references (ONE instance of each) posed IN the open truck bed of the BLACK FORD F-150 XLT pickup truck from the truck reference. TAILGATE IS DOWN. View is from behind/three-quarter rear — you can see the tailgate, the bed full of characters, the rear lights and rear bumper of the truck. The truck must be CLEARLY VISIBLE and recognizable as a Ford F-150 XLT pickup. Strip all real-world branding from the truck body itself (no Ford emblems, no dealership text). Truck rendered in PIXAR 3D animated style.

HERO TEXT — locked typography "MUHA MEMBERS GIVEAWAY" stacked in the upper portion, with subtitle "WIN A FORD F-150 XLT" in cream beneath it. The "FORD F-150 XLT" wording is allowed text on the design (it's the prize being given away).

BACKGROUND inside the inner area — Miami-neon Vegas-strip golden-hour: deep navy-purple sky with hot magenta + electric teal sunset glow, palm trees blurred in deep background, atmospheric particles. No red.

${SHARED_STYLE}`,
  },
  {
    label: "C-truck-hero-v4",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN C (TRUCK-HERO — truck dominant, front-three-quarter view).

INSIDE THE INNER STICKER AREA: a dramatic HERO PORTRAIT of the BLACK FORD F-150 XLT pickup truck from the truck reference as the STAR of the scene. Three-quarter FRONT-RIGHT view of the truck (looking at the front grille + hood + side from a low cool angle) — NOT the rear/tailgate view. The truck is the dominant element, larger than in design B. Headlights glowing. The truck must be CLEARLY VISIBLE and recognizable as a Ford F-150 XLT pickup. Strip Ford emblems and dealership text from the truck body.

The 10 Muha fruit-drama characters (ONE instance of each) are arranged dynamically AROUND and ON the truck — some perched on the hood, some leaning against the side, some standing in front in cool poses, some peeking out from behind. The truck stays dominant; the cast are supporting players.

HERO TEXT — locked typography "MUHA MEMBERS GIVEAWAY" in the upper portion, subtitle "WIN A FORD F-150 XLT" in cream beneath.

BACKGROUND inside the inner area — Miami-neon Vegas strip: deep midnight navy + hot magenta + electric teal neon haze, faint blurred stylized neon-shape suggestions in the deep background (no readable signage text), volumetric light beams. High-octane action-poster energy. No red.

${SHARED_STYLE}`,
  },
  {
    label: "D-with-qr-v4",
    includeTruck: true,
    prompt: `MUHA MEMBERS GIVEAWAY RAFFLE CARD — DESIGN D (CAST + TRUCK + QR CODE PANEL on right).

INSIDE THE INNER STICKER AREA (1866 x 762 px), split into two zones:

LEFT ZONE (about 70% of the inner width): a cinematic ensemble of all 10 Muha fruit-drama characters (ONE instance of each) posed in/around the BLACK FORD F-150 XLT pickup truck (tailgate down, characters in the bed and around it). The truck must be CLEARLY VISIBLE and recognizable. Strip Ford emblems / dealership text from the truck body. Locked hero typography "MUHA MEMBERS GIVEAWAY" in the upper portion of this left zone, subtitle "WIN A FORD F-150 XLT" in cream below.

RIGHT ZONE (about 30% of the inner width): a dedicated QR CODE PANEL with a slightly darker midnight-navy + gold-accent background. Contains:
- A large square QR CODE in the upper-middle of the panel — a visually believable square QR pattern (black + white square modules in a recognizable QR layout). Does NOT need to encode anything real, but must visually read as a clean square QR code with proper finder patterns in the corners. Roughly 70% the width of the right zone.
- Beneath the QR code: stacked text reading "SCAN" (large) above "TO ENTER" (smaller) in chunky cream / gold display lettering matching the hero typography style.
- A thin gold vertical divider line cleanly separates the LEFT zone from the right QR panel.
- Small gold ornament accents around the QR panel edges.

BACKGROUND inside the LEFT zone — Miami-neon palette: deep navy-purple with hot magenta + electric teal accents, palm trees blurred in the distance. No red.

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
