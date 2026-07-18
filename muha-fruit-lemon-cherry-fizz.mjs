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

CHARACTER — Pixar 3D young-adult WOMAN (mid-20s), the "Lemon Cherry Fizz" personality: a SASSY BRATTY POP DIVA — eye-roll energy, hair flick, gum-popping attitude, "ugh, whatever" vibe. The Y2K pop-princess of the cast. Bratty, confident, untouchable cool. Think Ariana Grande / Doja Cat attitude crossed with a Bratz-doll smirk.

HEAD — FULL FRUIT-CHARACTER. The head IS LITERALLY a LEMON with cherry accents, not a humanoid head with lemon coloring:
- The ENTIRE head is a giant glossy SYMMETRICAL rounded lemon — bright sunny YELLOW skin with the classic dimpled lemon-peel texture. LEFT-RIGHT BALANCED, NOT lopsided. Slightly oval/elongated lemon silhouette but not too tapered — should still read like a normal-proportioned head silhouette. Glossy real-fruit skin texture.
- A small lemon stem-and-leaf detail at the very crown.
- CHERRY "HAIR ACCESSORIES" — two glossy bright RED CHERRIES on long green stems hanging from the top sides of the head like cute hair-clip accessories or twin-tail pigtail-bobs. The cherries are positioned where pigtails would sit, dangling slightly past her ears. They are her signature pop-star accessory.
- FIZZ SPARKLE — tiny orange-yellow FIZZ BUBBLES popping in the air around the head, with subtle iridescent sparkle shimmer (like a soda just opened). Light playful sparkles, not overdone.
- 100% lemon-skin coloring across the ENTIRE face. Zero human flesh tone. No peach cheeks, no pink human lips, no human-skin pores. Picture animated cartoon features painted directly onto the surface of a lemon.
- Stylized SIMPLE CARTOON Pixar features embedded INTO the lemon surface — same construction approach as Aloha Passion Rush / Blue Slushie / Frozen Pomegranate / Arctic Blueberry / Galactic Diesel / Guava Mango / Horchata in this series. Animated fruit-WITH-a-face, NOT a photoreal human face glued onto a lemon-shaped head.

FACE — Pixar 3D fruit-face, stylized animated features (NOT photoreal human):
- Stylized angled brow shapes in a slightly darker yellow-orange — one brow arched higher than the other in a sassy "really?" expression.
- Cartoon Pixar eyes (almond) — HALF-LIDDED in a bratty EYE-ROLL — pupils drifted up and to the side, lids lowered, dripping with attitude. Iris a bright sour-yellow / amber. Simple highlight. NOT photoreal human eyes with realistic sclera + tear ducts.
- A subtle cartoon nose-bump on the lemon surface (no sculpted human nose with nostrils).
- A bratty PUCKERED SMIRK — mouth pursed to one side / blowing a small glossy CHERRY-RED bubblegum bubble at her lips. Lip area colored a deeper cherry-red than the surrounding face. NOT a human-lipped mouth glued on.
- Expression: full Bratz-doll sass — eye roll + smirk + hair-flick energy frozen mid-attitude. "Ugh, whatever."

BODY & POSE (free-standing, full diva pose):
- Adult feminine 1:7 head-to-body proportions, confident pop-star posture.
- EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs.
- Framed from MID-THIGH UP — full head with cherry pigtails, torso, both arms with both hands, hips, and down through mid-thigh. CHARACTER FILLS THE LOWER 3/4 of the frame.
- Pose: one hand on her hip in a power-cocked stance, the other hand brought up to flick / push back one of her cherry-pigtails in a "hair flick" gesture. Hips cocked to one side. Shoulder slightly raised on the hair-flick side. Pure bratty attitude.

OUTFIT — completely PLAIN, no graphics or prints:
- A PLAIN solid bright YELLOW CROP TOP or fitted tee — solid uniform yellow color, NO prints, NO graphics, NO logos, NO embroidery, NO cherry print, NO lemon icons.
- Plain solid CHERRY-RED low-rise mini-skirt or fitted bottom visible from waist to mid-thigh — solid uniform red, NO patterns.
- Stylish modern Y2K pop-princess aesthetic — bright, contemporary, attitude-forward. NOT fantasy, NOT couture, NOT cluttered.

WALL & BADGE PLACEMENT — the wall behind her is a bright pop-art interior wall — sunny yellow with subtle red polka-dot shadow accent (purely the wall, not on her outfit). The "LEMON CHERRY FIZZ" badge from reference 1 is a flat printed poster on that wall, occupying the UPPER THIRD of the frame, large and completely visible from edge to edge — pixel-faithful to reference 1, NOT restyled. All letterforms / lemon slices / cherries / fizz splashes reproduced exactly.

LIGHTING & ATMOSPHERE: bright pop-music-video lighting — punchy bright key light from upper front, cherry-pink rim light from behind, soft yellow fill. Tiny fizz-sparkle particles in the air. Mood: bratty Y2K music-video energy.

COMPOSITION: 9:16 vertical, poster-style layout. Upper ~1/4 = badge poster fully visible edge to edge. Lower ~3/4 = the character framed mid-thigh up, filling the frame width-wise, with clear air gap above her head.

NEGATIVE — do NOT redraw or restyle the badge poster — reference 1 placed AS-IS. Do NOT let the character overlap the badge. Do NOT render the head as a humanoid head with realistic human face features (no realistic human nose, no realistic human lips, no human cheek/jaw bone structure). Do NOT use any human flesh tone on the face. Do NOT add ANY graphics, prints, polka dots, fruit icons, or logos to the crop top or skirt — both must be PLAIN solid colors. Do NOT render her as a child / teen / chibi — she is a young ADULT woman (mid-20s) with mature feminine proportions. Do NOT make her look sweet or innocent — she is BRATTY / sassy / eye-rolling. Do NOT add extra arms or hands. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-lemon-cherry-fizz-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
