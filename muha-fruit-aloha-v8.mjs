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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE TARGET — 3D Pixar/animation-quality rendered fruit-characters, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING ALOHA PASSION RUSH PRINTED POSTER ARTWORK — a flat printed piece of artwork that already exists. Place it IN the scene AS-IS, do NOT redesign, redraw, or reinterpret it. Treat it like a printed decal that physically exists.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

BODY PROPORTIONS (CRITICAL — last version was too short/stocky, fix this):
- TALL, SLIM, WILLOWY model-like figure — supermodel-level slender proportions
- LONG ELEGANT NECK with defined collarbones
- NARROW SHOULDERS, slim torso, hourglass figure (defined waist, subtle hip-flare)
- Head proportional to body — NOT an oversized cartoonish big-head-tiny-body style
- The character reads as a tall sexy adult woman, not a chibi or stocky cartoon
- Think: high-fashion runway model body proportions, just rendered in Pixar 3D style
- Long graceful arms and slender wrists

PERSONALITY: ULTRA FLIRTY SEDUCTIVE TROPICAL BOMBSHELL — sultry half-lidded smolder, mischievous SMIRK with one corner of red-orange glossy lips raised, lips slightly parted, optional gentle lip-bite. Head tilted slightly down, eyes glancing UP through long thick eyelashes. One hand raised gracefully (touching her hair, chin, or lower lip). Femme-fatale tropical Bond-girl energy. NO tears, NO sad expression.

- HEAD: large stylized PASSION FRUIT (pearly purple-yellow glossy with subtle dimples and freckles). Proportional to body — about head-to-body ratio 1:6 (model proportions).
- HAIR: 6-8 distinct PALM FRONDS cascading past her shoulders to mid-back — central spine + thin pointed leaflets fanning out symmetrically, vibrant glossy green, tousled and voluminous.
- HIBISCUS: 3-4 pink-red hibiscus blooms tucked into the palm-fronds.
- EYES: huge almond-shaped half-lidded sultry gaze, long thick mascara'd lashes, iris warm honey-amber.
- LIPS: glossy bold RED-ORANGE, pouty, half-smile/smirk.
- POSE: tall standing 3/4 body turn, one hip cocked sideways (model contrapposto stance), one shoulder forward, one hand raised gracefully (to face), the other hand on her hip or shoulder — full flirty supermodel pose.
- OUTFIT: cropped open-collar HAWAIIAN SHIRT tied at her midriff (showing her slim waist and toned stomach), slipping off one shoulder, tropical hibiscus + palm-leaf + water-wave print in coral/red-orange/yellow/pink. The cropped tie at the waist emphasizes her slim hourglass figure.

THE FLAVOR BADGE — PLACED AS A FLAT PRINTED POSTER (badge preservation locked):
The "ALOHA PASSION RUSH" poster (reference 2) is mounted FLAT on the tropical tiki-bar wooden wall directly behind the character — reference 2 IS the poster, do NOT redesign it. Same typography, colors, hibiscus flowers, water splashes — placed AS-IS. Position: upper background behind her head/shoulders, large enough that ALOHA / PASSION / RUSH are readable. Flat 2D printed graphic mounted on the wall, no perspective warping.

BACKGROUND ATMOSPHERE: moody Hawaiian sunset — warm orange-red gradient sky, blurred palm silhouettes, sparkle bokeh. Warm cinematic key light from upper right.

COMPOSITION: 9:16 vertical. Character framed WAIST-UP (showing her slim waist, knotted shirt midriff, and hip cock) filling ~75% of frame height. Tall slender proportions clearly visible. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT render her as short or stocky — she is TALL and SLENDER (model build)
- Do NOT give her an oversized cartoon head with tiny body — head proportional to body
- Do NOT make her face chubby or babyish — sleek mature feminine features
- Do NOT redraw or restyle the "ALOHA PASSION RUSH" poster (preserve reference 2 exactly)
- Do NOT use generic green dreadlocks (palm fronds required)
- Do NOT add other characters
- Do NOT include the Muha brand logo
- Do NOT change her flirty smirk personality`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v8-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
