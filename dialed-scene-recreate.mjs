#!/usr/bin/env node
// Recreate the Dialed Moods lifestyle shot fresh: NEW different young/successful man,
// simple clean uncluttered background, DIALED can passed as a product reference so it
// stays accurate. Nano Banana Pro. Square 1:1.
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
const CAN = "/tmp/dialed_can_crop.png";
const OUT = "Dialed Moods/dialed-lifestyle-recreated-v6.jpg";
const inline = (p) => ({ inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } });

const PROMPT = `Reference 1 is the "DIALED" energy drink can (tall slim can, blue + white + gold, reading "DIALED MOODS / BLUE GLACIER / COGNITION ELIXIR / CLEAN ENERGY & CALM FOCUS / DIETARY SUPPLEMENT"). Reproduce this can FAITHFULLY and accurately in the new scene — same shape, same blue/white/gold design and branding, standing upright on the desk in the foreground, clearly visible as the hero product. Do NOT redesign the can.

Create a NEW image that looks like a totally ORDINARY, CANDID PHONE SNAPSHOT — the kind of casual photo a friend would quickly take on an iPhone in a normal apartment and post without editing. It must NOT look like a professional product shoot, NOT a stock photo, NOT a polished AI render, NOT an "influencer" beauty shot. It should look slightly unremarkable and real.
- CAMERA / LOOK: shot on an iPhone, everyday indoor lighting that is a bit UNEVEN — real directional light from a window mixing with normal room light, with actual CONTRAST, real soft shadows on the face and a slightly brighter (mildly blown) window area — NOT flat, even, perfectly-balanced studio light. Natural phone-camera characteristics: a little bit of sensor noise/grain in the shadows, very slightly soft focus, true-to-life un-graded colors (a touch cool/neutral, NOT cinematic orange-teal), normal dynamic range. Imperfect casual framing — the subject a bit off-center, slightly tilted, like a quick grab, not carefully composed.
- THE GUY: a MASCULINE, successful-looking YOUNG man, EARLY-TO-MID 20s (around 23–25 years old) — clearly YOUTHFUL with a fresh young face, but still distinctly manly: a defined jawline, athletic build, broad-ish shoulders, confident grounded presence. The kind of sharp young guy who has his life together (a young founder / professional in his early 20s), understated, NOT flashy. Groomed in a masculine but YOUTHFUL way: a SHORTER, neater beard or just well-kept stubble (a young man's beard, NOT a thick full older-man beard), a modern young men's haircut, a calm focused expression. He must look his age — early-20s young, fresh and energetic — NOT in his 30s, NOT weathered or aged, but also NOT soft, NOT pretty, NOT preppy. Keep him REAL though, not an airbrushed model — natural skin with real texture and pores, believable as a real person in a real photo. He wears simple, well-fitted MASCULINE smart-casual clothing — e.g. a plain dark crewneck or henley, or a rolled-sleeve oxford in a muted neutral tone — clean and intentional, not flashy. Calm focused expression looking at his laptop, natural and unposed.
- BACKGROUND: simple, clean and tasteful but still realistic — a tidy modern home office / nice apartment workspace: a clean neutral wall, soft natural window light, and one or two understated tasteful touches (a framed print, a healthy plant), gently out of focus. It should feel like a successful young person's calm, well-kept space — uncluttered and a bit upscale, but still a believable real room, not a sterile studio. No mess, no clutter, no cables.
- DESK: just the laptop and the DIALED can. NO coffee mug, NO notebook, NO pen, NO earbuds, NO cables.
- NO readable small text anywhere (laptop screen dim/soft, no legible UI; no signs/labels in focus) EXCEPT the DIALED can branding.

The single most important thing: it must read as a real, slightly imperfect, candid everyday phone photo of a normal guy — believable and unpolished, NOT synthetic or beautiful. Square 1:1.`;

const body = { contents: [{ parts: [inline(CAN), { text: PROMPT }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const raw = "/tmp/dialed_recreate_raw.png";
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    await sharp(raw).resize(2000, 2000, { fit: "cover" }).jpeg({ quality: 95 }).toFile(OUT);
    console.log(`OK -> ${OUT}`);
    try { execSync(`open -a Preview "${OUT}"`); } catch {}
    process.exit(0);
  }
}
console.error("no image"); process.exit(1);
