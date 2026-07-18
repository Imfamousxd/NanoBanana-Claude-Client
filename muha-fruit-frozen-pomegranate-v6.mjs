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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality fruit-characters where THE HEAD IS LITERALLY THE WHOLE FRUIT (like the banana/strawberry/carrot heads in reference 1). Dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN (mid-20s).

HEAD CONSTRUCTION — FULL WHOLE INTACT POMEGRANATE:
- The entire head is a COMPLETE WHOLE POMEGRANATE FRUIT — round, full, plump, intact (like a fresh pomegranate from the grocery store, exactly like the whole pomegranates shown in reference 2 on the left side)
- Round bulbous spherical pomegranate shape with a slightly squat bottom
- Deep glossy pink-red pomegranate skin (matching the badge fruit color), smooth uninterrupted surface
- The pomegranate CALYX (5-6 leathery brown-pink crown petals) sits naturally on top of the round fruit
- Large expressive cartoon Pixar EYES embedded in the front of the pomegranate face
- An expressive mouth/lips embedded in the pomegranate face
- A subtle frost glaze across the top
- ABSOLUTELY NO CRACK, no split, no opening, no exposed seeds anywhere on the head — full intact fruit only

BODY ANATOMY — STRICT ANATOMICAL ACCURACY:
- A regular adult human female body — slim trendy proportions (1:7 head-to-body ratio)
- EXACTLY TWO ARMS connected to her shoulders — no extra limbs, no third arm, no duplicate hands
- EXACTLY TWO HANDS — one at the end of each arm, each with exactly five fingers (or partially visible if behind something)
- Arms positioned in ONE specific pose only (see below) — do not duplicate or repeat limbs

PERSONALITY — MAX MEAN POPULAR GIRL: ultra-snobby clique queen, Regina George at her most ruthless, dismissive eye-roll + sneer + tight smug smirk + tilted-back head looking down her nose.

POSE (specific to lock anatomy):
- Both arms crossed TIGHT in front of her chest — the LEFT arm crosses over the RIGHT arm, both hands tucked into the crooks of the opposite elbows
- This pose shows exactly 2 arms and 2 hands, with hands partially hidden under the opposite elbow
- One hip cocked aggressively to the side
- Head tilted back, looking down her nose at the viewer
- Maximum attitude

HAIR: long sleek glossy POMEGRANATE-RED hair in a high-end blowout cascading past her shoulders, with subtle frosted icy highlights.

EYES: mature feminine almond-shaped, narrowed dramatically in disdain, sharp eyeliner, long thick lashes, iris ICY BLUE matching the badge "FROZEN" color.

LIPS: glossy deep PINK-RED matching the badge "Pomegranate" script color, upper lip slightly curled in a sneer.

OUTFIT — POPULAR-GIRL CASUAL:
- Fitted cropped top in deep pink-red or pastel icy blue
- High-waisted denim or mini skirt at her waist
- Small gold chain necklace, hoop earrings
- 1-2 ice cubes near her shoulders as floating bokeh elements (matching badge)
- Modern trendy popular-girl look

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 2) mounted FLAT on a chic modern wall behind her — same typography, pomegranates, ice cubes, dripping ice. Upper background. Flat 2D printed graphic.

BACKGROUND ATMOSPHERE: chic frozen-yogurt-shop / trendy ice-cream-parlor at twilight — modern decor, cool ambient lighting (blue + soft pink), blurred pastel decor, soft sparkle bokeh.

COMPOSITION: 9:16 vertical. Character chest-up to waist-up filling ~65-70% of frame. Badge poster upper background.

CRITICAL NEGATIVES:
- Do NOT show ANY crack or opening on the pomegranate head — FULL WHOLE INTACT FRUIT ONLY
- Do NOT generate extra limbs — EXACTLY TWO ARMS, EXACTLY TWO HANDS, no duplicate or floating limbs
- Do NOT show pomegranate seeds on her head
- Do NOT use royal/fantasy/couture clothing
- Do NOT use throne room backgrounds (modern café only)
- Do NOT render her as child/teen — ADULT WOMAN
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v6-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
