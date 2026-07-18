#!/usr/bin/env node
// Becca Boo × NuLumin flyer via Nano Banana Pro (gemini-3-pro-image-preview) at 4K.
// Logos + vials passed as references so NB paints them INTO the design (integrated,
// soft edges — no pasted-on look). 2 candidates.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const OUT_DIR = "Becca Boo Flyer/nb";
fs.mkdirSync(OUT_DIR, { recursive: true });

const BB = "Becca Boo Flyer/assets/beccaboo_logo_clean.png";
const NU = "Becca Boo Flyer/assets/nulumin_logo_trim.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";

const inline = (p) => ({ inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Design a single, ultra-premium, beautifully art-directed PORTRAIT (4:5) DIGITAL FLYER for a luxury women's beauty studio that is now offering research peptides. Editorial, elegant, expensive and calm — like a high-end skincare house advertisement. Cohesive soft lavender / plum / cream / soft-gold palette, gentle watercolor atmosphere, generous negative space, refined and uncluttered. Everything must look like ONE seamless, professionally designed piece — no element should look pasted on; all edges soft and integrated into the artwork.

Use the THREE reference images as follows:
- Reference image 1 is the "Becca Boo Beauty" brand logo. Reproduce it FAITHFULLY and place it, well-integrated, across the TOP of the flyer as the brand mark (keep its calligraphy "Becca Boo", "BEAUTY", and the purple butterfly + florals). Make it sit naturally on the cream background, not like a sticker.
- Reference image 2 is the "NuLumin BIO-SCIENCES" partner logo (a vertical 5-color spectrum bar beside the wordmark). Reproduce it FAITHFULLY, smaller, integrated near the BOTTOM as the supplier mark.
- Reference image 3 shows the THREE purple-capped research-peptide vials. Reproduce the vials and their white "NuLumin" labels FAITHFULLY (BPC-157, Glow Blend, GHK-Cu), tallest "Glow Blend" centered, beautifully lit with soft realistic studio shadows and gentle reflections on a clean surface, as the hero product.

Headline in the upper area, spelled EXACTLY: "Peptides Available Now" — "Peptides" in a large bold high-contrast serif in deep plum, "Available Now" in an elegant bold calligraphy script; crisp and highly legible with clean space around it.
A refined, softly rounded pill BUTTON lower down, spelled EXACTLY: "Get Started Today".
Add only a few delicate watercolor florals and one subtle butterfly tastefully in the corners — restrained, never covering the text, logos or vials.

Spell on-image text EXACTLY and ONLY these strings: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no other text, no misspellings, no gibberish, no duplicated headlines, no watermark, nothing pasted-looking or hard-edged.`;

async function gen(i) {
  const body = {
    contents: [{ parts: [inline(BB), inline(NU), inline(TRIO), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`c${i} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(OUT_DIR, `flyer_nb_c${i}.png`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`✓ ${out}`); return out;
    }
  }
  console.error(`c${i}: no image`); return null;
}

const outs = [];
for (let i = 1; i <= 2; i++) { const o = await gen(i); if (o) outs.push(o); }
if (outs.length) { try { execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/2`);
