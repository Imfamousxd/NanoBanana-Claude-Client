#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v11 SIDE PANEL (cooler Miami-Vice neon "flavor wall")
// Matches the v10/v11 front theme (Pixar Miami-Vice neon) but as the box SIDE face: a glowing
// retro-arcade "FLAVOR LINEUP" wall where the 10 fruit-drama flavor badges drop into neon-sign
// tiles. Same dieline language as the front (top/bottom flaps, side rails) so it reads as one box.
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

const FRONT_REF = "AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T03-22-38_muha-mastercase-v10-FRONT.png"; // image 0 = style/dieline match
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const CREST_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";

const PROMPT = `MUHA MEMBERS GIVEAWAY — MASTER CASE SIDE PANEL. Image 0 is the FRONT panel of this same box; MATCH its visual world EXACTLY so the side reads as the same carton: unified PIXAR / CINEMA 4D / OCTANE glossy 3D in a MIAMI-VICE retro-80s NEON aesthetic — deep navy-purple base, magenta-to-orange sunset, teal/cyan neon, glowing gold ornament, palm + skyline silhouettes, neon perspective grid, soft bloom. Same dieline language as the front: an angled TOP DUST-FLAP, the main FACE, full-height ornate VERTICAL SIDE RAILS pinned to the left and right edges, and a curved rounded BOTTOM TUCK-FLAP. Keep all artwork INSIDE the main face; nothing crosses a fold line onto the flaps or rails.

This SIDE face is a cool retro-arcade "FLAVOR WALL". Layout top to bottom, all contained inside the main face:
1) TOP DUST-FLAP: small inverted (upside-down) fine-print tagline, like the front.
2) HEADER: the MUHA MEMBERS logo reproduced EXACTLY from the logo reference image (blue verification-checkmark badge + gold "M" monogram + gold cursive "Members®"), composited AS-IS, pixel-faithful — do NOT redraw, recolor, neon-ify, or add extra text to it. Beneath it a glowing neon-tube sign reading "FLAVOR LINEUP" in chunky retro-80s letters (gold + magenta/cyan neon glow). Spelled exactly F-L-A-V-O-R  L-I-N-E-U-P.
3) MAIN AREA — a clean grid of TEN (10) identical EMPTY badge slots arranged as 2 columns x 5 rows (or a single column of 10 if it reads cleaner), evenly spaced. Each slot is a cool glowing NEON-SIGN TILE: a rounded-rectangle plaque with a luminous neon-tube outline (alternating magenta/cyan/gold glow), a subtle dark glossy interior, and a thin gold inner frame — like illuminated arcade name-plates on a wall. The tile INTERIORS are INTENTIONALLY EMPTY (dark glossy blank, no artwork) — reserved placeholders where the 10 fruit-drama flavor badges get dropped in later. Make the empty tiles obvious, uniform, and tidy. Do NOT draw any fruit, characters, faces, or badge art inside them — leave them blank.
4) BOTTOM: a slim BLACK-AND-WHITE CHECKERED-FLAG accent strip with thin gold rules (echoing the front's bottom band), and a small light-gray fine-print line: "FOR ADULTS 21+ ONLY. KEEP OUT OF REACH OF CHILDREN & PETS." correctly spelled.
5) BOTTOM TUCK-FLAP: curved rounded die-cut bottom with a gold decorative band, side rails continuing down into it.

PANEL FORMAT: tall vertical rectangle (the long narrow side face of the master case).

NEGATIVE: do NOT fill the 10 placeholder tiles with any artwork — keep all 10 EMPTY/blank for later badge placement. Do NOT add the truck or any cartoon characters on this side panel. Do NOT garble or redraw the Muha Members logo — composite the logo reference exactly as-is, and do NOT add a separate "MUHA MEMBERS" or "MUHA" text label near it. Do NOT use the black chrome Von-Dutch pinstripe style. Do NOT write "Von Dutch" or any third-party brand. Do NOT bleed artwork across fold lines onto the flaps/rails. Do NOT misspell FLAVOR LINEUP. Do NOT add phone numbers, dates, URLs, or barcodes.`;

const SIZE = "1024x1536";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// image 0 = front panel (style + dieline match), then logo, crest
form.append("image[]", new Blob([fs.readFileSync(FRONT_REF)], { type: "image/png" }), "00-front-style-match.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");

console.log("Generating Master Case v11 SIDE (Miami-Vice neon flavor-wall, 10 empty neon-tile slots)...");
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
const outPath = `${outDir}/${stamp}_muha-mastercase-v11-SIDE.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
