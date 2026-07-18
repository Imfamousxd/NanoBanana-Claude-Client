#!/usr/bin/env node
// gpt-image-2 flyer with ONE consistent watercolor background (no bars) and the logos
// rendered INTO the art (passed as refs). Medium quality, 3 small refs, retries, 3 candidates.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/integrated";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_ref.png";

const PROMPT = `Design ONE seamless, professionally art-directed PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Elegant, expensive, calm; soft lavender / plum / cream / soft-gold palette.

BACKGROUND: a SINGLE, CONSISTENT soft purple watercolor background that flows seamlessly across the ENTIRE graphic from top to bottom. Do NOT add any solid white or cream bars, panels, boxes or empty bands anywhere — the watercolor wash and delicate florals are continuous and consistent through the whole composition, including behind the logos. Everything sits on this one unified background.

Use the references and INTEGRATE them naturally into that single background (painted in, soft-edged, never looking pasted or boxed):
- Reference image 1 = the "Becca Boo Beauty" brand logo. Reproduce it faithfully (calligraphy "Becca Boo", "BEAUTY", purple butterfly + florals) and blend it into the TOP of the flyer as the brand mark.
- Reference image 2 = the "NuLumin BIO-SCIENCES" partner logo (vertical 5-color spectrum bar + wordmark). Reproduce it faithfully, smaller, blended into the BOTTOM.
- Reference image 3 = the THREE purple-capped vials. Reproduce them and their white "NuLumin" labels faithfully (BPC-157, Glow Blend, GHK-Cu), tallest "Glow Blend" centered, as the hero product with soft realistic shadows and gentle reflections.

HEADLINE in the upper area, spelled EXACTLY: "Peptides Available Now" — "Peptides" in a large bold high-contrast serif in deep plum, "Available Now" in an elegant bold calligraphy script; crisp and highly legible.
A softly rounded pill BUTTON lower down, spelled EXACTLY: "Get Started Today".
Keep generous breathing room around the headline and vials; a few tasteful florals/butterflies in the corners, never covering text, logos or vials.

Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars or boxes, nothing pasted-looking or hard-edged, no watermark.`;

async function genOnce(name) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", PROMPT);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(BB)], { type: "image/png" }), "becca.png");
  form.append("image[]", new Blob([fs.readFileSync(NU)], { type: "image/png" }), "nulumin.png");
  form.append("image[]", new Blob([fs.readFileSync(TRIO)], { type: "image/png" }), "vials.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form, signal: AbortSignal.timeout(240000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) throw new Error("no image");
  const out = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(out, Buffer.from(data[0].b64_json, "base64"));
  console.log(`✓ ${out}`);
  return out;
}
async function gen(name) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}
const outs = [];
for (const n of ["int1", "int2", "int3"]) { const o = await gen(n); if (o) outs.push(o); }
if (outs.length) { try { (await import("child_process")).execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/3`);
