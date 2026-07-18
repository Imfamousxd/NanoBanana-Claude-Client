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
const STYLE_REF = "AI Fruit VIdeos Muha/Character Example/character to recreate.png";
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/FROSTED MINT COOKIES.png";

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality rendered fruit/food-characters, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROSTED MINT COOKIES PRINTED POSTER ARTWORK. Place AS-IS as a flat printed poster, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN: she is a young ADULT WOMAN (early-20s appearance), NOT a child, NOT a teen, NOT chibi/kawaii infantilized. Adult proportions, mature feminine features, defined adult jawline. The character must read as a grown adult woman who happens to have a shy personality — like the bashful adult barista or shy young librarian, NOT a little kid.

BODY PROPORTIONS: slim adult woman build, hourglass figure with defined waist, model-proportions (1:7 head-to-body ratio), mature feminine curves. Tall and slender — NOT petite/short/childlike. Long graceful neck, defined collarbones, narrow shoulders, slim waist.

PERSONALITY (unique to this character): SWEET BASHFUL adult — shy, blushing, demure. Adult quiet charm — the kind of grown-up girl who's reserved but warm, doesn't fully meet eye contact, blushes when complimented. Adult shy energy, NOT childlike playfulness. Think: the cute reserved adult woman archetype. NO seduction, NO drama — adult sweet shyness.

- HEAD: a large stylized CHOCOLATE-CHIP COOKIE — warm golden-brown baked cookie texture with multiple visible CHOCOLATE CHIPS dotted across her face area, slight bumpy cookie surface, glossy. The top of the cookie head has a generous swirl of ICY BLUE-MINT FROSTING that drips slightly down the back.
- HAIR: voluminous FRESH MINT SPRIG hair — vibrant green mint leaves cascading from her head like wavy long ADULT hair styled past her shoulders, mint-leaf shapes (pointed oval leaves with toothed edges and visible veins). Adult styled hair, not pigtails or childlike.
- ACCESSORIES: a small ICE CUBE tucked into her mint-leaf hair like a hair pin. A tiny chocolate-chip cookie as a charm bracelet on her wrist.
- EYES: large expressive almond-shaped feminine eyes (NOT childlike huge round doe eyes — these are adult-sized expressive eyes), long thick eyelashes, iris warm honey-brown matching the cookie. Eyes give "shy adult woman who can't quite meet your gaze" energy — looking slightly down or to the side.
- EYEBROWS: gently arched mature feminine brows.
- CHEEKS: pink BLUSH dusting across her cookie-cheeks — visibly flushed, shy adult.
- LIPS: feminine adult lips (fuller than a child's), soft pink, in a small shy closed-mouth smile. Mature feminine lip shape, NOT a tiny child bow.
- POSE: hands gently clasped in front of her chest (one hand wrapped around the other wrist), shoulders slightly turned inward bashfully, head tilted gently to one side. Adult shy body language — not hunched childishly, just demure and reserved.
- OUTFIT: a cute cropped pastel SWEATER OR FITTED BAKER TOP in icy mint blue-and-cream with the badge's cookie + mint-leaf + ice-cube motifs printed on it. Adult-styled — fitted to her adult figure, modest neckline but flattering. The fit emphasizes she's an adult woman, just in a wholesome cute style.

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROSTED MINT COOKIES" poster (reference 2) is mounted FLAT on a cozy bakery kitchen wall directly behind the character — reference 2 IS the poster, do NOT redesign it. Same typography ("Frosted Mint" icy blue script + "COOKIES" golden-brown bubble letters), same cookies, same ice cubes, same mint leaves, same dripping ice. Position: upper background, large and readable.

BACKGROUND ATMOSPHERE: cozy bakery kitchen — soft warm-and-cool mixed lighting, blurred wooden kitchen shelves with cookie jars and mint sprigs, soft sparkle bokeh of flour dust. Subtle pile of warm chocolate-chip cookies on a tray, blurred. Cool icy blue frosting drips somewhere in the scene.

COMPOSITION: 9:16 vertical. Character framed chest-up to waist-up filling ~65-70% of frame height. ADULT WOMAN proportions clearly visible. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT render her as a child, teen, or chibi character — she must read as an ADULT WOMAN (early-20s)
- Do NOT use oversized cute kawaii eyes (use mature feminine eye scale)
- Do NOT use a tiny child-bow lip — adult feminine lip shape
- Do NOT make her face round and babyish — defined mature feminine facial structure
- Do NOT redraw the badge poster (preserve reference 2 EXACTLY)
- Do NOT make her seductive or flirty — adult SHY/bashful only
- Do NOT add other characters
- Do NOT include the Muha brand logo`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(STYLE_REF), inline(FLAVOR_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frosted-mint-cookies-v2-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
