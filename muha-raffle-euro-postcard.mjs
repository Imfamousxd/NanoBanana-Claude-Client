#!/usr/bin/env node
// Muha Meds Giveaway — EURO BIG-LETTER POSTCARD raffle card.
// Mimics the vintage "Greetings from MONACO" large-letter postcard (ref 2),
// but the block letters spell "MUHA MEDS", each letter a window into a famous
// European tourist city, on a Mediterranean-vacation background. NO characters,
// NO truck. Keeps the LOCKED raffle ticket border + dimensions (ref 1).
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

const TEMPLATE_REF = "AI Fruit VIdeos Muha/Raffle Card Designs/2026-05-31T02-02-35_muha-raffle-A-characters-only-v14.png";
const POSTCARD_REF = "/Users/mario/.claude/image-cache/10411c3b-0759-44f8-b622-bae6610f846d/1.png";

const TEMPLATE_LOCK = `TEMPLATE / DIMENSION LOCK — reference image 1 is the APPROVED MASTER RAFFLE-CARD TEMPLATE. Keep its frame EXACTLY and only replace the interior artwork:
- CANVAS 2048 x 1024 px = a full 90mm x 43mm physical raffle card.
- INNER PEEL-OFF STICKER AREA = 82mm x 32mm ≈ 1866 x 762 px, PERFECTLY CENTERED (≈91 px left/right margin, ≈131 px top/bottom margin).
- KEEP the ornate GOLD ART-DECO TICKET BORDER exactly as in reference 1: Art-Deco filigree flourishes only in the 4 corners, a double gold rule running parallel along all 4 edges with gold bead detail, clean edges (NO starbursts at edge midpoints). The gold border is the TOPMOST layer.
- KEEP the OUTER CARD BODY (the ring outside the gold border, between border and canvas edge) exactly: deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern, symmetric on all 4 sides.
- ALL new postcard artwork is FULLY CONTAINED INSIDE the 1866 x 762 peel-off sticker area with a ~30-40 px safe-zone inset. Nothing crosses or overlaps the gold border.`;

const POSTCARD_STYLE = `INTERIOR ARTWORK — replace everything inside the gold border with a VINTAGE "LARGE-LETTER" TRAVEL POSTCARD, styled exactly like reference image 2 (the retro "Greetings from MONACO" postcard): bold 1950s-60s linen-texture travel-postcard illustration, saturated retro print colors, halftone/litho feel, big chunky 3D block capital letters with a heavy navy-blue drop shadow and cream outline, each letter acting as a WINDOW cut-out revealing a detailed illustrated scene inside it. Warm sunset Mediterranean palette.

THE BIG BLOCK LETTERS SPELL EXACTLY: "MUHA MEDS" (M-U-H-A space M-E-D-S). Each of the 8 letters is a window into a different famous EUROPEAN tourist city, illustrated inside the letter shape:
- 1st letter M → MONACO: Monte-Carlo casino, super-yachts in the harbor, a red Formula-1 car on the street circuit, cliffside Riviera.
- U → PARIS: the Eiffel Tower, the Seine, a sidewalk café.
- H → ROME: the Colosseum and ancient ruins, a Vespa.
- A → VENICE: the Grand Canal with a gondola, Rialto bridge.
- 2nd letter M → BARCELONA: Gaudí's Sagrada Família and colorful mosaic tilework.
- E → SANTORINI (Greece): white-washed buildings with blue domes above the blue Aegean sea at sunset.
- D → AMSTERDAM: narrow gabled canal houses, a windmill, tulips and bicycles.
- S → LONDON: Big Ben / the clock tower, a red double-decker bus, a red telephone box.

BACKGROUND behind and around the letters = a sweeping golden-hour MEDITERRANEAN VACATION panorama: turquoise sea, sailboats and yachts, palm trees, pastel cliffside villages, a warm pink-orange sunset sky with retro clouds — the classic euro-vacation travel-poster backdrop.`;

const NEGATIVE = `NEGATIVE — NO cartoon characters of any kind, NO fruit characters, NO people as the hero, NO truck or any vehicle as a hero (small illustrated cars/buses inside the city scenes are fine). Do NOT misspell: the block letters must read EXACTLY "MUHA MEDS" and the script must read EXACTLY "Giveaway". NO extra words, NO "ADMIT ONE" stub, NO phone numbers / dates / URLs / barcodes. Do NOT let any artwork cross or cover the gold ticket border. Do NOT alter the gold border or the navy outer card body from reference 1.`;

const VARIANTS = [
  {
    slug: "A-stacked",
    layout: `LAYOUT — stack the block letters on TWO lines, big and bold, filling most of the sticker height: line 1 = "MUHA", line 2 = "MEDS", both centered. Above the top line, the word "Giveaway" in elegant gold vintage SCRIPT (cursive) with a little sparkle, positioned like the "Greetings from" script in reference 2. The two stacked words give large, clearly-readable city windows inside each letter.`,
  },
  {
    slug: "B-oneline",
    layout: `LAYOUT — the closest match to reference 2: all 8 block letters "MUHA MEDS" on ONE single bold line spanning the width of the sticker, with the gold vintage SCRIPT word "Giveaway" tucked into the upper-left like "Greetings from" in reference 2. Big sunset sky and Mediterranean coastline fill behind and below the letters.`,
  },
  {
    slug: "C-banner",
    layout: `LAYOUT — block letters "MUHA MEDS" on two centered lines (MUHA over MEDS) as the hero, with a gold ribbon/banner across the bottom of the sticker carrying the word "Giveaway" in gold vintage script. Push the sunset Riviera panorama (sea, yachts, palms) prominently behind the letters.`,
  },
];

const SIZE = "2048x1024";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Postcard";
fs.mkdirSync(outDir, { recursive: true });

const templateBuf = fs.readFileSync(TEMPLATE_REF);
const postcardBuf = fs.readFileSync(POSTCARD_REF);

for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Euro postcard raffle card: ${v.slug}...`);

  const PROMPT = `MUHA MEDS GIVEAWAY — vintage EURO LARGE-LETTER POSTCARD raffle card.

${TEMPLATE_LOCK}

${POSTCARD_STYLE}

${v.layout}

${NEGATIVE}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([templateBuf], { type: "image/png" }), "template-border.png");
  form.append("image[]", new Blob([postcardBuf], { type: "image/png" }), "postcard-style.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 400)}`);
    continue;
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.slug})`); continue; }
  const outPath = `${outDir}/${stamp}_muha-euro-postcard-${v.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
console.log("Done.");
