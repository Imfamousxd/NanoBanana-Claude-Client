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

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP (showing roughly 3/4 of his body — head, torso, full arms with hands, and down to mid-thigh). The badge poster sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of the character's head must NOT overlap the bottom of the badge poster — keep a small visible air gap of wall between them. Think movie-poster layout: title (badge) on top strip, 3/4-body character below.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the "Arctic Blueberry" personality: BROODY, ANGRY, HURT — a betrayed-young-man telenovela energy. He stands freely (NOT encased in ice, NOT frozen in a block, NOT trapped). Framing: 3/4 body — visible from MID-THIGH UP, hands and arms fully visible in the frame.

HEAD (the fruit, full fruit-character style — the ENTIRE head IS the blueberry):
- A giant glossy deep purple-blue BLUEBERRY as the entire head. The classic small star-shaped crown indent at the top of the blueberry. Soft silvery natural "bloom" dust on the skin.
- Face skin = blueberry skin. No human flesh tone anywhere on the head. The face features are embedded directly into the blueberry surface.
- Light frost dusting only on the eyebrows and tops of the cheeks (not encasing the whole head — he's chilled, not frozen solid).
- A small fluffy tuft of WHITE SNOW resting on top of the blueberry head near the crown indent.

FACE — Pixar 3D, masculine young-adult features:
- Strong masculine jawline, thicker eyebrows (lightly frost-tipped).
- Almond-shaped eyes, narrowed in a scowl, glaring upward slightly. Iris an intense icy blue. Short masculine lashes.
- Lips pressed tight in a hard masculine frown.
- Expression: betrayed, simmering rage held back behind the eyes — telenovela "I've been wronged and I'm holding it together."

BODY & POSE (free-standing, NO ICE BLOCK):
- Adult masculine 1:7 head-to-body proportions, broad shoulders.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible in frame. One fist clenched at his side, the other hand half-curled. Shoulders squared, head tilted slightly down, glaring up with smoldering anger.
- NO ice prison, NO glacier block, NO ice trapping his body.

OUTFIT — modern trendy contemporary young-adult menswear:
- Dark navy/indigo zip-up HOODIE over a deeper blue tee. Small printed blueberry-cluster graphic on the chest. Subtle snowflake stitching on the cuff.
- Dark charcoal joggers or dark denim visible from waist down to mid-thigh (where the frame cuts).
- Stylish, Y2K streetwear sensibility.

WALL & BADGE PLACEMENT — the wall behind him is a cold arctic-blue interior wall. The "ARCTIC BLUEBERRY" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — NOT blocked by the character at all. Pixel-faithful to reference 1, NOT restyled. There is clear empty wall between the bottom of the badge poster and the top of the character's head.

LIGHTING & ATMOSPHERE: cold cinematic blue key light from the upper right, deep indigo shadow on the left, soft rim light catching the frost. Subtle bokeh of falling snowflakes in the air.

COMPOSITION: 9:16 vertical, poster-style layout:
- Upper ~1/4 of the frame = the ARCTIC BLUEBERRY badge poster, fully visible edge to edge
- Lower ~3/4 of the frame = the character framed mid-thigh up (head + full torso + both arms + both hands + down to mid-thigh), centered, with a small clear air gap of wall between his head and the badge
The character must NOT overlap the badge poster. Repeat: BADGE POSTER FULLY UNOBSTRUCTED, character shown 3/4 body.

NEGATIVE — do NOT let the character's head, hood, or shoulders overlap or cover any part of the badge poster. Do NOT place the badge behind the character's body. Do NOT shrink the badge — it must be large and fully visible. Do NOT encase him in an ice block. Do NOT render him as a child / teen / chibi. Do NOT use feminine features. Do NOT use a human flesh-tone face — the entire head IS the blueberry. Do NOT add extra arms or hands. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-v6-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
