#!/usr/bin/env node
// Iterate v3 — keep v2's layout + QR style pixel-faithfully, only fix the
// DH logo on the bag using the official logo asset as a pristine reference.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T22-41-13_scan-bag-qr-v2.jpg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Take reference image 1 (the prior generation showing a hand holding a phone above an empty Dialed Health-branded specimen bag, the phone scanning the QR code on the bag). Reproduce reference 1 PIXEL-FAITHFULLY — same composition, same hand, same phone pose, same bag silhouette, same zip-seal, same QR code style (keep the detailed QR mosaic exactly as drawn), same line-art rendering, same proportions, same 1:1 framing, same black-on-white treatment.

ONLY MODIFY: the DIALED HEALTH logo printed on the bag. Replace it with the OFFICIAL DH logo lockup as shown in reference 2 (the brand logo asset). Match reference 2 PRECISELY: the exact same typeface, the exact same letter-spacing, the exact same offset-diagonal layout where "DIALED" sits above-left of a thin horizontal line, the line carries a SINGLE EKG SPIKE notch at its center, and "HEALTH" sits below-right of the line. Render the logo in clean black line-art only (no color), at the same scale and position on the bag as in reference 1.

Everything else from reference 1 stays IDENTICAL: the phone, the hand, the bag silhouette, the zip-seal closure, the QR code (keep its detailed mosaic style), the scan reticle on the phone screen, the line-weights, the white background. No new text. No biohazard. No vial. No protector tube. No color.

Negative: do NOT change the scene, do NOT redraw the hand or phone, do NOT alter the QR code style, do NOT add a vial or protector tube, do NOT add biohazard, do NOT add color, do NOT center-stack the DH logo, do NOT use a different typeface for the logo — must match reference 2 precisely.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(PRIOR), inline(DH_LOGO), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_scan-bag-qr-v3.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
