#!/usr/bin/env node
// v4: TWO-PASS fix for Azure / Juicy Melon / Kiwi Mojito (fruit kept rendering in FRONT).
//   Pass 1: strip fruit -> clean glossy text plate (keep text + splash exactly).
//   Pass 2: re-add fruit strictly BEHIND the existing text (model told not to cover letters).
// Sunset Sherbet: single pass, make the setting sun much BIGGER/brighter.
// Writes *_realistic_v4.jpg.
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

const TWO_PASS = [
  { file: "Azure_Wild_Berry", title: "AZURE WILD BERRY", fruit: "glossy blueberries, blackberries, and raspberries with a few green leaves and glossy blue water-splash accents" },
  { file: "Juicy_Melon", title: "JUICY MELON", fruit: "glossy watermelon slices, cantaloupe/melon wedges, honeydew, and small melon balls" },
  { file: "Kiwi_Mojito", title: "KIWI MOJITO", fruit: "glossy kiwi slices, lime slices, fresh mint leaves, and a few water/ice accents" },
];

for (const { file, title, fruit } of TWO_PASS) {
  console.log(`\n→ ${file}`);
  // Pass 1: strip to clean text
  const strip = `${KEEP}\n\nEDIT: Remove ALL fruit, berries, leaves, and decorative splashes from the image, leaving ONLY the glossy 3D "${title}" title text by itself, perfectly intact and unchanged, centered on the clean checkerboard transparency background. Cleanly erase everything except the lettering — no fruit, no leaves, no splashes, no leftover fragments. Keep every letter exactly as it is.\n\nRender high resolution, 4:3, output the clean text-only badge.`;
  const clean = await gen([inline(path.join(DIR, `${file}_realistic_v3.jpg`)), { text: strip }], `${file}_textonly.jpg`, "pass 1: strip fruit");
  if (!clean) continue;
  // Pass 2: add fruit strictly behind
  const add = `${KEEP}\n\nThis badge already has FINISHED glossy 3D title text "${title}" in the FOREGROUND. Add ${fruit} as a decorative backdrop arranged BEHIND the text.\n\nABSOLUTE RULE — DO NOT COVER THE LETTERS: the existing title text is the front-most layer and must stay 100% visible and unobstructed. Place ALL fruit/leaves/splash BEHIND the lettering — clustered ABOVE the top edge of the text, BELOW the bottom edge of the text, and at the LEFT/RIGHT corners. Where a fruit extends toward a letter, the LETTER stays in front and hides the fruit behind it. NO fruit, leaf, or splash may be drawn on top of, across, or in front of any letter. Do NOT let the bottom fruit cover the bottoms of the letters — keep that fruit below the letters' lowest edge. Every letter must read perfectly clearly after the edit.\n\nRender high resolution, 4:3, output the full badge with fruit behind the text.`;
  await gen([inline(clean), { text: add }], `${file}_realistic_v4.jpg`, "pass 2: add fruit behind");
}

// Sunset Sherbet: bigger, brighter setting sun
console.log(`\n→ Sunset_Sherbet`);
const sun = `${KEEP}\n\nEDIT: Make the SETTING SUN clearly visible and prominent behind the "SUNSET SHERBET" text. Render a LARGE, bright, glowing golden-orange sun disc low behind the lettering as if setting on a horizon — it should be obvious and eye-catching, with a strong warm radial glow (golden → orange → coral → pink) and soft light rays fanning out from behind the text. The sun and glow sit BEHIND the text; every letter stays fully in front and unobstructed. Keep the rest of the canvas TRANSPARENT (grey+white checkerboard still visible at the corners/edges) — do NOT fill the whole background with a solid sky. Keep the pastel sherbet scoops / candy elements BEHIND the text and around the edges, none in front of any letter.\n\nRender high resolution, 4:3, output the full badge.`;
await gen([inline(path.join(DIR, "Sunset_Sherbet_realistic_v3.jpg")), { text: sun }], "Sunset_Sherbet_realistic_v4.jpg", "bigger setting sun");

console.log("\nDone — v4 edits written.");
