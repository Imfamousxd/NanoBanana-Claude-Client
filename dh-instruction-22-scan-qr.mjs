#!/usr/bin/env node
// New DH instruction step — scanning the QR code on the empty DH-branded
// specimen bag with a phone. Black line-art on white, 1:1, 4K, no refs.
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
fs.mkdirSync(OUT, { recursive: true });

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, no color anywhere. Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no caption, no labels (except the brand mark and QR code as specified), no numbers, no extra arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

SCENE — depict the patient SCANNING the QR code on the front of an empty Dialed Health-branded specimen bag with their smartphone. The composition has TWO key objects: the bag laid flat with the front face visible, and the phone hovering above it with its camera capturing the QR code.

THE BAG (lower portion of frame, roughly the lower 55% of the composition):
- A clear translucent zip-seal specimen bag in 3/4 angled view, laid flat or held flat from the bottom edge by a partial hand if needed for stability. Generic rectangular pouch with a clearly drawn zip-seal closure across the top.
- The bag is EMPTY — NO vial inside, NO protector tube inside, NO blood, nothing inside. Just the flat empty bag.
- On the FRONT face of the bag, two printed elements:
  - UPPER area of the bag front: the DIALED HEALTH logo printed in line-art — LOCKED OFFSET DIAGONAL LAYOUT: the word "DIALED" sits in the TOP-LEFT, then a thin horizontal line with a SMALL EKG SPIKE (a single peak-and-trough notch) at the line's center, then the word "HEALTH" sits BOTTOM-RIGHT of the spike. The words are diagonally offset across the line, NOT centered/stacked.
  - LOWER area of the bag front: a square QR code rendered as a small mosaic of black squares on white, with the three position-detection markers (the larger square eyes in the top-left, top-right, and bottom-left corners) clearly drawn. The QR sized at roughly 30-35% of the bag front's width, centered horizontally on the bag's lower half.

THE PHONE (upper portion of frame):
- A modern smartphone held by a hand from above — the hand grips the phone with thumb on one side, fingers on the other side, in a natural held-up pose. The phone is held mostly HORIZONTAL with the screen tilted down toward the bag, the back of the phone facing the viewer.
- The screen side of the phone faces DOWN toward the bag (the camera lens captures the QR). The phone is positioned hovering ABOVE the bag with a clear vertical gap (~10-15% of canvas height between the phone's bottom edge and the bag's top edge).
- On the screen of the phone (drawn with line-art outline of the screen visible at the angle), draw a small SCAN RETICLE — four small L-shaped corner brackets framing the QR-code area on the bag, with a thin line-art representation of the QR appearing inside the brackets (small simplified QR mosaic). This shows the phone is actively capturing the code.
- Optionally, a few tiny scan indicator lines or a small thin scan beam between the phone's camera area and the QR code on the bag below.

HAND that holds the phone: drawn cleanly, real human proportions, line-art only — fingers wrapped around the phone naturally. Hand reads BIGGER than the phone, phone reads bigger than the QR on the bag, bag reads as comfortably letter-sized.

NO biohazard symbol anywhere. NO vial. NO protector tube. NO blood. No numbers or step labels in the illustration. No color anywhere — pure black-on-white line-art.

Negative: no color, no shading beyond minimal hatching, no biohazard symbols, no vials, no protector tubes, no blood, no extra arrows, no extra text/captions/numbers, no logos other than the DIALED HEALTH offset-diagonal mark on the bag, no warped or centered-stacked DH logo, no QR code without the position-detection corners, no flat black silhouette phone (it must be a clear outlined drawing).`;

const body = {
  contents: [{ parts: [{ text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_scan-bag-qr.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
