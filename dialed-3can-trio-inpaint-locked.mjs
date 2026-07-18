#!/usr/bin/env node
// Same EXACT inpaint pattern that worked on the single cans, scaled to the
// trio. Source = trio-cans.png + 3 product PNGs (one per flavor for fruit
// accuracy). Prompt mirrors the single-can prompt's structure.
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
const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const DST = "Dialed Moods L-Doba Generations/Trio/trio-deconstructed.png";

const PROMPT = `Take reference image 1 (the trio of three intact Dialed Moods cans — Lemonade front-center, Black Cherry Vanilla back-left, Blue Glacier back-right — isolated on flat white). Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the change described below — same camera angle, same can positions, same can sizes, same triangle formation, same lighting, same contact shadows, same flat white background.

DECONSTRUCTED EDIT — for EACH of the three cans, REPLACE only the WHITE CYLINDRICAL BODY of the can (the middle section between the colored top cap and the colored bottom band — the area currently containing the gold "DIALED" wordmark, "CLEAN ENERGY & CALM FOCUS" banner, vertical flavor ribbon, fruit illustration, QR sticker, "Prize With Every Can" text, "COGNITION ELIXIR" subtitle). REMOVE all of that white-body content entirely and REPLACE it with a photoreal floating INGREDIENT COLUMN occupying the EXACT same cylindrical footprint the white body currently occupies — same width, same height, same position, same perspective as the rest of each can.

KEEP IDENTICAL to reference 1:
- The colored TOP CAP of each can with its small black sipping mouth ring — pixel-identical position, size, color, shape
- The colored BOTTOM BAND of each can with the small "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)" text — pixel-identical
- The can's outer silhouette and edges where the cap and bottom band meet the body
- The can's overall position, size, and angle in the frame
- The flat white #FFFFFF background
- The tiny contact shadow beneath each can's base

INGREDIENT COLUMNS (filling the space each white body used to occupy):
- FRONT-CENTER can (Lemonade — reference 3): vivid purple-violet mucuna L-Dopa flower clusters on green stems with leaves (~30–35% of the column), raw brown coffee beans scattered through the column, AND several fresh lemons (one whole + halved lemons showing juicy yellow flesh) sitting visually on top of the core ingredients (~35–40% of the column).
- BACK-LEFT can (Black Cherry Vanilla — reference 2): purple mucuna flower clusters + scattered coffee beans + an abundant pile of glossy dark black cherries with stems + two or three whole vanilla bean pods (long dark brown slightly twisted).
- BACK-RIGHT can (Blue Glacier — reference 4): purple mucuna flower clusters + scattered coffee beans + an abundant cluster of plump fresh blueberries with their natural silvery bloom.

The ingredients appear suspended / floating, photoreal, sharply lit, glossy crisp — like a luxury deconstructed beverage editorial. Each ingredient column occupies the precise volume where its can's white body used to be. NO can body of any kind remains in the middle of any can — no white, no glass, no translucent surface, just open air with the ingredients hanging in it.

Mucuna rule: vivid purple-violet drooping flower racemes on green stems with green leaves. NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO dark purple bean-pod shapes — ONLY flower clusters with stems and leaves.

Style: high-end deconstructed beverage editorial / luxury product photography, hyper-realistic ingredients, glossy crisp finish, isolated on flat white ready for Photoshop.

Negative: no can body remaining in any can (no white, no glass, no translucent shell, no faded label), no gold DIALED wordmark, no fruit illustrations from the original labels, no QR code, no "Prize With Every Can" text, no "COGNITION ELIXIR" subtitle, no logos, no environment, no podium, no shadows beyond the tiny base contact shadows, NO velvet bean pods of any color, no warped or repositioned top caps or bottom bands, no can repositioning, no can resizing, no changed lighting.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [
    inline(SRC),                                                  // 1: trio source (the image to edit)
    inline(path.join(REF_DIR, "black cherry vanilla.png")),       // 2: BCV product (for fruit accuracy)
    inline(path.join(REF_DIR, "Lemonade.png")),                   // 3: Lemonade product
    inline(path.join(REF_DIR, "Blue glacier.png")),               // 4: Blue Glacier product
    { text: PROMPT },
  ]}],
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
