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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/GALACTIC DIESEL.png";

const PROMPT = `Reference 1 is the "GALACTIC DIESEL" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, or reinterpret the badge — reference 1 placed AS-IS, pixel-faithful, unchanged. The badge poster is the only source of brand/typography in the scene.

CHARACTER — full-body Pixar 3D young-adult MAN (mid-20s), the "Galactic Diesel" personality: a BADASS COSMIC REBEL / SPACE OUTLAW — swaggering cyberpunk-cowboy energy, smirking, dangerous, untouchable, the guy who just rode in from across the galaxy on stolen fuel. Cocky and cool, leaning back into his own confidence.

HEAD (the "fruit" — a cosmic PLANET-FRUIT as the entire head):
- The ENTIRE head is a glossy cosmic PLANET-FRUIT hybrid — a sphere the size of a head, deep cosmic-purple skin with swirling violet/magenta/teal nebula cloud patterns flowing across the surface (like a gas giant). Subtle iridescent shimmer.
- A thin RING SYSTEM (like Saturn's) tilted around the head — a flat band of golden-orange and green particle dust orbiting horizontally around the head. The ring slices behind the head and reappears in front.
- A few tiny GLOWING STAR POINTS sparkle near the head as if he carries his own little galaxy with him.
- A small fuel-cap detail near the temple — a circular metallic gas-cap embedded into the planet skin (subtle nod to the badge's gas-pump motif), but small and slick, not a full mechanical part.
- Face skin = planet skin. No human flesh tone anywhere on the head. The face features are embedded directly into the cosmic surface, with the nebula swirls flowing around the cheeks.

FACE — Pixar 3D, masculine young-adult features:
- Strong defined masculine jawline, sharp brow line, slight stubble shadow rendered as faint dark nebula texture along the jaw.
- Almond-shaped eyes — narrowed in a cocky smirk-glare. Iris a glowing electric-green (matching the badge's green planet accent), faintly luminous like they're lit from inside.
- A confident smirk — one corner of the mouth pulled up, mouth slightly open, hint of a sharp canine. NOT angry, NOT laughing — that "yeah, what" rebel smirk.
- Short masculine lashes (NOT feminine). Lips a desaturated cosmic-purple, slightly darker than the skin.

BODY & POSE (free-standing, full-length):
- Adult masculine 1:7 head-to-body proportions, broad shoulders, lean athletic build, the build of an outlaw.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Pose: standing with weight cocked on one hip, one hand resting low on his belt buckle, the other hand loosely flicking a small glowing cosmic spark / ember between his fingertips. Shoulders back, chin slightly raised, smirking down at the viewer. The body language of someone who just walked away from an explosion without looking back.

OUTFIT — cyberpunk space-outlaw, modern contemporary streetwear hybrid:
- Black moto-style leather jacket with subtle iridescent-purple oil-slick sheen on the shoulders, sleeves cuffed back. A frayed dark-violet bandana or chain around the neck.
- Dark fitted graphic tee underneath in deep cosmic-purple, with a small printed planet-and-pump graphic on the chest in the badge's color palette (purple + yellow + green + orange-red).
- Slim charcoal cargo pants with utility pockets, tucked into chunky space-boots with worn metallic detailing.
- A thin holographic glow strip subtly outlining one cuff or seam — slick, not gimmicky.
- Stylish, modern, attitude-forward — NOT fantasy armor, NOT royal, NOT costume-y.

WALL & BADGE PLACEMENT — the wall behind him is a moody cosmic interior — like the metal-and-neon back wall of a deep-space garage or a fuel-depot bar. Subtle scuffed metal panels, faint chromatic shimmer, soft purple/teal neon spill. The "GALACTIC DIESEL" badge from reference 1 is a flat printed poster on that wall behind him, large and clearly readable in the upper background. Pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: high-contrast cinematic — magenta-purple key light from upper left, teal-cyan rim light from behind, deep shadow on the right cheek. Subtle floating dust particles and tiny cosmic sparks drifting around him. The mood is "wanted-poster cool" — confident, dangerous, beautiful.

COMPOSITION: 9:16 vertical. Full body or knee-up framing, the badge poster large in the upper background behind him. Hyper-detailed Pixar / Cinema 4D / Octane 3D render, shallow depth of field, cinematic color grade leaning cosmic-purple / electric-teal.

NEGATIVE — do NOT render him as a child / teen / chibi — he is a young ADULT MAN in his mid-20s with mature masculine proportions. Do NOT use feminine features (glossy lips, long lashes, soft round chin, oversized kawaii eyes). Do NOT use a human flesh-tone face — the entire head IS the cosmic planet-fruit. Do NOT add extra arms or hands. Do NOT make him an angry / broody character (that's Arctic Blueberry's lane — this one is a SMIRKING cocky rebel). Do NOT make him a literal robot or full sci-fi mech (he's a Pixar character with cosmic-planet skin, not chrome). Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-galactic-diesel-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
