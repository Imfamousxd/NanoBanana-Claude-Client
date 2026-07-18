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

const PROMPT = `Reference 1 is the "ARCTIC BLUEBERRY" flavor badge. It MUST appear in the scene AS-IS — a flat RECTANGULAR printed poster pinned to the wall behind the character, faithfully reproducing reference 1 exactly. The badge in reference 1 is a wide RECTANGULAR landscape sign (NOT a circle, NOT a Starbucks-style round logo) featuring: a chunky 3D snow-iced wordmark reading "ARCTIC BLUEBERRY" with the words stacked in two lines, chunky blue display letterforms with white snow piled on top of each letter and frost crystals around them, a pile of plump deep purple-blue BLUEBERRIES at the top with white snow piled on them, and white/light blue FROSTED-ICE chunks at the bottom. Reproduce ALL of those elements exactly. Do NOT convert the badge into a circular logo, do NOT redraw, restyle, recolor, or reinterpret. Reference 1 placed AS-IS, pixel-faithful, unchanged — the exact same wide RECTANGULAR poster from the reference image. The badge poster is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character is LARGE, TALL and IMPOSING and fills MOST of the frame — framed from MID-THIGH (or knees) UP, standing CLOSE to camera so he reads as a big, tall, commanding presence that dominates the shot. He occupies the LOWER ~4/5 of the frame. The badge sits ABOVE him in the upper portion, still clearly visible edge to edge, with only a small air gap of wall between the top of his head and the bottom of the badge. Make him noticeably TALLER and BIGGER in the frame than a normal medium shot — broad, towering, larger-than-life scale, shoulders wide and filling the width of the frame.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the NEW "Arctic Blueberry" personality: the EFFORTLESSLY COOL, NONCHALANT, CHILL GUY with serious SWAGGER and DRIP. He is the smooth, laid-back, too-cool-to-care guy — relaxed confidence, never tries hard, just naturally has the best style and the best energy in the room. Cool and unbothered, slight knowing smirk, fully at ease. NOT a flexing gym-bro, NOT aggressive, NOT broody — his whole vibe is calm, stylish, self-assured nonchalance. He is TALL and has a big, broad, commanding frame (a large imposing presence), but his ENERGY stays relaxed and nonchalant — tall and built, yet loose and chill, not flexing. Picture the tallest, most stylish, chill, unbothered guy at the rooftop party who everyone gravitates to.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY A BLUEBERRY, not a humanoid head with blueberry coloring:
- The ENTIRE head is a giant glossy spherical deep purple-blue BLUEBERRY. Spherical blueberry shape, NOT a human skull shape. Classic small star-shaped crown indent at the top. Soft silvery natural "bloom" dust on the surface.
- A small fluffy tuft of WHITE SNOW resting on top of the blueberry head near the crown indent.
- 100% blueberry-skin coloring across the ENTIRE face. Zero human flesh tone. Picture cartoon Pixar features painted directly onto the surface of a blueberry.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the blueberry surface — same construction approach as the other Muha fruit-drama characters (Aloha, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum). Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a blueberry-shaped head.
- Light frost dusting only on the brow ridges.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized masculine angled brow shapes in a slightly darker purple — one brow subtly raised in a cool, knowing, unbothered expression.
- Cartoon Pixar eyes (almond), relaxed and half-lidded in a chill, smooth, too-cool gaze. Iris an intense icy blue with a simple highlight. Short masculine lashes.
- A subtle cartoon nose-bump on the blueberry surface.
- A small, easy, knowing SMIRK — calm and confident, barely-there cool half-smile (not a big grin). Mouth shape colored a slightly deeper blueberry tone.
- Expression: nonchalant, chill, effortlessly cool. "Yeah, I know." Unbothered swagger.

BODY & POSE (free-standing, relaxed nonchalant swagger):
- Adult masculine proportions — good athletic build, but a RELAXED, loose, laid-back posture. Shoulders easy and dropped, weight shifted casually onto one leg, slight cool lean. He is NOT puffed-up or flexing — he's loose and unbothered.
- ALL VISIBLE SKIN (hands, neck, forearms — anything not covered by clothing) is the SAME DEEP PURPLE-BLUE BLUEBERRY COLOR as the head, with the same soft silvery bloom dust subtly visible. NO human flesh tone anywhere — fully blueberry-colored from head to fingertips. Hands are blue-fingered, neck is blue-skinned, exposed forearm skin is blue.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY. Each arm attaches at one shoulder, ends in one hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible. ZERO extra arms or hands.
- Framed from MID-THIGH UP — full torso, both arms, both hands all visible. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: nonchalant chill swagger — one hand relaxed in his pocket, the OTHER hand resting near his chest lightly touching the cuban-link chain (or a loose easy gesture). Leaning back slightly, calm and collected, chin level, totally at ease. Effortless cool, NOT a hard flex. (His wrists are BARE — no watch.)

JEWELRY / DRIP — tasteful Pixar-stylized iced-out jewelry that POPS against the blue skin:
- A chunky ICED-OUT DIAMOND CUBAN LINK CHAIN necklace — interlocking silver / white-gold links fully encrusted with sparkling white diamonds, worn OVER the hoodie on his chest, catching cool light with bright sparkle glints. The hero drip piece, clearly visible draped over the hoodie. This is the ONLY jewelry piece.
- NO WATCH — his wrists are completely bare, no watch, no wristband, no bracelet of any kind.
- Keep the chain clean, glossy, Pixar-stylized (sparkly cartoon diamonds), expensive-looking but tasteful — this is his SWAGGER and DRIP.

OUTFIT — stylish, fashionable streetwear "best fits" — HOODIE + RIPPED JEANS drip, MASCULINE cool, PLAIN solid colors, NO graphics/prints/logos:
- A premium, oversized stylish HOODIE in a cool tone (icy blue, slate-grey, frosty off-white, or charcoal) — clean, fashion-forward streetwear hoodie, hood down or relaxed, drawstrings visible. Heavyweight premium-fabric look. Solid uniform color only, NO prints, NO graphics, NO logos, NO text, NO embroidery, NO brand marks. This is a STYLISH COOL hoodie (drip), NOT a sad/broody hoodie.
- Cool distressed RIPPED JEANS — fashionable light-to-mid blue or washed grey denim with stylish rips/tears at the knees and thighs, modern streetwear cut, visible from waist to mid-thigh/knee. Solid wash, no prints.
- Maybe push the hoodie sleeves up the forearms casually so the blueberry-blue forearms show (bare wrists, NO watch). The iced cuban-link chain is draped OVER the hoodie.
- Modern fashionable young-adult streetwear aesthetic — expensive, effortlessly put-together drip. NOT plain button-down, NOT athletic athleisure, NOT a broody outfit — cool stylish streetwear.

WALL & BADGE PLACEMENT — the wall behind him is a cold arctic-blue interior wall (sleek modern lounge / cool lighting). The "ARCTIC BLUEBERRY" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled.

LIGHTING & ATMOSPHERE: cool blue cinematic key light from the upper right, soft cool fill, gentle rim light catching the frost on the blueberry skin AND bright sparkle highlights on the diamond chain. Subtle snowflake bokeh in the air. Mood: chill, upscale, modern-lounge cool. Confidently relaxed.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = character framed mid-thigh up.

STYLE LOCK — hyper-detailed Pixar / Cinema 4D / Octane 3D render, animated-feature-film look, unified Pixar-3D stylization across the ENTIRE character (head, face, hands, jewelry, shirt, pants). NOT photoreal, NOT live-action, NOT a real human-photo body with a cartoon head pasted on. Hands are PIXAR-CARTOON hands (stylized animated, not photoreal). Clothes and jewelry are PIXAR-CARTOON (stylized fabric and sparkly stylized diamonds, animated feature shading). All rendered together as one cohesive Pixar 3D animated character — matching the other approved characters in the set.

NEGATIVE — do NOT render him as broody / angry / hurt / sad (the hoodie is a STYLISH cool drip hoodie, his expression and energy are chill and confident, NOT moody). Do NOT render him flexing or puffed-up (he is relaxed and nonchalant). Do NOT make him small / short — he must read as TALL and large in frame. Do NOT use a plain button-down. Do NOT render the head as a humanoid head with realistic human face features. Do NOT use any human flesh tone ANYWHERE on the body — face, neck, hands, forearms must all be blueberry-blue matching the head. Do NOT make the hands peachy / pink / grey. Do NOT add ANY graphics, prints, brand logos, or text to the shirt or pants. Do NOT add a third arm or extra hand. Do NOT put a WATCH, wristwatch, smartwatch, bracelet, or any wrist accessory on him — wrists are completely bare (keep ONLY the cuban-link chain necklace). Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-v13-nowatch-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`OK ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
