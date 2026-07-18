#!/usr/bin/env node
// Becca Boo Beauty × NuLumin peptide flyer via gpt-image-2 EDIT (vials as refs for
// product fidelity). Reserve clean bands top+bottom for the exact logos (composited
// after). Portrait 1024x1536, quality high, 2 candidates.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage";
fs.mkdirSync(OUT_DIR, { recursive: true });

const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";

const PROMPT = `Design a premium, modern DIGITAL FLYER in portrait orientation for a high-end women's beauty studio announcing peptides. Aesthetic: soft lavender-and-plum WATERCOLOR, warm cream paper, delicate gold hairline accents, airy luxury-skincare editorial — feminine, elegant, expensive, calm. Generous white space.

COMPOSITION (top to bottom):
- Leave the very TOP ~16% as a CLEAN, EMPTY soft-cream band with nothing in it (reserved for a brand logo — no text or graphics there).
- A large elegant HEADLINE in the upper third reading EXACTLY: "Peptides Available Now" — set in a high-contrast serif with a flowing calligraphy script accent, beautifully kerned, perfectly spelled.
- In the CENTER, feature the THREE purple-capped research-peptide vials shown in the reference images as the hero product: reproduce each vial and its white label FAITHFULLY from the references (clear glass, lavender-purple flip cap, "NuLumin" label), standing together with the tallest "Glow Blend" vial in the middle, on a soft reflective surface with a gentle luminous glow and soft shadows.
- A softly rounded PILL BUTTON below the vials reading EXACTLY: "Get Started Today".
- Leave the very BOTTOM ~10% as a CLEAN, EMPTY band (reserved for a partner logo).
Scatter a few subtle watercolor florals and one faint butterfly motif in the corners, plus thin gold hairline framing. Cohesive lavender/plum/cream/gold palette.

Spell the on-image text EXACTLY and only these two strings: "Peptides Available Now" and "Get Started Today".
Negative: no other text, no misspellings, no gibberish letters, no extra logos, no watermark, no lorem ipsum, no duplicated words, no brand names other than what is on the vials.`;

async function genOnce(i) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", PROMPT);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(TRIO)], { type: "image/png" }), "vials.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` },
    body: form, signal: AbortSignal.timeout(240000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) throw new Error("no image in response");
  const out = path.join(OUT_DIR, `flyer_gpt_c${i}.png`);
  fs.writeFileSync(out, Buffer.from(data[0].b64_json, "base64"));
  console.log(`✓ ${out}`);
  return out;
}

async function gen(i) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await genOnce(i); }
    catch (e) {
      console.error(`c${i} attempt ${attempt} failed: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  return null;
}

const outs = [];
for (let i = 1; i <= 2; i++) { const o = await gen(i); if (o) outs.push(o); }
console.log(`Done ${outs.length}/2`);
