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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/ALOHA PASSION RUSH.png";

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 is the FLAVOR BADGE — "ALOHA PASSION RUSH" — STUDY IT CAREFULLY. The badge has: "ALOHA" stacked above "PASSION" stacked above "RUSH" in cream/yellow display lettering with deep red drop shadow and bold black outlines, sitting on a cartoon banner ribbon, surrounded by VIBRANT PINK-RED HIBISCUS flowers (one on left, one on right), GREEN PALM LEAVES, and CYAN BLUE WATER-SPLASH wave accents behind. EVERY detail of this badge — the exact typography, the exact flowers, the exact wave splashes — must be reproduced PIXEL-FAITHFULLY when the badge appears in the scene.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered) — A PASSION-FRUIT FEMALE CHARACTER:

PERSONALITY (LOCKED — keep this exactly as approved): CONFIDENT SEDUCTIVE TROPICAL HEARTBREAKER — sultry half-lidded smolder, mischievous SMIRK with one corner of red-orange glossy lips raised, head tilted slightly down with eyes glancing up at the viewer. Hand to chin or playing with a strand of hair. "I'm the rush — you can't handle me" femme-fatale tropical bombshell energy. NO tears, NO sad expression.

- HEAD: large stylized PASSION FRUIT (pearly purple-yellow exterior with subtle dimples and freckles, glossy with light reflection).

- HAIR — CRITICAL EMPHASIS — must be UNMISTAKABLY PALM LEAVES, not generic green hair:
  → Multiple long PALM FRONDS cascading from her head like hair
  → Each frond has the iconic palm-leaf shape: a central spine with many thin pointed LEAFLETS fanning out symmetrically along both sides of the spine
  → 5-7 distinct palm fronds visible, some longer reaching past her shoulders, some shorter
  → Vibrant glossy tropical green color
  → The fronds drape and tumble around her face and shoulders like flowing hair — but every viewer should INSTANTLY recognize them as palm leaves (not generic dreadlocks)
  → Visible spine veins on each frond
  → Realistic Pixar 3D palm-leaf texture with subtle highlights

- HIBISCUS FLOWERS: 3-4 vibrant pink-red hibiscus blooms tucked confidently into the palm-leaf hair (matching the hibiscus color/shape from reference 2 exactly) — one large statement bloom above her right ear, two smaller blooms in the cascading fronds.

- EYES: large almond-shaped, SMOLDERING half-lidded bedroom gaze, long thick eyelashes, iris warm honey-amber. Looking slightly down/sideways at the viewer.

- LIPS: glossy bold RED-ORANGE matching the exact red-orange of the "ALOHA PASSION RUSH" lettering, curled into a SMIRK (one corner raised mischievously).

- HAWAIIAN SHIRT: a cropped open-collar Hawaiian shirt (loosely tied or unbuttoned at top to show collarbones), tropical print explicitly featuring hibiscus + palm-leaf + water-wave motifs from reference 2 in coral/red-orange/yellow/pink palette.

THE FLAVOR BADGE IN THE SCENE (CRITICAL — MUST BE PIXEL-FAITHFUL TO REFERENCE 2):
- The "ALOHA PASSION RUSH" badge appears as a large rendered SIGN on a tropical wooden tiki-bar wall directly behind her
- The sign is a faithful recreation of reference 2: the same stacked "ALOHA / PASSION / RUSH" typography, the same cream/yellow display letters with deep red drop shadow and bold black outlines, the SAME pink-red hibiscus flowers flanking the left and right sides, the SAME green palm leaves, the SAME cyan blue water-splash wave accents behind the typography
- Lit by warm key light so it reads clearly
- Large enough to be unmistakably readable
- Positioned in the upper background, behind her shoulder area
- Do not reinterpret, restyle, or improvise the badge — it is reproduced exactly as in reference 2, just rendered as a physical sign

BACKGROUND ATMOSPHERE: moody Hawaiian sunset — warm orange-red gradient sky, blurred palm silhouettes, atmospheric haze, soft sparkle bokeh. Cinematic warm key light from upper right, deep shadow on the left, rim light catching her palm-leaf hair.

COMPOSITION: 9:16 vertical. Character from chest up filling ~65-70% of frame height. Badge sign in upper background. Pixar/Cinema 4D/Octane 3D render, shallow depth of field.

Negative: do NOT change the badge's typography or layout from reference 2 (must be pixel-faithful — same stacked ALOHA/PASSION/RUSH, same colors, same hibiscus flowers and palm leaves and water splashes), do NOT replace her palm-leaf hair with generic green dreadlocks (must look like actual palm fronds with leaflets fanning from a spine), do NOT change her seductive smirk personality, do NOT add tears or sad expression, do NOT add other characters, do NOT include the Muha brand logo.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v5-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
