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

const PROMPT = `Reference 1 is the "GALACTIC DIESEL" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. Do NOT redraw, restyle, recolor, re-letter, or reinterpret the badge. Reference 1 must be reproduced pixel-faithful, completely unchanged — same letterforms, same gas-pump nozzle, same planets, same orbits, same colors, same layout. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge poster sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of the character's head must NOT overlap the bottom of the badge poster — keep a small visible air gap of wall between them. Movie-poster layout: title (badge) on top strip, 3/4-body character below.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the "Galactic Diesel" personality: a BADASS COSMIC REBEL / SPACE OUTLAW — swaggering cyberpunk-cowboy energy, smirking, dangerous, cocky and cool, the guy who just rode in from across the galaxy on stolen fuel.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a cosmic PLANET-FRUIT, not a humanoid head with cosmic skin:
- The ENTIRE head is a giant glossy spherical PLANET-FRUIT, deep cosmic-purple with swirling violet/magenta/teal nebula cloud patterns flowing across the surface (gas-giant texture). Subtle iridescent shimmer. Spherical planet shape — NOT a human skull shape with chin/cheekbones/jaw.
- A thin RING SYSTEM (like Saturn's) tilted around the head — a flat band of golden-orange and green particle dust orbiting horizontally around the head. The ring slices behind the head and reappears in front.
- A few tiny GLOWING STAR POINTS sparkle near the head as if he carries his own little galaxy with him.
- 100% planet-surface coloring across the ENTIRE face. Zero human flesh tone, no peach cheeks, no pink lips, no human-skin highlights. Every surface — cheeks, forehead, chin — is the same cosmic-purple nebula skin. Picture animated cartoon features painted directly onto the surface of a planet.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the planet surface — same construction approach as the Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry characters in this series (animated fruit-with-a-face, NOT a photoreal human face glued onto a planet-shaped head).

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized angled brow shapes in a slightly darker cosmic-purple — angled in a cocky scowl-smirk.
- Cartoon Pixar eyes (almond), glowing electric-green irises that look lit from within. Confident narrowed look. Simple highlight. NOT photoreal human eyes with sclera + lashes + tear ducts.
- A subtle cartoon nose-bump on the planet surface (no sculpted human nose with nostrils).
- A confident SMIRK — one corner of the mouth pulled up. Mouth shape colored a slightly darker cosmic-purple than the surrounding face. NOT a separate human-lipped mouth glued on.
- Expression: cocky rebel smirk — "yeah, what" energy. Convey through cartoon-fruit features.

BODY & POSE (free-standing, full):
- Adult masculine 1:7 head-to-body proportions, broad shoulders, lean athletic outlaw build.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. Pose: weight cocked on one hip, one hand resting low on his belt, the other hand loosely flicking a small glowing cosmic spark between his fingertips. Chin slightly raised, smirking down at the viewer.

OUTFIT — completely PLAIN, no graphics or prints:
- A plain black moto-style LEATHER JACKET with a subtle iridescent purple oil-slick sheen on the shoulders. No prints, no patches, no logos, no graphics, no embroidery.
- A plain solid dark cosmic-purple T-SHIRT underneath the open jacket. NO prints, NO graphics, NO icons.
- Slim dark charcoal pants or cargo pants — plain, no special detailing.
- Stylish modern attitude-forward look — NOT fantasy armor, NOT costume-y.

WALL & BADGE PLACEMENT — the wall behind him is a moody cosmic interior wall — scuffed metal panels with soft purple/teal neon spill, like a deep-space garage. The "GALACTIC DIESEL" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled, all gas-pump nozzle / planets / orbit / letterforms reproduced exactly.

LIGHTING & ATMOSPHERE: high-contrast cinematic — magenta-purple key light from upper left, teal-cyan rim light from behind, deep shadow on the right cheek. Subtle floating cosmic-dust particles drifting around him.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, centered, with clear air gap above his head.

NEGATIVE — do NOT redraw, restyle, re-letter, recolor, or reinterpret the badge poster — reference 1 placed AS-IS, identical to the source image. Do NOT let the character overlap or block any part of the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, logos, embroidery, or patches to the jacket or shirt — both must be PLAIN. Do NOT render him as a child / teen / chibi. Do NOT make him angry/broody (that's Arctic Blueberry — this one SMIRKS). Do NOT make him a literal robot or chrome mech. Do NOT add extra arms or hands. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-galactic-diesel-v2-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
