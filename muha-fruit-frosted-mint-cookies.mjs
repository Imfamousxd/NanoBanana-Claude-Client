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

Reference 2 = the EXISTING FROSTED MINT COOKIES PRINTED POSTER ARTWORK. Place AS-IS in the scene as a flat printed poster, do NOT redesign, redraw, or reinterpret it. Treat reference 2 like a printed decal that physically exists.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

PERSONALITY (CRITICAL — unique to this character in the lineup): SWEET BASHFUL GOODY-TWO-SHOES — innocent, shy, blushing, cookie-cutter "girl-next-door" energy. The kind of character who covers her mouth when she giggles, clasps her hands shyly, looks up through her lashes with wide doe-eyed innocence. Wholesome bakery-girl charm. The character equivalent of "aww, you're so sweet!" energy. NO seduction, NO anger, NO drama — pure shy sweetness.

BODY PROPORTIONS: slim petite cute build (smaller than the Aloha bombshell), proportional, soft and rounded but not stocky. Cute petite frame. Head proportional to body (1:5 ratio for cute build).

- HEAD: a large stylized CHOCOLATE-CHIP COOKIE — warm golden-brown baked cookie texture with multiple visible CHOCOLATE CHIPS dotted across her face area, slight bumpy cookie surface, glossy. The top of the cookie head is covered with a generous swirl of ICY BLUE-MINT FROSTING that drips slightly down the back of her head, with a hint of mint flavor (icy blue-white color with slight transparency).
- HAIR: voluminous FRESH MINT SPRIG hair — bright vibrant green mint leaves cascading from her head like wavy long hair past her shoulders, with the iconic mint-leaf shape (pointed oval leaves with toothed edges and visible veins). Fresh and dewy looking.
- ACCESSORIES: a small ICE CUBE tucked into her mint-leaf hair like a hair pin (matching the ice cubes in reference 2). A tiny chocolate-chip cookie dangling from a string on her wrist as a charm bracelet.
- EYES: HUGE round innocent DOE EYES, wide open with sparkles/shine in the iris (the classic anime/Pixar "innocent sparkle" eye look), long thick eyelashes, iris a warm honey-brown matching the cookie color. Eyes give "shy and sweet" energy, not sultry.
- EYEBROWS: gentle arched lighter brown, raised slightly innocently.
- CHEEKS: bright pink BLUSH dusting across her cookie-cheeks — visibly flushed, very shy.
- LIPS: small bow-shaped smile, soft pink, slightly parted in a shy "aww" expression. NOT seductive — small and sweet.
- POSE: hands clasped or held shyly in front of her chest (fingers interlaced or one hand near her mouth covering a giggle). Shoulders slightly hunched forward bashfully. Head tilted innocently to one side. Body language radiates "shy and sweet."
- OUTFIT: a cute cropped pastel SWEATER OR APRON-STYLE BAKER TOP in icy mint blue-and-cream with the badge's cookie + mint-leaf + ice-cube motifs printed on it. The top is high-cut and modest (NOT cropped midriff or shoulder-bare like the Aloha character — this is the wholesome girl).

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROSTED MINT COOKIES" poster (reference 2) is mounted FLAT on a cozy bakery kitchen wall directly behind the character — reference 2 IS the poster, do NOT redesign it. Same typography ("Frosted Mint" icy blue script + "COOKIES" golden-brown bubble letters), same cookies, same ice cubes, same mint leaves, same dripping ice — placed AS-IS. Position: upper background behind her head/shoulders, large enough that the words are clearly readable. Flat 2D printed graphic mounted on the wall.

BACKGROUND ATMOSPHERE: cozy bakery kitchen — soft warm-and-cool mixed lighting (warm kitchen tones + cool mint-frost highlights), blurred wooden kitchen shelves with cookie jars and mint sprigs in the background, soft sparkle bokeh of flour/sugar dust. A subtle pile of warm chocolate-chip cookies sitting on a tray to the side, partially blurred. Cool icy blue frosting drips visible somewhere in the scene.

COMPOSITION: 9:16 vertical. Character framed chest-up to waist-up filling ~65-70% of frame height. Petite cute proportions clearly visible. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT redraw the badge poster (preserve reference 2 EXACTLY)
- Do NOT make her seductive, sultry, or flirty — she's BASHFUL/INNOCENT only
- Do NOT use bedroom eyes or smirk (must be wide-eyed doe-eyed innocent sparkle)
- Do NOT use midriff-bare or off-shoulder clothing (modest wholesome outfit)
- Do NOT make her face mature or adult-glamorous — she's a sweet bakery-girl
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frosted-mint-cookies-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
