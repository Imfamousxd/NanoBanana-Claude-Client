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

const PROMPT = `Reference 1 is the "WATERMELON BUBBLEGUM" flavor badge. It must appear in the scene AS-IS — a flat printed poster pinned to the wall behind the character. The badge in reference 1 shows: "WATERMELON" in chunky 3D bright-green block letters on top, "BUBBLEGUM" in chunky 3D bright-pink block letters below, with watermelon slices on the left and right sides and pink bubblegum drips oozing at the bottom, all with black drop-shadow borders. Reproduce this EXACTLY from reference 1, pixel-faithful, completely unchanged — same letterforms, same colors, same watermelon slices, same pink drips, same layout. Do NOT redraw, restyle, re-letter, recolor, or reinterpret. The badge poster is the only source of brand/typography in the scene.

OVERALL RENDER STYLE LOCK — hyper-detailed Pixar / Cinema 4D / Octane 3D render, same animated-feature-film look as the rest of this Muha fruit-drama character series (Arctic Blueberry, Galactic Diesel, Guava Mango, Horchata, Lemon Cherry Fizz). The ENTIRE character — head, face, hands, hoodie, tee, jeans — is unified PIXAR-3D stylization. Stylized animated proportions and textures across everything. NOT photorealistic, NOT live-action, NOT a real human-photo body with a cartoon head pasted on. The clothes are PIXAR-CARTOON clothes (stylized fabric folds and animated-feature shading), the hands are PIXAR-CARTOON HANDS (stylized animated-feature hands with cartoon proportions, NOT photoreal human hands with realistic skin/nails/veins), the face is PIXAR-CARTOON. All elements rendered together in one cohesive 3D animation style — like a single character from a Pixar / Disney / DreamWorks feature film. Cinematic lighting and shallow depth of field, but everything is stylized animated, not photoreal.

CRITICAL COMPOSITION RULE — the BADGE POSTER MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame. The character occupies the LOWER ~3/4 of the frame, framed from MID-THIGH UP. The badge sits ABOVE him in the upper ~1/4 of the frame, clearly visible from edge to edge. The top of his head must NOT overlap the badge — keep a small visible air gap. Movie-poster layout.

CHARACTER — Pixar 3D young-adult MAN (mid-20s), the "Watermelon Bubblegum" personality: a PLAYFUL FUN GUY — the goofy mid-20s skater-kid-grown-up energy, mid-bubblegum-blow, easygoing class-clown charm, fun and approachable. Confident but not cocky. Cheeky, mischievous.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY A WHOLE UNCUT WATERMELON (green-rind exterior — the OUTSIDE of an intact watermelon), with cartoon Pixar features painted directly onto the green surface. Same construction approach as the other characters in this series (Arctic Blueberry / Galactic Diesel / Guava Mango / Horchata / Lemon Cherry Fizz): one single integrated fruit IS the head.
- The ENTIRE head is a giant glossy SYMMETRICAL rounded WHOLE-WATERMELON sphere (LEFT-RIGHT BALANCED, NOT lopsided). Slightly elongated oval / watermelon-shape but normal head-proportioned. Bright juicy GREEN rind across the whole head — the classic watermelon-green base with darker GREEN WAVY STRIPES running vertically over the entire head surface (top to bottom, all the way around). Glossy real-fruit skin texture, like an uncut whole watermelon sitting on a counter.
- BUBBLEGUM HAIR — instead of a tiny stem on top, his "hair" is a STYLED GLOSSY PINK BUBBLEGUM hairstyle sitting on top of the green watermelon head. The bubblegum is shaped like a cool masculine HAIRSTYLE — a stylized swooping pompadour-quiff / wavy gum-pomp / chunky gum-mohawk vibe, made of glossy translucent bright bubblegum-pink gum that holds the hair shape. Think: a skater-cool gum-quiff pulled up and back, with one or two gum strands curling slightly. The gum hair has glossy specular highlights and a slight translucent pink glow. A tiny brown stem may peek through the gum hair if it works compositionally.
- BUBBLEGUM BUBBLE — additionally, a large glossy translucent PINK BUBBLEGUM bubble blown out from his mouth, fist-sized, clearly reads as bubblegum.
- 100% watermelon-rind GREEN coloring across the ENTIRE face area (the face features sit on the green watermelon skin, not on pink flesh). Zero human flesh tone. No peach cheeks, no human-skin pores. Picture animated cartoon features painted directly onto the green outside of a whole watermelon.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the pink-flesh surface — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel / Guava Mango / Horchata / Lemon Cherry Fizz in this series. Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a fruit-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized angled MASCULINE brow shapes in a darker watermelon-green tone — one brow arched in a playful mischievous lift. Thicker than feminine brows.
- Cartoon Pixar eyes (almond-shaped, simple cartoon style) — narrowed slightly with playful crinkles at the corners. Iris a warm amber. Simple cartoon highlight only. NO realistic human eye anatomy (no realistic sclera shading, no realistic tear ducts, no realistic eyelid folds, no detailed lashes). Keep eyes SIMPLE and CARTOON, like the other characters in the series. SHORT MASCULINE LASHES.
- A subtle cartoon nose-bump on the green watermelon-rind surface (no sculpted human nose with nostrils).
- A puckered mouth shape mid-bubble-blow — lips pursed forward, mouth a slightly darker green or rose tone. NOT a human-lipped mouth glued on.
- Expression: playful goofy fun — cheeky eyes, mid-bubblegum-blow, about to crack a joke.

BODY & POSE (free-standing, full playful pose):
- Adult MASCULINE 1:7 head-to-body proportions, broad shoulders, lean athletic skater-build.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS — TWO ARMS ONLY. Each arm attaches at one shoulder, ends in one hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible in the entire image. ZERO extra arms.
- Framed from MID-THIGH UP — full head, torso, both arms with both hands, hips, and down through mid-thigh. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: one hand tucked casually in his pants pocket, the other hand giving a chill peace-sign / two-fingers-up gesture near his shoulder. Slight slouch, weight on one leg, head tilted slightly with the bubblegum bubble blowing out of his mouth. Easygoing playful streetwear-guy stance.

OUTFIT — UPGRADED contemporary streetwear, more distinctive cut/silhouette but still completely PLAIN with no graphics or prints:
- A PLAIN solid watermelon-PINK ribbed CREWNECK SWEATER or oversized fitted knit — solid uniform color, NICE textured knit weave in stylized Pixar fashion (not photoreal), NO prints, NO logos, NO graphics, NO embroidery, NO patches.
- A PLAIN solid GREEN (watermelon-rind green) MA-1 BOMBER JACKET layered open over the sweater — modern oversized fit with stylized ribbed cuffs and ribbed collar / hem, solid uniform green, NO prints, NO patches, NO logos, NO embroidery.
- Dark CHARCOAL CARGO PANTS or wide-leg trousers with subtle utility-pocket details (no logos, no prints, just structural pockets), visible from waist to mid-thigh.
- Optional: a stylized clean chain or single statement accessory at the neck — plain metallic, no logos.
- Stylish modern HYPEBEAST / Tokyo-streetwear inspired aesthetic — a clear step up from a basic tee + hoodie. Pixar-stylized, NOT photoreal fashion-shoot.

ENVIRONMENT & BADGE PLACEMENT — the BACKGROUND is a STYLIZED DREAMY OUTDOOR BUBBLEGUM-WORLD ENVIRONMENT, not a plain wall:
- A vibrant pink-to-green pastel gradient SKY backdrop (soft sunset-pink fading into watermelon green) with a hint of warm sunny light.
- Multiple FLOATING GLOSSY PINK BUBBLEGUM BUBBLES of various sizes drifting through the air in the background and midground at different depths, with soft bokeh on the more distant ones.
- A few stylized green WATERMELON-VINE LEAVES or large playful palm-frond shapes curling in from the edges of the frame, adding depth.
- Optional: a soft suggestion of a stylized pink-and-green checkered ground plane below his feet, fading into the background.
- The mood is whimsical Pixar-set design — a dreamy candy/bubblegum world, NOT a flat boring interior wall.
- The "WATERMELON BUBBLEGUM" badge from reference 1 is a flat printed poster floating / pinned in the UPPER THIRD of the frame against this dreamy background, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled. All letterforms and imagery reproduced exactly.

LIGHTING & ATMOSPHERE: warm dreamy golden-hour key light, soft pink and green rim light, magical bubblegum-world vibe. Floating bubble particles add depth. Mood: lighthearted, whimsical, immersive.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, filling the frame width-wise, with clear air gap above his head.

NEGATIVE — do NOT render the head as a pink-flesh ball — the head must be a WHOLE WATERMELON with the GREEN STRIPED RIND exterior all the way around. Do NOT split the head into a green rind shell with a flesh face-panel cutout — features sit on the green skin. Do NOT render him wearing a watermelon helmet or mask — the head IS the watermelon. Do NOT make the bubblegum drip cover most of the head — the watermelon must be clearly visible, the gum is a small accent + the blown bubble. Do NOT redraw or restyle the badge poster — reference 1 placed AS-IS. Do NOT let the character overlap the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use photoreal human eyes — eyes must be SIMPLE CARTOON Pixar eyes matching the other characters in the series. Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, or logos to the tee, hoodie, or pants — all must be PLAIN solid colors. Do NOT render him as a child / teen / chibi. Do NOT make him female / use feminine features. Do NOT add a third arm or extra hand — TWO ARMS / TWO HANDS / TEN FINGERS TOTAL only. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-watermelon-bubblegum-v6-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
