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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/ARCTIC BLUEBERRY.png";

const PROMPT = `Reference 1 is the "ARCTIC BLUEBERRY" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, or reinterpret the badge — reference 1 placed AS-IS, pixel-faithful, unchanged. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge poster sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of the character's head must NOT overlap the bottom of the badge poster — keep a small visible air gap of wall between them.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the "Arctic Blueberry" personality: BROODY, ANGRY, HURT — a betrayed-young-man telenovela energy. He stands freely (NOT encased in ice, NOT frozen in a block, NOT trapped). Framing: 3/4 body — visible from MID-THIGH UP, hands and arms fully visible in the frame.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY A BLUEBERRY, not a humanoid head with blueberry coloring:
- The ENTIRE head is a giant glossy deep purple-blue SPHERICAL BLUEBERRY. Round blueberry shape — NOT a human skull shape with chin/cheekbones/jawline. The classic small star-shaped crown indent at the top. Soft silvery natural "bloom" dust on the surface.
- 100% blueberry-skin coloring across the ENTIRE face. Zero human flesh tone. No peach cheeks, no pink lips area, no human-skin highlights, no skin pores. Every surface — cheeks, forehead, chin, mouth area — is the same deep purple-blue blueberry skin. Picture animated cartoon features painted directly onto the surface of a real blueberry.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the blueberry surface — same construction approach as the Aloha Passion Rush / Blue Slushie / Frozen Pomegranate characters in this series (animated fruit WITH a face, NOT a photoreal human face glued onto a fruit-shaped head).
- A small fluffy tuft of WHITE SNOW resting on top of the blueberry head near the crown indent.
- Light frost dusting on the brow ridges only.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human features):
- Stylized angled brow shapes in a slightly darker purple than the face — angled down in a scowl. NOT realistic hair-textured human eyebrows.
- Cartoon Pixar eyes (almond-round), narrowed in a scowl, glaring slightly upward. Iris an intense icy blue with a single simple highlight. NOT photoreal human eyes with realistic sclera + lashes + tear ducts.
- A subtle cartoon nose-bump pressed into the blueberry surface (no sculpted human nose with nostrils).
- A stylized cartoon frown — the mouth area is colored a slightly deeper blueberry tone than the surrounding face. NOT a separate human-lipped mouth glued on.
- Expression: betrayed, simmering anger held back. Convey it through the cartoon-fruit features.

BODY & POSE (free-standing, NO ICE BLOCK):
- Adult masculine 1:7 head-to-body proportions, broad shoulders.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. One fist clenched at his side, the other hand half-curled. Shoulders squared, head tilted slightly down, glaring up with smoldering anger.

OUTFIT — completely PLAIN, no graphics, no prints, no stitching details:
- A PLAIN solid blue zip-up HOODIE — solid uniform blue color, NO graphics, NO prints, NO logos, NO embroidery, NO snowflake details, NO blueberry icons.
- A PLAIN solid blue T-SHIRT visible underneath through the open hoodie neckline — solid uniform blue, NO prints, NO graphics, NO icons.
- Sweatpants in any neutral color (charcoal grey or black) — plain, no detailing.
- The hoodie and tee should be a clean modern medium-to-deep blue. No fashion graphics anywhere on the outfit.

WALL & BADGE PLACEMENT — the wall behind him is a cold arctic-blue interior wall. The "ARCTIC BLUEBERRY" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — NOT blocked by the character at all. Pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: cold cinematic blue key light from the upper right, deep indigo shadow on the left, soft rim light. Subtle bokeh of falling snowflakes.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = the badge poster fully visible. Lower ~3/4 = the character mid-thigh up.

NEGATIVE — do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no realistic human cheek/jaw bone structure). The head is a BLUEBERRY first, with simple Pixar fruit-face features second. Do NOT use any human flesh tone, peach cheeks, or pink mouth color on the face. Do NOT add ANY graphics, prints, logos, embroidery, snowflake patterns, or blueberry icons to the hoodie or shirt — both must be PLAIN solid blue. Do NOT let the character overlap the badge poster. Do NOT shrink the badge. Do NOT encase him in ice. Do NOT render him as a child / teen / chibi. Do NOT add extra arms or hands. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-v7-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
