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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality fruit-characters where THE HEAD IS LITERALLY THE WHOLE FRUIT (like the banana/strawberry/carrot heads). Hyper-detailed Cinema 4D/Octane render quality, dramatic moody cinematic lighting, telenovela-meme aesthetic.

Reference 2 = the PREVIOUSLY APPROVED CHARACTER in this same series (Aloha Passion Rush). MATCH HER STYLE EXACTLY: same hyper-detailed Pixar 3D render quality, same realistic skin/fruit texturing, same cinematic shallow-depth-of-field, same mature adult proportions, same level of photo-realistic detail. NOT cartoony, NOT flat, NOT chibi. This new character must look like she belongs in the same scene/series as reference 2.

Reference 3 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS as a flat printed poster, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered to MATCH reference 2's realism level):

CRITICAL AGE — YOUNG ADULT WOMAN (mid-20s), matching the maturity level of reference 2.

HEAD CONSTRUCTION — FULL WHOLE INTACT POMEGRANATE:
- The entire head is a complete whole pomegranate fruit — round, plump, intact
- Deep glossy pink-red pomegranate skin with hyper-realistic texture (subtle bumps, light reflections, micro-details — NOT flat cartoon shading)
- Pomegranate CALYX (5-6 leathery brown-pink crown petals) on top
- Large expressive Pixar EYES embedded in the front (same eye style as reference 2)
- Expressive mouth/lips embedded in the face
- Subtle frost glaze on top
- NO crack, NO opening, NO exposed seeds — full intact fruit

BODY ANATOMY (STRICT):
- Adult human female body — slim trendy proportions matching reference 2 (1:7 head-to-body)
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, each with five fingers
- No duplicate or extra limbs

PERSONALITY — MEAN POPULAR GIRL: ultra-snobby clique queen, Regina-George dismissive attitude, sneer + eye-roll + tight smug smirk + chin tilted up.

POSE: arms crossed TIGHT in front of her chest (left over right), hands tucked into the crooks of the opposite elbows, hip cocked aggressively, head tilted back looking down her nose.

HAIR: long sleek glossy POMEGRANATE-RED hair in a high-end blowout cascading past her shoulders, with frosted icy highlights, hyper-realistic strand detail matching reference 2's hair quality.

EYES: mature feminine almond-shaped, narrowed in disdain, sharp eyeliner, long thick mascara'd lashes, iris ICY BLUE matching the badge's "FROZEN" color. Same Pixar eye realism as reference 2.

LIPS: glossy deep PINK-RED matching badge "Pomegranate" color, upper lip curled in a sneer.

OUTFIT — POPULAR-GIRL CASUAL (modern trendy):
- Fitted cropped TOP in deep pink-red or pastel icy blue (matching badge palette)
- High-waisted denim shorts or mini skirt visible at her waist
- Small gold chain necklace, hoop earrings
- 1-2 ice cubes near her shoulders as bokeh elements
- Modern Y2K / contemporary popular-girl wardrobe

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 3 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 3) mounted FLAT on the wall behind her — same typography, pomegranates, ice cubes, dripping ice. Upper background. Flat 2D printed graphic.

BACKGROUND ATMOSPHERE: chic frozen-yogurt-shop / trendy ice-cream-parlor at twilight — modern decor, cool ambient lighting (blue + soft pink), blurred pastel decor, sparkle bokeh. Same cinematic depth-of-field and lighting quality as reference 2.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Badge poster upper background.

CRITICAL STYLE NEGATIVES:
- Do NOT render her in a flat cartoon or chibi style — must match reference 2's hyper-realistic Pixar 3D render quality
- Do NOT make her look like a 2D animation character — full 3D Cinema 4D / Octane render quality with realistic lighting, shadows, and material textures
- Do NOT make her cute/childish — adult woman matching reference 2's maturity level
- Do NOT show ANY crack or seed exposure on pomegranate head
- Do NOT generate extra limbs — EXACTLY 2 arms / 2 hands
- Do NOT redraw the badge poster (preserve reference 3 EXACTLY)
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v7-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
