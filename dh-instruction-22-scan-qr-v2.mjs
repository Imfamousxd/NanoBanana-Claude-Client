#!/usr/bin/env node
// Iterate the scan-QR graphic — keep prior gen's scene/layout pixel-faithfully
// (empty bag, phone scanning), only fix the QR code style and DH logo to match
// approved step 17.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T22-38-58_scan-bag-qr.jpg";
const STYLE_REF = "DIaled Health Instruction Graphics/Approved/17.png";

const PROMPT = `Take reference image 1 (the prior generation showing a hand holding a phone above an empty Dialed Health-branded specimen bag, with the phone scanning the QR code on the bag). Reproduce reference 1 PIXEL-FAITHFULLY — same composition, same hand position, same phone position and pose, same bag position, same line-art style, same proportions, same black-on-white treatment. KEEP every aspect of the scene identical except the two specific corrections below.

ONLY MODIFY:

1) QR CODE STYLE — replace the QR code currently on the bag with one that visually matches the QR code style shown in reference image 2 (approved step 17). The reference-2 QR is a denser, more detailed black-and-white mosaic with three clearly drawn position-detection corner markers (the big square eyes — two in the top corners and one in the bottom-left of the QR). The pixel cells are crisp and varied. Match that level of detail and the same crisp line-art rendering.

2) DIALED HEALTH LOGO — the DH logo on the bag in reference 1 is wrong. Replace it with the SAME LOGO as drawn in reference 2: "DIALED" word sits in the TOP-LEFT, a thin horizontal line with a SINGLE EKG SPIKE (peak-and-trough notch) at the line's center, "HEALTH" word sits BOTTOM-RIGHT of the spike — the words diagonally OFFSET across the line (NOT centered, NOT stacked, NOT both above the line, NOT both below the line). Same typeface and weight as in reference 2. Render in black line-art only.

Everything else from reference 1 stays IDENTICAL: the phone, the hand, the bag silhouette, the zip-seal closure, the scan reticle on the phone screen, the line-weights, the white background, the 1:1 framing. No new text. No biohazard. No vial or protector tube inside the bag. No color anywhere — pure black-on-white line-art.

Negative: do NOT change the scene composition, do NOT redraw the hand or phone, do NOT add a vial or protector tube, do NOT add biohazard, do NOT add color, do NOT center-stack the DH logo, do NOT make the QR code a simplified grid — it must match reference 2's detail level.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(PRIOR), inline(STYLE_REF), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_scan-bag-qr-v2.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
