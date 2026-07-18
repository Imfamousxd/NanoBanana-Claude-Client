#!/usr/bin/env node
// Generate ONE single can (Lemonade) as the size/distance/framing anchor.
// Once approved, this becomes the reference for the other 5 flavors.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const FLAVOR_REF = "Dialed Moods L-Doba Generations/Product REfs/Lemonade.png";
const OUT_DIR = "Dialed Moods L-Doba Generations/Single Cans";
fs.mkdirSync(OUT_DIR, { recursive: true });

const PROMPT = `Hero product photograph — 3:4 vertical — of ONE intact Dialed Moods Lemonade Cognition Elixir can (12 fl oz tall slim aluminum format), isolated on a PURE FLAT WHITE BACKGROUND (#FFFFFF, uniform, no gradient, no ledge, no surface, no environment, no shadow beyond a tiny tight contact shadow directly under the can's base).

CAMERA — clean head-on product shot:
- Camera at the can's mid-body height, looking DEAD-ON at the can from straight in front
- NO upward tilt, NO downward tilt, NO 3/4 rotation — straight perpendicular front elevation
- The label's flat plane is parallel to the camera lens
- Top cap and bottom band read as VERY THIN ellipses (looking straight at them edge-on)
- Can stands upright vertically

FRAMING / SIZE / DISTANCE (CRITICAL — this defines the master framing for the whole flavor set):
- The can is horizontally CENTERED in the frame, vertically CENTERED
- The can occupies exactly ~75% of the canvas HEIGHT (from base to cap)
- Equal cream-white margin above the can (~12% of canvas height) and below the can (~12% of canvas height including the tiny contact shadow)
- Equal cream-white margin left and right of the can (the can is comfortably centered with generous side margins)
- The viewer sees the FULL can from cap to base with comfortable breathing room on all four sides
- This framing will be the master reference for every other flavor in the set — consistent scale matters

LABEL — use REFERENCE 1 for EXACT label artwork. Preserve pixel-faithfully:
- TOP yellow/gold cap with the small black sipping mouth ring
- TOP yellow banner reading "CLEAN ENERGY & CALM FOCUS"
- White MAIN body with the gold/cream "DIALED" wordmark prominently center (with black drop-shadow)
- Vertical "LEMONADE" ribbon on the left side
- "Prize With Every Can" vertical text
- The lemon-slice illustration
- The QR sticker
- "COGNITION ELIXIR" subtitle below DIALED
- Yellow BOTTOM band with "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)"
- All typography hyperrealistic, sharp, fully legible

LIGHTING:
- Bright soft diffused studio lighting from above-front
- Subtle cool rim highlight running down one edge, soft warm fill on the opposite edge
- Glossy crisp metallic surface

Style: clean modern beverage commercial, magazine-grade product photography, hyper-realistic can rendering, glossy crisp finish, isolated on flat white ready for Photoshop.

Negative: no upward/downward tilt, no off-axis rotation, no can physically tilted, no extra cans, no ledge, no environment, no colored background, no gradient, no warped typography, no inaccurate label colors, no off-white tinting, no hands, no people.`;

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(FLAVOR_REF), { text: PROMPT }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "3:4", imageSize: "4K" },
  },
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
    const dst = path.join(OUT_DIR, "single-lemonade-anchor.png");
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
