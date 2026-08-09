#!/usr/bin/env node
// Legibility cleanup pass on the finished open-box interior renders: keep composition
// pixel-identical, re-render the small printed text crisp/sharp/legible (headline, feature
// bullets, COA card, carton branding, product-name labels). One edit generation.
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const DIR = "NuLumin Influencer Box";

const KEEP = `Reference image 1 is a finished studio product photograph of the open NuLumin influencer box, elevated three-quarter angle: flipped-up lid at top showing its printed interior, base tray below with a colored insert holding peptide cartons in die-cut cutouts and product names printed under each cutout, pure white background. Reproduce this photograph EXACTLY — identical camera angle, composition, box, lid interior layout, insert color, carton positions, cutouts, lighting, white background and shadows. Change NOTHING about the layout or the objects. The ONE and only change: re-render every piece of PRINTED TEXT so it is crisp, sharp, high-contrast and perfectly legible — as if the photo were in flawless focus — instead of soft, blurry or garbled. No smudged or nonsense lettering anywhere.`;

const COMMON = `On the flipped-up lid render the headline exactly "A New Light in Peptide Research" (multi-color words) and, beneath it, four small feature bullets with tiny icons reading exactly "3rd-Party Lab Tested", "Made in USA", "Public COAs" and "Fast Shipping"; the tilted white "Certificate of Analysis" card should have a clean sharp header reading "Certificate of Analysis" with "GLP-3 (R)" as the bold compound name and neat rows of small analysis data beneath (legible characters, not scribbles). Each NuLumin carton reads exactly "NuLumin" with "BIO-SCIENCES" beneath in the small logo lockup, all crisp. Keep the insert color and the box unchanged.`;

const KITS = [
  { slug: "adameve",     labels: ["Selank", "PT-141", "KissPeptin"] },
  { slug: "jacked",      labels: ["CJC-1295 + Ipamorelin", "Tesamorelin", "AOD-9604", "KissPeptin"] },
  { slug: "reverseglow", labels: ["Glow Blend", "NAD+", "Epithalon", "Melanotan II"] },
  { slug: "shed",        labels: ["GLP-3 (R)", "Tesamorelin", "CJC-1295"] },
  { slug: "supercharge", labels: ["Klow Blend", "MOTS-C", "NAD+"] },
];

async function run(k) {
  const labelStr = k.labels.map(l => `"${l}"`).join(", ");
  const prompt = `${KEEP} ${COMMON} The product-name labels printed on the insert under the cutouts must be sharp and read exactly, left to right: ${labelStr}. Spell every one of these exactly as written, crisp and legible. Do not add, remove or rename any product. Do not add a kit-name title anywhere — the insert area above the cutouts stays clean empty colored paper. No other text, no misspellings.`;
  const parts = [
    { inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(path.join(DIR, `refs/cleanbase_${k.slug}.jpg`)).toString("base64") } },
    { text: prompt },
  ];
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } } };
  console.log(`→ ${k.slug}...`);
  const reqFile = path.join(os.tmpdir(), `nbc_${k.slug}.json`);
  const resFile = path.join(os.tmpdir(), `nbc_${k.slug}_res.json`);
  fs.writeFileSync(reqFile, JSON.stringify(body));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execFileSync("curl", ["-s", "--max-time", "900", "-X", "POST",
        "-H", `x-goog-api-key: ${API_KEY}`, "-H", "Content-Type: application/json",
        "--data-binary", `@${reqFile}`, "-o", resFile,
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`]);
      const json = JSON.parse(fs.readFileSync(resFile, "utf-8"));
      if (json.error) { console.log(`  API error (${attempt}/3): ${JSON.stringify(json.error).slice(0,160)}`); continue; }
      for (const p of json.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData) {
          const out = path.join(DIR, `box_open_clean_${k.slug}.png`);
          fs.writeFileSync(out, Buffer.from(p.inlineData.data, "base64"));
          console.log(`  ✓ ${out}`); return;
        }
      }
      console.log(`  no image (${attempt}/3)`);
    } catch (e) { console.log(`  curl failed (${attempt}/3): ${String(e.message).slice(0,100)}`); }
  }
  console.error(`  FAILED ${k.slug}`);
}

const want = process.argv.slice(2);
const list = want.length ? KITS.filter(k => want.includes(k.slug)) : KITS;
for (const k of list) await run(k);
console.log("Done.");
