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

Reference 2 = the EXISTING FROZEN POMEGRANATE PRINTED POSTER. Place AS-IS as a flat printed poster, do NOT redesign. Also: every visual element of reference 2 (the whole pomegranates, the cracked-open pomegranate with seeds, the ice cubes, the dripping ice, the deep red + icy blue + frost-white color palette) must be embodied in the character's design.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

CRITICAL AGE — ADULT WOMAN (mid-20s), NOT a child or teen.

BODY PROPORTIONS: tall, slim, regal hourglass figure with defined waist (1:7 head-to-body ratio), long elegant neck, narrow shoulders, mature adult curves.

PERSONALITY: REGAL EVIL QUEEN FEMME FATALE — cold, dangerous, intoxicating dominance. Confident calculating SMIRK. Chin lifted high in regal disdain, looking DOWN at the viewer through her lashes. Dominant, intimidating, "you've already lost" energy.

DIRECT BADGE EMBODIMENT (CRITICAL — make her look like she IS the badge):

- HEAD: a large stylized POMEGRANATE FRUIT — pixel-faithful to the pomegranates shown in reference 2. Deep pink-red glossy skin (matching the badge pomegranate color exactly), with a few subtle highlight spots, the iconic pomegranate CALYX (5-6 pointed leathery crown-petals at top) sitting atop her head like a literal crown. The calyx is the same brownish-pink color as in the badge.
- VISIBLE POMEGRANATE SEEDS — a "CRACKED-OPEN" effect on one side of her pomegranate head, exposing CLUSTER OF JEWEL-LIKE RED POMEGRANATE SEEDS inside (matching the cracked-open pomegranate visible in reference 2). The crack is on the side of her head, glistening, with the seeds catching the cool light. The crack itself has frost crystals around its edges.
- FROST GLAZE: a thin layer of ICE/FROST crystals dusting across the top and one side of the pomegranate skin (matching the "FROZEN" icy effect on the badge's lettering).
- HAIR: long flowing hair made of strands styled in the same deep pink-red gradient as the badge's pomegranate color, with frosted icy highlights — the hair colors match the badge's "Pomegranate" pink-red script.
- ICE CUBES AS ACCESSORIES: 2-3 chunky clear ICE CUBES floating/clustered near her shoulders and hair, matching the ice cubes in reference 2 exactly.
- DRIPPING ICE: a subtle dripping-ice effect on her shoulders/collarbone (matching the dripping ice at the bottom of reference 2).

- EYES: mature feminine almond-shaped, narrowed slightly in dangerous judgment, long thick lashes with sharp winged eyeliner. Iris a striking ICY BLUE matching the badge's "FROZEN" lettering color.
- LIPS: glossy deep PINK-RED matching the badge's "Pomegranate" script color, in a knowing COLD SMIRK.
- POSE: chin LIFTED HIGH, looking down at the viewer. Body angled 3/4 turn. One hand raised gracefully — holding a single POMEGRANATE SEED between her fingertips like a precious jewel (a small red seed catching the light). Other hand on her hip. Regal predatory posture.
- OUTFIT: a sleek cropped HIGH-COLLAR top in deep PINK-RED (matching the badge pomegranate color) with FROSTED-WHITE icy trim across the collar and cropped hem, and small POMEGRANATE-SEED RHINESTONE embellishments scattered across the fabric. Frost details fading down from the collar.

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "FROZEN POMEGRANATE" poster (reference 2) is mounted FLAT on the wall behind her — reference 2 IS the poster, do NOT redesign it. Same typography ("FROZEN" icy blue + "Pomegranate" pink-red script), same pomegranates, same ice cubes, same dripping ice. Position: upper background. Flat 2D printed graphic on the wall.

BACKGROUND ATMOSPHERE: an icy frozen-fruit-stand or frozen marketplace at twilight — cold blue + crimson gradient atmosphere, blurred icy stone or wooden wall, frost mist, scattered ice crystals, hint of pomegranate seeds bokeh in deep blurred background. Cool key light from upper left, deep crimson shadow on the right. Color grade dominated by deep PINK-RED + ICY BLUE matching the badge.

COMPOSITION: 9:16 vertical. Character framed chest-up to waist-up filling ~65-70% of frame. Adult tall slender proportions. Badge poster in upper background, recognizable.

CRITICAL NEGATIVES:
- Do NOT render her as a child or teen — must be ADULT WOMAN
- Do NOT skip the visible pomegranate seeds (cracked-open effect required to tie to the badge)
- Do NOT skip the ice cubes around her (must be visible)
- Do NOT use a generic dark queen aesthetic disconnected from the badge — must feel like the badge brought to life
- Do NOT redraw the badge poster (preserve reference 2 EXACTLY)
- Do NOT remove the cold-smirk evil-queen mood (that part is approved)
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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-frozen-pomegranate-v2-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
