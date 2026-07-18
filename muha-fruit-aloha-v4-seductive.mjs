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

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 is the FLAVOR BADGE — "ALOHA PASSION RUSH" with red-orange display lettering, vibrant pink-red HIBISCUS flowers, lush green PALM LEAVES, BLUE WATER-SPLASH accents.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered) — A SINGLE PASSION-FRUIT FEMALE CHARACTER:

PERSONALITY (CRITICAL — this is what makes her unique in the lineup): she is a CONFIDENT SEDUCTIVE TROPICAL HEARTBREAKER — the one who breaks hearts, not the one who cries. Sultry, knowing, smirking, dangerously charming. She just delivered devastating news with a smile. Vibe: "I'm the rush — you can't handle me." Telenovela "femme fatale tropical bombshell" energy.

- HEAD: a large stylized PASSION FRUIT (pearly purple-yellow exterior with subtle dimples and freckles, glossy with light reflection).
- HAIR: voluminous PALM-FROND HAIR — vibrant glossy green palm leaves cascading like long flowing dreadlocks past her shoulders, lush and tousled.
- HIBISCUS FLOWERS: 3-4 vibrant red-pink hibiscus blooms tucked prominently into the palm-leaf hair — one statement bloom above her right ear (tucked confidently).
- EYES: large almond-shaped, SMOLDERING HALF-LIDDED bedroom-eye gaze — confident, knowing, slightly looking sideways/down at the viewer like she's sizing them up. Long thick eyelashes. Iris a warm honey-amber.
- LIPS: glossy bold RED-ORANGE matching the badge's display lettering color, curled into a SMIRK / sultry half-smile. One corner of her mouth raised mischievously.
- POSE: confident and seductive — one hand raised to her chin or playing with a strand of palm-leaf hair, head tilted slightly down with eyes glancing up. Shoulders relaxed, body language saying "I know exactly what I'm doing." NO tears, NO sad expression — this is the SEDUCER.
- WATER-SPLASH ACCENT: a few crystal water droplets caught around her — maybe one or two on her collarbone like she just emerged from the ocean. NOT tears, just glamorous moisture.
- HAWAIIAN SHIRT: a cropped open-collar Hawaiian shirt (loosely tied or unbuttoned at top to show collarbones), tropical print explicitly featuring hibiscus + palm-leaf + water-wave motifs from reference 2 in coral/red-orange/yellow/pink palette.

THE FLAVOR BADGE IN THE SCENE: the "ALOHA PASSION RUSH" badge from reference 2 appears as a large rendered SIGN on a tropical wooden tiki-bar wall behind her, large enough to be unmistakably readable, warmly lit, in the upper background. Pixel-faithful to reference 2.

BACKGROUND ATMOSPHERE: moody Hawaiian sunset — warm orange-red gradient sky, blurred palm silhouettes, atmospheric haze, soft sparkle bokeh, distant blue water-splash element. Cinematic warm key light from upper right (golden orange) with deep shadow on the left, rim light catching her hibiscus crown.

COMPOSITION: 9:16 vertical. Character framed from chest up filling ~65-70% of frame height. Badge sign in upper background. Hyper-detailed Pixar/Cinema 4D/Octane 3D render, shallow depth of field, warm cinematic color grade.

Negative: do NOT make her sad/crying/teary (she is the SEDUCER not the wounded one), do NOT use a wide-eyed innocent expression (must be sultry half-lidded smolder), do NOT remove the smirk (signature trait), do NOT omit the palm-leaf hair or hibiscus blooms or badge sign, do NOT break the 3D Pixar style, do NOT add other characters, do NOT include the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v4-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
