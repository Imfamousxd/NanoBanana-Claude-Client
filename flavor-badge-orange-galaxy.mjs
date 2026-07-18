#!/usr/bin/env node
// Orange Dream flavor badge — replace the fruit/cream decor with an ORANGE GALAXY theme.
// Keep the glossy 3D "Orange Dream" lettering exactly; two-pass (strip fruit -> add galaxy behind).
// Locked Nano Banana Pro workflow (gemini-3-pro-image-preview), checkerboard transparency grid.
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
const inline = (p, mime = "image/jpeg") => ({ inline_data: { mime_type: mime, data: fs.readFileSync(p).toString("base64") } });

const KEEP = `Glossy hyper-realistic 3D "flavor badge" logo (Cinema 4D / Octane style) on a light grey+white CHECKERBOARD transparency grid. KEEP the wording/spelling, lettering font + 3D bevel/gloss, text colors and color-themed strokes, the glossy render look, and the SAME checkerboard transparency-grid background (clean cutout, no solid/photo background).`;

async function gen(parts, outName, label) {
  const body = {
    contents: [{ parts }],
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

const SRC = path.join(DIR, "Approved/Orange_Dream.jpg");
const TITLE = "ORANGE DREAM";

console.log("→ Orange Dream → Orange Galaxy");

// Pass 1: strip all fruit/cream/popsicle/splash to clean text only.
const strip = `${KEEP}\n\nEDIT: Remove ALL fruit, orange slices, whole oranges, creamsicle popsicles, whipped-cream swirls, juice splashes, and droplets from the image, leaving ONLY the glossy 3D "${TITLE}" title text by itself ("Orange" in orange, "Dream" in cream), perfectly intact and unchanged, centered on the clean checkerboard transparency background. Cleanly erase everything except the lettering — no fruit, no cream, no popsicles, no splashes, no leftover fragments. Keep every letter exactly as it is.\n\nRender high resolution, 4:3, output the clean text-only badge.`;
const clean = await gen([inline(SRC), { text: strip }], "Orange_Dream_textonly.jpg", "pass 1: strip fruit/cream");

if (clean) {
  // Pass 2: add ORANGE GALAXY behind the text.
  const galaxy = `${KEEP}\n\nThis badge already has FINISHED glossy 3D title text "${TITLE}" in the FOREGROUND ("Orange" in orange, "Dream" in cream). Add an ORANGE GALAXY / COSMIC theme as a decorative backdrop arranged BEHIND the text — replacing what would normally be fruit. The galaxy elements: a swirling deep-space nebula in rich ORANGE tones (amber, tangerine, coral, warm gold) with darker cosmic shadows, glowing stars and sparkles, scattered glossy 3D planets / orbs with orbital rings (in orange/amber/cream tones to match the flavor), a soft spiral-galaxy swirl, stardust and light flares. Keep it glossy, premium, hyper-real 3D — like a cosmic candy galaxy, NOT flat. It should still feel like the "Orange Dream" flavor world, just cosmic/galactic instead of fruit.\n\nABSOLUTE RULE — DO NOT COVER THE LETTERS: the existing title text is the front-most layer and must stay 100% visible and unobstructed. Place ALL galaxy/nebula/planets/stars BEHIND the lettering — clustered ABOVE the top edge of the text, BELOW the bottom edge of the text, and at the LEFT/RIGHT corners. Where a cosmic element extends toward a letter, the LETTER stays in front and hides it. NO planet, nebula, star, or glow may be drawn on top of, across, or in front of any letter. Keep the corners/edges showing the grey+white checkerboard transparency grid — do NOT fill the entire canvas with a solid space background; the galaxy is a contained decorative cluster behind the text, not a full bleed. Every letter must read perfectly clearly after the edit.\n\nRender high resolution, 4:3, output the full badge with the orange galaxy behind the text.`;
  await gen([inline(clean), { text: galaxy }], "Orange_Dream_galaxy_v1.jpg", "pass 2: add orange galaxy behind");
}

console.log("\nDone — Orange Galaxy badge written.");
