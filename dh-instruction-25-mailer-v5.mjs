#!/usr/bin/env node
// v5 — different tactic: use approved step 17 (which has the capsule clearly
// visible going into the bag with correct DH logo) as the primary anchor,
// then ADD a poly bubble mailer beneath that the bag is being slipped into.
// Keep step 17's bag rendering EXACTLY.
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

const STEP17 = "DIaled Health Instruction Graphics/Approved/17.png";
const MAILER_REF = "DIaled Health Instruction Graphics/mailer.jpeg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Reference image 1 is the approved step 17 graphic — a hand lowering a black-capped DIALED HEALTH protector capsule into the open top of a clear DIALED HEALTH-branded zip-seal pouch. The bag is clear/translucent, the capsule is fully visible (black cap with "DIALED" embossing, white body with "HEALTH" embossing), the DH offset-diagonal logo is printed cleanly on the bag's front face, a detailed QR-code mosaic sits below the logo, and the hand pinches the cap above the bag's zip-seal opening.

NEW SCENE — extend reference 1's scene by ADDING a poly bubble mailer BENEATH the bag. The bag is now SEALED (zip-seal closed) with the capsule fully inside it, and the bag's lower portion is being slipped DOWNWARD into the open top of a poly bubble mailer.

KEEP IDENTICAL TO REFERENCE 1 (these elements must look 1:1 with how they're drawn in reference 1):
- The DIALED HEALTH offset-diagonal logo printed on the bag (use reference 3 to verify it stays pristine)
- The QR code mosaic on the bag (same detailed pixel pattern)
- The capsule itself (clearly visible through the clear bag — black cap "DIALED" on top, white body "HEALTH" beneath, fully drawn line-art outline visible through the transparent plastic)
- The bag's clear/transparent character (NOT opaque)
- The hand's natural grip style (line-art only, real human proportions)

CHANGES from reference 1 (only these):
1. The bag's TOP is now SEALED — zip-seal closed (two parallel close-fitting horizontal lines across the top), NOT pinched open
2. The hand now grips the TOP-CENTER of the SEALED bag from above (no longer holding the capsule going in — the capsule is already inside)
3. The bag is positioned UPPER-CENTER of the canvas, with its LOWER ~40% already INSIDE the mailer below
4. ADD a POLY BUBBLE MAILER (use reference 2 for shape and bubble-wrap texture) occupying the LOWER ~55% of the canvas. White padded plastic mailing pouch, slightly puffy bubble-wrap texture suggested by light irregular line work, OPEN TOP edge where the bag is entering (peel-and-seal flap pulled back). The mailer is centered horizontally, slightly wider than the bag.
5. ADD a generic SHIPPING LABEL on the mailer's front face — rectangular outline with bold caps header, "TO" address block (3-4 placeholder bars), "FROM" address block (2-3 bars), horizontal barcode at the bottom, small "TRACKING #" line. Centered on the mailer's visible face.

OVERALL LAYOUT (top to bottom):
- Hand at the very top (~10-18% from top of canvas) gripping the bag
- Bag in the upper-middle (~18-50% from top of canvas), capsule clearly visible inside, with the lower portion of the bag entering the mailer
- Mailer in the lower half (~45-95% from top), shipping label centered on its face

Black line-art on white background, 1:1 framing, NO color anywhere, no captions/numbers/arrows, no biohazard symbol, no FEDEX-specific branding.

Critical: the capsule MUST be visible inside the bag with full firm line-art — failing to draw the capsule clearly visible is a critical error. The DH logo MUST match reference 3 precisely.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(STEP17), inline(MAILER_REF), inline(DH_LOGO), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_bag-into-mailer-v5.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
