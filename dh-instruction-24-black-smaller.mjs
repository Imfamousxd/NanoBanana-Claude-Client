#!/usr/bin/env node
// Iterate the black-bandage version — shrink the bandage to ~50% of current
// size. Keep person, layout, color inversion (black bandage + white logo)
// pixel-faithful.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T23-44-37_bandage-on-arm-black.jpg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Take reference image 1 (a person chin-to-mid-torso in a fitted tee with the right shoulder/deltoid exposed, with a solid-black round DIALED HEALTH-branded bandage on the deltoid — the bandage is filled solid black with the DH logo printed in white inside). Reproduce reference 1 PIXEL-FAITHFULLY — same person silhouette, same chin-to-torso framing, same exposed deltoid, same shirt, same posture, same line-art style, same proportions, same 1:1 framing, same line-weights, same minimal contour hatching, same black-bandage-with-white-logo color treatment.

ONLY MODIFY: SHRINK THE BANDAGE to approximately 50% of its current diameter. The new bandage diameter should be roughly HALF of the bandage shown in reference 1 — much smaller, sitting comfortably on the deltoid muscle. Keep its position centered on the deltoid (same spot, just smaller). The solid-black fill stays, the white DH logo inside scales down proportionally with the bandage, matching reference 2 (DIALED top-left of EKG-spike line, HEALTH bottom-right, offset diagonal). The smaller logo should still read clearly even at the reduced scale — render it crisply.

Everything else from reference 1 stays IDENTICAL: the person, the shirt, the exposed shoulder/arm, the body posture, the line-art rendering, the contour hatching, the white background, the framing, the bandage's center position on the deltoid.

Negative: do NOT change the person, do NOT alter the shoulder/arm position, do NOT change the shirt, do NOT change the bandage shape (still round/circular), do NOT change the color treatment (must remain solid black bandage with white logo on top), do NOT add a second bandage, do NOT add extra color, no captions/numbers/arrows, no warped DH logo, no center-stacked DH logo.`;

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
    const dst = path.join(OUT, `${ts}_bandage-black-smaller.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
