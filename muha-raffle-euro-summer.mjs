#!/usr/bin/env node
// EURO SUMMER $20K TRIP — re-text the approved euro large-letter postcard cards.
// Anchor to the approved v2-20k cards (exact border + postcard style); change ONLY the text:
// big block letters -> "EURO SUMMER" (each letter a Euro city window), banner -> "$20K TRIP".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const AP = "AI Fruit VIdeos Muha/Raffle Card Designs/Approved Raffle Cards";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
fs.mkdirSync(outDir, { recursive: true });

const KEEP = `Reference image 1 is the APPROVED master card — keep its EXACT style: the ornate gold Art-Deco ticket border (the TOPMOST layer, nothing crosses it), the deep midnight-navy + gold-pinstripe outer card body, the vintage 1950s linen-texture travel-postcard look, and the big chunky 3D block CAPITAL letters with a heavy navy drop-shadow and cream outline where EACH LETTER is a window revealing a detailed illustrated European city scene, over a golden-hour Mediterranean panorama. Canvas 2048x1024; all art inside the centered 1866x762 peel-zone. Do NOT alter the gold border or the navy outer card body.`;

const TEXT = `CHANGE THE TEXT to read EXACTLY this: the big block letters now spell "EURO SUMMER" on TWO centered lines — "EURO" on line 1 over "SUMMER" on line 2. Each of the 10 letters is a window into a famous European summer destination:
E→Santorini (white-washed blue-domed houses, Aegean sea), U→Paris (Eiffel Tower), R→Rome (Colosseum), O→Monaco (Monte-Carlo casino, super-yachts, a red F1 car); S→Barcelona (Sagrada Família), U→Amalfi Coast (pastel cliffside village + lemons), M→Mykonos (white windmills), M→Venice (Grand Canal + gondola), E→London (Big Ben + red double-decker bus), R→the Swiss Alps (the Matterhorn peak).
Spell EXACTLY "EURO SUMMER", "$20K TRIP", and "Giveaway" — every letter correct, NO misspellings, NO extra or doubled letters, NO other words, no dates / URLs / barcodes / "ADMIT ONE".`;

const VARIANTS = [
  { slug: "A-stacked", ref: "2026-06-07T22-04-26_muha-euro-v2-20k-A-stacked.png",
    layout: `LAYOUT: keep the word "Giveaway" in elegant gold vintage SCRIPT across the top (as in reference 1), the stacked "EURO" / "SUMMER" block letters as the hero, and a gold ribbon banner across the bottom reading "$20K TRIP".` },
  { slug: "C-banner", ref: "2026-06-07T22-08-22_muha-euro-v2-20k-C-banner.png",
    layout: `LAYOUT: the stacked "EURO" / "SUMMER" block letters as the hero, with a gold ribbon banner across the bottom reading "GIVEAWAY · $20K TRIP".` },
];

for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating EURO SUMMER ${v.slug}...`);
  const PROMPT = `EURO SUMMER $20K TRIP — vintage euro large-letter postcard raffle card.\n\n${KEEP}\n\n${TEXT}\n\n${v.layout}`;
  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(AP, v.ref))], { type: "image/png" }), "approved-euro.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 250)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${v.slug})`); continue; }
  const out = `${outDir}/${stamp}_euro-summer-${v.slug}.png`;
  fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${out}`);
}
console.log("Done.");
