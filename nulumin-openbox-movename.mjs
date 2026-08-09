#!/usr/bin/env node
// Move the kit name in the OPEN-box interior renders: off the base insert, onto the lid top.
// Same angle/composition as the finished open-box shots — one relocation, nothing else.
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

const KEEP = `Reference image 1 is a finished studio product photograph of the open NuLumin influencer box, shot from an elevated three-quarter angle: the flipped-up lid at the top of the frame shows its printed interior ("A New Light in Peptide Research" headline and the Certificate of Analysis card), and the base tray below holds the colored insert with the peptide cartons in their cutouts and the product names printed under each cutout. Reproduce this image EXACTLY — identical camera angle, composition, box, lid interior, insert color, cartons, product-name labels, lighting, background and shadows — with exactly ONE relocation and nothing else:`;

const KITS = [
  { slug: "adameve",     title: "Adam & Eve",    style: "an elegant dark-charcoal serif with a decorative ampersand" },
  { slug: "jacked",      title: "[ JACKED ]",    style: "a bold dark-charcoal monospaced uppercase face with square brackets and wide letter-spacing" },
  { slug: "reverseglow", title: "REVERSE GLOW",  style: "a bold dark-charcoal uppercase sans-serif on two lines (REVERSE over GLOW)" },
  { slug: "shed",        title: "shed",          style: "a bold dark-charcoal lowercase sans-serif with a short dark underline" },
  { slug: "supercharge", title: "SUPER·CHARGE",  style: "a bold dark-charcoal italic uppercase sans-serif with a short dark underline" },
];

async function run(k) {
  const prompt = `${KEEP} the kit name "${k.title}" is currently printed in the colored base insert, centered above the row of cutouts — REMOVE it completely so that area of the insert is clean, empty colored paper matching the surrounding insert color, with no title text there at all. Do NOT add the kit name anywhere else in the image — no title on the lid, no text floating on the background. Everything else stays pixel-identical: the "A New Light in Peptide Research" headline and Certificate of Analysis on the lid, the cartons in their cutouts, the product-name labels printed under each cutout (e.g. "Selank", "PT-141"), the insert color, the pure white background, the camera angle and lighting. The ONLY change is deleting the kit-name title from the insert.`;
  const parts = [
    { inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(path.join(DIR, `refs/openbase_${k.slug}.jpg`)).toString("base64") } },
    { text: prompt },
  ];
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } } };
  console.log(`→ ${k.slug}...`);
  const reqFile = path.join(os.tmpdir(), `nbm_${k.slug}.json`);
  const resFile = path.join(os.tmpdir(), `nbm_${k.slug}_res.json`);
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
          const out = path.join(DIR, `box_open_topname_${k.slug}.png`);
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
