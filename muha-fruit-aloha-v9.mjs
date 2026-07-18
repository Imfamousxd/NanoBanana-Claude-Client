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

const PROMPT = `Reference 1 = LOCKED VISUAL STYLE — 3D Pixar/animation-quality rendered fruit-characters, dramatic moody cinematic lighting, telenovela-meme aesthetic, shallow depth of field.

Reference 2 = the EXISTING ALOHA PASSION RUSH PRINTED POSTER. Place AS-IS in the scene, do NOT redesign.

SCENE — 9:16 portrait composition.

THE CHARACTER (foreground hero, Pixar 3D rendered):

BODY PROPORTIONS (locked from approved v8): TALL, SLIM, WILLOWY supermodel build, long elegant neck, narrow shoulders, defined hourglass waist, head proportional to body (1:6 head-to-body ratio). High-fashion runway model body in Pixar 3D style.

PERSONALITY — MAXIMUM SEDUCTION (push harder than v8): she is the embodiment of "passion rush" — the most magnetic, sultry, intoxicating presence in the room. Channel Jessica Rabbit + Marilyn Monroe + telenovela bombshell + James Bond femme fatale. Every detail of her face and body screams seduction. NO innocence, NO sad expression, NO neutral look — she is ACTIVELY drawing the viewer in.

THE SEDUCTIVE FACE (detailed):
- EYES: BEDROOM EYES — heavily half-lidded (eyelids close to closed), eyelashes long thick and curled with dark mascara, smoldering INTENSE eye contact directly with the viewer. The whites of the eyes barely visible — she's giving full smolder. Iris warm honey-amber.
- EYE GLANCE: chin tilted slightly down so she's looking UP at the viewer through her lashes — the iconic "come hither" angle.
- EYEBROWS: gracefully arched, one subtly raised in a knowing flirty challenge.
- LIPS: glossy bold RED-ORANGE (matching the badge's RUSH lettering), full and POUTY, slightly PARTED to show a tiny sliver of teeth — like she just exhaled or whispered something seductive. ALTERNATIVELY: lower lip gently caught between her teeth in a soft bite (tasteful, not aggressive).
- CHEEKS: subtle warm flush along the cheekbones, slight dewy highlight.
- A subtle beauty mark / single freckle near her lip corner for that classic vintage bombshell touch.

THE SEDUCTIVE POSE (detailed):
- Body angled 3/4 turn toward the viewer, leaning SLIGHTLY FORWARD (drawing the viewer in)
- One hip cocked sideways (model contrapposto)
- ONE HAND raised gracefully to her COLLARBONE area — slender fingers resting against her skin/neck, drawing attention to the long elegant neckline (signature seductive gesture)
- The OTHER HAND lower, perhaps resting at her cocked hip or playing with a strand of her palm-leaf hair
- Shoulders relaxed and rolled back slightly — open inviting body language
- Head tilted ever so slightly to one side (the "interested" head tilt that reads as intimate)

- HEAD: large stylized PASSION FRUIT (pearly purple-yellow glossy, subtle dimples and freckles, proportional to body).
- HAIR: 6-8 distinct PALM FRONDS cascading past her shoulders to mid-back, central spine + thin pointed leaflets, vibrant glossy green, tousled and tumbled to one side.
- HIBISCUS: 3-4 pink-red hibiscus blooms tucked into the palm-fronds — one statement bloom prominently above her ear.
- OUTFIT: cropped open-collar HAWAIIAN SHIRT tied at her midriff (showing her slim waist and toned stomach), top buttons undone, the shirt slipping off ONE SHOULDER (showing her bare shoulder and clavicle line), tropical hibiscus + palm-leaf + water-wave print in coral/red-orange/yellow/pink.

THE FLAVOR BADGE — FLAT PRINTED POSTER (preserve reference 2 AS-IS):
The "ALOHA PASSION RUSH" poster (reference 2) is mounted FLAT on the tropical tiki-bar wooden wall behind the character — reference 2 IS the poster, do NOT redesign it. Same typography, colors, hibiscus flowers, water splashes — placed AS-IS. Position: upper background behind her head/shoulders. Flat 2D printed graphic mounted on the wall, no perspective warping.

BACKGROUND ATMOSPHERE: moody Hawaiian sunset — warm orange-red gradient sky, blurred palm silhouettes, sparkle bokeh. Warm cinematic key light from upper right.

COMPOSITION: 9:16 vertical. Character framed waist-up, slim hourglass figure clearly visible, knotted-midriff shirt, hand-to-collarbone seductive pose, badge poster in upper background.

CRITICAL NEGATIVES:
- Do NOT redraw the badge poster (preserve reference 2 EXACTLY)
- Do NOT make her smile wide and innocent (must be sultry half-smile/lip-bite/parted-lips)
- Do NOT use wide-open surprised eyes (must be heavy bedroom-eyes)
- Do NOT use a generic neutral stance (must be hip-cocked + hand-to-collarbone seductive pose)
- Do NOT make her body stocky or short (must be tall slim supermodel)
- Do NOT use generic green hair (palm fronds required)
- Do NOT add other characters
- Do NOT include the Muha brand logo
- Keep it CLASSY seduction (Pixar-appropriate, no nudity)`;

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
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_muha-fruit-aloha-passion-v9-NB.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
