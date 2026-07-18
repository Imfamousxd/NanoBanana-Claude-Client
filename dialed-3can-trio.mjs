#!/usr/bin/env node
// Stage 1 — 3-can triangle hero. Front-center can + 2 back cans peeking on
// either side. Low up-angle, all bases on the same plane. Isolated on flat
// white for Photoshop removability.
import fs from "fs";

const SINGLES_DIR = "Dialed Moods L-Doba Generations/Single Cans";
const ANGLE_REF = "Dialed Moods L-Doba Generations/6can-final-v4.png";

// Trio: high color contrast — magenta + yellow + cyan. Use the APPROVED single
// can shots as label references (they're already pixel-faithful matches).
const TRIO = {
  front: { file: "single-lemonade-anchor.png",       name: "Lemonade",            cap: "bright sunshine yellow",     ribbon: "LEMONADE" },
  backL: { file: "single-black-cherry-vanilla.png",  name: "Black Cherry Vanilla", cap: "deep magenta / berry pink", ribbon: "BLACK CHERRY VANILLA" },
  backR: { file: "single-blue-glacier.png",          name: "Blue Glacier",        cap: "light cyan / sky blue",      ribbon: "BLUE GLACIER" },
};

const PROMPT = `Hero product photograph — 4:3 landscape — of THREE intact Dialed Moods Cognition Elixir cans (12 fl oz tall slim aluminum format) arranged in a tight TRIANGLE formation, isolated on a PURE FLAT WHITE BACKGROUND (#FFFFFF, uniform, no gradient, no ledge, no surface, no environment, no shadow beyond tiny tight contact shadows directly under each can's base).

CAMERA — restrained low up-angle:
- Camera positioned slightly BELOW the cans, looking UPWARD at them
- Tilted UPWARD ~20° — clearly low-angle but not extreme
- All three cans stand UPRIGHT with their vertical axes parallel to each other and perpendicular to the ground plane
- Reference image 1 (the approved 6-can hero) is the ANGLE / LIGHTING anchor — match its low up-angle character and lighting

TRIANGLE FORMATION:
- ONE can centered in the FRONT row, closest to the camera, fully visible
- TWO cans in the BACK row, one slightly offset to the LEFT behind the front can, one slightly offset to the RIGHT behind the front can. Each back can shows ~75% of its body — the inner edge partially hidden by the front can's silhouette.
- CRITICAL: ALL THREE CANS SIT ON THE SAME FLAT GROUND PLANE — their bases all rest at the EXACT same Y coordinate in world space. Due to the low up-angle perspective, the back cans' bases appear slightly HIGHER on the canvas than the front can's base (because they're further from the camera — perspective foreshortening), but this is camera perspective only; in world space all three bases sit on one invisible flat floor.
- Triangle silhouette: apex at top-back-center, widening as it comes forward to the front can.

LEFT-TO-RIGHT FLAVOR ASSIGNMENT — REFERENCE 2, 3, 4 ARE THE EXACT LABEL ARTWORK ANCHORS. Each can in the trio must be a PIXEL-FAITHFUL reproduction of its respective reference label, just placed in the triangle composition at the low up-angle:
- FRONT-CENTER can: Lemonade — REPRODUCE the EXACT label artwork shown in reference 2 (yellow top cap with "CLEAN ENERGY & CALM FOCUS" banner, white body with the gold "DIALED" wordmark, vertical "LEMONADE" ribbon on the left, lemon-slice illustration, QR sticker, "COGNITION ELIXIR" subtitle, yellow bottom band with "DIETARY SUPPLEMENT 5 CALORIE ZERO SUGAR 12 FL OZ"). Match reference 2 1:1 — same typography, same illustration, same colors, same composition.
- BACK-LEFT can: Black Cherry Vanilla — REPRODUCE the EXACT label artwork shown in reference 3 (deep magenta/berry-pink top cap, magenta vertical "BLACK CHERRY VANILLA" ribbon, the cherries-and-vanilla-pod illustration, magenta bottom band). Match reference 3 1:1.
- BACK-RIGHT can: Blue Glacier — REPRODUCE the EXACT label artwork shown in reference 4 (light cyan/sky-blue top cap, cyan vertical "BLUE GLACIER" ribbon, the blueberries illustration, cyan bottom band). Match reference 4 1:1.

CRITICAL: do NOT invent label artwork. The labels in your output must read 1:1 with references 2, 3, and 4 — same typeface, same wordmark style, same fruit illustrations, same colors, same vertical ribbons, same QR codes, same subtitle.

LIGHTING:
- Bright soft diffused studio lighting from above-front
- Subtle cool rim highlights down each can's left edge, warm fill on the right edges
- Glossy crisp metallic surfaces
- Tiny tight contact shadows directly beneath each can's base

Style: clean modern beverage commercial, magazine-grade product photography from a low up-angle, hyper-realistic can rendering, glossy crisp finish, isolated on flat white ready for Photoshop.

Negative: no head-on eye-level perspective, no downward angle, no extreme dramatic perspective, no can physically tilted (cans stand vertical), no extra cans (only three), no ledge, no environment, no colored background, no gradient, no warped typography, no inaccurate label colors, no off-white tinting, no hands, no people, no cans floating above other cans (all three bases on the same plane).`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const __ = await import("path");
const { default: path } = __;
const __url = await import("url");
const __dirname = path.dirname(__url.fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const OUT_DIR = "Dialed Moods L-Doba Generations/Trio";
fs.mkdirSync(OUT_DIR, { recursive: true });

const body = {
  contents: [{ parts: [
    inline(ANGLE_REF),
    inline(path.join(SINGLES_DIR, TRIO.front.file)),
    inline(path.join(SINGLES_DIR, TRIO.backL.file)),
    inline(path.join(SINGLES_DIR, TRIO.backR.file)),
    { text: PROMPT },
  ]}],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const dst = path.join(OUT_DIR, "trio-cans.png");
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
