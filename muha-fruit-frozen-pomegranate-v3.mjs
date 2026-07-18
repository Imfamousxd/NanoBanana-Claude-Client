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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality rendered fruit-characters, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS as a flat printed poster, do NOT redesign. Every visual element of reference 2 (whole pomegranates, cracked-open pomegranate with seeds, ice cubes, dripping ice, deep red + icy blue + frost-white palette) must be embodied in the character.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN (mid-20s), NOT child/teen/chibi.

BODY PROPORTIONS: tall, slim, hourglass figure with defined waist (1:7 head-to-body ratio), long elegant neck, narrow shoulders. Adult model proportions.

PERSONALITY (UNIQUE in the lineup) — MEAN-GIRL ICE QUEEN SOCIALITE: she is the rich-girl bully, the snobby clique queen, the "you're not invited" mean girl. Channel: Regina George + Blair Waldorf + the rich mean-girl from every telenovela. She's MEAN and SNOBBY but in a GROUNDED contemporary "popular girl who looks down on everyone" way — NOT a Disney evil sorceress, NOT a fantasy villain queen. She lives in the same telenovela world as the Aloha tropical bombshell and the shy bakery girl — same energy, just nasty/snobby. Cold judgmental eye-roll, smug little smirk, "you've gotta be kidding me" energy. NO Maleficent fantasy theatrics, NO dark magic vibes. Just modern mean-girl glamour with a frozen-pomegranate twist.

DIRECT BADGE EMBODIMENT (CRITICAL):

- HEAD: a large stylized POMEGRANATE FRUIT — pixel-faithful to the pomegranates in reference 2. Deep pink-red glossy skin (matching badge color), with the iconic POMEGRANATE CALYX (5-6 pointed leathery crown-petals) sitting atop her head naturally — NOT styled as a regal crown, just the natural fruit calyx.
- VISIBLE POMEGRANATE SEEDS: a small "CRACKED-OPEN" effect on one side of her pomegranate head showing a cluster of jewel-like red POMEGRANATE SEEDS inside (matching the cracked pomegranate in reference 2). Frost crystals around the crack edges.
- FROST GLAZE: a thin layer of ICE/FROST crystals dusting across the top and one side of the pomegranate skin.
- HAIR: long sleek SHINY POMEGRANATE-RED hair styled in long straight glossy strands cascading past her shoulders — like a high-end blowout, very mean-girl-glamour. Glossy frosted highlights, NOT braided fantasy hair.
- ICE CUBES: 2-3 chunky clear ICE CUBES floating/clustered near her shoulders (subtle, not crown-like).

- MAKEUP — MEAN-GIRL SOCIALITE (not goth/fantasy):
  → Subtle smoky pink eyeshadow (NOT heavy black goth eye makeup)
  → Crisp but normal eyeliner (NOT sharp witch winged liner)
  → Lots of mascara, long lashes
  → Glossy red-pink LIPS matching the badge's "Pomegranate" script color
  → Subtle highlighter and rosy blush — high-maintenance modern beauty

- EYES: mature feminine almond-shaped, narrowed slightly in disdain (the classic mean-girl side-eye), one eyebrow raised in skeptical judgment. Iris ICY BLUE matching the badge's "FROZEN" lettering color.

- POSE: arms crossed CASUALLY in front of her chest (the iconic mean-girl pose), one shoulder slightly forward, head tilted with a side-eye glance at the viewer — like she just heard something stupid and is judging you for it. Body language is SNOBBY/UNIMPRESSED, not theatrical/dramatic.

- OUTFIT: a sleek modern cropped TOP in deep pink-red (matching pomegranate color) with FROSTED-WHITE faux-fur trim across a high collar — adult contemporary mean-girl wardrobe (like a designer crop top, NOT a fantasy royal gown). Small pomegranate-seed RHINESTONE details on the collar. Modern and fashionable.

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 2) mounted FLAT on the wall behind her — same typography, pomegranates, ice cubes, dripping ice. Upper background. Flat 2D printed graphic.

BACKGROUND ATMOSPHERE: a chic frozen cocktail-lounge OR upscale modern frozen-yogurt-bar at twilight — cold blue + crimson ambient lighting, blurred frosted-glass backdrop with hints of pomegranate accents, frost mist, subtle ice crystals. NOT a fantasy throne room. Modern upscale glamour location.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Adult slim proportions visible. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT make her look like Maleficent, evil sorceress, or fantasy villain queen
- Do NOT use heavy goth/dark fantasy makeup (must be modern mean-girl makeup)
- Do NOT give her a fantasy crown or royal jewels — just her natural pomegranate calyx + ice cubes
- Do NOT use a fantasy throne room background (modern upscale lounge instead)
- Do NOT use exaggerated theatrical sorceress poses — modern arms-crossed mean-girl pose
- Do NOT render her as child/teen — ADULT WOMAN
- Do NOT skip the visible pomegranate seeds (cracked-open effect required)
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v3-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
