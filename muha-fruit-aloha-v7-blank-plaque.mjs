#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const STYLE_REF = "AI Fruit VIdeos Muha/Character Example/character to recreate.png";

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

PERSONALITY: ULTRA FLIRTY SEDUCTIVE TROPICAL BOMBSHELL — sultry half-lidded smolder, mischievous SMIRK with one corner of red-orange glossy lips raised (lips slightly parted, optional gentle lip-bite). Head tilted slightly down, eyes glancing UP at viewer through long thick eyelashes. One hand raised gracefully (touching her hair, chin, or lower lip). "I'm the rush — you can't handle me" femme-fatale tropical Bond-girl energy. NO tears, NO sad expression.

- HEAD: large stylized PASSION FRUIT (pearly purple-yellow glossy exterior with subtle dimples and freckles).
- HAIR: 6-8 distinct PALM FRONDS cascading from her head past her shoulders — each frond is unmistakably palm-shaped (central spine + thin pointed leaflets fanning out symmetrically). Vibrant glossy tropical green, tousled.
- HIBISCUS FLOWERS: 3-4 vibrant pink-red hibiscus blooms tucked into the palm-fronds (one statement bloom above her right ear).
- EYES: huge almond-shaped, half-lidded sultry bedroom gaze, long thick eyelashes with mascara, iris warm honey-amber.
- LIPS: glossy bold RED-ORANGE, full and pouty, in a confident half-smile/smirk.
- POSE: 3/4 body angle, one shoulder slightly forward, flirty body language.
- OUTFIT: cropped open-collar Hawaiian shirt slipping off one shoulder, tropical hibiscus + palm-leaf + water-wave print in coral/red-orange/yellow/pink.

THE BACKGROUND ELEMENT — A LARGE BLANK WOODEN PLAQUE/SIGN:
CRITICAL: behind the character, mounted on a rustic tropical tiki-bar wooden wall, there is a LARGE BLANK WOODEN PLAQUE/SIGN — a rectangular wooden sign with no text, no logo, no illustrations, no decoration on it whatsoever. JUST a clean blank wood surface. The plaque has:
- A rectangular shape, slightly wider than tall (roughly 4:3 aspect ratio)
- Light tan/cream wooden grain texture (no carvings, no painted text — completely blank)
- A simple darker wooden frame border around the edges
- Positioned in the UPPER CENTER of the frame, behind the character's head/shoulders area
- Size: approximately 50% of the frame width, perfectly centered horizontally
- Lit by warm cinematic key light from the upper right

The plaque is intentionally blank because a separate flavor badge will be added to it later via compositing. You MUST leave this plaque completely empty/blank — do NOT draw any letters, words, flowers, decorations, or graphics on it. Just clean blank wood with grain texture.

BACKGROUND ATMOSPHERE: moody Hawaiian sunset — warm orange-red gradient sky, blurred palm silhouettes, atmospheric haze, sparkle bokeh. Tropical tiki-bar wooden wall behind her with the blank plaque mounted on it.

COMPOSITION: 9:16 vertical. Character chest up filling ~60% of frame, leaving the upper portion clearly visible for the blank plaque. Pixar/Cinema 4D/Octane 3D render, shallow depth of field, warm cinematic color grade.

CRITICAL NEGATIVE: do NOT draw ANY text on the plaque, do NOT draw "ALOHA PASSION RUSH" anywhere, do NOT draw any flowers or decorations on the plaque, do NOT make the plaque a finished signed product — it MUST be a completely BLANK wooden plaque (just wood grain). Also: do not omit the character's flirty smirk, do not make her sad, do not use generic green dreadlocks (palm fronds required), do not add other characters, do not include the Muha brand logo.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(STYLE_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v7-blank-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
