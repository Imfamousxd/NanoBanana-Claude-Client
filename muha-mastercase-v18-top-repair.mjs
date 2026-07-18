#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v18 TOP-BAND REPAIR (masked inpaint)
// The recurring failure: full-panel edits keep breaking the TOP guardrail. Fix = MASK the edit
// so only the top band is repainted; the rest of v17 (truck, cast, coin, band, side+bottom
// guardrails) is FROZEN pixel-for-pixel. Mask transparent = editable (top ~27%), opaque = frozen.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeRectMask } from "./lib-make-mask.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";

const BASE = "AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T04-30-08_muha-mastercase-v17-FRONT.png";

// dimensions of the base panel
const SIZE = "1024x1536"; // W x H
const [W, H] = SIZE.split("x").map(Number);

// Editable band = top 0% to 27% (dust flap + top guard border + logo box + emblems + headline top).
const MASK_PATH = "/tmp/mc_top_mask.png";
writeRectMask(MASK_PATH, W, H, [[0.0, 0.27]]);
console.log(`mask written: ${MASK_PATH} (${W}x${H}, editable 0-27%)`);

const PROMPT = `This is a masked inpaint of a Muha Members master-case FRONT panel. ONLY the masked TOP BAND is being repainted; everything below is frozen and must blend seamlessly with it. Repaint the top band so it matches the existing panel's glossy Miami-Vice retro-neon style (deep navy-purple, magenta/cyan neon, glowing gold).

In the top band, render these elements cleanly, in this stacked order, each fully INSIDE the panel with margins:
1) At the very top edge: a thin angled DUST-FLAP strip carrying small UPSIDE-DOWN (inverted) fine-print tagline text. It stays above the top border line.
2) THE TOP GUARD BORDER: a single, SOLID, CONTINUOUS, perfectly straight horizontal neon line spanning the full width, with clean 90-degree corners that connect down into the left and right vertical border lines. This rectangular guard border must be UNBROKEN and complete — nothing overlaps or crosses it. Just inside it, the ornate neon-gold corner filigree flourishes in the two top corners (kept inside the border, not poking through).
3) A BLANK reserved LOGO BOX, centered, a clean empty rounded-rectangle neon frame with nothing inside it (the real logo is added later).
4) Two small decorative winged-eyeball neon emblems flanking the area just below the logo box.
5) The TOP of the chunky 3D neon "FORD" headline beginning to appear at the bottom of this band (it continues below the mask) — align it so it connects seamlessly with the frozen portion below.

Keep all text crisp. Do NOT add any other logo, wordmark, characters, truck, or "MUHA"/"Von Dutch" text. Do NOT break or cover the guard border. Match colors, glow, and lighting to the frozen lower portion so the seam is invisible.`;

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");
form.append("image", new Blob([fs.readFileSync(BASE)], { type: "image/png" }), "base.png");
form.append("mask", new Blob([fs.readFileSync(MASK_PATH)], { type: "image/png" }), "mask.png");

console.log("Generating Master Case v18 (masked TOP-band repair of v17)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 600)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Master Case Designs";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-mastercase-v18-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
