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

CHARACTER — full-body Pixar 3D young-adult MAN (mid-20s), the "Arctic Blueberry" personality: BROODY, ANGRY, HURT — a betrayed-young-man telenovela energy. He stands freely (NOT encased in ice, NOT frozen in a block, NOT trapped). His body is fully visible from at least mid-thigh up, posed naturally on his own two feet.

HEAD (the fruit, full fruit-character style — the ENTIRE head IS the blueberry):
- A giant glossy deep purple-blue BLUEBERRY as the entire head. The classic small star-shaped crown indent at the top of the blueberry. Soft silvery natural "bloom" dust on the skin. Subtle masculine angularity to the round form (squarer jaw region, stronger brow ridge implied in the fruit's contour).
- Face skin = blueberry skin. No human flesh tone anywhere on the head. The face features are embedded directly into the blueberry surface.
- Light frost dusting only on the eyebrows and tops of the cheeks (not encasing the whole head — he's chilled, not frozen solid).
- A small fluffy tuft of WHITE SNOW resting on top of the blueberry head near the crown indent, matching the snow on the badge.

FACE — Pixar 3D, masculine young-adult features:
- Strong masculine jawline, thicker eyebrows (lightly frost-tipped).
- Almond-shaped eyes, narrowed in a scowl, glaring upward slightly. Iris an intense icy blue. Short masculine lashes (NOT feminine glossy lashes).
- Lips pressed tight in a hard masculine frown, slightly chapped (not glossy).
- Expression: betrayed, simmering rage held back behind the eyes — telenovela "I've been wronged and I'm holding it together." Heart-broken but proud.

BODY & POSE (free-standing, NO ICE BLOCK):
- Adult masculine 1:7 head-to-body proportions, broad shoulders, stocky torso.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Standing pose: one fist clenched at his side, the other hand half-curled. Shoulders squared, chest forward, head tilted slightly down, glaring up with smoldering anger. Could read as the moment right before he turns and walks away from a betrayal.
- NO ice prison, NO glacier block trapping him, NO frozen-in-place body. He is free, on his feet, just emotionally hurt.

OUTFIT — modern trendy contemporary young-adult menswear in the badge's cold palette:
- Dark navy/indigo zip-up HOODIE with a small printed blueberry-cluster graphic on the chest, layered over a deeper blue tee. Optional snowflake stitching detail on the sleeve cuff.
- Dark casual pants (charcoal joggers or dark denim).
- Stylish, not childish, not fantasy, not couture — Y2K streetwear sensibility.

WALL & BADGE PLACEMENT — the wall behind him is a cold arctic-blue interior wall (think modern apartment with a frost-tinted blue lighting wash). The "ARCTIC BLUEBERRY" badge from reference 1 is a flat printed poster on that wall behind him, large and clearly readable in the upper background. Pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: cold cinematic blue key light from the upper right, deep indigo shadow on the left, soft rim light catching the frost on the blueberry skin. Subtle bokeh of falling snowflakes in the air. Moody, dramatic, telenovela.

COMPOSITION: 9:16 vertical. Full body or mid-thigh-up framing. Hyper-detailed Pixar / Cinema 4D / Octane 3D render, shallow depth of field, cold cinematic color grade.

NEGATIVE — do NOT encase him in an ice block, do NOT freeze him into a glacier, do NOT trap his lower body in ice, do NOT show only his upper torso emerging from ice. He is FREE-STANDING. Do NOT render him as a child / teen / chibi — he is a young ADULT MAN in his mid-20s with mature masculine proportions. Do NOT use feminine features (glossy lips, long lashes, soft round chin). Do NOT use a human flesh-tone face — the entire head IS the blueberry. Do NOT add extra arms or hands. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-v4-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
