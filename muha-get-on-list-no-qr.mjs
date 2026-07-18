#!/usr/bin/env node
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
const SRC = "Muha Giveaway Redesigned/Disclaimer Styled/Get on the List.png";
const DST = "Muha Giveaway Redesigned/Get on the List no-qr.png";

const PROMPT = `Edit reference 1. Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the change below — same MM gold monogram, same Vice City Miami night backdrop with red glow / palms / skyline, same "GET ON THE LIST" massive cream letterpress headline, same red Dodge Challenger photo, same stacked dollar bills foreground, same styled bottom disclaimer, same aspect ratio.

ONLY MODIFY:
1. REMOVE the QR code in the lower-middle area of the image ENTIRELY. Erase the white QR square and the "SCAN FOR APP" arrow/text callout next to it. Fill the area cleanly with the same Vice City backdrop / Challenger imagery that surrounds it (extend the existing background and car visuals seamlessly into the cleared area).
2. CHANGE the small red rounded-rectangle pill that currently says "SCAN TO ENTER" — replace its text with "BECOME A MEMBER TODAY". Keep the pill style, color, glow, and position identical.

Everything else stays IDENTICAL.

Negative: do not change the MM monogram, do not change the GET ON THE LIST headline typography, do not change the Challenger photo, do not change the money stacks, do not change the backdrop, do not leave any trace of the QR code or "SCAN FOR APP" text, do not change the pill design.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(SRC), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    fs.writeFileSync(DST, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${DST}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
