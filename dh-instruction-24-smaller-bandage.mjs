#!/usr/bin/env node
// Iterate approved step 24 — shrink the round bandage to ~50% of its current
// size while keeping everything else (person framing, shoulder, line-art
// style, DH logo on bandage) pixel-faithful.
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

const PRIOR = "DIaled Health Instruction Graphics/Approved/24.png";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Take reference image 1 (approved step 24 — a person chin-to-mid-torso in a fitted tee with the right shoulder/deltoid exposed, a round DIALED HEALTH-branded bandage applied to the deltoid). Reproduce reference 1 PIXEL-FAITHFULLY — same person silhouette, same chin-to-torso framing, same exposed deltoid, same shirt, same posture, same line-art style, same proportions, same 1:1 framing, same black-on-white treatment, same line-weights, same minimal contour hatching.

ONLY MODIFY: the ROUND BANDAGE on the deltoid is currently too large. SHRINK it to approximately 50% of its current diameter — so the bandage is roughly HALF the size shown in reference 1. The smaller bandage sits in the same approximate position on the deltoid (centered on the muscle), still drawn as a clean simple circular adhesive patch with the locked DIALED HEALTH offset-diagonal logo printed on its face (use reference 2 to keep the logo pristine — "DIALED" top-left of a thin horizontal line with an EKG-spike notch at center, "HEALTH" bottom-right of the line). Because the bandage is now smaller, the logo inside it also scales down proportionally — keep it crisply rendered and still readable even at the smaller scale.

Everything else from reference 1 stays IDENTICAL: the person, the shirt, the exposed shoulder/arm, the body posture, the line-art rendering, the contour hatching, the white background, the framing. NO other changes.

Negative: do NOT change the person, do NOT alter the shoulder/arm position, do NOT change the shirt, do NOT change the bandage to a different shape (still round/circular), do NOT change its position on the deltoid (just shrink it in place), do NOT add color, do NOT add additional bandages, no captions/numbers/arrows, no warped DH logo, no center-stacked DH logo.`;

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
    const dst = path.join(OUT, `${ts}_bandage-on-arm-smaller.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
