#!/usr/bin/env node
// Orange Dream — ORANGE GALAXY badge, FRESH lettering (better font). User rejected the old font.
// Generate 3 font directions over the same orange-galaxy backdrop, glossy hyper-real 3D,
// checkerboard transparency grid. Nano Banana Pro (gemini-3-pro-image-preview).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const DIR = "Flavor Badges";

async function gen(prompt, outName, label) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "4K" } },
  };
  console.log(`  · ${label}`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`    HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(DIR, outName);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`    ✓ ${out}`);
      return out;
    }
  }
  console.error("    no image"); return null;
}

const BASE = `A glossy hyper-realistic 3D "flavor badge" logo (Cinema 4D / Octane render style) on a light grey+white CHECKERBOARD transparency grid (clean cutout PNG look, NO solid or photo background — the checkerboard shows at the corners/edges).

The badge reads "ORANGE DREAM" on two stacked lines: "Orange" on top, "Dream" below. Spell it EXACTLY: O-R-A-N-G-E / D-R-E-A-M. Every letter crisp, clean, correctly formed, and perfectly legible — premium professional lettering (NOT amateur, NOT distorted, NOT messy).

BACKDROP (behind the text only): an ORANGE GALAXY / cosmic theme — a swirling deep-space nebula in rich orange tones (amber, tangerine, coral, warm gold) with darker cosmic shadows, glowing stars and sparkles, a soft spiral-galaxy swirl, scattered glossy 3D planets/orbs with orbital rings in orange/amber/cream tones, stardust and light flares. Glossy, premium, hyper-real 3D — a cosmic candy galaxy. The galaxy is a CONTAINED decorative cluster behind the text (clustered above, below, and at the left/right corners), NOT a full-bleed background — keep the checkerboard transparency grid visible at the outer corners/edges.

ABSOLUTE RULE: the title text is the FRONT-most layer and stays 100% visible — no planet, nebula, star, or glow crosses in front of any letter. The text sits cleanly on top of the galaxy.`;

const FONTS = [
  {
    name: "v2a_chunky",
    desc: `LETTERING STYLE: a bold, chunky, modern ROUNDED 3D display font — thick confident strokes, smooth rounded terminals, a clean glossy candy bevel with a bright top highlight, a crisp cream/white outline, and a soft drop shadow. "Orange" in glossy orange-to-amber gradient, "Dream" in glossy cream/white. Confident, premium, mouth-watering — like a high-end frozen-treat brand logo. Tight, even kerning.`,
  },
  {
    name: "v2b_brush",
    desc: `LETTERING STYLE: a smooth, energetic 3D BRUSH-SCRIPT font with confident flowing strokes and clean connected letters — elegant but bold and legible, with a glossy candy bevel, bright specular highlights, a cream outline, and a soft shadow. "Orange" in glossy orange, "Dream" in glossy cream. Premium, lively, dessert-brand feel — clean and refined, NOT messy or cramped.`,
  },
  {
    name: "v2c_extrude",
    desc: `LETTERING STYLE: a strong condensed BOLD SANS 3D extruded font — clean geometric uppercase-feel letterforms with a deep chrome-and-candy 3D extrusion, glossy front faces, a bright bevel highlight, gold rim light, and a cream outline. "ORANGE" in glossy orange with gold edges, "DREAM" in glossy cream with orange edges. Punchy, premium, poster-grade — perfectly even and legible.`,
  },
];

console.log("→ Orange Dream / Orange Galaxy — 3 fresh font directions");
for (const f of FONTS) {
  await gen(`${BASE}\n\n${f.desc}\n\nRender high resolution, 4:3, output the full glossy badge.`, `Orange_Galaxy_${f.name}.jpg`, f.name);
}
console.log("\nDone — 3 font variations written.");
