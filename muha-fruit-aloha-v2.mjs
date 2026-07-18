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

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact aesthetic: 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting with warm orange/red key light and deep shadow falloff, soap-opera-drama emotional energy, telenovela-meme aesthetic, shallow depth of field with soft bokeh background.

Reference 2 is the FLAVOR BADGE — the "ALOHA PASSION RUSH" logo graphic (the cartoon banner-style logo with red/orange display lettering, hibiscus flowers, palm leaves, and water/wave accents). This badge MUST appear PROMINENTLY in the rendered scene so anyone glancing at the image instantly knows what flavor the character represents.

SCENE — 9:16 portrait composition with ONE hero character + the flavor badge clearly visible:

THE CHARACTER (foreground, hero position): a single Pixar-3D-rendered passion-fruit-themed character. HEAD is a large stylized PASSION FRUIT (pearly purple-yellow exterior with subtle dimples and freckles, glossy with light reflection) topped with a leafy green crown of vibrant red-orange hibiscus flowers. Large expressive almond-shaped EYES (exaggerated cartoon scale, glossy with thick eyelashes), glossy plump lips. Wearing a casual cropped HAWAIIAN SHIRT (open-collared, tropical floral print in coral/red/yellow palette) over a fitted tank. Small hibiscus-flower lei around her neck.

THE DRAMATIC EMOTION: dramatically WOUNDED / BETRAYED expression — eyes wide and glossy with tears welling at the brim (not falling), lower lip quivering, one hand raised to her chest in shock, head turned slightly to the side. Telenovela "I can't believe this is happening" energy.

THE FLAVOR BADGE PLACEMENT: the "ALOHA PASSION RUSH" badge from reference 2 appears as a large rendered SIGN/BANNER hanging on a wooden tropical beach-bar wall directly BEHIND the character. The badge should be:
- LARGE enough to be unmistakably readable (the words "ALOHA PASSION RUSH" clearly legible)
- Positioned in the upper-background of the 9:16 frame, behind the character's shoulder/head area
- Lit by the warm cinematic key light so it glows slightly
- Rendered as a real physical sign with light wood grain backing — like a tropical tiki-bar's flavor menu sign
- Pixel-faithful to reference 2's typography, color palette, and floral decorations

The badge anchors the scene: any viewer immediately sees "Aloha Passion Rush" + the passion-fruit character + the drama, and understands the character represents that flavor.

BACKGROUND ATMOSPHERE (behind/around the sign): moody Hawaiian sunset tones — soft warm orange-red gradient sky, blurred palm tree silhouettes, atmospheric haze, soft sparkle bokeh. Shallow depth of field — the badge sign is slightly softer focus than the character but still clearly readable.

COMPOSITION: 9:16 vertical portrait. Character framed from chest up filling ~65-70% of frame height. The flavor badge sign occupies the upper-third background area, large and recognizable. Hyper-detailed Pixar/Cinema 4D/Octane 3D render, cinematic shallow depth of field, warm cinematic color grade (orange/red/amber dominant with pink hibiscus accents).

Negative: do NOT flatten or 2D-ify the badge (it must look like a real physical sign integrated into the scene), do NOT shrink the badge so much it becomes illegible, do NOT obscure the badge text behind the character, do NOT break the 3D Pixar style of the character, do NOT add other characters in the foreground, do NOT include the Muha brand logo, do NOT include the words "Muha" anywhere.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v2-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
