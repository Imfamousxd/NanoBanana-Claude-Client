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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/WATERMELON BUBBLEGUM.png";

const PROMPT = `Reference 1 is the "WATERMELON BUBBLEGUM" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, re-letter, or reinterpret the badge. Reference 1 must be reproduced pixel-faithful, completely unchanged — same letterforms, same watermelon imagery, same bubblegum elements, same colors, same layout. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of his head must NOT overlap the badge — keep a small visible air gap. Movie-poster layout.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the "Watermelon Bubblegum" personality: a PLAYFUL FUN GUY — the goofy mid-20s skater-kid-grown-up energy, mid-bubblegum-blow, easygoing class-clown charm, fun and approachable. Think the cool laid-back skater/streetwear guy who makes everyone laugh. Confident but not cocky. Playful, cheeky, mischievous.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a WATERMELON, not a humanoid head with watermelon coloring:
- The ENTIRE head is a giant glossy SYMMETRICAL rounded watermelon sphere (LEFT-RIGHT BALANCED, NOT lopsided). Slightly elongated egg/sphere shape but normal head-proportioned.
- Watermelon RIND skin pattern across the head — bright juicy GREEN rind base with darker green WAVY STRIPES running vertically over the head (the classic watermelon stripe pattern). Glossy real-fruit skin texture.
- A FACE PANEL — where the face appears, the rind opens into a cross-section of WATERMELON FLESH — bright pink/red juicy watermelon-flesh color forming the "face zone" (cheeks, around the mouth, the area where features live), with a few realistic dark watermelon SEEDS embedded into the pink flesh as scattered accents. Like he's a watermelon cut open showing his pink inside as his face.
- A small green watermelon stem at the very crown of the head.
- BUBBLEGUM BUBBLE — a large glossy PINK BUBBLEGUM BUBBLE he is currently blowing from his mouth — translucent shiny pink, bubbling outward in front of his lips. The bubble should be clearly visible as bubblegum, not a sphere of fruit.
- 100% watermelon coloring across the ENTIRE face — green rind on the outer head, pink flesh in the face panel. Zero human flesh tone. No peach cheeks, no human-skin pores. Picture animated cartoon features painted directly onto a sliced-open watermelon head.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the watermelon flesh — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel / Guava Mango / Horchata / Lemon Cherry Fizz in this series. Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a watermelon-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized angled MASCULINE brow shapes in a slightly darker pink-red or green tone — one brow arched in a playful mischievous lift. Stronger / thicker than feminine brows.
- Cartoon Pixar eyes (almond-shaped) — narrowed slightly with playful crinkles at the corners (mid-bubble-blow grin energy). Iris a warm green or amber. Simple highlight. NOT photoreal human eyes with realistic sclera + tear ducts. SHORT MASCULINE LASHES.
- A subtle cartoon nose-bump on the watermelon-flesh face (no sculpted human nose with nostrils).
- A puckered MOUTH shape mid-bubble-blow — lips pursed forward to push the bubblegum bubble out. Mouth shape colored a slightly darker rose tone. NOT a human-lipped mouth glued on.
- Expression: playful goofy fun — cheeky eyes, mid-bubblegum-blow, the guy who's about to crack a joke.

BODY & POSE (free-standing, full playful pose):
- Adult MASCULINE 1:7 head-to-body proportions, broad shoulders, lean athletic skater-build.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY. Each arm attaches at one shoulder, ends in one hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible in the entire image. ZERO extra arms.
- Framed from MID-THIGH UP — full head, torso, both arms with both hands, hips, and down through mid-thigh. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: one hand tucked casually in his pants pocket, the other hand giving a chill peace-sign / two-fingers-up gesture near his shoulder. Slight slouch, weight on one leg, head tilted slightly with the bubblegum bubble blowing out of his mouth. Easygoing playful streetwear-guy stance.

OUTFIT — completely PLAIN, no graphics or prints, MASCULINE casual:
- A PLAIN solid bright watermelon-PINK or coral T-SHIRT — solid uniform color, NO prints, NO graphics, NO logos, NO embroidery, NO watermelon icons.
- An open PLAIN solid GREEN (watermelon-rind green) unzipped hoodie or zip-up jacket draped loosely over the tee — solid uniform green, NO prints, NO graphics, NO patches.
- Plain dark denim jeans or charcoal cargos visible from waist to mid-thigh — solid color, no patterns.
- Stylish modern young-adult streetwear / skater-casual aesthetic. NOT fantasy, NOT couture, NOT cluttered.

WALL & BADGE PLACEMENT — the wall behind him is a bright playful interior wall — soft pink or pale green pastel, like a fun candy-store interior. The "WATERMELON BUBBLEGUM" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled. All letterforms / watermelon / bubblegum imagery reproduced exactly.

LIGHTING & ATMOSPHERE: bright playful key light from upper front, soft pink/green rim light, fun candy-store vibe. Maybe a few tiny pink bubble-particle accents floating in the air. Mood: lighthearted, playful, fun.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, filling the frame width-wise, with clear air gap above his head.

NEGATIVE — do NOT redraw or restyle the badge poster — reference 1 placed AS-IS, identical to source. Do NOT let the character overlap the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face — watermelon green/pink only. Do NOT add ANY graphics, prints, or logos to the tee, hoodie, or pants — all must be PLAIN solid colors. Do NOT render him as a child / teen / chibi — he is a young ADULT MAN (mid-20s) with mature masculine proportions. Do NOT make him female / use feminine features (no glossy feminine lips, no long feminine lashes) — he is MASCULINE. Do NOT add a third arm or extra hand — TWO ARMS / TWO HANDS / TEN FINGERS TOTAL only, count carefully. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-watermelon-bubblegum-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
