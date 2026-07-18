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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality fruit-characters where THE HEAD IS LITERALLY THE FRUIT (like the banana/strawberry/carrot heads in reference 1). Dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS as a flat printed poster, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN (mid-20s).

HEAD CONSTRUCTION — the entire HEAD is a literal POMEGRANATE FRUIT (like the banana character in reference 1):
- Round pomegranate shape, deep pink-red glossy skin (matching badge color)
- The pomegranate CALYX (5-6 leathery brown-pink crown petals) sits naturally on top
- Large expressive cartoon Pixar EYES embedded in the front of the pomegranate face
- An expressive mouth/lips embedded in the pomegranate face
- A subtle frost glaze across the top of the pomegranate skin (matching badge's "FROZEN" effect)
- ABSOLUTELY NO CRACK or split or opening showing seeds on her face — her pomegranate-head surface is SMOOTH and INTACT, completely unbroken. Do NOT show internal pomegranate seeds on her head. The skin is whole.

BODY: a regular human ADULT WOMAN body — slim, tall, trendy modern proportions (1:7 head-to-body ratio).

PERSONALITY (PUSH THE MEAN HARDER) — ULTRA-MEAN POPULAR GIRL: she is the absolute QUEEN of the mean-girl clique. Channel: Regina George at her most ruthless + Heather Chandler (Heathers) + every bitchy popular girl who's destroyed someone's confidence with one look. Maximum snob, maximum judgment, maximum "ugh you again." She's looking at the viewer like they just embarrassed themselves and she's already screenshotting it to send to the group chat.

MAXIMIZE THE MEAN through:
- Eyes ROLLING slightly, narrowed in dismissive judgment, ONE eyebrow sharply RAISED in the iconic "are you serious right now" look
- Lip CURLED into an upper-lip sneer (slight disgust + amusement)
- Mouth slightly opened in a "WOW" mid-eye-roll expression OR closed in a tight smug smirk
- Head tilted with a slow side-eye glance at the viewer
- Body language radiating "I cannot believe I have to deal with this"

- HAIR: long sleek SHINY POMEGRANATE-RED hair in a glossy high-end blowout, cascading past her shoulders, with frosted icy highlights throughout. Modern luxe hair styling.

- EYES: mature feminine almond-shaped, narrowed in disdain, dramatic eyeliner (mean-girl makeup), long lashes. Iris ICY BLUE matching the badge's "FROZEN" lettering. The eyes are sharp and cutting.

- LIPS: glossy deep PINK-RED matching the badge's "Pomegranate" script color, with the upper lip slightly curled in a sneer.

- POSE: arms CROSSED tight in front of her chest with attitude (the iconic mean-girl pose), one hip aggressively cocked, head tilted back slightly so she's looking down her nose at the viewer. Pure dismissive attitude.

- OUTFIT — NORMAL POPULAR-GIRL FIT (trendy modern casual):
  → A fitted CROPPED top or designer crop hoodie in deep pink-red or pastel icy blue (popular-girl wardrobe)
  → Subtle icy-blue frost details or small pomegranate-seed pattern on a sleeve or hem
  → High-waisted denim or mini skirt visible
  → Subtle gold chain necklace, small hoop earrings
  → A pair of ICE CUBES dangling as cute earring accents (tying to badge) — or 1-2 ice cubes near her shoulders/hair as floating bokeh elements
  → Overall: contemporary popular-girl outfit, NOT couture, NOT royal

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 2) mounted FLAT on a chic modern wall behind her — same typography, pomegranates, ice cubes, dripping ice. Upper background. Flat 2D printed graphic.

BACKGROUND ATMOSPHERE: a chic frozen-yogurt-shop / trendy ice-cream-parlor / upscale café — modern decor, cool ambient lighting (blue + soft pink), blurred pastel decor, soft sparkle bokeh. Modern trendy popular-girl hangout.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Adult slim proportions. Badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT show any crack, split, or opening on her pomegranate head (smooth intact skin only)
- Do NOT show pomegranate seeds anywhere on her face/head
- Do NOT make her seem sad, hurt, or vulnerable — MAXIMUM mean snobby energy
- Do NOT make her sweet or smiling kindly — sneer/eye-roll/smug only
- Do NOT dress her in royal/fantasy/couture clothing — trendy modern popular-girl casual only
- Do NOT use throne room / fantasy backgrounds — modern café/lounge only
- Do NOT render her as child/teen (must be ADULT WOMAN)
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v5-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
