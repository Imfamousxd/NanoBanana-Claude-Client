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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/BLUE SLUSHIE.png";

const PROMPT = `Reference 1 is the "BLUE SLUSHIE" flavor badge. It MUST appear in the scene AS-IS — a flat printed poster / glowing sign on the wall behind the character, faithfully reproducing reference 1 exactly: "BLUE" in frosted/cracked-ice display lettering (icy blue), "SLUSHIE" in bubblegum-pink rounded display lettering, and big chunky ICE CUBES clustered around the typography. Reproduce ALL of those elements exactly. Do NOT redraw, restyle, recolor, or reinterpret the badge — reference 1 placed AS-IS, pixel-faithful, unchanged. The badge poster/sign is the only source of brand/typography in the scene.

CRITICAL COMPOSITION RULE — the BADGE SIGN MUST BE FULLY VISIBLE AND UNOBSTRUCTED in the UPPER portion of the frame, clearly readable edge to edge. The character occupies the LOWER ~3/4 of the frame, framed from chest/mid-torso up. Keep a small visible air gap between the top of her head and the bottom of the badge.

CHARACTER — Pixar 3D young-adult WOMAN (mid-20s), the NEW "Blue Slushie" personality: a VIBRANT GAMER E-GIRL — a bubbly, playful, slightly nerdy-but-adorable streamer/gamer girl with huge fun energy. Cute, expressive, mischievous, full of life. Think cozy-gamer / Twitch-streamer e-girl aesthetic: cat-ear gaming headset, playful makeup, peace-sign energy. Confident, cheeky and FUN — NOT crying, NOT sad, NOT brain-freeze drama anymore. She is upbeat, vibrant and a little geeky-cute.

HEAD — FULL SLUSHIE-CHARACTER (keep her core flavor identity). Her head IS literally a slushie, not a human head with blue coloring:
- The ENTIRE head is a glossy, slightly TRANSLUCENT slushie made of swirled ICY BLUE and BUBBLEGUM PINK slushie crystals visibly mixing inside, like real slushie ice, with frosty condensation sheen. The top of the head domes up slightly like a mounded slushie peak.
- 100% slushie coloring across the whole face (icy blue + pink swirl). Zero human flesh tone anywhere — cartoon Pixar features painted directly onto the translucent slushie surface.
- HAIR: voluminous BUBBLEGUM PINK slushie-ice hair (long, with frosted crystal texture and tiny ice flecks), streaked with a few icy BLUE strands — styled cute in an e-girl way (e.g. space buns, twin tails, or loose with face-framing strands). A couple of small clip accessories are okay.
- Stylized SIMPLE CARTOON Pixar features embedded into the slushie surface — animated slushie-WITH-a-face, NOT a photoreal human face glued onto a slushie head. Same construction approach as the other Muha fruit-drama characters.

FACE — Pixar 3D slushie-face, stylized animated features (NOT photoreal), cute vibrant e-girl expression:
- Large expressive glossy Pixar almond eyes, exaggerated cute scale, thick playful lashes — iris a vibrant ICY BLUE. Sparkly and lively, NOT watery/teary.
- Cute e-girl makeup painted onto the slushie face: bold winged eyeliner, a little sparkle, and two small blush hearts or blush blots high on the cheeks (the classic e-girl blush). Optional tiny star/heart sticker decals under one eye.
- Glossy BUBBLEGUM PINK lips in a playful expression — a big cheeky grin, or a cute open-mouth excited "let's gooo" smile, or a playful tongue-out :P with a peace sign. Mischievous and fun.
- Expression overall: vibrant, bubbly, geeky-cute, full of streamer energy.

GAMER E-GIRL ACCESSORIES (hero details):
- A CAT-EAR GAMING HEADSET worn over the head — a chunky modern gaming headset with two pointy CAT EARS on top and soft glowing RGB / blue-and-pink LED accents along the ear cups and cat ears. The headset's padded ear cups sit over where ears would be. ABSOLUTELY NO MICROPHONE and NO mic boom arm — it is a clean headset with NO mic attached anywhere, nothing in front of her face. This is the signature piece — clearly visible.
- Optional: cute oversized round nerdy glasses (clear or thin frames) for the geeky-but-vibrant touch, OR clip-on blue-light glasses pushed up — keep it cute, not heavy.
- A couple of small floating ICE CUBES drifting near her as cold bokeh accents (ties to the slushie theme).

BODY & POSE (vibrant gamer e-girl):
- Adult feminine proportions, cute and lively. Framed from chest/mid-torso up.
- ALL VISIBLE SKIN (hands, neck) is the SAME translucent icy-blue + pink SLUSHIE coloring as the head — NO human flesh tone anywhere. Hands are slushie-blue, neck is slushie-colored.
- ANATOMY LOCK — EXACTLY TWO ARMS and EXACTLY TWO HANDS total. Each arm attaches at one shoulder and ends in ONE hand with five fingers. Total of TWO arms + TWO hands + TEN fingers visible — count them. ZERO extra arms, ZERO extra hands, no third hand anywhere in the frame.
- Pose: playful gamer energy with NOTHING held in her hands (NO game controller, no props). ONE hand throws a cute PEACE SIGN / V near her face, and the OTHER hand rests casually on her headset ear-cup (or on her hip) like she's mid-stream saying "let's go". Lively, animated, fun body language. NOT crying, NOT pained. NO controller, NO objects in hands.

OUTFIT — cute gamer e-girl streetwear, PLAIN solid colors, NO graphics/prints/logos/text:
- A cozy oversized cropped HOODIE or zip-up in icy blue / bubblegum pink two-tone (color-blocked), or a cute layered top — soft, comfy streamer-girl style. Solid colors only, NO prints, NO graphics, NO logos, NO text, NO embroidery.
- Optional cute touches: fingerless gloves or arm warmers in the blue/pink palette, a small choker. Keep it cute and vibrant.
- Modern fashionable e-girl / gamer aesthetic, comfy and colorful.

WALL & BADGE PLACEMENT & BACKGROUND — a cozy GAMER BEDROOM / streaming setup wall washed in blue + pink RGB LED light (the e-girl RGB aesthetic, which doubles as the cold slushie palette). The "BLUE SLUSHIE" badge from reference 1 is a flat printed poster / glowing sign on that wall, occupying the upper portion, large and completely visible edge to edge — pixel-faithful to reference 1, NOT restyled. Soft blurred hints of a gaming setup (LED strips, soft bokeh) in the background, shallow depth of field.

LIGHTING & ATMOSPHERE: vibrant blue + pink RGB / neon key lighting, soft glow, sparkle bokeh, a little frosty mist. Mood: fun, cozy, upbeat gamer-stream vibe. Cool-but-vibrant color grade (icy blue + hot bubblegum pink dominant).

COMPOSITION: 9:16 vertical, poster-style layout. Upper portion = badge sign fully visible edge to edge. Lower ~3/4 = character framed chest up.

STYLE LOCK — hyper-detailed Pixar / Cinema 4D / Octane 3D render, animated-feature-film look, unified Pixar-3D stylization across the ENTIRE character (slushie head, face, hands, headset, hoodie). NOT photoreal, NOT live-action. Hands are PIXAR-CARTOON hands. Clothes and headset are PIXAR-CARTOON (stylized, animated feature shading). One cohesive Pixar 3D animated character matching the other approved characters in the set.

NEGATIVE — do NOT render her crying / sad / teary / in brain-freeze pain (she is vibrant and happy now). Do NOT use a human-skin face — the whole head/face/hands must be translucent blue+pink slushie. Do NOT omit the cat-ear gaming headset. Do NOT omit the pink slushie-ice hair. Do NOT use any human flesh tone anywhere. Do NOT add ANY graphics, prints, brand logos, or text to the clothing. Do NOT add a microphone or mic boom to the headset. Do NOT put a game controller or any object in her hands. Do NOT add a third hand or third arm — exactly two hands total, no extra limbs. Do NOT redraw the badge poster — reference 1 placed AS-IS. Do NOT add other characters. Do NOT add the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-blue-slushie-v3-egirl-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`OK ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
