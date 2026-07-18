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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/LEMON CHERRY FIZZ.png";

const PROMPT = `Reference 1 is the "LEMON CHERRY FIZZ" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, re-letter, or reinterpret the badge. Reference 1 must be reproduced pixel-faithful, completely unchanged. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE her in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of her head must NOT overlap the badge — keep a small visible air gap. Movie-poster layout.

CHARACTER — Pixar 3D young-adult WOMAN (mid-20s), the "Lemon Cherry Fizz" personality: a SMART, QUIETLY BEAUTIFUL NERD GIRL — bookish-confident, academic-cute, "actually, well..." energy. The brainy honors-student of the cast. Sharp, witty, quietly self-assured AND visually pretty — the cute-girl-who-happens-to-be-the-smartest-in-class. Subtly attractive in a bookish, hot-librarian, Anne-Hathaway-glasses-on way. Pretty face features, soft attractive proportions, polished. NOT plain, NOT awkward, NOT frumpy. Bookish AND beautiful.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a LEMON, not a humanoid head with lemon coloring:
- The ENTIRE head is a giant glossy SYMMETRICAL rounded lemon — bright sunny YELLOW skin with the classic dimpled lemon-peel texture. LEFT-RIGHT BALANCED, NOT lopsided. Slightly oval/elongated lemon silhouette but normal head-proportioned. Glossy real-fruit skin texture.
- LEAFY BOOKISH HAIR — a NEAT shoulder-length BOB of bright-green lemon LEAVES styled as her hair, framing the sides of her face from crown down to chin/shoulder level. Tidy, smooth, librarian-polished — not wild or messy. Roughly 8-10 leaves arranged like a chic short bob with a slight inner curl. A small brown lemon stem peeks up at the very crown, optionally with a tiny CHERRY-RED ribbon or pencil tucked behind one ear. The leaves clearly read as her HAIR — bookish-cute, not just a fruit-stem detail.
- CHERRY EARRINGS — two glossy bright RED CHERRIES on short slim green stems dangling from her EARLOBES as elegant earrings. The cherries hang at ear-level on each side of the head, swinging like dainty fruit-shaped earrings. NOT pigtails, NOT hair accessories — they are pierced EARRINGS hanging from where ears would be on the lemon head.
- EARS — if any ear shape is visible at all (where the cherry earrings attach), it must be colored the SAME LEMON-YELLOW as the rest of the head, with the same dimpled lemon-peel texture. NEVER human flesh-tone, peach, or pink. The ear is part of the lemon — just a small lemon-yellow bump from which the cherry earring hangs. NO realistic human-ear cartilage anatomy.
- GLASSES — round or slim cat-eye GLASSES perched on the front of the lemon face, thin tortoiseshell or thin black frames. Clear lenses (or one lens catching a small reflective highlight). The glasses are her signature smart-girl prop.
- FIZZ SPARKLE — tiny orange-yellow FIZZ BUBBLES popping in the air around the head, subtle iridescent shimmer.
- 100% lemon-skin coloring across the ENTIRE face. Zero human flesh tone. No peach cheeks, no pink human lips, no human-skin pores. Picture animated cartoon features painted directly onto the surface of a lemon.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the lemon surface — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel / Guava Mango / Horchata in this series. Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a lemon-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized brow shapes in a slightly darker yellow-orange — one brow arched in a curious "well actually" lift.
- Cartoon Pixar eyes (large expressive almond shape — pretty eyes with a soft pleasing tilt) behind the glasses lenses, bright and alert, with intelligent confidence. Long graceful (but still cartoon) lashes. Iris a warm amber. Simple cartoon highlight. NOT photoreal human eyes with realistic sclera + tear ducts.
- A subtle cartoon nose-bump on the lemon surface where the glasses bridge would rest (no sculpted human nose with nostrils).
- A small knowing closed-mouth SMIRK / soft smile — lips slightly pursed in academic confidence. Mouth shape a slightly deeper cherry-tone than the surrounding face. NOT a human-lipped mouth glued on.
- Expression: confident smart-girl, "yes I read the textbook" — sharp eyes, slight smirk, head tilted slightly with curiosity.

BODY & POSE (free-standing, full smart-girl pose):
- Adult feminine 1:7 head-to-body proportions, poised academic posture.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY, no more, no less. Each arm attaches at one shoulder, ends in one hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible in the entire image. ZERO extra arms, ZERO extra hands, ZERO duplicate limbs.
- Framed from MID-THIGH UP — full head with cherry earrings + glasses, torso, both arms with both hands, hips, and down through mid-thigh. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: she stands gently. Her LEFT arm holds a closed BOOK against her hip / waist (one hand visible gripping the book). Her RIGHT arm is raised up to her glasses, with her right index finger lightly touching the bridge / temple of her glasses (the "adjusting glasses" gesture). One arm down with the book, one arm up at her glasses — that's all, no other arms or hands. Slight head tilt, weight on one leg, composed and poised. NOT bratty, NOT a hair flick — confident-bookish stance.

OUTFIT — completely PLAIN, no graphics or prints:
- A PLAIN solid soft pastel YELLOW or pale lemon BUTTON-UP SHIRT or fitted blouse — solid uniform color, NO prints, NO patterns, NO graphics. Sleeves can be rolled to the elbow or full-sleeve.
- An optional plain solid CHERRY-RED knit vest or cardigan layered over the shirt — solid uniform red, NO patterns, NO graphics. (If a vest is included it should be plain solid red. If skipped, the plain yellow shirt alone is fine.)
- Plain solid CHERRY-RED A-line skirt or pleated skirt visible from waist to mid-thigh — solid uniform red, NO patterns, NO plaid, NO graphics.
- Stylish modern academic-cute / preppy bookworm aesthetic. NOT bratty, NOT pop-star, NOT fantasy.

WALL & BADGE PLACEMENT — the wall behind her is a soft warm library/study interior — pale cream-yellow wall with a hint of a wooden bookshelf shadow softly blurred in the background. The "LEMON CHERRY FIZZ" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled. All letterforms / lemon slices / cherries / fizz splashes reproduced exactly.

LIGHTING & ATMOSPHERE: warm cinematic study-room lighting — soft golden key light from upper right, gentle warm fill, soft shadow. Mood: warm, intelligent, focused. Tiny fizz-sparkle dots optional in the air, subtle.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, filling the frame width-wise, with clear air gap above her head.

NEGATIVE — do NOT redraw or restyle the badge poster — reference 1 placed AS-IS. Do NOT let the character overlap the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, polka dots, fruit icons, plaid patterns, or logos to the shirt, vest, or skirt — all must be PLAIN solid colors. Do NOT render her as a child / teen / chibi — she is a young ADULT woman (mid-20s). Do NOT make her bratty / sassy / eye-rolling — she is the SMART NERD-GIRL of the cast, composed and bookish. Do NOT put cherries as PIGTAILS or hair-clips — the cherries must be pierced EARRINGS hanging from her ears, NOT on top of the head. Do NOT add a THIRD arm or extra hand — TWO ARMS / TWO HANDS / TEN FINGERS TOTAL only, count them carefully. Do NOT make her look plain, frumpy, awkward, or unattractive — she should look SOFTLY BEAUTIFUL (smart and pretty, bookish AND lovely). Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-lemon-cherry-fizz-v5-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
