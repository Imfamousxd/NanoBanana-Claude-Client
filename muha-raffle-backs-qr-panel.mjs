#!/usr/bin/env node
// Per-character RAFFLE CARD BACKS — add the GOLD QR ENTRY PANEL into the reserved right third of the
// v4 QR-space backs. INPAINT approach: the v4 card is passed as image[1] with a MASK that keeps the
// LEFT ~66% (character + Mustang + headline + logo) pixel-locked and only lets the model paint the
// RIGHT third. Panel style copied from the Europe-ticket reference (refs/qr-panel-ref.png).
// CLI slug filter; concurrent.  e.g.  node muha-raffle-backs-qr-panel.mjs diesel aloha
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

const BASE_DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs v4 QR-space";
const PANEL_REF = "AI Fruit VIdeos Muha/refs/qr-panel-ref.png";
const MASK = "AI Fruit VIdeos Muha/refs/qr-mask-panel-float.png";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs v6 QR-fit";
fs.mkdirSync(outDir, { recursive: true });

const SLUGS = ["aloha", "blueberry", "slushie", "cookies", "pomegranate", "diesel", "mango", "horchata", "lemon", "watermelon"];

// Placeholder raffle ID per card (production swaps a real per-ticket ID + a real scannable QR).
const RAFFLE_ID = process.env.RAFFLE_ID || "G2T6A03";

const PANEL = `RIGHT-SIDE QR ENTRY PANEL — paint, in the empty RIGHT area only, a vertical "Encrypted Raffle Entry Ticket" panel rendered EXACTLY in the style of REFERENCE IMAGE 2 (same deep-black panel, same warm metallic GOLD, same ornate gold framing, same layout and proportions). The panel is a FLOATING rounded card that sits in the clear empty space on the right with a comfortable even margin around it; it must NOT touch, cover, or overlap the white headline to its left — keep a clear visible GAP between the headline and the panel's left edge. From top to bottom, centered:
1. A tall ROUNDED-RECTANGLE panel of deep matte BLACK floating with an even margin on all sides (it does not bleed to the card edges).
2. An ornate GOLD FRAME inset from the panel edge: a thin gold double-line border with decorative gold CORNER BRACKETS in all four corners and small gold tick/bead accents along the edges (copy reference 2's frame).
3. HEADING in bold warm-GOLD rounded sans, two centered lines: "Your Encrypted" / "Raffle Entry Ticket."
4. A square QR CODE in the center: GOLD code modules on a WHITE rounded-square tile with a thin gold inner border, and the ornate baroque GOLD Muha "M" monogram sitting in the dead center of the QR (decorative, matching reference 2).
5. Two centered BOLD WHITE lines: "Scan In Members App." / "To Redeem 10 Entries!"
6. A horizontal GOLD rounded PILL/BAR containing crisp dark text: "Raffle ID: ${RAFFLE_ID}".
7. A small centered WHITE line at the bottom: "No Purchase Necessary".
Everything centered, evenly spaced, crisp and legible, metallic gold catching light like reference 2.

SPELLING GUARD — reproduce ALL panel text EXACTLY, each word once, no extra/garbled letters: "Your Encrypted", "Raffle Entry Ticket.", "Scan In Members App.", "To Redeem 10 Entries!", "Raffle ID: ${RAFFLE_ID}", "No Purchase Necessary".`;

const KEEP = `KEEP THE LEFT UNCHANGED — REFERENCE IMAGE 1 is the card WITHOUT the panel; only the masked floating-panel area on the right may be painted. Do NOT alter, redraw, recolor, shift, or restyle anything else: the fruit character, the glossy black Ford Mustang, the three-line white "WIN A / 2026 FORD / MUSTANG" headline (which must stay FULLY VISIBLE and uncovered — every letter including the final D in FORD and G in MUSTANG), the Muha Members logo, and the background must remain EXACTLY as in reference 1. The new gold QR panel sits ONLY in the empty right area and must not overlap or touch the character, car, or headline.`;

const NEG = `NEGATIVE — the panel uses ONLY black + metallic gold + white (no other colors). Do NOT change the left art in any way. Do NOT garble any text. ONE QR code only, ONE Muha "M" in its center. No real photo, keep the unified premium 3D / print look. The panel stays inside the right third.`;

const panelBuf = fs.readFileSync(PANEL_REF);
const maskBuf = fs.readFileSync(MASK);

function latestBase(slug) {
  const hit = fs.readdirSync(BASE_DIR).filter((f) => f.endsWith(`-${slug}.png`) && !f.startsWith("_")).sort().pop();
  return hit ? path.join(BASE_DIR, hit) : null;
}

const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const queue = (wanted.length ? SLUGS.filter((s) => wanted.includes(s)) : SLUGS);

async function genPanel(slug) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const basePath = latestBase(slug);
  if (!basePath) { console.error(`no base card for ${slug}`); return null; }
  console.log(`Adding QR panel: ${slug} (base ${path.basename(basePath)})...`);

  const PROMPT = `MUHA MEMBERS — RAFFLE CARD BACK — add the gold QR entry panel to the right third of ${slug.toUpperCase()}.

${KEEP}

${PANEL}

${NEG}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(basePath)], { type: "image/png" }), "base-card.png");
  form.append("image[]", new Blob([panelBuf], { type: "image/png" }), "qr-panel-ref.png");
  form.append("mask", new Blob([maskBuf], { type: "image/png" }), "mask.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${slug}): ${(await res.text()).slice(0, 500)}`); return null; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${slug})`); return null; }
  const outPath = `${outDir}/${stamp}_muha-raffle-back-v5-qr-${slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  return outPath;
}

const results = (await Promise.all(queue.map((s) => genPanel(s).catch((e) => { console.error(`${s}: ${e.message}`); return null; })))).filter(Boolean);
console.log(`\nDone — ${results.length}/${queue.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
