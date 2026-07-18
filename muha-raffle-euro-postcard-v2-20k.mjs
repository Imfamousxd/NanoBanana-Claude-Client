#!/usr/bin/env node
// Muha MEMBERS Giveaway — EURO BIG-LETTER POSTCARD raffle card, v2.
// FIX over v1: the block letters now spell "MUHA MEMBERS" (was "MUHA MEDS"), and the
// giveaway text now carries the prize amount "$20,000". Each existing v1 euro card is used
// as its OWN style/border/layout reference so the approved vintage look is preserved exactly.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "2048x1024";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Postcard v2";
fs.mkdirSync(outDir, { recursive: true });

const REF_LOCK = `REFERENCE IMAGE 1 IS THE APPROVED EURO POSTCARD RAFFLE CARD. Keep EVERYTHING about it IDENTICAL — same vintage 1950s-60s linen-texture large-letter travel-postcard illustration style, same saturated retro litho colors, same warm golden-hour Mediterranean palette, same chunky 3D block-letter treatment with navy drop shadow + cream outline, and the SAME ornate GOLD ART-DECO TICKET BORDER + deep navy-purple outer card body (border is the topmost layer, nothing crosses it). CANVAS 2048x1024 px; all artwork stays inside the centered ~1866x762 peel-sticker area. ONLY change the two things described below (the spelled word + the giveaway amount). Do not restyle anything else.`;

const POSTCARD_LETTERS = `THE BIG BLOCK LETTERS MUST NOW SPELL EXACTLY: "MUHA MEMBERS" (M-U-H-A space M-E-M-B-E-R-S = 11 letters). Each letter stays a WINDOW cut-out revealing a different famous EUROPEAN tourist scene illustrated inside it:
- M → MONACO: Monte-Carlo casino, super-yachts, red Formula-1 car, cliffside Riviera.
- U → PARIS: the Eiffel Tower, the Seine, a sidewalk café.
- H → ROME: the Colosseum and ancient ruins, a Vespa.
- A → VENICE: the Grand Canal with a gondola and the Rialto bridge.
- M → BARCELONA: Gaudí's Sagrada Família and colorful mosaic tilework.
- E → SANTORINI: white-washed buildings with blue domes above the blue Aegean at sunset.
- M → AMSTERDAM: narrow gabled canal houses, a windmill, tulips and bicycles.
- B → LONDON: Big Ben clock tower, a red double-decker bus, a red telephone box.
- E → PRAGUE: the Charles Bridge and the old-town astronomical clock tower.
- R → SWISS ALPS: the Matterhorn peak, an alpine chalet and a cable car.
- S → ATHENS: the Acropolis and the Parthenon on the hill.
Keep the sweeping golden-hour Mediterranean vacation panorama (turquoise sea, sailboats/yachts, palms, pastel cliffside villages, retro sunset sky) behind and around the letters.`;

const NEGATIVE = `NEGATIVE — NO cartoon/fruit characters, NO people as hero, NO truck. Spelling is CRITICAL: the block letters read EXACTLY "MUHA MEMBERS" (never "MEDS", never "MEMBER"), and the giveaway text reads exactly as specified in the layout (including "$20,000"). NO other words, NO "ADMIT ONE" stub, NO phone numbers / dates / URLs / barcodes. Do NOT cover or alter the gold ticket border or navy outer body.`;

const VARIANTS = [
  {
    slug: "A-stacked",
    ref: "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Postcard/2026-06-04T20-54-09_muha-euro-postcard-A-stacked.png",
    layout: `LAYOUT — stack the block letters on TWO centered lines: line 1 = "MUHA", line 2 = "MEMBERS", filling most of the sticker height. Above the top line keep the word "Giveaway" in elegant gold vintage SCRIPT (cursive) with a sparkle. Add a slim gold vintage banner/ribbon along the BOTTOM reading "WIN $20,000" in bold cream-and-navy postcard caps.`,
  },
  {
    slug: "B-oneline",
    ref: "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Postcard/2026-06-04T20-56-14_muha-euro-postcard-B-oneline.png",
    layout: `LAYOUT — fit all 11 block letters "MUHA MEMBERS" across ONE bold line spanning the sticker width (letters a touch narrower to fit, still legible city windows). Tuck the gold vintage SCRIPT line "Giveaway · $20,000" into the upper-left like the "Greetings from" script. Big sunset sky and coastline behind and below.`,
  },
  {
    slug: "C-banner",
    ref: "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Postcard/2026-06-04T20-58-37_muha-euro-postcard-C-banner.png",
    layout: `LAYOUT — block letters "MUHA" over "MEMBERS" on two centered lines as the hero, sunset Riviera panorama prominent behind them. Across the BOTTOM, a single ornate gold ribbon/banner carrying "GIVEAWAY · WIN $20,000" in gold vintage script + caps.`,
  },
];

const results = [];
for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Euro postcard v2 (MUHA MEMBERS / $20,000): ${v.slug}...`);
  const PROMPT = `MUHA MEMBERS GIVEAWAY — vintage EURO LARGE-LETTER POSTCARD raffle card (corrected text).

${REF_LOCK}

${POSTCARD_LETTERS}

${v.layout}

${NEGATIVE}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(v.ref)], { type: "image/png" }), "approved-euro.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 400)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${v.slug})`); continue; }
  const outPath = `${outDir}/${stamp}_muha-euro-v2-20k-${v.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${VARIANTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
