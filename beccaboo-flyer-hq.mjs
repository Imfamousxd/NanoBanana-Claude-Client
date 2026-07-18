#!/usr/bin/env node
// Refined HIGH-quality flyer test: clean solid logo bands, restrained editorial design.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/hq";
fs.mkdirSync(OUT_DIR, { recursive: true });
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";
const QUALITY = process.env.Q || "high";
const NAMES = (process.env.NAMES || "hq_test").split(",");

const PROMPT = `Ultra-premium, elegant PORTRAIT flyer for a luxury women's beauty studio announcing peptides. Editorial, refined, expensive and calm — like a high-end skincare house advertisement. GENEROUS negative space, uncluttered and intentional (NOT busy, NOT crowded).
- TOP ~16%: a CLEAN, SOLID, FLAT soft-cream band, completely EMPTY (reserved for a logo) — absolutely no flowers, texture, shadow or text inside this band.
- HEADLINE just below the band, reading EXACTLY: "Peptides Available Now" — "Peptides" in a large, bold, high-contrast serif in deep plum; "Available Now" in a refined bold calligraphy script. Crisp, elegant, with clean breathing room around it.
- The THREE purple-capped research-peptide vials from the reference image reproduced FAITHFULLY (clear glass, lavender flip caps, white "NuLumin" labels: BPC-157, Glow Blend, GHK-Cu), the tallest "Glow Blend" centered, beautifully lit with soft realistic studio shadows and gentle reflections on a clean surface.
- A refined, softly rounded PILL BUTTON reading EXACTLY: "Get Started Today".
- Only a FEW delicate watercolor florals and one subtle butterfly, placed tastefully in the corners — restrained, airy, NEVER over the text or vials, NEVER cluttered.
- BOTTOM ~11%: a CLEAN, SOLID, FLAT soft-cream band, EMPTY (reserved for a partner logo) — no flowers or text inside it.
Soft lavender / plum / cream / soft-gold palette. Polished, photographic, sharp focus, professionally art-directed.
Render ONLY these two text strings exactly: "Peptides Available Now" and "Get Started Today".
Negative: no other text, no misspellings, no gibberish, no clutter, no busy background, no flowers in the top or bottom bands, no extra logos, no watermark.`;

async function genOnce(name) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", PROMPT);
  form.append("size", "1024x1536");
  form.append("quality", QUALITY);
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(TRIO)], { type: "image/png" }), "vials.png");
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` },
    body: form, signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) throw new Error("no image");
  const out = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(out, Buffer.from(data[0].b64_json, "base64"));
  console.log(`✓ ${out} (${Math.round((Date.now() - t0) / 1000)}s, ${QUALITY})`);
  return out;
}
async function gen(name) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}
let ok = 0;
for (const n of NAMES) { const o = await gen(n.trim()); if (o) ok++; }
console.log(`Done ${ok}/${NAMES.length}`);
