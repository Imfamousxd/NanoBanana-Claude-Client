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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/FROZEN POMEGRANATE.png";

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality fruit-characters where THE HEAD IS LITERALLY THE FRUIT (like the banana head and strawberry head and carrot head in reference 1 — the whole head is the fruit with cartoon eyes/mouth embedded in it, NOT a human face with fruit elements). Dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS as a flat printed poster, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN (mid-20s).

CRITICAL HEAD CONSTRUCTION — the entire HEAD must be a literal POMEGRANATE FRUIT, just like how the banana character in reference 1 has a banana as its actual head. NOT a human-skinned face with pomegranate accessories. The HEAD IS THE FRUIT:
- Round pomegranate shape replaces where a human head would be
- Deep pink-red glossy pomegranate skin (matching badge color)
- The pomegranate CALYX (5-6 leathery brown-pink crown petals) sits naturally on top of the fruit-head
- Large expressive cartoon Pixar EYES embedded in the front of the pomegranate face
- A small expressive mouth/lips also embedded in the pomegranate face
- A subtle CRACK on one side of the pomegranate-head showing red jewel-like seeds inside (matching the cracked pomegranate in reference 2)
- A frost glaze across the top of the pomegranate skin
- Cartoon Pixar features look natural on the fruit — like the banana character's face in reference 1

BODY: a regular human ADULT WOMAN body — slim, tall, trendy modern proportions (1:7 head-to-body ratio for the fruit-head-to-body). Long elegant neck connects the pomegranate-head to her body.

PERSONALITY (UNIQUE in the lineup) — MEAN POPULAR GIRL: she is the rich popular high-school / college queen-bee mean girl. Channel: Regina George (Mean Girls), Cher (Clueless), Blair Waldorf (Gossip Girl). Snobby, judgmental, "ugh, as if" energy. Cold side-eye, smug little smirk, looks-down-on-you posture. Modern mean-girl-clique aesthetic — NOT a fantasy queen, NOT a couture model, just a regular bitchy popular girl who happens to have a pomegranate for a head.

OUTFIT — NORMAL POPULAR-GIRL FIT (not couture, not fantasy):
- A fitted CROPPED tank or crop top in deep PINK-RED or icy pastel blue (something a popular girl would wear)
- OR alternatively: a cute fitted designer cropped hoodie / cropped sweater
- High-waisted denim or a mini skirt visible at her waist
- Maybe a small chain necklace or hoop earrings (subtle modern accessories)
- A small pomegranate-seed-pattern detail or icy frost accent somewhere on the outfit to tie to the flavor
- Overall vibe: modern Y2K / contemporary popular-girl wardrobe, NOT royal or fantasy

POSE: arms crossed CASUALLY in front of her chest (signature mean-girl pose), one hip cocked, head tilted with a side-eye glance at the viewer. Body language unimpressed and snobby. Casual stance, not theatrical.

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 2) mounted FLAT on a chic modern wall behind her — same typography, pomegranates, ice cubes, dripping ice. Upper background. Flat 2D printed graphic.

BACKGROUND ATMOSPHERE: a high-end frozen-yogurt-shop / trendy ice-cream-parlor / chic café — modern decor, cool ambient lighting (blue + soft pink), blurred pastel decor, soft sparkle bokeh. NOT a fantasy throne room. Modern trendy popular-girl hangout.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Adult slim proportions. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT give her a human face (the HEAD IS a literal POMEGRANATE FRUIT with cartoon features embedded in the fruit)
- Do NOT dress her like a fantasy royal / queen / sorceress
- Do NOT use couture / haute fashion (just trendy popular-girl casual)
- Do NOT use a throne room or fantasy background (modern café/yogurt-shop instead)
- Do NOT render her as child/teen (must be ADULT WOMAN)
- Do NOT skip the visible pomegranate seeds (cracked-open hint required)
- Do NOT redraw the badge poster (preserve reference 2 EXACTLY)
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v4-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
