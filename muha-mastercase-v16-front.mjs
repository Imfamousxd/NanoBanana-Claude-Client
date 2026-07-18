#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v12 FRONT PANEL
// Uses the NEW split FRONT ref ("front master case.png") as image[0] structural ground truth
// (cleaner than v5 — no side rails, preserves truck/coin/layout). Restyle to fruit-drama
// Miami-Vice neon; top = Muha Members logo ALONE; bottom = the real MM coin; central hero =
// the 10 characters around the F-150 XLT prize.
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

const FRONT_REF = "AI Fruit VIdeos Muha/refs/front master case.png"; // image 0 = structural ground truth
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const COIN_REF = "AI Fruit VIdeos Muha/refs/mm coin.png";
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

const PROMPT = `FORD F-150 XLT GIVEAWAY — Muha master-case FRONT PANEL. LAYOUT-LOCKED RESTYLE / EDIT of the supplied primary image (image 0 = the front-panel template). Image 0 is the STRUCTURAL GROUND TRUTH: reproduce its dieline, zone positions, sizes, alignments, and proportions EXACTLY. Only change (1) the visual STYLE, (2) the central hero content, and (3) the two emblem swaps named below. Nothing else moves, resizes, or reflows.

=== GUARDRAIL / SAFE-AREA CONTAINMENT (critical — read first) ===
Image 0 has a thin BLUE rectangular GUARD-BORDER (the inner safe-area line) inset from the panel edges, with the ornate frame just inside it. This blue guard-border must remain a COMPLETE, UNBROKEN rectangle on ALL FOUR sides (top, bottom, left, right) — do not break, cover, distort, or let anything cross it. ALL artwork — every character, the truck, the headline, ribbon, coin, crests, ornament, glow, and background — MUST stay strictly INSIDE that blue guard-border with a clear even margin. NOTHING may touch, overlap, or lap OVER the blue guardrail lines or extend into the outer black border / fold area. Treat the blue guard-border as a hard wall on all four sides. If any content (especially the character ensemble) is too big, SCALE IT DOWN so it fits comfortably inside the guardrails — never let it bleed to or past the border.

TOP GUARDRAIL (the v14 problem): the TOP blue guard line and the top dust-flap tagline strip must stay clear and intact. The blank top logo box, the two winged crests, and the "FORD F-150 XLT" headline must ALL sit BELOW the top guard line with margin — none of them may touch or cross the top guard border or push up into the top dust-flap. Keep the headline at a moderate size with clear breathing room above it; do NOT let the headline or crests grow up into / over the top guardrail.
BOTTOM GUARDRAIL (the v14 problem): the BOTTOM blue guard line, the checkered "100 UNITS | 10 CASES | 10 STRAINS" band, and the bottom gold flap must stay clear and intact INSIDE the guard border. The character ensemble must STOP well ABOVE the MM coin and must NOT drop down onto the coin, the ALL-IN-ONE script, the checkered band, or the bottom guard line. Leave a clear empty gap between the lowest characters and the MM coin. No feet, limbs, or props extend into the bottom band region or across the bottom guardrail.

=== GEOMETRY LOCK (match image 0 exactly) ===
Portrait near-square panel. Top to bottom, keep every zone in the SAME place/size as image 0:
  1. TOP DUST-FLAP inverted (upside-down) fine-print tagline — top edge band [0.10,0.00,0.80,0.07]. Keep it inverted; stays on the flap.
  2. TOP EMBLEM ROW [0.20,0.10,0.60,0.11] — see TOP LOGO ZONE (left intentionally BLANK).
  3. Two winged flame crests flanking the headline top — left [0.25,0.22,0.14,0.10], right [0.61,0.22,0.14,0.10]. Keep as cool decorative winged crests (re-skin to neon-gold).
  4. STACKED HEADLINE "FORD" / "F-150 XLT" [0.12,0.26,0.76,0.13] — two lines, the dominant chrome-to-neon 3D lettering, ornamental divider above & below. Keep it WITHIN this box with margin; do NOT let it grow upward toward the top guard line or the logo box.
  5. Gold "GIVEAWAY" ribbon flanked by stars [0.28,0.42,0.44,0.06] — directly under the headline.
  6. CENTRAL HERO ZONE [0.13,0.49,0.74,0.19] — see HERO CONTENT. The ensemble MUST end above y=0.68; keep a clear gap below it before the MM coin.
  7. MM COIN medallion [0.33,0.70,0.34,0.13] — see EMBLEM SWAP #2.
  8. "ALL-IN-ONE" script line [0.20,0.85,0.60,0.05].
  9. Checkered spec band "100 UNITS | 10 CASES | 10 STRAINS" [0.16,0.90,0.68,0.045] — black-and-white checkerboard accents + gold pipe-separated text.
  10. Bottom gold flap band [0.00,0.945,1.00,0.055].
Do NOT crop, zoom, re-center, or change aspect ratio. No element crosses a fold line.

=== TOP LOGO ZONE — LEAVE IT BLANK (reserved) ===
Remove image 0's top "Muha Meds + Von Dutch Kulture House" dual lockup and DO NOT put any logo, emblem, badge, monogram, crest, or text in the top emblem row [0.20,0.10,0.60,0.11]. Leave this zone CLEAN and EMPTY — just the restyled dark neon background — because the real Muha Members logo will be dropped in here later by the designer. Keep clear, uncluttered negative space there (no ornament intruding into it). Absolutely NO Von Dutch, NO Muha Meds winged-M, NO "Members" wordmark, NO placeholder logo up top.

=== EMBLEM SWAP #2 — BOTTOM (MM coin) ===
The bottom medallion is the MM COIN: reproduce the provided MM coin reference (gold circular "MUHA MEDS · INHALE EXCELLENCE · 2019" coin with the MM monogram), composited faithfully, centered, keeping image 0's wings/placement around it. This is the bottom emblem.

=== HERO CONTENT (central hero zone only) ===
Replace image 0's lone truck with a HERO ENSEMBLE: the FORD F-150 XLT is the BIG, CLEAR, DOMINANT centerpiece (glossy blackout pickup, from the truck reference — preserve its real shape/details, sharp and fully visible). Render the truck LARGE and prominent in the upper-center of the hero zone in a dramatic front three-quarter hero angle, well-lit and crisp so it reads instantly as the grand prize — it should be the single biggest object in the hero zone, NOT small or half-hidden. The 10 Muha fruit-drama characters are arranged AROUND and slightly IN FRONT of the lower edge of the truck as an excited crowd, smaller than the truck, framing it without covering it — keep the truck's grille, hood, headlights, and body clearly visible above/between the characters (characters do not block more than the truck's lower wheels/bumper). Characters = excited fans, truck = the big trophy. All 10 distinct Pixar-3D fruit-headed figures at consistent scale. Exactly ONE blueberry-blue character; no duplicates, no extra figures.
CONTAINMENT — IMPORTANT: the ENTIRE ensemble (the LARGE truck + all 10 characters, including every limb, hand, leaf, hair, prop, and shadow) must sit FULLY INSIDE the central hero zone [0.13,0.49,0.74,0.19] with margin. The truck is big and dominant but still must stay WITHIN the hero-zone box — it must NOT touch or cross the side guard-borders, must NOT rise into the GIVEAWAY ribbon above (stay below y=0.49), and the ensemble must NOT drop onto the MM coin / ALL-IN-ONE / checkered band below (stop above y=0.68, leaving a clear empty gap before the coin). Leave a clear gap between the artwork and the blue guardrail on all sides. The composition reads as a big clear hero truck surrounded by the contained character crowd — not a full-bleed scene.

CAST (one each, 10 total): Aloha Passion Rush (passionfruit, hibiscus crown, F) · Arctic Blueberry (blue blueberry, snow tuft, blue button-up, M — the ONLY blue one) · Blue Slushie (pink/blue cotton-candy hair, F) · Frosted Mint Cookies (cookie head, shy, F) · Frozen Pomegranate (buff red pomegranate, crown, red tank, M) · Galactic Diesel (cosmic-purple planet head, Saturn rings, leather jacket, M) · Guava Mango (half-yellow/half-green split head, laughing, M) · Horchata (cinnamon-swirl head, red flamenco dress, F) · Lemon Cherry Fizz (lemon head, glasses, cherry earrings, F) · Watermelon Bubblegum (watermelon head, pink quiff, green bomber, M).

=== STYLE CHANGE (whole panel, geometry untouched) ===
Re-render the ENTIRE panel as unified glossy PIXAR / CINEMA 4D / OCTANE 3D in a MIAMI-VICE retro-80s NEON aesthetic. REMOVE image 0's black-chrome Von-Dutch pinstripe look; re-skin all the same ornament (headline, crests, ribbon, coin, divider, checkered band, borders) as luminous NEON-AND-GOLD versions of the SAME shapes. Palette: deep navy-purple, magenta-to-orange sunset, teal/cyan neon, glowing gold. Background mood inside the panel: dim retro-Miami sunset with palm + skyline silhouettes and a faint neon grid, kept subtle so gold ornament + hero read clearly. All text crisp.

=== TEXT (verbatim) ===
"FORD" / "F-150 XLT" (headline) · "GIVEAWAY" · "ALL-IN-ONE" · "100 UNITS | 10 CASES | 10 STRAINS" · inverted top-flap tagline (small) · 21+ fine print if present. The TOP logo zone stays BLANK (no text/logo). The bottom MM coin is a composited IMAGE, not typed text. Do NOT type "MUHA MEMBERS", "MUHA", "Members", or "Von Dutch" anywhere. Spell everything exactly.

NEGATIVE: NO artwork lapping over or touching the blue guard-border / safe-area lines — everything stays inside the guardrails with margin; no full-bleed crowd; no character/limb/prop/glow crossing into the outer border, the side rails, the headline/ribbon above, or the coin/band below. No layout change / no zone moved or resized / no crop / no aspect change; no content crossing fold lines; no black chrome; no Von-Dutch style or text; NO logo/emblem/wordmark of any kind in the top zone (keep it blank for later); no garbled or redrawn logos; no duplicate characters; no extra brands; no phone numbers/URLs/barcodes/dates; no misspellings.`;

const SIZE = "1024x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// image 0 = front ground truth, then coin, truck, 10 chars (NO logo ref — top zone left blank)
form.append("image[]", new Blob([fs.readFileSync(FRONT_REF)], { type: "image/png" }), "00-front-ground-truth.png");
form.append("image[]", new Blob([fs.readFileSync(COIN_REF)], { type: "image/png" }), "mm-coin.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v16 FRONT (truck bigger + clearer as hero, all 10 chars)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v16-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
