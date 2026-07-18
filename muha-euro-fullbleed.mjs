#!/usr/bin/env node
// EURO SUMMER — produce a FULL-BLEED art base (NO border/frame at all) so a clean, even
// border can be composited in CODE afterward. Anchors to approved v2-trip-A; keeps the
// EURO SUMMER city-window letters + "$20K TRIP GIVEAWAY" banner, extends the panorama
// to all four edges, and removes the ornate gold border + navy margin entirely.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const SRC = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const REF = "2026-06-08T21-05-20_euro-summer-v2-trip-A.png";
const outDir = SRC;

const PROMPT = `Reference image 1 is the approved EURO SUMMER raffle card. Produce a FULL-BLEED version of its artwork with NO frame and NO border at all.
KEEP IDENTICAL: the big chunky 3D block CAPITAL letters spelling "EURO" over "SUMMER" on two centered lines, each letter a window into its European city (Santorini, Paris/Eiffel, Rome/Colosseum, Monaco; Barcelona/Sagrada Família, Amalfi, Mykonos windmills, Venice canal, London/Big Ben, the Matterhorn); the warm golden-hour Mediterranean panorama; and the single gold ribbon banner under "SUMMER" reading EXACTLY "$20K TRIP GIVEAWAY" (one line, correct spelling, exactly that amount — NOT $200K).
REMOVE COMPLETELY: the ornate gold Art-Deco filigree ticket border, all corner flourishes, and the deep navy + gold-pinstripe outer margin. EXTEND the golden-hour Mediterranean panorama (sky, sea, cliffside villages) outward so the illustration BLEEDS edge-to-edge and fills the ENTIRE 2048x1024 canvas with NO frame, NO border, NO solid margin, NO vignette. Center the EURO SUMMER letters and banner as before. No "ADMIT ONE", no dates/URLs/barcodes.`;

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
console.log("Generating FULL-BLEED EURO SUMMER base (no border)...");
const form = new FormData();
form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
form.append("image[]", new Blob([fs.readFileSync(path.join(SRC, REF))], { type: "image/png" }), "approved-euro-summer.png");
const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const item = ((await res.json()).data || [])[0];
if (!item?.b64_json) { console.error("no image"); process.exit(1); }
const out = `${outDir}/${stamp}_euro-summer-FULLBLEED.png`;
fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${out}`);
