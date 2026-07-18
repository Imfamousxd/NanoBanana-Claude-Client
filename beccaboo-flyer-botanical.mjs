#!/usr/bin/env node
// 5 botanical (v2-style) gpt-image-2 flyer variants with a BOLDER headline + bigger
// reserved logo bands. Single trio ref, medium quality, retries.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/botanical";
fs.mkdirSync(OUT_DIR, { recursive: true });
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";

const COMMON = `Premium PORTRAIT digital flyer for a high-end women's beauty studio announcing peptides — a LUSH PURPLE WATERCOLOR BOTANICAL style: soft lilac and plum peonies, roses, lilac sprigs and eucalyptus, a delicate butterfly accent, and fine gold-foil flecks framing the composition.
LAYOUT (must hold):
- Leave the very TOP ~17% as a CLEAN, EMPTY soft-cream band with NOTHING in it (reserved for a brand logo) — keep all florals out of this band.
- A HEADLINE just below it reading EXACTLY: "Peptides Available Now". Make it BIG, BOLD and HIGHLY LEGIBLE: "Peptides" in a heavy high-contrast serif with thick bold strokes in deep plum, "Available Now" in an elegant but bold calligraphy script. Keep a clear, uncluttered halo of clean space around the headline so the text stands out crisply — the flowers frame the edges and corners and NEVER overlap or cover the letters.
- Feature the THREE purple-capped research-peptide vials from the reference image FAITHFULLY (clear glass, lavender-purple flip caps, white "NuLumin" labels reading BPC-157, Glow Blend, GHK-Cu), the tallest "Glow Blend" vial centered.
- A softly rounded PILL BUTTON reading EXACTLY: "Get Started Today", clearly legible.
- Leave the very BOTTOM ~12% as CLEAN, EMPTY space (reserved for a partner logo) — keep florals out of this band.
Lavender / plum / cream / soft-gold palette; feminine, lush, expensive.
Render ONLY these two text strings exactly: "Peptides Available Now" and "Get Started Today".
Negative: no other text, no misspellings, no gibberish letters, no duplicated words, no extra logos, no watermark; do NOT cover the headline letters with flowers.
STYLE FOR THIS VERSION: `;

const STYLES = [
  ["b1_glowhalo", "peonies clustered in the lower-left and upper-right corners with a single butterfly near the headline, and a soft pale glow directly behind the headline letters for extra contrast and pop."],
  ["b2_arch", "a graceful floral garland arch sweeping across the top, framing the headline, with abundant lilac and roses and trailing eucalyptus down both sides and generous gold flecks."],
  ["b3_panel", "a soft translucent cream watercolor panel sitting behind the headline so the bold letters rest on a clean plate for maximum legibility, with florals blooming outward from behind the panel."],
  ["b4_deep", "richer, deeper plum and magenta blooms massed along both side edges and the bottom for a dramatic saturated frame, with the bold headline in crisp near-white serif for strong contrast against the deep florals."],
  ["b5_airy", "airy and light — scattered delicate watercolor wildflowers and three small butterflies with lots of soft cream space, and a very prominent, clean, bold deep-plum headline."],
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
