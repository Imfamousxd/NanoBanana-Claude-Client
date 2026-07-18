#!/usr/bin/env node
// v3 fixes: Azure / Juicy Melon / Kiwi Mojito still have fruit IN FRONT of letters -> force
// the text to be the front-most opaque layer that HIDES any fruit behind it. Sunset Sherbet ->
// add an actual glowing SETTING SUN behind the text. Feeds v2 back in, writes *_v3.jpg.
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

const KEEP = `This is a glossy hyper-realistic 3D "flavor badge" logo (Cinema 4D / Octane style) on a transparent background shown as a light grey+white CHECKERBOARD transparency grid. KEEP EXACTLY: the wording/spelling, the lettering font + 3D bevel/gloss, the text colors and color-themed strokes, the glossy 3D render look, and the SAME checkerboard transparency-grid background (clean cutout — no solid/photo background).`;

// Strong layering instruction for the "fruit still in front" badges.
const FRONT = `THE PROBLEM TO FIX: right now some fruit/leaves overlap and sit IN FRONT OF the letters — this is WRONG.
FIX: The title text must be the absolute FRONT-MOST layer — 100% opaque and fully on top of everything. Redraw so the lettering COMPLETELY COVERS AND HIDES any element behind it: wherever a fruit, leaf, or splash overlaps a letter, the LETTER is in front and the fruit is hidden behind it (you should see the letter, not the fruit).
ALSO reposition and slightly shrink the fruit so the bulk of it clusters BELOW the words and around the outer edges/corners, NOT across the middle of the letters. After the edit, every single letter must be 100% visible and unobstructed, with no fruit/leaf/splash crossing in front of any letter.`;

const EDITS = [
  { file: "Azure_Wild_Berry", src: "v2", prompt: `${KEEP}\n\n${FRONT}\n\nKeep the same berries (blueberries, raspberry, blackberry) and glossy blue water-splash, just send them BEHIND the "AZURE WILD BERRY" text and around the edges.` },
  { file: "Juicy_Melon", src: "v2", prompt: `${KEEP}\n\n${FRONT}\n\nKeep the same juicy fruit (watermelon slice, cantaloupe/melon wedge, kiwi), just send them BEHIND the "JUICY MELON" text and around the edges.` },
  { file: "Kiwi_Mojito", src: "v2", prompt: `${KEEP}\n\n${FRONT}\n\nKeep the same glossy kiwi slices, lime, and mint, just send them BEHIND the "KIWI MOJITO" text and around the edges.` },
  { file: "Sunset_Sherbet", src: "v2", prompt: `${KEEP}\n\nADD A GLOWING SETTING SUN behind the text: a luminous warm golden-orange sun disc sitting low BEHIND the "SUNSET SHERBET" lettering as if setting on a horizon, radiating a soft sunset gradient (golden → orange → coral → pink → purple) and gentle light rays outward from behind the text. The sun and glow sit BEHIND the text — every letter stays fully in front and unobstructed. Keep the rest of the canvas TRANSPARENT (the grey+white checkerboard must still show at the corners/edges) — do NOT fill the whole background with a solid sky. Keep the pastel sherbet scoops / ice-cream / candy elements BEHIND the text and around the edges, none in front of any letter.` },
];

async function run(file, src, prompt) {
  const srcPath = path.join(DIR, `${file}_realistic_${src}.jpg`);
  const body = {
    contents: [{ parts: [inline(srcPath), { text: prompt + "\n\nRender high resolution, 4:3 aspect ratio matching the source. Output the full edited badge." }] }],
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
      const out = path.join(DIR, `${file}_realistic_v3.jpg`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`);
      return out;
    }
  }
  console.error("  no image in response");
  return null;
}

for (const { file, src, prompt } of EDITS) await run(file, src, prompt);
console.log("\nDone — v3 edits written.");
