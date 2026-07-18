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

const PROMPT = `Reference 1 is the "GUAVA MANGO" flavor badge. It MUST appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character, faithfully reproducing reference 1 exactly. The badge in reference 1 is a wide poster showing: chunky 3D display lettering reading "GUAVA MANGO Z" with "GUAVA" in green block letters across the top and "MANGO Z" in yellow-orange block letters on the bottom, a pink GUAVA slice on the left, an orange-yellow MANGO with green leaves on the right, juice splashes in pink and orange surrounding the wordmark. Reproduce ALL of those elements exactly, same colors, same letterforms, same fruit imagery, same juice-splash treatment. Do NOT redraw, restyle, recolor, or reinterpret. Reference 1 placed AS-IS, pixel-faithful, unchanged. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. Keep a small visible air gap of wall between the top of his head and the bottom of the badge.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the NEW "Guava Mango" personality: a FUNNY CLASS-CLOWN GUY — the goofball who tries to make everyone laugh, the comic-relief of the cast, mid-goofy-joke energy. Always making faces, finger guns, dorky grins, tongue-out faces, "did you see what I did there?" vibes. Lovable dork. NOT a female "pure-joy laughing sunshine" — that's the OLD personality which we're completely replacing. NEW personality is a fully male class-clown comic-relief guy.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a MANGO + GUAVA HYBRID, with BOTH fruits clearly represented on the head:
- The ENTIRE head is a giant glossy SYMMETRICAL rounded mango shape — slightly elongated oval / egg shape, LEFT-RIGHT BALANCED. NOT a human skull shape.
- Skin: the head is split DOWN THE CENTER vertically into TWO HALVES — the LEFT HALF of the face is bright sunny YELLOW-ORANGE MANGO skin (smooth glossy mango exterior), and the RIGHT HALF of the face is bright FRESH GUAVA-GREEN skin (the actual EXTERIOR color of a guava — a vibrant yellow-green, NOT pink, NOT red — guava OUTSIDE is green). The split runs vertically straight down the middle of the face, dividing the head cleanly: mango-yellow on one half, guava-green on the other half. Both halves are glossy fruit-skin texture.
- NO visible guava-slice cap on top of the head, NO half-fruit element sticking out of the head, NO guava-flesh patch with exposed seeds on the cheek. The dual-fruit identity comes through ONLY via the clean half-and-half color split — the head stays a smooth mango silhouette.
- LEAFY HAIR — a BIG LUSH FULL HEAD OF MANGO LEAVES sprouting from the top and back of the head, styled as his HAIR. 10-15 leaves arranged like a leafy bouquet flowing down to ear-level on the sides. Masculine leafy hair style. A small brown mango stem at the crown.
- 100% fruit skin coloring across the ENTIRE face — mango-yellow on one half, guava-GREEN on the other half, NO human flesh tone, NO PINK on the guava side (guava exterior is green not pink). Picture cartoon Pixar features painted onto a mango-guava hybrid surface.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the mango surface — same construction as the other Muha fruit-drama characters. Animated fruit-WITH-a-face, NOT a photoreal human face glued on a mango-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human). The character is MID-BELLY-LAUGH — caught in a full unguarded laugh, the goofball cracking up at his own joke:
- Stylized MASCULINE thicker brow shapes in a darker orange-pink, arched HIGH in laughter.
- Cartoon Pixar eyes — SQUEEZED SHUT into upward-curved happy-crescent slits from laughing so hard. Eye-corner laugh-lines / crinkles visible. NOT open-eyed staring at camera — fully scrunched-shut mid-laugh. Simple cartoon style. SHORT MASCULINE LASHES.
- A subtle cartoon nose-bump on the fruit surface.
- A HUGE WIDE-OPEN LAUGHING MOUTH — mouth thrown open in a full belly-laugh, simple cartoon teeth visible, masculine wide-open laugh shape. Mouth shape a deeper pink/coral. NOT a frozen camera-grin — a genuine mid-laugh.
- Head TILTED BACK slightly with the laughter — chin lifted, mouth open to the sky.
- Expression: 100% genuine mid-belly-laugh, can't-help-himself class-clown CRACKING UP. The kind of laugh that makes everyone else laugh too.

BODY & POSE (free-standing, comic-relief class-clown pose):
- Adult masculine 1:7 head-to-body proportions, SLIGHTLY ATHLETIC / FIT build — broader shoulders than an everyman, visible natural athletic muscle in arms and chest (the "guy who hits the gym occasionally but isn't a bodybuilder"). A step up from a regular build but NOT bodybuilder-buff. Between average and Arctic Blueberry's chad — clearly fit and masculine while keeping comic-relief energy. NOT scrawny, NOT hyper-buff.
- ALL VISIBLE SKIN (hands, neck, forearms — anywhere uncovered) is the SAME MANGO-YELLOW / GUAVA-GREEN coloring matching the corresponding half of the head (yellow side of body = mango-yellow skin, green side = guava-green skin) OR the dominant mango-yellow if the split doesn't extend below the neck. NO human flesh tone anywhere.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY. Each arm at one shoulder, ending in one hand with five fingers. TWO arms + TWO hands + TEN fingers TOTAL. ZERO extra arms.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: classic mid-belly-laugh stance — one hand pressed lightly to his own belly / stomach mid-laugh ("I can't even" gesture), the other hand thrown back / out loose in joy or slapping his thigh laughing. Head tilted back with the laugh. NOT finger-guns, NOT a frozen camera pose — caught mid-cackle, can't-stop-laughing comic energy. Shoulders shaking with the laugh.

OUTFIT — completely PLAIN, no graphics or prints, MASCULINE casual streetwear:
- A PLAIN solid sunny YELLOW T-SHIRT — solid uniform color, NO prints, NO graphics, NO logos, NO embroidery.
- REQUIRED LAYER: an open PLAIN solid CORAL-PINK button-up shirt or unzipped lightweight hoodie layered OVER the yellow tee, sleeves rolled to elbows. Solid uniform coral-pink, NO patterns, NO graphics. This pink overshirt is REQUIRED — don't drop it.
- Plain dark joggers / denim / charcoal pants visible from waist to mid-thigh — solid color.
- Stylish modern young-adult casual streetwear aesthetic — moderately fit, athletic-build guy at the BBQ.

WALL & BADGE PLACEMENT — the wall behind him is a warm sunny interior wall, bright with a gentle pink-orange sunset wash. The "GUAVA MANGO" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: warm cinematic golden-hour key light from upper right, soft pink rim light, warm coral fill. Tiny floating bokeh sparkles in the air. Mood: sunny playful comic-relief.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster. Lower ~3/4 = character framed mid-thigh up.

STYLE LOCK — HYPER-DETAILED CINEMATIC PIXAR / CINEMA 4D / OCTANE 3D RENDER. Full 3D dimensional rendering with proper depth, subsurface scattering on the fruit skin, soft realistic lighting falloff, glossy material shading, cinematic depth of field. Match the same 3D-rendered quality as the other approved characters in this Muha cast (Arctic Blueberry chad version, Frozen Pomegranate buff guy, Aloha, Galactic Diesel, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum). DO NOT render this as flat 2D vector art, NOT cel-shaded illustration, NOT cartoon-flat clip-art style, NOT painterly children's-book illustration. Must read as a real 3D animated-feature-film character with rounded volumetric forms and physically-based 3D lighting. Hands are PIXAR-CARTOON 3D-modeled hands (stylized 3D, not flat 2D). Clothes are PIXAR-CARTOON 3D fabric (with proper folds and 3D shading, not flat color fills).

NEGATIVE — do NOT render as flat 2D cartoon / cel-shaded illustration / painterly storybook style — MUST be full 3D Pixar render. Do NOT add any guava-slice cap / half-fruit / exposed pink-flesh-with-seeds element on top of the head or as a hat accessory — the head is a CLEAN smooth mango silhouette with just two-tone yellow + pink skin. Do NOT render this as a FEMALE character (the OLD personality was a laughing sunshine woman — we are completely replacing with a CLASS-CLOWN MALE comic-relief). Do NOT use any human flesh tone anywhere — face, neck, hands, arms must all be mango-yellow/guava-pink matching the head. Do NOT make hands peachy / pink / grey. Do NOT render the head as a humanoid head with realistic human face features. Do NOT add ANY graphics, prints, or logos to the outfit. Do NOT add a third arm or extra hand. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo. Do NOT render him as a child / teen / chibi.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-guava-mango-v10-3d-restore-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
