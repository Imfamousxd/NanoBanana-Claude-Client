#!/usr/bin/env node
// Iterate bag-into-mailer — keep prior gen pixel-faithfully, only change:
// show the protector capsule clearly sealed inside the DH bag (visible
// silhouette through the translucent plastic, zip-seal closed at the top).
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T23-01-38_bag-into-mailer.jpg";
const TUBE_REF = "DIaled Health Instruction Graphics/Product Refs/protector tube.png";
const TUBE_TOP_REF = "DIaled Health Instruction Graphics/Product Refs/protector tube top.png";

const PROMPT = `Take reference image 1 (the prior generation showing a hand sliding a clear DIALED HEALTH-branded zip-seal bag down into a poly bubble mailer with a shipping label). Reproduce reference 1 PIXEL-FAITHFULLY — same composition, same hand position, same bag position, same mailer silhouette and bubble-wrap texture, same shipping label layout, same DH logo on the bag, same QR code, same line-art style, same 1:1 framing, same black-on-white treatment.

ONLY MODIFY: clearly show the DIALED HEALTH PROTECTOR TUBE/CAPSULE already SEALED inside the bag. Use references 2 and 3 (protector tube body + tube cap) as the visual reference for the capsule's shape. Inside the visible portion of the translucent bag, draw the capsule with a CLEAR (not ghosted) line-art outline:
- White cylindrical TUBE BODY with "HEALTH" embossed/printed across its side wall in bold sans-serif
- Black cylindrical TUBE CAP on top of the body with "DIALED" embossed/printed across its side wall — the cap drawn with the locked solid-black fill (so the assembled tube reads "DIALED HEALTH" across the joined cap+body)
- Stubby pill-bottle proportions (height ≈ 1.5x diameter, 60/40 white-body-to-black-cap split — same proportions as step 17's tube)
- The capsule sits VERTICALLY inside the bag in the bag's lower-middle area, centered, fully contained within the bag silhouette
- The zip-seal at the TOP of the bag is clearly CLOSED — show the zip-seal line as a sealed continuous closure (not pinched-open like in step 17). Two parallel close-fitting lines indicating the closed zip-seal.

Everything else from reference 1 stays IDENTICAL: the hand, the mailer (silhouette, bubble texture, open top), the shipping label (header, TO/FROM blocks, barcode), the DH logo on the bag, the QR code, the line-weights, the white background, the framing.

Negative: do NOT change the scene composition, do NOT redraw the hand or mailer, do NOT alter the shipping label, do NOT alter the QR code or DH logo on the bag, do NOT add color, do NOT show the bag pinched open at the top — the bag must be sealed with the capsule inside, do NOT add a second capsule, do NOT add a vial alongside the capsule (just the capsule), no captions/numbers/arrows.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(PRIOR), inline(TUBE_REF), inline(TUBE_TOP_REF), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_bag-into-mailer-v2.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
