#!/usr/bin/env node
// Keep the v8 scene; reproduce the can to EXACTLY match the ACTUAL can from the original
// photo (ref1) — do NOT redesign/simplify. ref1 = real can crop, ref2 = v8 scene.
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
const CAN_REF = "/tmp/dialed_can_crop.png";          // the ACTUAL can from the original photo
const CLEAN_REF = "Dialed Moods L-Doba Generations/Product REfs/Blue glacier.png"; // crisp label detail
const SCENE = "Dialed Moods/dialed-lifestyle-recreated-v8.jpg";
const OUT = "Dialed Moods/dialed-lifestyle-recreated-v10.jpg";
const inline = (p) => ({ inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference 1 and Reference 2 are the SAME real "DIALED — Blue Glacier" energy drink can — reference 1 is a photo of it, reference 2 is its crisp product render. Study this exact can carefully: it is a slim white/silver can with a light-blue band at the TOP reading "CLEAN ENERGY & CALM FOCUS"; a narrow vertical light-blue tab on the LEFT edge reading "BLUE GLACIER"; small vertical text "Prize With Every Can" on the left; a large GOLD outlined wordmark "DIALED" across the middle with small "MOODS" tucked under it; a cluster of blueberries; a short ingredient list on the right ("20mg ... 200mg ... 200mg ... 200mg ..."); the words "COGNITION ELIXIR" lower down; and at the bottom "DIETARY SUPPLEMENT / 5 CALORIE - ZERO SUGAR / 12 FL OZ (355 mL)".

Reference 3 is a candid lifestyle photo: a young man at a laptop in neutral window daylight with this DIALED can on the desk in the foreground.

Recreate reference 3 EXACTLY — SAME man (face, hair, beard, dark crewneck, pose), SAME daylight, SAME desk/room/plant/framed print/composition, SAME can position and size.

THE FIX: the can in reference 3 has the wrong/garbled label. Reproduce the can so it is EXACTLY this real Blue Glacier can shown in references 1 and 2 — the SAME full label design with ALL of its elements in the same arrangement (blue top "CLEAN ENERGY & CALM FOCUS", the "BLUE GLACIER" vertical tab on the left, "Prize With Every Can", the big gold "DIALED" + "MOODS", the blueberries, the ingredient list, "COGNITION ELIXIR", and "DIETARY SUPPLEMENT / 5 CALORIE - ZERO SUGAR / 12 FL OZ (355 mL)"). Do NOT simplify it, do NOT redesign it, do NOT move elements around, do NOT drop the ingredient list or the vertical side text, do NOT change "5 CALORIE". Make the label SHARP, clean and accurate, the can tack-sharp and in focus as the hero, lit naturally to match the daylight scene with a consistent shadow.

Everything else stays identical to reference 3 — only the can's label is corrected to match the real can in references 1 and 2. Believable candid real photo. Square 1:1.`;

const body = { contents: [{ parts: [inline(CAN_REF), inline(CLEAN_REF), inline(SCENE), { text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const raw = "/tmp/dialed_v10_raw.png";
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    await sharp(raw).resize(2000, 2000, { fit: "cover" }).jpeg({ quality: 95 }).toFile(OUT);
    console.log(`OK -> ${OUT}`);
    try { execSync(`open -a Preview "${OUT}"`); } catch {}
    process.exit(0);
  }
}
console.error("no image"); process.exit(1);
