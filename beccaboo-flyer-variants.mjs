#!/usr/bin/env node
// 5 distinct gpt-image-2 flyer variants (single trio ref, medium quality, retries).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/variants";
fs.mkdirSync(OUT_DIR, { recursive: true });
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";

const COMMON = `Premium PORTRAIT digital flyer for a high-end women's beauty studio announcing peptides.
LAYOUT (must hold for every version):
- Leave the very TOP ~14% as a CLEAN, EMPTY soft-cream band with NOTHING in it (reserved for a brand logo).
- A large elegant HEADLINE in the upper area reading EXACTLY: "Peptides Available Now" — high-contrast serif with a flowing calligraphy script accent, beautifully kerned, perfectly spelled.
- Feature the THREE purple-capped research-peptide vials from the reference image FAITHFULLY (clear glass, lavender-purple flip caps, white "NuLumin" labels reading BPC-157, Glow Blend, GHK-Cu), the tallest "Glow Blend" vial in the middle.
- A softly rounded PILL BUTTON reading EXACTLY: "Get Started Today".
- Leave the very BOTTOM ~9% as CLEAN, EMPTY space (reserved for a partner logo).
Cohesive lavender / plum / cream / soft-gold palette; feminine, calm, expensive.
Render ONLY these two text strings exactly: "Peptides Available Now" and "Get Started Today".
Negative: no other text, no misspellings, no gibberish letters, no duplicated words, no extra logos, no watermark.
STYLE FOR THIS VERSION: `;

const STYLES = [
  ["v1_minimal", "airy minimalist — generous soft-cream negative space, one thin gold hairline frame, the vials standing in a clean row on a faint mirror reflection, only two or three tiny watercolor petals. Restrained, modern, breathable."],
  ["v2_botanical", "lush botanical — abundant soft purple watercolor peonies, lilac sprigs and eucalyptus framing the edges, a delicate butterfly accent, fine gold-foil flecks, the vials nestled among the florals."],
  ["v3_glossy", "glossy luxe editorial — a satin/silk lavender backdrop with gentle studio reflections beneath the vials, soft dramatic lighting and a subtle radial glow behind the center vial; high-fashion beauty-ad feel."],
  ["v4_marble", "marble & gold — a pale lavender-veined marble surface, thin art-deco gold linework accents, the vials standing with crisp clean reflections; refined luxury cosmetics-counter look."],
  ["v5_gradient", "dreamy pastel gradient — a soft lavender-to-blush vertical gradient background, the vials floating with delicate soft shadows, faint sparkles and one translucent butterfly; romantic, light and ethereal."],
];

async function genOnce(name, style) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", COMMON + style);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(TRIO)], { type: "image/png" }), "vials.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` },
    body: form, signal: AbortSignal.timeout(240000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) throw new Error("no image");
  const out = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(out, Buffer.from(data[0].b64_json, "base64"));
  console.log(`✓ ${out}`);
  return out;
}

async function gen(name, style) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name, style); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}

let ok = 0;
for (const [name, style] of STYLES) { const o = await gen(name, style); if (o) ok++; }
console.log(`Done ${ok}/${STYLES.length}`);
