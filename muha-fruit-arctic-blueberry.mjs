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
const FLAVOR_REF = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/ARCTIC BLUEBERRY.png";

const PROMPT = `Reference 1 is the LOCKED VISUAL STYLE TARGET — match its exact aesthetic: 3D Pixar/animation-quality rendered fruit-characters with realistic textures, expressive cartoon faces with huge emotive eyes, hands and arms with clothing, dramatic moody cinematic lighting, soap-opera-drama emotional energy, telenovela-meme aesthetic, shallow depth of field with soft bokeh background.

Reference 2 is the FLAVOR BADGE — the "ARCTIC BLUEBERRY" logo with icy-blue/white display lettering with snow-capped tops, a cluster of plump purple-blue BLUEBERRIES at the top, white/blue FROSTED-ICE chunks/glaciers at the bottom. EVERY element of this badge must be embodied in the character's design + the badge itself must appear in the scene.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

- HEAD: large stylized BLUEBERRY (deep purple-blue glossy exterior with a subtle silvery bloom/frost dusting, the characteristic small star-shaped crown indent at the top, light reflections).
- HAIR: a voluminous CLUSTER OF BLUEBERRIES piled and cascading from her head like braided fruit dreadlocks — multiple individual plump blueberries clustered together, dusted with frost crystals, hanging past her shoulders. Among the blueberries: a few green blueberry-bush leaves peeking out (matching the small green leaves in reference 2).
- ICE CRYSTAL ACCENTS: delicate frost crystals on her eyelashes, eyebrows, and dusted across the top of her head/hair like fresh snow.
- EYES: large expressive almond-shaped, glossy, exaggerated Pixar cartoon scale with thick eyelashes — iris color is a cold pale ICY BLUE matching the badge's display lettering.
- LIPS: glossy icy blue-purple, slightly frost-chapped.
- FROZEN TEARS: instead of normal tears, dramatic CRYSTALLIZED ICE TEARS — small icicle-shaped frozen droplets clinging to her cheeks, with light refraction catching the cold key light. Some droplets caught mid-fall, half-frozen.
- POSE / EXPRESSION: dramatically WOUNDED / ICY-COLD-BETRAYED — eyes wide and watery (the verge of tears), lower lip quivering, one hand raised to her chest in shock or wrapped around herself shivering, head turned slightly. A frozen-over telenovela "I'm freezing inside" energy.
- OUTFIT: a cropped fuzzy/sherpa WINTER PARKA in icy white-and-blue with the parka's pattern explicitly featuring PRINTED BLUEBERRIES and SNOWFLAKES motifs in the badge's exact color palette (deep purple-blue + frost white + icy blue). Faux-fur trim around the hood (which is down) and cuffs.

THE FLAVOR BADGE IN THE SCENE: the "ARCTIC BLUEBERRY" badge from reference 2 appears as a large rendered SIGN/PLAQUE carved into or embedded in a WALL OF FROSTED BLUE ICE / GLACIER behind the character — large enough to be unmistakably readable, lit by the cold key light, positioned in the upper background. The sign looks like it's been frozen into the ice wall with frost crystals around its edges. Pixel-faithful to reference 2's typography and decorations.

BACKGROUND ATMOSPHERE: a moody arctic ice cave / frozen tundra — soft cold blue gradient, blurred icicles hanging in the foreground edges and ice formations, frosty mist, soft sparkle bokeh of falling snowflakes. Cool cinematic blue key light from the upper right with deep moody indigo shadow on the left, rim light catching the ice crystals on her hair. Subtle distant blue light shafts.

COMPOSITION: 9:16 vertical. Character framed from chest up filling ~65-70% of frame height. Flavor badge sign large in upper background, recognizable. Hyper-detailed Pixar/Cinema 4D/Octane 3D render, cinematic shallow depth of field, cold cinematic color grade (icy blue/purple/white dominant, with the badge accent reading clearly).

Negative: do NOT make the lighting warm or sunset-toned (must be COLD blue arctic), do NOT omit the blueberry-cluster hair (must be prominent), do NOT omit the frozen-icicle tears, do NOT omit the snowflake/blueberry parka pattern, do NOT shrink the badge so it's illegible, do NOT flatten the badge (must look like a real ice-embedded sign), do NOT break the 3D Pixar style, do NOT add other characters in foreground, do NOT include the Muha brand logo or words.`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-arctic-blueberry-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
