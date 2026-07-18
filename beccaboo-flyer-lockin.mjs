#!/usr/bin/env node
// LOCK-IN set: both logos at TOP (co-brand), beautiful gold CTA, DIFFERENT background
// per variant, equal vials, bold legible headline. gpt-image-2 medium, 3 refs, retries.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = "Becca Boo Flyer/gptimage/lockin";
fs.mkdirSync(OUT_DIR, { recursive: true });
const BB = "Becca Boo Flyer/gptimage/refs/beccaboo_ref.png";
const NU = "Becca Boo Flyer/gptimage/refs/nulumin_ref.png";
const TRIO = "Becca Boo Flyer/gptimage/refs/vial_trio_equal.png";

const COMMON = `Design ONE polished, premium PORTRAIT digital flyer for a luxury women's beauty studio now offering research peptides. Professionally art-directed, refined and balanced.

CO-BRAND LOGOS AT THE TOP (important): place BOTH brand logos together at the very TOP as a partnership lockup — the "Becca Boo Beauty" logo (reference 1) as the larger primary mark, and the "NuLumin BIO-SCIENCES" logo (reference 2, a vertical 5-color spectrum bar + wordmark) as a smaller secondary mark beside or just below it, optionally separated by a slim elegant vertical divider. Reproduce BOTH faithfully, painted naturally into the design (soft-edged, never pasted or boxed), and make sure BOTH are clearly visible. Do NOT place any logo at the bottom of the flyer.

HEADLINE just below the logos, spelled EXACTLY "Peptides Available Now": a BOLD, UPRIGHT, very legible elegant display (a strong refined serif) — NOT cursive, NOT script, NOT a plain flat sans. Commanding and premium. Color it for strong contrast against this version's background.

VIALS: from reference 3 — the three purple-capped vials, reproduced faithfully with white "NuLumin" labels (BPC-157, Glow Blend, GHK-Cu). Render ALL THREE THE EXACT SAME SIZE and height, in a neat row on one baseline (do NOT enlarge the middle one).

CTA — make it genuinely BEAUTIFUL: the "Get Started Today" button is a smooth rounded button with a rich polished GOLD gradient (or deep plum with a bright gold border), a soft drop shadow lifting it off the background, a subtle glossy sheen, refined padding, and a small elegant arrow. It should look like a high-end luxury brand's call-to-action. Absolutely NOT a flat, dull, plain pill. Spell EXACTLY "Get Started Today".

Tasteful, balanced, not cluttered and not plain. Render on-image text EXACTLY and ONLY: "Becca Boo Beauty", "BEAUTY", "Peptides Available Now", "Get Started Today", "NuLumin", "BIO-SCIENCES", and the vial labels. Negative: no logo at the bottom, no cursive headline, no plain flat CTA, no other text, no misspellings, no gibberish, no duplicated headlines, no white/cream bars or boxes, vials must be equal size, nothing pasted-looking, no watermark.

BACKGROUND FOR THIS VERSION (each version must look clearly different): `;

const STYLES = [
  ["L1_lavender", "a soft, dreamy LAVENDER WATERCOLOR background with gentle blooms and a few delicate florals in the corners; airy and light. Headline in deep plum."],
  ["L2_marble", "a luxe CREAM & SOFT-GOLD MARBLE background — pale ivory with subtle grey-gold veining and a refined gold hairline frame; elegant and clean. Headline in deep plum."],
  ["L3_plum", "a dramatic DEEP PLUM / AUBERGINE gradient background with a soft luminous spotlight glow behind the vials and a few faint gold sparkles; moody and luxe. Headline and text in warm cream/ivory with gold accents for contrast."],
  ["L4_blush", "a warm romantic BLUSH-PINK to LAVENDER gradient background with soft watercolor petals drifting; gentle and feminine. Headline in deep plum/mauve."],
  ["L5_minimal", "a clean MODERN MINIMAL background — soft white fading to pale lilac with a very subtle paper texture and a thin gold border frame; lots of calm negative space, almost no florals. Headline in deep plum."],
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
const outs = [];
for (const [n, s] of STYLES) { const o = await gen(n, s); if (o) outs.push(o); }
if (outs.length) { try { (await import("child_process")).execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`Done ${outs.length}/${STYLES.length}`);
