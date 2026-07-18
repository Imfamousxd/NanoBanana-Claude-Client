#!/usr/bin/env node
// New DH instruction step — sliding the clear DH-branded zip-seal bag into a
// poly bubble mailer with a shipping label. Black line-art on white, 1:1, 4K.
// Refs: mailer.jpeg (bubble mailer silhouette/texture), 17.png (DH bag style),
// DH logo asset (pristine DH lockup).
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
const BAG_REF = "DIaled Health Instruction Graphics/Approved/17.png";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, NO COLOR anywhere. Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no captions, no numbers, no extra arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

SCENE — a hand from the UPPER portion of the frame slides the clear DIALED HEALTH-branded zip-seal specimen bag DOWNWARD into the open top of a POLY BUBBLE MAILING POUCH that occupies the lower two-thirds of the frame.

THE MAILER (lower two-thirds of frame, ~70% canvas width, tilted very slightly off-axis):
Use reference 1 as the visual ref for the mailer's shape, proportions, and surface character. It is a white POLY BUBBLE MAILER (padded plastic mailing pouch) — soft rounded rectangular silhouette with a slightly puffy bubble-wrap texture suggested by light irregular line work across the body (just enough to suggest bubble-wrap padding inside the translucent outer shell, no heavy hatching). The OPEN TOP edge of the mailer is at the upper edge of the mailer where the bag is being inserted — show the mailer's flap pulled back or slightly open. The bottom of the mailer is sealed with a clear horizontal seam line.

SHIPPING LABEL on the FRONT of the mailer, occupying roughly the middle 50% of the mailer's front face:
- A clean rectangular label outline (slightly raised drawn as a thin double-line border) printed on the mailer
- TOP of the label: bold caps header "SHIPPING LABEL" (or just generic placeholder header bars)
- Below the header: two stacked address blocks — "TO" block with three or four short horizontal placeholder bars (representing recipient address lines), and beneath it a "FROM" block with two or three placeholder bars
- BOTTOM of the label: a horizontal barcode (vertical black bars of varying widths) with a small "TRACKING #" line of small placeholder text beneath
- Right side of the label: a small square outline for service info

THE DH BAG being slipped in (entering from above, ~40% of the bag still visible above the mailer's open top, ~60% already inside):
Use reference 2 (approved step 17) as the visual ref for the bag style — a clear translucent zip-seal pouch with the DIALED HEALTH offset-diagonal logo printed in line-art on the upper area and a square QR code mosaic in the lower area. The bag is sealed (zip-seal lines visible at the top). Through the translucent plastic, the silhouette of the protector tube inside is suggested faintly with thin ghosted lines (lightest line-work, just enough to imply contents — don't overpower). The DH logo on the visible portion of the bag must match reference 3 (the official DH logo asset) PRECISELY — same typeface, same offset-diagonal layout with single EKG-spike line.

THE HAND from the upper edge of the frame grips the top of the DH bag, fingers wrapping around it, thumb visible — drawn cleanly, real human proportions, hand reads bigger than the bag opening it holds. Down-pointing motion implied by the hand's positioning.

Composition guidance:
- Mailer dominates the lower ~70% of frame
- DH bag enters from above, half in / half out
- Hand at the very top, fingers gripping the bag
- All elements stack vertically: hand → bag → mailer

KEY VISUAL RULES (locked from prior approved instruction graphics):
- DIALED HEALTH logo on the bag must match reference 3 PRECISELY
- Mailer surface has soft bubble-wrap texture suggested (NOT a smooth cardboard box, NOT a rigid courier pouch)
- Black line-art ONLY — NO color anywhere
- Hand-drawn instruction-illustration style consistent with the existing approved set

Negative: no color (no blue, no red, no gray fills), no biohazard symbol, no second bag, no extra hands, no extra mailers, no FEDEX-specific branding (this is a generic poly bubble mailer with a generic shipping label), no captions/numbers/arrows in the illustration, no warped DH logo, no center-stacked DH logo, no smooth cardboard-box silhouette, no rigid courier-pouch silhouette.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(MAILER_REF), inline(BAG_REF), inline(DH_LOGO), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_bag-into-mailer.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
