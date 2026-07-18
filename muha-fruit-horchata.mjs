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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/HORCHATA.png";

const PROMPT = `Reference 1 is the "HORCHATA" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, re-letter, or reinterpret the badge. Reference 1 must be reproduced pixel-faithful, completely unchanged. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE her in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of her head must NOT overlap the bottom of the badge — keep a small visible air gap. Movie-poster layout.

CHARACTER — Pixar 3D young-adult WOMAN (mid-20s), the "Horchata" personality: a PASSIONATE FLAMENCO DANCER — Latin drama, fiery confidence, mid-flamenco-pose, head proudly turned to the side, smoldering passionate expression, the dramatic Spanish-dance leading lady of the cast. Fierce, sensual, dignified.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a HORCHATA-DRINK orb — a creamy cinnamon-swirled sphere, not a humanoid head with cream skin:
- The ENTIRE head is a giant glossy SYMMETRICAL rounded sphere (LEFT-RIGHT BALANCED, NOT lopsided), the color of creamy horchata — warm milky beige / pale toasted-rice cream as the base skin tone.
- Soft swirling CINNAMON-BROWN ribbons marbled across the head's surface — like cream and cinnamon mixed in a glass — flowing in elegant graceful swirls. Subtle, painterly, not chaotic.
- A light dusting of GROUND CINNAMON specks (warm reddish-brown flecks) sprinkled across the top of the head.
- CINNAMON-STICK HAIR — a full head of CINNAMON-STICK curls and waves styled as her hair. The "hair" is made of multiple slender rolled cinnamon-stick strands, warm reddish-brown bark texture, cascading like wavy shoulder-length flamenco hair down past her ears, with a small red rose tucked in one side (in the flamenco-dancer tradition). The hair should clearly read as cinnamon-stick HAIR.
- 100% horchata-cream skin coloring across the ENTIRE face. Zero human flesh tone. No peach cheeks, no pink lips, no human-skin pores. Picture animated cartoon features painted directly onto a creamy horchata orb.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the horchata surface — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel / Guava Mango in this series. Animated drink-WITH-a-face, NOT a photoreal human face glued onto a creamy orb.

FACE — Pixar 3D fruit/drink-face, stylized animated features (NOT photoreal human):
- Stylized angled brow shapes in a darker cinnamon-brown — arched proudly, expressive.
- Cartoon Pixar eyes (almond), large and dramatic, with smoldering long-lash flamenco intensity. Iris a deep warm cinnamon-brown. Simple highlight. NOT photoreal human eyes with realistic sclera + tear ducts.
- A subtle cartoon nose-bump on the cream surface (no sculpted human nose with nostrils).
- A confident closed-mouth flamenco smolder — lips parted very slightly, mouth shape colored a slightly deeper cinnamon-rose tone. NOT a human-lipped mouth glued on.
- Expression: smoldering Latin-drama passion — chin raised, gaze sharp and proud over her shoulder, the iconic "watch me dance" intensity.

BODY & POSE (free-standing, full flamenco-dance pose):
- Adult feminine 1:7 head-to-body proportions, elegant dancer's posture.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full leafy-hair top, head, torso, both arms with both hands, hips, and down through mid-thigh. CHARACTER FILLS THE FULL LOWER 3/4 of the frame.
- Flamenco pose: one arm raised high above her head with the hand arched gracefully, the other arm curved across her front. Hips cocked, body twisted with dancer's tension, head turned sharply to one side with chin raised. Pure flamenco-dancer silhouette.

OUTFIT — completely PLAIN, no graphics or prints:
- A PLAIN solid DEEP RED flamenco-style top or bodice — solid uniform crimson red, NO prints, NO ruffles with patterns, NO graphics, NO embroidery. Can suggest a structured V-neck or off-shoulder flamenco-blouse silhouette but in solid plain red fabric.
- A flowing PLAIN solid red flamenco SKIRT visible from waist down to mid-thigh — uniform red, NO polka dots, NO floral prints, NO patterns. (Plain ruffled-skirt shape is fine, just no surface graphics.)
- Stylish modern flamenco-inspired but PLAIN. NOT costume-y. NOT cluttered.

WALL & BADGE PLACEMENT — the wall behind her is a warm Spanish-tavern interior wall — sun-baked terracotta plaster with soft warm shadow, like a Sevilla courtyard at dusk. The "HORCHATA" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: warm cinematic golden-hour key light from upper right, deep amber shadow on the left, soft warm rim light catching the cinnamon-stick hair. Subtle floating dust particles in the warm air. Mood: passionate, dramatic, Sevillian.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, filling the frame width-wise, with clear air gap above her head.

NEGATIVE — do NOT redraw or restyle the badge poster — reference 1 placed AS-IS. Do NOT let the character overlap the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, polka dots, floral patterns, embroidery, or logos to the top or skirt — both must be PLAIN solid red. Do NOT render her as a child / teen / chibi. Do NOT make her sad or angry — she is PASSIONATE / smoldering / proud. Do NOT make her cartoon-cute / kawaii — she is fierce flamenco. Do NOT add extra arms or hands. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-horchata-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
