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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/BLUE SLUSHIE.png";

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact aesthetic: 3D Pixar/animation-quality rendered characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting, soap-opera-drama emotional energy, telenovela-meme aesthetic, shallow depth of field with soft bokeh background.

Reference 2 is the FLAVOR BADGE — the "BLUE SLUSHIE" logo with: "BLUE" in frosted/cracked-ice display lettering (icy blue color), "SLUSHIE" in bubblegum pink rounded display lettering, and big chunky ICE CUBES clustered around the typography. EVERY element of this badge must be embodied in the character's design + the badge itself must appear in the scene.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

- HEAD: a TRANSLUCENT slushie-character HEAD made of layered icy blue and bubblegum pink slushie crystals — visibly swirled with both colors mixing inside, slightly translucent like real slushie ice, glossy with frosty condensation. The top of the head domes up like a slushie pile (the classic mounded slushie peak). A subtle "brain freeze" frost halo around the crown.
- HAIR: voluminous BUBBLEGUM PINK SLUSHIE-ICE strands cascading like long braided dreadlocks, with frosted crystal texture and tiny ice flecks. Streaked with a few icy BLUE strands mixed in.
- ICE CUBE ACCESSORIES: 2-3 floating CHUNKY clear ICE CUBES around her shoulders/head area, drifting like cold-air bokeh elements. Some catching highlights from the cool light.
- EYES: large expressive Pixar almond-shaped, glossy, exaggerated cartoon scale, thick eyelashes — iris a vibrant ICY BLUE matching the badge's "BLUE" lettering. Watery and dramatic.
- LIPS: glossy BUBBLEGUM PINK matching the badge's "SLUSHIE" lettering color.
- SLUSHIE TEARS: instead of clear tears, dramatic SWIRLED slushie droplets streaming down her cheeks — half icy blue, half bubblegum pink, with slushie-ice texture, refracting light. Some droplets caught mid-fall.
- POSE / EXPRESSION: dramatic BRAIN-FREEZE-BETRAYAL — eyes wide and watery and pinched at the corners (signature brain-freeze look), one hand raised pressed to her temple in pain, head tilted in shock, lower lip quivering. Telenovela "this betrayal hit me like a brain freeze" energy.
- OUTFIT: a cropped puffer jacket in glossy ICY BLUE + BUBBLEGUM PINK two-tone (color-blocked or mixed), with the jacket's pattern explicitly featuring printed ICE CUBES and small slushie swirl motifs in the badge's exact color palette. Faux-fur trim around the cropped collar (down hood).

THE FLAVOR BADGE IN THE SCENE: the "BLUE SLUSHIE" badge from reference 2 appears as a large GLOWING NEON-LIT SIGN mounted on a frosted-glass slushie-shop wall behind the character — large enough to be unmistakably readable, lit so it glows softly (blue + pink neon hues), positioned in the upper background. Pixel-faithful to reference 2's typography, ice cubes, and decorations.

BACKGROUND ATMOSPHERE: a moody retro slushie shop / icy neon-lit interior — soft cold blue + pink gradient atmosphere, blurred frosty glass surfaces, a hint of a slushie machine in the deep blurred background, atmospheric frost mist, soft sparkle bokeh of falling ice crystals. Cool cinematic blue + pink neon key lighting with deep cool shadow. Subtle pink rim light catching her bubblegum hair.

COMPOSITION: 9:16 vertical. Character framed from chest up filling ~65-70% of frame height. Flavor badge neon sign large in upper background. Hyper-detailed Pixar/Cinema 4D/Octane 3D render, cinematic shallow depth of field, cold-but-vibrant cinematic color grade (icy blue + hot bubblegum pink dominant).

Negative: do NOT use warm sunset tones (must be COLD blue + neon pink), do NOT omit the translucent slushie head, do NOT omit the pink slushie-ice hair, do NOT omit the swirled half-blue-half-pink slushie tears, do NOT omit the ice cube accessories, do NOT omit the ice-cube-print puffer jacket, do NOT shrink the badge so it's illegible, do NOT flatten the badge sign, do NOT break the 3D Pixar style, do NOT add other characters in foreground, do NOT include the Muha brand logo or words.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-blue-slushie-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
