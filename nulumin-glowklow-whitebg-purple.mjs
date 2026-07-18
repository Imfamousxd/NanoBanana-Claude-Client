#!/usr/bin/env node
// Recolor the BLUE brand accents (cap, accent bar, dose) on the Glow/Klow WHITE-BG
// studio shots to the KPV purple — keep the studio white background. Nano Banana Pro.
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const D = "/Users/mario/Downloads/nulumin-tissue-purple_plus-glow-klow";
const COLOR_REF = `${D}/tissue-purple-lightstreak/KPV_10mg_purple.jpg`;

const JOBS = [
  { src: `${D}/glow-klow-white-background/Klow-Blend_80mg_white-bg.png`, name: "Klow Blend", dose: "80mg" },
  { src: `${D}/glow-klow-white-background/Glow-Blend_70mg_white-bg.png`, name: "Glow Blend", dose: "70mg" },
];

const inline = (p) => ({ inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

async function run(job) {
  const PROMPT = `Reference 1 is a clean NuLumin Bio-Sciences STUDIO product shot — the "${job.name}" vial standing on a plain light studio WHITE / very-light-grey background — currently with a BLUE brand accent color (blue plastic cap, a blue vertical accent bar on the left of the label, and the '${job.dose}' dose number printed in blue). Reference 2 is another NuLumin vial (KPV) showing the PURPLE/VIOLET brand accent color we want to match.

Recreate reference 1 EXACTLY and pixel-faithfully — IDENTICAL vial, glass, metallic crimp, the same cream/white wrap-label, the 'NuLumin' logo, 'BIO SCIENCES', the italic serif '${job.name}' product name, the boxed research text, the '${job.dose}' dose, the 'Manufactured by NuLumin' line, the same soft studio lighting, reflection and shadow, and the SAME clean studio WHITE / light background — everything in the same place at the same size.

THE ONLY CHANGE: recolor the BLUE BRAND-ACCENT ELEMENTS to the PURPLE/VIOLET of reference 2 (KPV): (1) the plastic CAP changes from blue to the same purple/violet as reference 2's cap; (2) the vertical ACCENT BAR on the left of the label changes from blue to that purple; (3) the '${job.dose}' DOSE number changes from blue to that purple/periwinkle. Match reference 2's exact purple hue.

CRITICAL: KEEP THE BACKGROUND THE SAME CLEAN STUDIO WHITE / LIGHT-GREY — do NOT make the background purple, do NOT add any light streaks or color wash, it stays a plain white studio backdrop. Change ONLY the blue accents to purple; everything else stays identical.

Output a SQUARE 1:1 image matching reference 1's framing.`;

  const body = {
    contents: [{ parts: [inline(job.src), inline(COLOR_REF), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`${job.name} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const bak = job.src.replace(/\.png$/, "_BLUE-original.png");
      if (!fs.existsSync(bak)) fs.copyFileSync(job.src, bak);
      const out = job.src.replace(/\.png$/, "_purple.png");
      const raw = job.src.replace(/\.png$/, "_raw.png");
      fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
      await sharp(raw).resize(724, 724, { fit: "cover" }).png().toFile(out);
      fs.unlinkSync(raw);
      console.log(`OK ${job.name} -> ${out}`);
      return out;
    }
  }
  console.error(`${job.name}: no image`); return null;
}

const outs = [];
for (const j of JOBS) { const o = await run(j); if (o) outs.push(o); }
if (outs.length) { try { execSync(`open -a Preview ${outs.map(o => `"${o}"`).join(" ")}`); } catch {} }
console.log(`DONE ${outs.length}/${JOBS.length}`);
