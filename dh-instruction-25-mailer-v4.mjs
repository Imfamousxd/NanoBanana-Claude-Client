#!/usr/bin/env node
// v4 — abandon iterating off prior gen (model kept ignoring the capsule).
// Fresh text-driven scene description with the capsule as a CORE element of
// the bag's interior, baked into the scene from the start.
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

const MAILER_REF = "DIaled Health Instruction Graphics/mailer.jpeg";
const STEP17_REF = "DIaled Health Instruction Graphics/Approved/17.png";
const TUBE_REF = "DIaled Health Instruction Graphics/Product Refs/protector tube.png";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, NO COLOR anywhere. Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no captions, no numbers, no extra arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

CORE SCENE — three layered objects, top to bottom in the frame:

[1] TOP of frame — a HAND descending from above, gripping the top of a CLEAR transparent zip-seal pouch with a thumb-and-fingers pinch. The hand is positioned in the upper ~20% of the frame.

[2] MIDDLE of frame — the CLEAR ZIP-SEAL POUCH (DIALED HEALTH-branded specimen bag) held by the hand. CRITICAL — the bag is TRANSPARENT/CLEAR like a ziplock sandwich bag, NOT an opaque white pouch. Through the clear plastic face of the bag the viewer SEES the contents directly. The bag is roughly 30% of canvas width × 35% of canvas height. The bag's TOP edge shows a closed zip-seal (two parallel thin horizontal lines). The bag's front face has two printed elements rendered in black line-art:
  - UPPER area of the bag: the DIALED HEALTH logo (use reference 4 for exact lockup) — OFFSET DIAGONAL layout, "DIALED" top-left of a thin horizontal line with a single EKG-spike notch at center, "HEALTH" bottom-right of the line.
  - LOWER area of the bag: a square QR code mosaic (use reference 2's QR style — detailed black-and-white pixel cells with three position-detection corner squares).

INSIDE the clear bag — visible through the transparent plastic — sits the DIALED HEALTH PROTECTOR CAPSULE (use reference 3 for visual). The capsule is drawn with FULL FIRM black line-art outlines (NOT ghosted, NOT faded — fully visible as if photographed through clear plastic). Capsule spec:
  - Stubby cylindrical capsule, vertical orientation, total height ~1.5x its diameter
  - TOP 40%: solid-black-filled cylindrical cap with "DIALED" embossed across its side wall
  - BOTTOM 60%: white cylindrical body (clean outline) with "HEALTH" embossed across its side wall
  - Capsule sized to fit comfortably inside the bag with ~10% clearance around it
  - Positioned VERTICALLY CENTERED inside the bag — sitting between the DH logo (above) and the QR code (below). The capsule overlaps the logo/QR slightly because all three elements are on different planes of the bag (logo printed ON the bag's front face, QR ALSO on the front face, capsule INSIDE behind the face).
  - The capsule is the SECOND-most-prominent element of the entire illustration after the bag itself — it MUST be clearly visible.

The bag (with the capsule sealed inside) is positioned with its lower half being slipped INTO the open top of the mailer below.

[3] LOWER 50% of frame — a POLY BUBBLE MAILER (use reference 1 for visual). White padded plastic mailing pouch with a slightly puffy bubble-wrap texture suggested by light irregular line work. The top of the mailer is OPEN — peel-and-seal flap pulled back showing the bag entering. The mailer occupies ~70% of canvas width and the lower 50% of canvas height. On its FRONT face, centered, a rectangular SHIPPING LABEL outline with:
  - Bold caps header
  - "TO" address block with 3-4 horizontal placeholder bars
  - "FROM" address block with 2-3 placeholder bars
  - A horizontal barcode (vertical black bars) at the bottom
  - A small "TRACKING #" line

COMPOSITION SUMMARY:
- Hand top
- Bag below the hand, with the CAPSULE clearly visible INSIDE it
- Mailer below the bag, with the bag's lower portion already going inside
- Shipping label on the mailer's front face

KEY VISUAL RULES (locked):
- The DH logo on the bag must match reference 4 PRECISELY (typeface + offset-diagonal layout).
- The capsule MUST be clearly visible inside the bag — failing to draw the capsule is a critical error.
- The bag is CLEAR/TRANSPARENT, NOT white opaque — this is essential for the capsule to be visible.
- Black line-art ONLY — NO color anywhere.

Negative: do NOT make the bag opaque white (it must be CLEAR), do NOT omit the capsule from inside the bag, do NOT draw the capsule floating outside the bag, do NOT add color, do NOT add a second capsule or vial, do NOT add a FEDEX label (this is a generic shipping label), do NOT draw the bag open at the top (zip-seal must be CLOSED), no captions/numbers/arrows, no warped DH logo.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(MAILER_REF), inline(STEP17_REF), inline(TUBE_REF), inline(DH_LOGO), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_bag-into-mailer-v4.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
