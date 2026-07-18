#!/usr/bin/env node
// Take the approved v6 Dialed scene and add warm natural sunlight (keep same guy/scene/can).
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const SRC = "Dialed Moods/dialed-lifestyle-recreated-v6.jpg";
const OUT = "Dialed Moods/dialed-lifestyle-recreated-v7-light.jpg";
const inline = (p) => ({ inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference 1 is a candid photo of a young man working on a laptop with a "DIALED" can on the desk. Keep this image essentially the SAME — the SAME young man (same face, hair, beard, dark crewneck, pose), the SAME DIALED can reproduced faithfully, the same desk, room, plant, framed print, framing and composition.

THE ONE CHANGE: add beautiful REAL NATURAL LIGHT to make it feel like an authentic sunlit photograph. Warm late-afternoon SUNLIGHT streams in through the window on the left and falls across the scene — a soft golden directional glow that catches the side of his face, hair rim-light, the edge of the DIALED can and the wooden desk surface, with gentle warm highlights, soft natural shadows falling to the opposite side, a touch of atmospheric sun haze/bloom near the window, and subtle light gradients across the wall. Real, sunny, lived-in golden-hour daylight — NOT flat even lighting, NOT studio light. Keep it believable and candid (still looks like a real iPhone photo), with natural contrast and a warm but realistic color balance. Everything else stays the same; only the lighting becomes warmer, sunnier and more dimensional. Square 1:1.`;

const body = { contents: [{ parts: [inline(SRC), { text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const raw = "/tmp/dialed_light_raw.png";
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    await sharp(raw).resize(2000, 2000, { fit: "cover" }).jpeg({ quality: 95 }).toFile(OUT);
    console.log(`OK -> ${OUT}`);
    try { execSync(`open -a Preview "${OUT}"`); } catch {}
    process.exit(0);
  }
}
console.error("no image"); process.exit(1);
