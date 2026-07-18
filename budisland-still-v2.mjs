#!/usr/bin/env node
// BUD ISLAND opener still v2 — REALISTIC/cinematic (NOT cartoony), 9:16 vertical.
// Skywriting "BUD ISLAND"; plane positioned at the loop of the "D" (to fly THROUGH it in the animation).
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

const PROMPT = `A cinematic, PHOTO-REALISTIC aerial travel shot, vertical 9:16 — like a premium travel commercial / drone-and-aerial cinematography. NOT cartoon, NOT 3D-animated, NOT glossy mobile-game style.

High in a deep blue sunny sky, big bold clean white SKYWRITING SMOKE spells "BUD ISLAND" across the sky — "BUD" on the upper line and "ISLAND" on the line just below it, in clear realistic puffy skywriting smoke letters. Spell it EXACTLY: B-U-D / I-S-L-A-N-D. Every letter crisp and legible.

A small real red-and-white skywriting propeller plane is flying right beside the round loop of the letter "D" in "BUD," trailing a continuous white smoke trail behind it, angled as if it is just about to fly through the open loop of that "D."

Far below, in the lower third of the frame: a stunning realistic turquoise tropical lagoon, white-sand beach, swaying real palm trees, and a sleek luxury modern villa with a pool. Warm late-afternoon golden-hour sunlight, realistic soft cumulus clouds, gentle haze on the horizon, crisp deep depth of field, lens flare, premium cinematic color grade. Photoreal and grounded.

Spell ONLY "BUD ISLAND" — no other text. Render high resolution, vertical 9:16.`;

const body = { contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } } };
console.log("Generating BUD ISLAND opener still v2 (realistic, 9:16)...");
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) { const out = path.join(outDir, "00_opener_budisland_still_v2.png"); fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64")); console.log(`✓ ${out}`); process.exit(0); }
}
console.error("no image"); process.exit(1);
