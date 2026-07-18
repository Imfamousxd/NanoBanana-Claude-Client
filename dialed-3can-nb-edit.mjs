#!/usr/bin/env node
// Direct Nano Banana edit on trio-cans.png — pass ONLY the source image (no
// other refs to confuse the model), with a simple edit instruction. Let NB's
// source-preservation handle the top caps, bottom bands, and background.
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

const SRC = "Dialed Moods L-Doba Generations/Trio/trio-cans.png";
const DST = "Dialed Moods L-Doba Generations/Trio/trio-ingredients-nb-edit.png";

const PROMPT = `Edit this image. KEEP every pixel of this image identical EXCEPT for the middle white body section of each of the three cans.

PRESERVE pixel-perfectly:
- The colored TOP CAP of each can (yellow on the front-center can, magenta on the back-left can, cyan on the back-right can) — including the small "CLEAN ENERGY & CALM FOCUS" banner just below each cap
- The colored BOTTOM BAND of each can with the "DIETARY SUPPLEMENT  5 CALORIE - ZERO SUGAR  12 FL OZ (355 mL)" text
- The flat white background
- The three cans' positions, sizes, and triangle formation
- The contact shadows beneath each can
- The lighting

CHANGE ONLY: the white middle body section of each can. Remove all the label artwork from those areas (the gold "DIALED" wordmark, the vertical flavor ribbons "LEMONADE" / "BLACK CHERRY VANILLA" / "BLUE GLACIER", the "Prize With Every Can" text, the fruit illustrations on the labels, the QR sticker, the "COGNITION ELIXIR" subtitle, the "YOUR FULL FEELING" text, the "20mg L-Dopa / 200mg..." ingredient list). Replace each can's white body with photoreal floating INGREDIENTS suspended in the open air — the can's middle should now read as see-through / empty space with ingredients hovering in it (NOT a solid white body, NOT a glass cylinder, NOT a translucent shell — just OPEN AIR with the ingredients floating).

Per-can ingredients to render in the open middle:
- FRONT-CENTER can (Lemonade position, yellow cap and band): purple-violet mucuna L-Dopa flower clusters on green stems with leaves, scattered raw brown coffee beans, and several fresh lemons (one whole + halved showing juicy yellow flesh).
- BACK-LEFT can (Black Cherry Vanilla position, magenta cap and band): purple mucuna flower clusters, scattered coffee beans, glossy dark black cherries with stems, and two or three whole vanilla bean pods (long dark brown slightly twisted).
- BACK-RIGHT can (Blue Glacier position, cyan cap and band): purple mucuna flower clusters, scattered coffee beans, and an abundant cluster of plump fresh blueberries with their natural silvery bloom.

CRITICAL: keep the top cap (and top banner) and the colored bottom band of every can — those stay in the output unchanged. Only the middle white body becomes the floating-ingredient area.

Mucuna rule: vivid purple-violet drooping flower racemes on green stems with green leaves. NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO bean-pod shapes — only flower clusters with stems and leaves.

Negative: do NOT remove the top caps, do NOT remove the top "CLEAN ENERGY & CALM FOCUS" banners, do NOT remove the bottom bands, do NOT change the can positions, do NOT change the background, do NOT add a solid white blob/mass/mound in the middle, do NOT keep the DIALED logo or any label text in the middle, do NOT show a glass/translucent body in the middle — just open air with floating ingredients.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(SRC), { text: PROMPT }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "4:3", imageSize: "4K" },
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
    fs.writeFileSync(DST, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${DST}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
