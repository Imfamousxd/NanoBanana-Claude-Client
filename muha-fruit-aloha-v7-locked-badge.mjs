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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/ALOHA PASSION RUSH.png";

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE TARGET — 3D Pixar/animation-quality rendered fruit-characters, expressive cartoon faces, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING ALOHA PASSION RUSH PRINTED POSTER ARTWORK. It is a finished printed piece of artwork that already exists. Your job is to place it IN the scene as a flat printed poster — NOT to redesign it, NOT to redraw it, NOT to reinterpret it. Treat reference 2 like a printed sticker decal or movie poster that physically exists and is being photographed inside the scene.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

PERSONALITY: ULTRA FLIRTY SEDUCTIVE TROPICAL BOMBSHELL — sultry half-lidded smolder, mischievous SMIRK with one corner of red-orange glossy lips raised, lips slightly parted, optional gentle lip-bite. Head tilted slightly down, eyes glancing UP through long thick eyelashes. One hand raised gracefully (touching her hair, chin, or lower lip). Femme-fatale tropical Bond-girl energy. NO tears, NO sad expression.

- HEAD: large stylized PASSION FRUIT (pearly purple-yellow glossy with subtle dimples and freckles).
- HAIR: 6-8 distinct PALM FRONDS cascading past her shoulders — central spine + thin pointed leaflets fanning out symmetrically, vibrant glossy green, tousled.
- HIBISCUS: 3-4 pink-red hibiscus blooms tucked into the palm-fronds.
- EYES: huge almond-shaped half-lidded sultry gaze, long thick mascara'd lashes, iris warm honey-amber.
- LIPS: glossy bold RED-ORANGE, pouty, half-smile/smirk.
- POSE: 3/4 body turn, one shoulder forward, flirty body language.
- OUTFIT: cropped open-collar Hawaiian shirt slipping off one shoulder, tropical hibiscus + palm-leaf + water-wave print.

THE FLAVOR BADGE — PLACED AS A FLAT PRINTED POSTER IN THE SCENE:

The "ALOHA PASSION RUSH" poster (reference 2) is mounted on the tropical tiki-bar wooden wall directly behind the character. You are NOT designing this poster — reference 2 IS the poster. Treat reference 2 as a literal pre-existing printed image that already exists, and place it on the wall AS-IS.

How to render the poster placement:
- The poster is a FLAT 2D printed graphic stuck/mounted on the wood-textured wall
- It is rendered in the scene at the same lighting as the wall (slight warm glow from key light)
- Its TYPOGRAPHY, COLORS, GRAPHICS, FLOWERS, WATER SPLASHES — every visual detail — match reference 2 EXACTLY because reference 2 IS the poster being placed
- Position: upper-center of the 9:16 frame, behind the character's head/shoulders
- Size: large enough that the words ALOHA / PASSION / RUSH are clearly readable
- Mounted flat on the wood — no warping, no perspective distortion, no shadow obscuring it

This is NOT a creative rendering of a poster — this is a flat placement of reference 2 onto the wall surface.

BACKGROUND ATMOSPHERE: moody Hawaiian sunset visible past the tiki wall edges — warm orange-red gradient, blurred palm silhouettes, sparkle bokeh. Warm cinematic key light from upper right.

COMPOSITION: 9:16 vertical. Character chest up filling ~60-65% of frame. Pixar/Cinema 4D/Octane 3D render quality on the character. The poster on the wall stays as the flat 2D printed graphic from reference 2.

CRITICAL NEGATIVES — DO NOT REDESIGN THE POSTER:
- Do NOT redraw or restyle the "ALOHA PASSION RUSH" lettering — use exactly the typography from reference 2
- Do NOT change the colors of the typography from reference 2
- Do NOT replace or relocate the hibiscus flowers on the poster — they appear exactly as in reference 2
- Do NOT alter, add, or remove the cyan water-splash wave elements behind the typography
- Do NOT add additional decorations to the poster
- Do NOT change the poster's aspect ratio or layout
- Do NOT 3D-render the poster's elements (it stays a flat printed graphic)
- Do NOT reinterpret reference 2 in your "own style" — copy it exactly
- The poster on the wall must look like reference 2 was directly placed on the wall

Also: do not omit the character's flirty smirk, do not use generic green dreadlocks (palm fronds required), do not add other characters, do not include the Muha brand logo.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(STYLE_REF), inline(FLAVOR_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v7-locked-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
