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

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. Keep a small visible air gap of wall between the top of his head and the bottom of the badge.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the NEW "Arctic Blueberry" personality: a CHILL COOL SMOOTH-TALKER CHAD — full alpha-bro swagger, broad-shouldered, gym-built, tall, the confident frat-king who walks into a room and owns it. Square jaw silhouette (suggested through the head shape), thick neck, broad chest, athletic V-taper torso. Half-smile + half-raised eyebrow, dripping with smooth-operator charm. The vibe is dominant-alpha-but-chill, "what's up bro" frat-bro CHAD energy. NOT just casual cool — visibly built, confident posture, chest-out, chin-up. NOT broody, NOT scrawny.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY A BLUEBERRY, not a humanoid head with blueberry coloring:
- The ENTIRE head is a giant glossy spherical deep purple-blue BLUEBERRY. Spherical blueberry shape, NOT a human skull shape. Classic small star-shaped crown indent at the top. Soft silvery natural "bloom" dust on the surface.
- A small fluffy tuft of WHITE SNOW resting on top of the blueberry head near the crown indent.
- 100% blueberry-skin coloring across the ENTIRE face. Zero human flesh tone. Picture cartoon Pixar features painted directly onto the surface of a blueberry.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the blueberry surface — same construction approach as the other Muha fruit-drama characters (Aloha, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum). Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a blueberry-shaped head.
- Light frost dusting only on the brow ridges.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized masculine angled brow shapes in a slightly darker purple — one brow arched higher than the other in a confident "what's up" lift.
- Cartoon Pixar eyes (almond), half-lidded in a smooth-cool relaxed gaze. Iris an intense icy blue with a simple highlight. Short masculine lashes.
- A subtle cartoon nose-bump on the blueberry surface.
- A confident half-smile / smirk — one corner of the mouth pulled up casually. Mouth shape colored a slightly deeper blueberry tone.
- Expression: laid-back charm, half-smile + brow raised, smooth-operator energy. "Hey."

BODY & POSE (free-standing, alpha-chad stance):
- Adult masculine CHAD proportions — broad shoulders, gym-built athletic V-taper torso, chest out, strong neck, confident upright posture. Slightly larger and more imposing than a "regular" Pixar character — visible upper-body muscle mass under the shirt.
- ALL VISIBLE SKIN (hands, neck, forearms — anything that isn't covered by clothing) is the SAME DEEP PURPLE-BLUE BLUEBERRY COLOR as the head, with the same soft silvery bloom dust subtly visible. NO human flesh tone anywhere — the character is fully blueberry-colored from head to fingertips. The skin matches the head exactly. Hands are blue-fingered, neck is blue-skinned, exposed forearm skin is blue.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY. Each arm attaches at one shoulder, ends in one hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible. ZERO extra arms or hands.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: alpha-chad smooth-talker stance — one hand casually tucked in his pants pocket pulling the shirt slightly open across the chest, the other hand making a relaxed finger-gun / point gesture at the camera or hooked into a belt loop. Chest forward, shoulders squared, chin up, slight body lean. The guy at the bar everyone notices. NOT shy, NOT slumped.

OUTFIT — completely PLAIN, no graphics or prints, MASCULINE smooth-cool casual:
- A PLAIN solid navy/indigo BLUE button-down or button-up SHIRT, casually unbuttoned at the top 2-3 buttons (V-neck reveal) — solid uniform color, NO prints, NO graphics, NO logos, NO embroidery. Sleeves could be rolled to the elbow casually.
- Underneath the open shirt collar, a glimpse of a plain solid BLUE undershirt or fitted tee.
- Plain dark joggers, dark jeans, or charcoal trousers visible from waist to mid-thigh — solid color, no patterns.
- Stylish modern young-adult smart-casual / smooth-cool aesthetic. NOT broody hoodie outfit (that was the old version), NOT athletic athleisure. More like "going out for drinks" cool.

WALL & BADGE PLACEMENT — the wall behind him is a cold arctic-blue interior wall (modern lounge / cool lighting). The "ARCTIC BLUEBERRY" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: cool blue cinematic key light from the upper right, soft cool fill, gentle rim light catching the frost on the blueberry skin. Subtle snowflake bokeh in the air. Mood: chill modern lounge cool. Not moody-hurt — confidently relaxed.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = character framed mid-thigh up.

STYLE LOCK — hyper-detailed Pixar / Cinema 4D / Octane 3D render, animated-feature-film look, unified Pixar-3D stylization across the ENTIRE character (head, face, hands, shirt, pants). NOT photoreal, NOT live-action, NOT a real human-photo body with a cartoon head pasted on. Hands are PIXAR-CARTOON hands (stylized animated, not photoreal). Clothes are PIXAR-CARTOON clothes (stylized fabric, animated feature shading). All rendered together as one cohesive Pixar 3D animated character — matching the other approved characters in the set.

NEGATIVE — do NOT render him as broody / angry / hurt. Do NOT use the navy hoodie outfit. Do NOT render the head as a humanoid head with realistic human face features. Do NOT use any human flesh tone ANYWHERE on the body — face, neck, hands, forearms must all be blueberry-blue matching the head. Do NOT make the hands peachy / pink / grey. Do NOT add ANY graphics, prints, or logos to the shirt or pants. Do NOT render him as scrawny / slumped / shy — he is a CHAD (broad, built, confident). Do NOT add a third arm or extra hand. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-v9-chad-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
