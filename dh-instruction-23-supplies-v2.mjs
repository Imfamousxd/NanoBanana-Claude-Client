#!/usr/bin/env node
// Iterate supplies layout — keep prior gen pixel-faithfully, only fix the DH
// logo on the prep-pad sachet and on each bandage using the official DH logo
// asset as a pristine reference.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T22-51-22_supplies-layout.jpg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `Take reference image 1 (the prior generation showing three medical supplies laid out flat: gauze pad on the left, DIALED HEALTH-branded alcohol prep pad sachet + open pad in the middle, and a vertical strip of round DIALED HEALTH-branded bandages with their backing liner on the right). Reproduce reference 1 PIXEL-FAITHFULLY — same composition, same supply positions, same proportions, same line-art style, same 1:1 framing, same black-on-white treatment, same gauze, same sachet shape and copy layout, same five-row bandage strip + backing liner layout, same line-weights.

ONLY MODIFY: every DIALED HEALTH logo currently printed in reference 1 (the logo at the top of the alcohol prep pad sachet, and the logo on each of the five round bandages). Replace each of those logos with the OFFICIAL DH logo lockup as shown in reference 2 (the brand logo asset). Match reference 2 PRECISELY: same typeface, same offset-diagonal layout where "DIALED" sits above-left of a thin horizontal line, the line carries a SINGLE EKG SPIKE notch at its center, and "HEALTH" sits below-right of the line. Render the logo in clean black line-art only (no color), scaled appropriately for the surface it's printed on (smaller on each round bandage, larger on the sachet front).

Everything else from reference 1 stays IDENTICAL: the gauze, the sachet copy (ALCOHOL PREP PAD, 70% ISOPROPYL ALCOHOL, sterile sub-line, info strip), the open pad, the bandage strip layout, the backing liner, the line-weights, the white background, the framing. No new text. No color anywhere. No biohazard.

Negative: do NOT change the supply layout, do NOT redraw the gauze or sachet body or bandage shapes, do NOT alter the prep-pad copy text, do NOT change the bandage count (must remain five round bandages), do NOT add color, do NOT center-stack the DH logo on either the sachet or the bandages, do NOT use a different typeface for the logo — must match reference 2 precisely.`;

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
    const dst = path.join(OUT, `${ts}_supplies-layout-v2.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
