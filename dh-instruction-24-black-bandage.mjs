#!/usr/bin/env node
// Iterate — keep the smaller-bandage layout pixel-faithfully, but invert the
// bandage colors: filled solid BLACK bandage with the DH logo rendered in
// WHITE inside it.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T23-43-00_bandage-on-arm-smaller.jpg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Take reference image 1 (a person chin-to-mid-torso in a fitted tee with the right shoulder/deltoid exposed, with a small round DIALED HEALTH-branded bandage on the deltoid). Reproduce reference 1 PIXEL-FAITHFULLY — same person silhouette, same chin-to-torso framing, same exposed deltoid, same shirt, same posture, same line-art style, same proportions, same 1:1 framing, same line-weights, same minimal contour hatching, same bandage SIZE and POSITION on the deltoid.

ONLY MODIFY: INVERT the bandage colors. The bandage should now be SOLID BLACK FILL (filled with a flat solid black ink across the entire round bandage area, NOT outline-only — the whole bandage disc is opaque black), and the DIALED HEALTH logo printed on it should be rendered in WHITE INK on top of that black background, the white reading clearly against the black bandage. The logo matches reference 2 PRECISELY — offset-diagonal layout, "DIALED" top-left of a thin horizontal line with an EKG-spike notch at center, "HEALTH" bottom-right of the line, same typeface — but inverted to white ink instead of black ink so it reads against the solid-black bandage.

Everything else from reference 1 stays IDENTICAL: the person, the shirt, the exposed shoulder/arm, the body posture, the line-art rendering, the contour hatching, the white background, the framing, the bandage's size and position.

Negative: do NOT change the person, do NOT alter the shoulder/arm position, do NOT change the shirt, do NOT make the bandage larger or smaller, do NOT change its shape (still round/circular), do NOT change its position on the deltoid, do NOT add additional bandages, do NOT add other colors (just black bandage + white logo + black ink for the rest of the illustration), no captions/numbers/arrows, no warped DH logo, no center-stacked DH logo.`;

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
    const dst = path.join(OUT, `${ts}_bandage-on-arm-black.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
