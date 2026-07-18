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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/FROZEN POMEGRANATE.png";

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality fruit-characters where THE HEAD IS LITERALLY THE WHOLE FRUIT (like the banana/strawberry/carrot heads in reference 1). Hyper-detailed Cinema 4D/Octane render quality, NOT cartoony or flat — realistic Pixar 3D with materials, lighting, and shadows. Dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER ARTWORK — a flat printed piece that already exists. DO NOT redesign, redraw, restyle, or reinterpret reference 2. Treat reference 2 as a literal pre-existing image that gets placed AS-IS on the wall.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered with hyper-realistic detail):

CRITICAL AGE — ADULT WOMAN (mid-20s), NOT child/teen/chibi.

HEAD CONSTRUCTION — FULL POMEGRANATE WITH ENTIRELY RED FACE:
- The entire head is a complete whole pomegranate fruit — round, plump, intact
- THE ENTIRE FACE SURFACE (forehead to chin, cheeks, around eyes) is DEEP POMEGRANATE-RED FRUIT SKIN
- ZERO human skin tone anywhere on the face — no peach/beige cheeks
- The face IS the fruit, like the banana character's face in reference 1 is entirely banana-yellow
- Pomegranate CALYX (5-6 leathery brown-pink crown petals) sitting on top of the round red fruit-head
- Large expressive Pixar EYES embedded in the red fruit-face (only non-red areas: eye whites, lips)
- Red-tinted lips embedded in the face, naturally blending
- Subtle frost glaze on top of the pomegranate skin
- NO crack, NO split, NO exposed seeds — full intact red fruit-head

BODY ANATOMY (STRICT):
- Adult human female body — slim trendy proportions (1:7 head-to-body)
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, each with five fingers
- No duplicate or extra limbs

PERSONALITY — MEAN POPULAR GIRL: Regina-George ultra-snobby clique queen, dismissive sneer + eye-roll + smug smirk + chin tilted up looking down her nose.

POSE: arms crossed TIGHT in front of her chest (left over right), hands tucked into opposite elbow crooks, hip cocked aggressively, head tilted back.

HAIR: long sleek glossy POMEGRANATE-RED hair (slightly more saturated than the face) in a high-end blowout cascading past her shoulders, with frosted icy highlights.

EYES: mature feminine almond-shaped, narrowed in disdain, sharp eyeliner, long thick mascara'd lashes, iris ICY BLUE matching the badge's "FROZEN" color.

LIPS: glossy deep PINK-RED matching the badge's "Pomegranate" script color, upper lip curled in a sneer.

OUTFIT — POPULAR-GIRL CASUAL:
- Fitted cropped TOP in deep pink-red or pastel icy blue
- High-waisted denim shorts or mini skirt
- Small gold chain necklace, hoop earrings
- 1-2 ice cubes near her shoulders as bokeh elements
- Modern Y2K / contemporary popular-girl wardrobe

THE FLAVOR BADGE — REFERENCE 2 PLACED AS-IS:
The "FROZEN POMEGRANATE" poster (reference 2) is mounted FLAT on the chic modern wall behind her. CRITICAL — reference 2 IS the poster, NOT a starting point for redesign. The poster shows EXACTLY what reference 2 shows:
- "FROZEN" word in icy blue display lettering with frost effects exactly as drawn in reference 2
- "Pomegranate" pink-red italic script lettering exactly as in reference 2
- Two whole pomegranates on left and cracked pomegranate on right exactly as in reference 2
- Ice cubes scattered around exactly as in reference 2
- Dripping ice at the bottom exactly as in reference 2
- Flat 2D printed graphic on the wall, no perspective warping, no creative reinterpretation
Position: upper background behind her head/shoulders, large enough to be clearly readable.

BACKGROUND ATMOSPHERE: chic frozen-yogurt-shop / trendy ice-cream-parlor at twilight — modern decor, cool ambient lighting (blue + pink), blurred pastel decor, sparkle bokeh.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Badge poster upper background.

CRITICAL NEGATIVES:
- Do NOT have any human skin tone on her face — ENTIRE FACE = POMEGRANATE-RED FRUIT SKIN
- Do NOT redraw or restyle the badge poster — reference 2 placed AS-IS
- Do NOT change the badge typography fonts/colors from reference 2
- Do NOT show any crack on her head
- Do NOT generate extra limbs — exactly 2 arms / 2 hands
- Do NOT make her cartoony / chibi / flat 2D — hyper-realistic Pixar 3D quality only
- Do NOT add other characters
- Do NOT include the Muha brand logo`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v9-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
