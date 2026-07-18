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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/FROZEN POMEGRANATE.png";

const PROMPT = `Reference 1 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER ARTWORK — a flat printed piece of artwork that already exists. DO NOT redesign, redraw, restyle, or reinterpret reference 1 in any way. Treat reference 1 as the literal artwork that gets placed AS-IS on the wall behind the character.

STYLE TARGET (described in text — no style reference image): 3D Pixar/animation-quality rendered fruit-character, hyper-detailed Cinema 4D / Octane render quality with realistic material textures, lighting, soft shadows, subsurface scattering on the fruit skin, soft realistic skin texturing on the body. Dramatic moody cinematic lighting with key light + rim light + ambient occlusion. Shallow depth of field with bokeh background. Telenovela-meme aesthetic — like a frame from a 3D animated short. NOT flat 2D, NOT cartoony, NOT chibi — realistic high-end 3D animation render quality.

THE FRUIT-CHARACTER ARCHETYPE: a character where the HEAD is literally a whole piece of fruit (like in Pixar's anthropomorphic-food shorts — the head IS the fruit, with cartoon Pixar eyes and mouth embedded directly in the fruit's surface). The body is a regular human adult body. Think: a Pixar character where a banana, strawberry, or pomegranate is the head sitting on top of a normal human neck.

SCENE — 9:16 portrait composition.

THE CHARACTER:

AGE — ADULT WOMAN (mid-20s), NOT child/teen/chibi.

HEAD CONSTRUCTION — FULL WHOLE POMEGRANATE WITH ENTIRELY RED FACE:
- The entire head is a complete whole pomegranate fruit — round, plump, intact
- THE ENTIRE FACE SURFACE (forehead, cheeks, around the eyes, chin) is DEEP POMEGRANATE-RED FRUIT SKIN — no human flesh tone anywhere
- Pomegranate CALYX (5-6 leathery brown-pink crown petals) sitting naturally on top
- Large expressive Pixar EYES embedded in the red fruit-face (only non-red areas: eye whites, lips)
- Red-tinted lips embedded in the face
- Subtle frost glaze on top of the pomegranate skin
- NO crack, NO split, NO exposed seeds on the head

BODY ANATOMY (STRICT):
- Adult human female body — slim trendy proportions (1:7 head-to-body)
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs

PERSONALITY — MEAN POPULAR GIRL: Regina-George ultra-snobby clique queen vibes. Dismissive sneer + eye-roll + smug smirk + chin tilted up looking down her nose.

POSE: arms crossed TIGHT in front of her chest (left over right), hands tucked into opposite elbow crooks. One hip cocked aggressively. Head tilted back with side-eye glance at the viewer.

HAIR: long sleek glossy POMEGRANATE-RED hair in a high-end blowout cascading past her shoulders, with frosted icy highlights.

EYES: mature feminine almond-shaped, narrowed in disdain, sharp eyeliner, long thick mascara'd lashes. Iris ICY BLUE.

LIPS: glossy deep PINK-RED, upper lip curled in a sneer.

OUTFIT — POPULAR-GIRL CASUAL:
- Fitted cropped TOP in deep pink-red or pastel icy blue
- High-waisted denim shorts or mini skirt
- Small gold chain necklace, hoop earrings
- 1-2 ice cubes near her shoulders as bokeh elements
- Modern Y2K / contemporary trendy popular-girl wardrobe

THE FLAVOR BADGE — REFERENCE 1 PLACED AS-IS ON THE WALL:
The wall behind the character has reference 1's poster mounted FLAT on it. Reference 1 IS the poster — copy it pixel-for-pixel. The poster shows:
- "FROZEN" in icy blue display lettering with frost effects (exactly as in reference 1)
- "Pomegranate" in pink-red italic script (exactly as in reference 1)
- Two whole pomegranates on the left and one cracked-open pomegranate on the right (exactly as in reference 1)
- Ice cubes scattered around (exactly as in reference 1)
- Dripping ice at the bottom (exactly as in reference 1)
Position: upper background behind her head/shoulders, large enough to be clearly readable. Flat 2D printed graphic, no perspective warping. Reference 1 placed AS-IS — if the typography, fruits, ice, or splashes look different from reference 1, you have failed.

BACKGROUND ATMOSPHERE: chic frozen-yogurt-shop / trendy ice-cream-parlor at twilight — modern decor, cool ambient lighting (blue + pink), blurred pastel decor, sparkle bokeh.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Badge poster upper background.

CRITICAL NEGATIVES:
- Do NOT have any human skin tone on her face — ENTIRE FACE IS POMEGRANATE-RED
- Do NOT redraw or reinterpret the badge poster — reference 1 placed AS-IS
- Do NOT change typography/colors/illustrations of the poster from reference 1
- Do NOT show any crack on her head
- Do NOT generate extra limbs
- Do NOT make her cartoony/flat/chibi — hyper-realistic Pixar 3D quality
- Do NOT add other characters
- Do NOT include the Muha brand logo`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(FLAVOR_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v10-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
