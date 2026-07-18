#!/usr/bin/env node
// Targeted edits to 6 flavor badges. GLOBAL RULE: text always fully in FRONT of and
// UNOBSTRUCTED by all fruit/elements; fruit sits behind text + around edges only.
// Keep the hyperreal glossy C4D/Octane 3D style, same wording/font/colors, and the
// SAME light grey+white checkerboard transparency-grid background (these are cutouts).
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
const inline = p => ({ inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

const GLOBAL = `This image is a glossy, hyper-realistic 3D "flavor badge" logo (Cinema 4D / Octane render style) sitting on a transparent background shown as a light grey-and-white CHECKERBOARD transparency grid.

KEEP EXACTLY (do not change): the wording/spelling of the text, the lettering font and 3D bevel/gloss style, the text colors and color-themed strokes, the overall hyper-real glossy 3D render look, and the SAME light grey+white checkerboard transparency-grid background (keep it as a clean cutout — do NOT add a solid or photographic background, do NOT change the checkerboard).

CRITICAL GLOBAL RULE — TEXT IS ALWAYS IN FRONT AND UNOBSTRUCTED: every letter of the title must be fully visible, on top of everything, with NOTHING covering it. No fruit, leaf, splash, drip, or decorative element may overlap, cross, or sit in front of any letter. All fruit and decorative elements sit BEHIND the text and only peek out around the outer edges / corners of the lettering.

THE SPECIFIC EDIT FOR THIS BADGE:`;

const EDITS = [
  {
    file: "Azure_Wild_Berry",
    edit: `Reposition the berries (blueberries, raspberry, blackberry) and the blue water-splash so they all sit BEHIND the "AZURE WILD BERRY" text and tuck around the outer edges. Any berry currently overlapping or sitting in front of the letters must be moved behind/below them so every letter is fully unobstructed. Keep the same berries and glossy blue splash style.`,
  },
  {
    file: "Blackberry_Kush",
    edit: `REMOVE ALL CANNABIS / MARIJUANA ELEMENTS COMPLETELY: delete the green-and-tan cannabis buds/nugs on the right side and anywhere else, and do NOT include any cannabis bud, flower, nug, weed leaf, or marijuana element anywhere in the image. Replace that area with more glossy blackberries and the purple juice splash. Keep ALL berries/fruit and splash BEHIND the "BLACKBERRY KUSH" text and around the edges — every letter fully unobstructed.`,
  },
  {
    file: "Juicy_Melon",
    edit: `Reposition all the fruit (watermelon slice, cantaloupe/melon wedge, kiwi) so they sit BEHIND the "JUICY MELON" text and around the outer edges. Any fruit currently overlapping or in front of the letters must move behind them so every letter is fully unobstructed. Keep the same juicy glossy fruit.`,
  },
  {
    file: "Kiwi_Mojito",
    edit: `Reposition the kiwi slices and mint leaves so they sit BEHIND the "KIWI MOJITO" text and around the outer edges. Any kiwi currently overlapping or in front of the letters must move behind them so every letter is fully unobstructed. Keep the same glossy kiwi and mint.`,
  },
  {
    file: "Pineapple_Kush",
    edit: `Do NOT include any cannabis bud, flower, nug, weed leaf, or marijuana element anywhere — if any bud or flower is present, remove it entirely and replace with pineapple / tropical fruit elements. Keep the pineapple and tropical elements BEHIND the "PINEAPPLE KUSH" text and around the edges, every letter fully unobstructed. (Keep the word "KUSH" as styled text.)`,
  },
  {
    file: "Sunset_Sherbet",
    edit: `Add a warm SUNSET-colored radiant glow/halo behind the "SUNSET SHERBET" text — a soft semi-transparent gradient bloom radiating orange → coral → pink → purple directly behind the lettering, evoking a sunset sky glow. This glow is part of the badge artwork; KEEP the rest of the canvas transparent (the light grey+white checkerboard must still show at the corners and edges) — do NOT fill the whole background with a solid sky. Keep the pastel sherbet scoops / candy elements BEHIND the text and around the edges, every letter fully unobstructed.`,
  },
];

async function run(file, edit) {
  const src = path.join(DIR, `${file}_realistic_v1.jpg`);
  const prompt = `${GLOBAL}\n${edit}\n\nRender at high resolution, 4:3 aspect ratio matching the source. Output the full edited badge.`;
  const body = {
    contents: [{ parts: [inline(src), { text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "4K" } },
  };
  console.log(`\n→ ${file}`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(DIR, `${file}_realistic_v2.jpg`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`);
      return out;
    }
  }
  console.error("  no image in response");
  return null;
}

for (const { file, edit } of EDITS) {
  await run(file, edit);
}
console.log("\nDone — 6 badge edits written as *_realistic_v2.jpg");
