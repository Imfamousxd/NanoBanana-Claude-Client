#!/usr/bin/env node
// Headline-free + button-free bases for A (centered) and C (editorial). gpt renders only
// bg + logos(top) + equal vials on a glow, leaving the headline + lower-center OPEN so we
// composite crisp real type. gpt-image-2 medium.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/bases";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE polished, premium, CLEAN PORTRAIT digital flyer BACKGROUND for a luxury women's beauty studio. Crisp, refined, elegant, uncluttered with generous negative space.

CO-BRAND LOGOS AT THE TOP: BOTH logos together at the very TOP as a partnership lockup — "Becca Boo Beauty" (reference 1) larger primary + "NuLumin BIO-SCIENCES" (reference 2, vertical 5-color spectrum bar + wordmark) smaller secondary, slim elegant divider. Reproduce BOTH faithfully, crisp and clearly visible, blended naturally. NO logo anywhere else.

VIALS from reference 3: three purple-capped vials with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE THE EXACT SAME SIZE and height, crisply, sitting on a soft LUMINOUS GLOW so they pop, with clean soft reflections.

CRITICAL: do NOT render any HEADLINE, title, or large words anywhere — leave the headline area completely EMPTY. Also do NOT render any button, pill, badge or call-to-action. The ONLY text in the image is the two logos at the top and the small vial labels — nothing else. Leave clean open background where a headline and a button will be added later.

A whisper of refined gold accent and a few delicate florals confined to the corners. Negative: NO headline, NO title text, NO "Peptides" word, NO button, NO "Get Started" text, no extra words anywhere except the logos and vial labels, no misspellings, no white/cream bars, vials must be equal size, nothing pasted-looking, no watermark.

LAYOUT FOR THIS VERSION: `;

const STYLES = [
  ["A_base", "CLEAN SYMMETRIC centered — logos centered at the top; leave a generous EMPTY open band in the upper-middle (below the logos) for a headline; the three equal vials in a crisp centered row in the lower-middle on a soft glow; open space at the very bottom. Soft dreamy LAVENDER watercolor background."],
  ["C_base", "CLEAN EDITORIAL — logos at the top; leave a LARGE EMPTY open area across the upper half for a big headline; the three equal vials in a tidy centered row across the lower third on a soft glow; minimal soft white-to-pale-lilac background with a thin gold frame and lots of calm negative space."],
];

async function genOnce(name, style) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", COMMON + style);
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
async function gen(name, style) {
  for (let a = 1; a <= 3; a++) {
    try { return await genOnce(name, style); }
    catch (e) { console.error(`${name} attempt ${a}: ${e.message}`); if (a < 3) await new Promise(r => setTimeout(r, 3000 * a)); }
  }
  return null;
}
let ok = 0;
for (const [n, s] of STYLES) { const o = await gen(n, s); if (o) ok++; }
console.log(`Done ${ok}/${STYLES.length}`);
