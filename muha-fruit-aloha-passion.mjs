#!/usr/bin/env node
// Nano Banana — Aloha Passion Rush fruit-drama character
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

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact aesthetic: 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting with warm orange/red key light and deep shadow falloff, soap-opera-drama emotional energy, telenovela-meme aesthetic, shallow depth of field with soft bokeh background. Same render quality, same lighting, same emotional theatrical drama as reference 1.

Reference 2 is the FLAVOR TARGET — "Aloha Passion Rush." This determines the character's fruit identity and tropical themed color palette: passion fruit (purple-yellow), hibiscus flowers (vibrant pink/red), palm leaves, tropical Hawaiian sunset vibes, warm reds/oranges/yellows.

SCENE — create a single 9:16 portrait composition with ONE hero character (face/upper-body framing, similar to reference 1):

THE CHARACTER: a single Aloha-Passion-Rush themed fruit-character, full Pixar 3D render. The character's HEAD is a large stylized PASSION FRUIT with a leafy green crown of hibiscus flowers (vibrant red-orange hibiscus blooms peeking from the top). Skin texture: pearly purple-yellow passion fruit exterior with subtle dimples and freckles, glossy with light reflection. Inside hint of orange-yellow flesh. Large expressive EYES (almond-shaped, glossy, exaggerated cartoon scale — 1.4x normal anime/Pixar eye size), thick eyelashes, glossy plump lips. Wearing a casual cropped HAWAIIAN SHIRT (open-collared, tropical floral print in warm coral/red/yellow palette) over a fitted tank. Around her neck: a small hibiscus-flower lei.

THE DRAMATIC EMOTION (match the soap-opera vibe of reference 1): she has a dramatically WOUNDED / BETRAYED expression — eyes wide and glossy with the verge of tears welling but not falling, lower lip quivering, one hand raised to her chest in shock, head turned slightly to the side as if just hearing devastating news. Telenovela "I can't believe this is happening" energy. Tropical drama queen.

BACKGROUND: a moody Hawaiian sunset — soft warm orange-red gradient sky, soft palm tree silhouettes blurred in shallow depth of field, a few fireflies or sparkle light specks, atmospheric haze. The lighting is cinematic warm key light from the upper right (golden orange) with deep moody shadow on the left, rim light catching the character's hibiscus crown.

COMPOSITION: 9:16 vertical portrait orientation, character framed from chest up filling ~75% of frame height, eyes positioned at upper-third rule. Hyper-detailed Pixar/Cinema 4D/Octane-quality 3D render. 4K maximum resolution. Cinematic shallow depth of field. Warm cinematic color grade (orange/red/amber dominant, with soft pink hibiscus accents).

Negative: do not break the 3D Pixar style, do not draw it flat or 2D, do not omit the dramatic emotional expression, do not use a generic tropical scene, do not include text or graphics, do not include the Muha brand logo or any logo, do not include other characters in the foreground (background figures fine).`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
