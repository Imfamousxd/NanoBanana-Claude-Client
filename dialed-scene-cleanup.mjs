#!/usr/bin/env node
// Clean up the Dialed Moods lifestyle shot: keep the man + DIALED can, remove mug/
// notepad/pen/earbuds, declutter + tastefully upscale the background, no legible small
// text anywhere. Nano Banana Pro for hero-can fidelity.
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
const SRC = "/tmp/dialed_scene.jpg";
const OUT = "Dialed Moods/dialed-lifestyle-cleaned.jpg";
const inline = (p) => ({ inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference 1 is a real lifestyle product photo: a young man working on a laptop at a wooden desk in warm window light, with a tall "DIALED" energy drink can on the desk. Recreate this SAME photo, same young man (same face, same light-grey t-shirt, same relaxed typing pose and profile, same warm golden side-light, same camera angle and framing) and the SAME "DIALED" can — keep the can faithfully reproduced (the same tall slim can with its blue, white and gold "DIALED MOODS / BLUE GLACIER / COGNITION ELIXIR" design, in the same position on the left of the desk; do not redesign or restyle the can).

CHANGES — clean it up and make it look more upscale, tidy and intentional (but still a believable real home office — a young, successful, put-together guy, NOT flashy, NOT a billionaire, no luxury showing off):
- REMOVE the ceramic coffee mug completely (no cup, no coffee anywhere).
- REMOVE the spiral notebook / notepad and the pen completely.
- REMOVE the tangled white wired earbuds and the messy cables/wires on the desk.
- DECLUTTER and tidy the BACKGROUND: turn the messy crammed bookshelf into a clean, tastefully arranged shelf; replace the messy pots/clutter near the window with one healthy tidy potted plant; clean the desk surface so it is uncluttered; keep it a warm, natural, modern home office with soft trees visible through the window. Calm, clean, premium but understated.
- Keep the laptop, but its screen shows only a soft, out-of-focus indistinct interface — NO legible text or UI labels.
- IMPORTANT: NO readable words or small text anywhere in the scene (no notepad text, no signs, no labels in focus) EXCEPT the DIALED can's own branding. Avoid any tiny crisp text that would look AI-generated.

Keep it PHOTOREAL — a real DSLR lifestyle photograph with warm natural light, shallow depth of field, authentic skin and materials. Natural and believable, not over-polished or CGI. Square 1:1, same framing as reference 1.`;

const body = { contents: [{ parts: [inline(SRC), { text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const raw = "/tmp/dialed_cleaned_raw.png";
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    await sharp(raw).resize(2000, 2000, { fit: "cover" }).jpeg({ quality: 95 }).toFile(OUT);
    console.log(`OK -> ${OUT}`);
    try { execSync(`open -a Preview "${OUT}"`); } catch {}
    process.exit(0);
  }
}
console.error("no image"); process.exit(1);
