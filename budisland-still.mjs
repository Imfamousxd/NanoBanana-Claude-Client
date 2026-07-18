#!/usr/bin/env node
// BUD ISLAND intro — opening still: a plane skywriting "BUD ISLAND" in clouds over a tropical island.
// Pixar-3D animated style (matches the fruit-drama cast world). Nano Banana Pro, 16:9, 4K (clean text).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const outDir = "AI Fruit VIdeos Muha/Bud Island Intro";
fs.mkdirSync(outDir, { recursive: true });

const PROMPT = `A bright, cheerful PIXAR / DreamWorks-style 3D ANIMATED-FEATURE establishing shot, cinematic wide 16:9.

A cute little vintage seaplane banks across a brilliant sunny tropical sky, trailing big, puffy, fluffy white SKYWRITING CLOUD-LETTERS that spell "BUD ISLAND" in clean, bold, rounded cloud lettering. Spell it EXACTLY: B-U-D (space) I-S-L-A-N-D — "BUD ISLAND", every letter crisp, legible and correctly formed, the words arcing gracefully across the upper sky.

Below: a lush, stylized tropical paradise island — swaying palm trees, turquoise lagoon, white-sand beach, and a colorful modern villa with a pool, in glossy vibrant animated-movie 3D. Warm golden-hour sunlight, scattered fluffy cumulus clouds, a few seabirds, sun-flare and sparkle. Saturated, joyful, premium animated-film color and lighting — a fun "Love Island meets Pixar" title-card vibe.

NO other text besides the "BUD ISLAND" skywriting. Render high resolution, cinematic 16:9.`;

const body = { contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "4K" } } };
console.log("Generating BUD ISLAND opener still...");
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) { const out = path.join(outDir, "00_opener_budisland_still.png"); fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64")); console.log(`✓ ${out}`); process.exit(0); }
}
console.error("no image"); process.exit(1);
