#!/usr/bin/env node
// Fresh text-only gen — bake the small bandage size into the spec from scratch.
// Black-filled bandage with white DH logo, tiny scale on the deltoid.
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
const OUT = "DIaled Health Instruction Graphics/generations";

const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, NO COLOR anywhere (only black, white, and a small inverted black-filled patch). Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no captions, no numbers, no extra arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

SCENE — a person shown from CHIN to mid-TORSO in a fitted t-shirt with the right SHOULDER and upper arm fully EXPOSED (sleeve pulled up high on the deltoid). The person stands facing the camera, shoulders square, head slightly tilted, no facial features above the chin. The shoulder/deltoid sits in the upper-right portion of the frame. Clean line-art rendering with minimal short parallel hatching for muscle volume.

THE BANDAGE on the deltoid — CRITICAL SCALE:
- A VERY SMALL round circular bandage applied flat against the bare deltoid skin
- Diameter is roughly the size of a DIME on a real arm — about 5-6% of the canvas width across, much smaller than a typical product label patch
- The bandage occupies only a SMALL portion of the deltoid muscle, leaving plenty of surrounding bare skin visible around it
- Fill: SOLID BLACK INK across the entire bandage disc (the circle is filled solid black, NOT outline-only)
- On top of the solid black bandage, the DIALED HEALTH logo printed in WHITE INK — small but legible. Match the official DH lockup (reference 1): "DIALED" sits top-left of a thin horizontal line with a single EKG-spike notch at center, "HEALTH" sits bottom-right of the line. Offset diagonal layout, exact typeface from reference 1, just rendered in white instead of black.

CRITICAL SIZE RULE: the bandage MUST read as a SMALL detail on the deltoid — about the size of a coin sticker, NOT a large product label. If the bandage looks like it covers more than 25% of the visible deltoid surface, the size is wrong.

NO device, NO vial, NO protector tube, NO heat pack, NO blood, NO hand on the bandage — just the person and the small black-and-white DH bandage stuck on the deltoid.

PERSON RENDERING: clean line-art outline of the body, t-shirt collar and chest indicated by simple line work, slight contour shading via minimal short parallel hatching where needed for volume (collarbone, deltoid muscle definition, side of the neck). No facial detail, no hair detail.

Negative: large bandage that dominates the deltoid (must be SMALL), color anywhere besides the solid-black bandage fill, facial features above the chin, second bandage, device on arm, vial, blood, hands on the bandage, captions/numbers/arrows in the illustration, warped DH logo, center-stacked DH logo, square bandage shape.`;

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(DH_LOGO), { text: PROMPT }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
  },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dst = path.join(OUT, `${ts}_bandage-black-tiny.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
