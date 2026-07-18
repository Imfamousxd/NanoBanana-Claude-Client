#!/usr/bin/env node
// EURO SUMMER — revision: collapse the giveaway text into ONE line under "EURO SUMMER".
// Anchor to the two EXISTING approved euro-summer cards (keep border + postcard style + the
// "EURO SUMMER" city-window block letters + panorama IDENTICAL); change ONLY the text so the
// single gold banner under SUMMER reads "$20K TRIP GIVEAWAY" — and remove the separate
// top "Giveaway" script word. No other words.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const SRC = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
fs.mkdirSync(outDir, { recursive: true });

const KEEP = `Reference image 1 is the APPROVED EURO SUMMER card — keep it IDENTICAL in every way EXCEPT the giveaway text line described below. Keep: the ornate gold Art-Deco ticket border (TOPMOST layer, nothing crosses it), the deep midnight-navy + gold-pinstripe outer card body, the vintage 1950s linen-texture travel-postcard look, the warm golden-hour Mediterranean panorama, and the big chunky 3D block CAPITAL letters spelling "EURO" over "SUMMER" on two centered lines where EACH LETTER is a window revealing a detailed illustrated European city scene (Santorini, Paris/Eiffel, Rome/Colosseum, Monaco; Barcelona/Sagrada Família, Amalfi, Mykonos windmills, Venice canal, London/Big Ben, the Matterhorn). Canvas 2048x1024; all art inside the centered 1866x762 peel-zone. Do NOT alter the gold border, the navy outer body, the EURO SUMMER letters, or the background.`;

const TEXT = `CHANGE ONLY THE GIVEAWAY TEXT. The big block letters must still spell EXACTLY "EURO SUMMER" (E-U-R-O over S-U-M-M-E-R, two centered lines) — do not change them.
There must be EXACTLY ONE line of giveaway text: a single ornate gold vintage ribbon/banner directly UNDER the "SUMMER" line reading EXACTLY "$20K TRIP GIVEAWAY" on ONE single line, in bold cream-and-navy vintage postcard caps.
REMOVE the separate cursive "Giveaway" script word that sits at the TOP of the card — it must be gone. REMOVE any middle-dot "·" separator and any duplicate "GIVEAWAY"/"$20K TRIP" text elsewhere.
Spelling is CRITICAL: the banner reads EXACTLY "$20K TRIP GIVEAWAY" — no misspellings, no doubled or missing letters, no other words, no "Giveaway" anywhere except inside that one banner, no dates / URLs / barcodes / "ADMIT ONE".`;

const VARIANTS = [
  { slug: "A", ref: "2026-06-08T20-38-36_euro-summer-A-stacked.png" },
  { slug: "C", ref: "2026-06-08T20-40-53_euro-summer-C-banner.png" },
].filter(v => !process.env.ONLY || process.env.ONLY.split(",").includes(v.slug));

const results = [];
for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating EURO SUMMER one-line trip ${v.slug}...`);
  const PROMPT = `EURO SUMMER $20K TRIP GIVEAWAY — vintage euro large-letter postcard raffle card (text revision: one giveaway line).\n\n${KEEP}\n\n${TEXT}`;
  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(SRC, v.ref))], { type: "image/png" }), "approved-euro-summer.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 250)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${v.slug})`); continue; }
  const out = `${outDir}/${stamp}_euro-summer-v2-trip-${v.slug}.png`;
  fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${out}`);
  results.push(out);
}
console.log(`\nDone — ${results.length}/${VARIANTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
