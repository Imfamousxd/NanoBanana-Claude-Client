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
const STYLE_REF_1 = "AI Fruit VIdeos Muha/Character Example/character to recreate.png";
const STYLE_REF_2 = "AI Fruit VIdeos Muha/Generated Characters/Aloha Passion Rush.png";
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/FROZEN POMEGRANATE.png";

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar fruit-characters where THE HEAD IS LITERALLY THE WHOLE FRUIT.
Reference 2 = PREVIOUSLY APPROVED CHARACTER in this series — match her hyper-detailed Pixar 3D render quality exactly.
Reference 3 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER ARTWORK — a flat printed piece that already exists. DO NOT redesign, redraw, restyle, or reinterpret reference 3 in any way. Treat reference 3 as a literal pre-existing image that gets placed AS-IS into the scene.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered to MATCH reference 2's realism):

CRITICAL AGE — ADULT WOMAN (mid-20s).

HEAD CONSTRUCTION — FULL POMEGRANATE FRUIT WITH ENTIRELY RED FACE:
- The entire head is a complete whole pomegranate fruit — round, plump, intact
- THE ENTIRE FACE SURFACE — from forehead to chin, including cheeks and around the eyes — is DEEP POMEGRANATE-RED FRUIT SKIN
- ZERO human skin tone anywhere on the face — no peach/beige cheeks, no flesh-colored areas — every visible inch of the face is the pomegranate-red glossy fruit skin
- The face is the FRUIT itself, like how the banana character's face in reference 1 is entirely banana-yellow, or how reference 2's character has the passion fruit face
- Pomegranate CALYX (5-6 leathery brown-pink crown petals) on top of the round red fruit-head
- Large expressive Pixar EYES embedded in the red fruit-face (the only non-red areas are the eye whites and lips)
- Lips embedded in the red face (red-tinted lips, naturally blending with the surrounding fruit skin)
- Subtle frost glaze across the top of the pomegranate skin
- NO crack, NO split, NO exposed seeds — full intact red fruit-head

BODY ANATOMY (STRICT):
- Adult human female body — slim trendy proportions (1:7 head-to-body)
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — no extra limbs

PERSONALITY — MEAN POPULAR GIRL: Regina-George ultra-snobby clique queen, dismissive sneer + eye-roll + smug smirk + chin tilted up.

POSE: arms crossed TIGHT in front of her chest (left over right), hands tucked into opposite elbow crooks, hip cocked, head tilted back looking down her nose.

HAIR: long sleek glossy POMEGRANATE-RED hair (slightly different red than the face — more saturated) in a high-end blowout, with frosted icy highlights.

EYES: mature feminine almond-shaped, narrowed in disdain, sharp eyeliner, long thick lashes, iris ICY BLUE matching the badge "FROZEN" color.

OUTFIT — POPULAR-GIRL CASUAL: fitted cropped top in deep pink-red or pastel icy blue + high-waisted denim/skirt + small gold chain + hoop earrings + 1-2 ice cubes near her shoulders as bokeh.

THE FLAVOR BADGE — FLAT PRINTED POSTER (PRESERVE REFERENCE 3 EXACTLY):
The "FROZEN POMEGRANATE" poster (reference 3) is mounted FLAT on the modern wall behind her. CRITICAL: this poster is reference 3 placed AS-IS — do NOT generate a "your own version" of the badge. Treat reference 3 as the literal artwork being displayed on the wall. The poster shows:
- The exact same "FROZEN" word in icy blue display lettering with frost effects (as drawn in reference 3)
- The exact same "Pomegranate" pink-red italic script lettering (as drawn in reference 3)
- The exact same two whole pomegranates on left and cracked-open pomegranate on right (as drawn in reference 3)
- The exact same ice cubes scattered around (as drawn in reference 3)
- The exact same dripping ice at the bottom (as drawn in reference 3)
- All as a flat 2D printed graphic on the wall, no perspective warping
Position: upper background behind her head/shoulders, large enough to be clearly readable.

If the typography, fruits, ice, or splashes in the poster look different from reference 3, you have failed. Reference 3 IS the poster.

BACKGROUND ATMOSPHERE: chic frozen-yogurt-shop / trendy ice-cream-parlor at twilight — modern decor, cool ambient lighting (blue + pink), blurred pastel decor, sparkle bokeh.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Badge poster upper background.

CRITICAL NEGATIVES:
- Do NOT have any human skin tone on her face — ENTIRE FACE IS POMEGRANATE-RED FRUIT SKIN
- Do NOT redraw or restyle the badge poster — copy reference 3 EXACTLY
- Do NOT change the badge typography fonts/colors from reference 3
- Do NOT show any crack on her head
- Do NOT generate extra limbs — exactly 2 arms / 2 hands
- Do NOT make her cartoony (match reference 2's realism)
- Do NOT add other characters
- Do NOT include the Muha brand logo`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(STYLE_REF_1), inline(STYLE_REF_2), inline(FLAVOR_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v8-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
