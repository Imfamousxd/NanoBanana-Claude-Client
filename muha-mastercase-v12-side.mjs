#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v12 SIDE PANEL
// Uses the NEW split SIDE ref ("Layer 1.png", a single side panel) as image[0] ground truth.
// Restyle to fruit-drama Miami-Vice neon, KEEP the center largely BLANK as a background for the
// flavor badges to be added later (honors the ref's empty-for-badges design), Muha Members logo
// at top, small MM emblem, matching the front's neon world.
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

const SIDE_REF = "AI Fruit VIdeos Muha/refs/Layer 1.png"; // image 0 = single side-panel ground truth
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const COIN_REF = "AI Fruit VIdeos Muha/refs/mm coin.png";

const PROMPT = `MUHA MEMBERS GIVEAWAY — MASTER CASE SIDE PANEL. LAYOUT-LOCKED RESTYLE / EDIT of the supplied primary image (image 0 = a single tall narrow side-panel template). Image 0 is the STRUCTURAL GROUND TRUTH: keep its tall-narrow dieline shape (angled top flap, long narrow face, rounded bottom tuck flap, thin blue edge accents) EXACTLY. Only change the visual STYLE and add the two small emblems below. Keep the CENTER LARGELY BLANK.

GEOMETRY: tall narrow vertical side panel, same proportions and flap shapes as image 0. Do NOT crop, zoom, re-center, or change aspect ratio. Nothing crosses a fold line.

CONTENT (keep it minimal — this side is mostly a BACKGROUND that flavor badges get added onto later):
  1. TOP: the MUHA MEMBERS logo composited from the logo reference AS-IS, pixel-faithful (blue verification-checkmark badge + gold "M" monogram + gold cursive "Members®"), small and centered near the top. Do NOT redraw, recolor, neon-ify, or add text to it.
  2. CENTER: KEEP IT OPEN / BLANK — just the restyled background (do NOT fill it with characters, fruit, badges, truck, or busy ornament). This empty central column is intentionally reserved so the 10 fruit-drama flavor badges can be placed here later. A faint vertical neon-pinstripe motif (re-skin of image 0's silver pinstripe filigree) may run subtly behind it, but keep the center clear and uncluttered.
  3. A small MM emblem / winged-M coin accent low-center (re-skin of image 0's small emblem), modest.
  4. BOTTOM: a slim black-and-white checkered accent + small light-gray fine print "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS." correctly spelled.

STYLE CHANGE: re-render in the SAME world as the master-case FRONT panel — glossy PIXAR / CINEMA 4D / OCTANE 3D, MIAMI-VICE retro-80s NEON: deep navy-purple base, magenta/orange sunset hints, teal/cyan neon, glowing gold. REMOVE the black-chrome Von-Dutch pinstripe look; re-skin the same filigree as subtle luminous neon-and-gold. Keep it elegant and not busy so badges read well on top.

NEGATIVE: do NOT fill the blank central area with artwork — keep it open for badges. Do NOT add cartoon characters, fruit, or the truck. Do NOT garble or redraw the Muha Members logo — composite it as-is; do NOT add "MUHA MEMBERS"/"MUHA"/"Von Dutch" text. Do NOT use the black chrome Von-Dutch style. Do NOT change the panel shape/proportions. No phone numbers/URLs/barcodes. No misspellings.`;

const SIZE = "1024x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// image 0 = side ground truth, then logo, coin
form.append("image[]", new Blob([fs.readFileSync(SIDE_REF)], { type: "image/png" }), "00-side-ground-truth.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(COIN_REF)], { type: "image/png" }), "mm-coin.png");

console.log("Generating Master Case v12 SIDE (split side ref ground truth, blank center for badges)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v12-SIDE.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
