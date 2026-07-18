#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const ASSETS = "Muha Giveaway Assets";
const OUT_DIR = "Muha Giveaway Redesigned/Disclaimer Styled";

const REFS = [
  `${ASSETS}/mm-gold.png`,
];

const PROMPT = `Design a Muha Members legal-disclaimer poster — pure legal text on a moody Vice City Miami-night background. NO Dodge Challenger. NO giveaway headline. NO "$25,000 CASH + DODGE CHALLENGER" wordmark. NO "MUHA MEMBERS GIVEAWAY" tagline. Just the gold Muha 'M' monogram at the top and the legal disclaimer block beneath it.

REFERENCE IMAGE — the gold Muha 'M' monogram. Render it exactly as shown; do NOT redraw freehand.

LAYOUT (top to bottom):

1. TOP — the gold Muha 'M' monogram (from the reference) centered horizontally, with generous empty space around it. Below the monogram, a small spaced gold-cream caps tagline "MUHA MEMBERS" with a thin gold hairline rule under it. Comfortable vertical gap below the tagline before the legal block begins.

2. LEGAL BLOCK — dense fine-print sweepstakes legal text, set in clean small cream/warm-grey sans-serif against the dark background. CRITICAL ALIGNMENT: EVERY paragraph, EVERY line of EVERY paragraph is HORIZONTALLY CENTERED with equal left and right margins on the canvas. NOT left-aligned. NOT justified. NOT ragged-right. Every line of body text wraps in the middle of the canvas with equal whitespace flanking it. Each paragraph appears as a centered text block. Multiple paragraphs separated by small vertical gaps. Comfortable line-height for legibility. The text MUST read EXACTLY as follows (preserve every word, every punctuation mark, every paragraph break):

PARAGRAPH 1 (slightly emphasized header line, all caps, slightly larger than rest):
NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING.

PARAGRAPH 2 (regular fine print):
Open only to legal Michigan residents 21+. Void where prohibited. Giveaway runs May 7, 2026, through July 30, 2026. Prize consists of one Grand Prize of $25,000 cash and one new, previously untitled 2023 Dodge Challenger from available dealer inventory, plus four Secondary Prizes of $1,000 cash each, subject to availability, substitution, taxes, title, registration, insurance, delivery, pickup, mileage, vehicle condition, and other restrictions stated in the Official Rules. Odds depend on eligible entries received. Sponsored by Michigan Investments 10 dba Muha Meds, MI marihuana license no. AU-P-000171 (Adult Use), in conjunction with participating licensed retailers and other properly licensed MI marihuana businesses involved in lawful product supply, distribution, transportation, transfer, sale, advertising, promotion, or administration.

PARAGRAPH 3:
This is a giveaway/sweepstakes-style promotion, not a raffle, lottery, gambling activity, or wagering activity. No cannabis product awarded as a prize. No cannabis purchase, cannabis use, app download, store visit, or purchase of any kind required for free entry. Entry code submissions and free entries have equal odds. See Official Rules at muhamembers.com.

PARAGRAPH 4:
For use only by individuals 21+. Keep out of reach of children. Do not drive under the influence of marihuana. Poison Control: 1-800-222-1222.

PARAGRAPH 5 (all caps warning, slightly emphasized):
WARNING: USE BY PREGNANT OR BREASTFEEDING WOMEN, OR BY WOMEN PLANNING TO BECOME PREGNANT, MAY RESULT IN FETAL INJURY, PRETERM BIRTH, LOW BIRTH WEIGHT, OR DEVELOPMENTAL PROBLEMS FOR THE CHILD.

CRITICAL: render every word of the legal text faithfully — no abbreviations, no paraphrasing, no missing sentences. The text fills most of the canvas vertically beneath the logo, with comfortable margins on left and right (~10% margins).

BACKGROUND / ATMOSPHERE: deep moody Miami nightscape — silhouette skyline pulsing with red neon, slender palm trees flanking the scene, glowing red and warm neon light bleeding from off-frame city signage, rain-slick black asphalt with reflective puddles, atmospheric red haze, cinematic depth-of-field, slight vignette around the edges. Premium movie-poster atmosphere. The background is darker and slightly lower contrast in the legal-text region so the fine print is easily readable.

COLOR PALETTE: deep maroon/black background, warm cream/beige typography (#E8D5A8 for headers, slightly lighter cream for body legal text), gold ornament accents for the monogram and hairline rule, intense red neon highlights in the background. NO pink, NO cyan, NO teal — strictly red/maroon/cream/gold/black.

NO Art-Deco corner ornaments, NO corner brackets, NO frames around the canvas. Clean dark corners.

Sharp focus, high resolution, premium movie-poster aesthetic.`;

const VARIANTS = [
  { name: "Legal Poster 3-4.png", size: "2160x2880" },
  { name: "Legal Poster 9-16.png", size: "2160x3840" },
];

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

async function generate(variant) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", variant.size);
  form.append("quality", "high");
  form.append("n", "1");
  for (const refPath of REFS) {
    const buf = fs.readFileSync(refPath);
    form.append("image[]", new Blob([buf], { type: mimeForExt(path.extname(refPath)) }), path.basename(refPath));
  }
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) return { ok: false, error: "no b64_json" };
  const dst = path.join(OUT_DIR, variant.name);
  fs.writeFileSync(dst, Buffer.from(item.b64_json, "base64"));
  return { ok: true, dst };
}

console.log(`Generating ${VARIANTS.length} legal posters via gpt-image-2...`);
for (const v of VARIANTS) {
  console.log(`→ ${v.name} (${v.size})`);
  const r = await generate(v);
  if (r.ok) console.log(`  ✓ ${r.dst}`);
  else console.log(`  ✗ ${r.error}`);
}
