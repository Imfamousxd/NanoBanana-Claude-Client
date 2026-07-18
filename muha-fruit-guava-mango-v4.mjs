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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/GUAVA MANGO.png";

const PROMPT = `Reference 1 is the "GUAVA MANGO" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, re-letter, or reinterpret the badge. Reference 1 must be reproduced pixel-faithful, completely unchanged. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge poster sits ABOVE her in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of her head must NOT overlap the bottom of the badge — keep a small visible air gap of wall between them. Movie-poster layout.

CHARACTER — Pixar 3D young-adult WOMAN (mid-20s), the "Guava Mango" personality: PURE-JOY LAUGHING SUNSHINE — infectious happiness, head thrown back mid-laugh, can't-stop-laughing energy, the kind of joy that's so genuine it makes everyone around her smile. The sunny optimist of the cast.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a MANGO with a guava-pink blush gradient flowing through it, not a humanoid head with mango coloring:
- The ENTIRE head is a giant glossy mango — a SYMMETRICAL, BALANCED rounded oval/egg shape. LEFT-RIGHT MIRRORED, NOT lopsided, NOT kidney-shaped, NOT tear-drop-asymmetric. Picture a slightly elongated sphere — rounded top, very gently tapered bottom, equal width on both sides of the face like a normal head silhouette. Glossy real-fruit skin texture.
- The skin gradient flows across the whole head: warm SUNNY YELLOW on one side blending through SUNSET ORANGE in the middle into a soft GUAVA PINK blush on the cheek area — like a ripe ataulfo mango with a pink guava kiss painted over it. The pink blush should be visible on the cheek/face zone where it reads as cheerful.
- LEAFY HAIR — a BIG LUSH FULL HEAD OF MANGO LEAVES sprouting from the top and back of the head, styled as her HAIR. At least 10-15 leaves of varying sizes, arranged like a leafy bob/bouquet — leaves on top, leaves cascading down behind both ears, leaves flowing to shoulder-length on the sides. NOT just two small leaves on top — must read as a FULL HEAD OF LEAF-HAIR, like she has a leafy mane. Glossy real-leaf texture with visible center veins. A small brown mango stem peeks through the leaves at the very crown.
- 100% mango/guava skin coloring across the ENTIRE face. Zero human flesh tone. No realistic peach cheeks, no pink human lips, no human-skin pores. Picture animated cartoon features painted directly onto the surface of a ripe mango.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the mango surface — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel in this series. Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a mango-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized eyebrows in a slightly darker orange-pink tone, arched UP in joy.
- Cartoon Pixar eyes (almond) — SQUEEZED SHUT into upward-curved happy-crescents from laughing so hard. Or open just slightly, sparkling, with crinkled corners. Simple cartoon highlights. Iris a warm amber/honey color when visible.
- A subtle cartoon nose-bump on the mango surface (no sculpted human nose with nostrils).
- A huge open-mouthed LAUGH — mouth wide open in a beaming grin, simple cartoon teeth visible (clean stylized white teeth, not photoreal). Mouth shape colored a deeper pink/coral than the surrounding face. NOT a human-lipped mouth glued on.
- A small set of cute warmth/dimple suggestions on the cheeks just from the smile pushing the skin up.
- Expression: pure unguarded JOY — caught mid-laugh, the kind where her whole face lights up.

BODY & POSE (free-standing):
- Adult feminine 1:7 head-to-body proportions, natural feminine build. Young adult woman.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. Pose: head tilted back slightly mid-laugh, one hand pressed lightly to her chest in a "I can't even" laughing gesture, the other hand thrown out loosely in joy. Shoulders relaxed, posture open and bright. Movement-y, full of life.

OUTFIT — completely PLAIN, no graphics or prints:
- A PLAIN solid sunny-yellow T-SHIRT or cropped tee — solid uniform yellow color, NO prints, NO graphics, NO logos, NO embroidery.
- An open PLAIN solid soft-pink (guava-pink) cardigan or zip-up draped loosely over the shirt — solid uniform pink, NO prints, NO graphics.
- Plain light-wash denim or simple skirt/shorts visible from waist to mid-thigh, neutral and undetailed.
- Stylish modern young-adult casual — bright, summery, contemporary streetwear sensibility. NOT fantasy, NOT couture.

WALL & BADGE PLACEMENT — the wall behind her is a warm sunny interior wall — bright with a gentle pink-orange sunset wash, like late-afternoon golden hour. The "GUAVA MANGO" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled. All letterforms / guava + mango illustrations / juice splashes reproduced exactly.

LIGHTING & ATMOSPHERE: warm cinematic golden-hour key light from upper right, soft pink rim light from behind, warm coral fill on the shadow side. Tiny floating bokeh sparkles / sun-dust particles in the air. Mood: pure sunshine and joy.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the CHARACTER MUST OCCUPY THE FULL LOWER THREE-QUARTERS OF THE FRAME, framed from MID-THIGH UP at minimum (shorts/jeans visible at the bottom of the frame, NOT cut off at the waist). Show: full leafy-hair top, full head, full torso, both arms with both hands, hips, and down through mid-thigh. The character should fill most of the lower 3/4 of the frame width-wise too — DO NOT pull the camera too far back leaving lots of empty wall around her. Frame her like a full character portrait, not a half-body bust shot.

NEGATIVE — do NOT redraw or restyle the badge poster — reference 1 placed AS-IS, identical to source. Do NOT let the character overlap the badge poster. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose with nostrils, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, or logos to the shirt or cardigan — both must be PLAIN solid colors. Do NOT render her as a child / teen / chibi — she is a young ADULT woman (mid-20s) with mature feminine proportions. Do NOT use "petite" doll-like infantilizing proportions. Do NOT make her sad, sultry, or angry — she is LAUGHING with joy. Do NOT add extra arms or hands. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-guava-mango-v4-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
