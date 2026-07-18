#!/usr/bin/env node
// Stage 2 — take the approved 3-can trio shot and replace each can's WHITE
// cylindrical body with its deconstructed ingredient column. Use the already-
// approved single-can ingredient versions as visual references for each
// flavor's ingredient column appearance.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const TRIO_SOURCE = "Dialed Moods L-Doba Generations/Trio/trio-cans.png";
const DECONSTRUCTED_REF = "Dialed Moods L-Doba Generations/6can-ingredients-mid-v1.png";
const ING_DIR = "Dialed Moods L-Doba Generations/Approved Single Cans Ingredients";
const ING_LEMONADE = path.join(ING_DIR, "ingredients-lemonade.png");
const ING_BCV = path.join(ING_DIR, "ingredients-black-cherry-vanilla.png");
const ING_BG = path.join(ING_DIR, "ingredients-blue-glacier.png");
const OUT = path.join("Dialed Moods L-Doba Generations/Trio", "trio-ingredients.png");

const PROMPT = `Reference image 1 is the trio composition anchor (3 Dialed Moods cans in triangle formation, low up-angle, isolated on flat white): Lemonade front-center, Black Cherry Vanilla back-left, Blue Glacier back-right.

Reference image 2 is the VISUAL TARGET — a previously-approved DECONSTRUCTED Dialed Moods composition where each can's MIDDLE BODY HAS BEEN COMPLETELY REMOVED, leaving ONLY the colored top cap and colored bottom band floating in the frame with OPEN AIR (the empty white background) between them. The ingredients hover freely in that open air between the cap and band. Study reference 2 carefully — that's exactly the look we want for each can in this output.

YOUR OUTPUT — apply reference 2's deconstructed look to reference 1's trio composition. For EACH of the three cans:

KEEP from reference 1 (pixel-identical):
- The colored TOP CAP of each can (yellow Lemonade, magenta BCV, cyan Blue Glacier) — position, size, color, shape, small black sipping mouth ring
- The colored BOTTOM BAND of each can with the small "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)" text — position, size, color, shape
- The three cans' POSITIONS and SCALES and TRIANGLE FORMATION in the frame
- The low up-angle camera perspective
- The flat white #FFFFFF background
- The tiny contact shadows beneath each can's base

REMOVE / DELETE COMPLETELY from each can:
- The WHITE CYLINDRICAL BODY between the top cap and bottom band — GONE. There is NO can body, NO white plastic/aluminum shell, NO transparent glass cylinder, NO translucent surface of ANY kind in the middle. Just OPEN AIR / EMPTY WHITE BACKGROUND between the top cap and bottom band.
- The gold "DIALED" wordmark — GONE
- The "CLEAN ENERGY & CALM FOCUS" banner — GONE
- The vertical flavor ribbon — GONE
- The fruit illustration on the label — GONE
- The QR sticker — GONE
- The "Prize With Every Can" text — GONE
- The "COGNITION ELIXIR" subtitle — GONE

IN THE OPEN AIR between each can's cap and bottom band, render INGREDIENTS suspended freely with NO can body around them. The ingredients hang in mid-air just like in reference 2. Per-can ingredient mix:
- FRONT-CENTER (Lemonade slot): purple-violet mucuna L-Dopa flower clusters on green stems with leaves + scattered raw brown coffee beans + several fresh lemons (whole + halved showing juicy yellow flesh). Use reference 3 for the visual look of the Lemonade ingredient mix.
- BACK-LEFT (Black Cherry Vanilla slot): purple mucuna flower clusters + coffee beans + abundant glossy dark black cherries with stems + two or three whole vanilla bean pods (long dark brown). Use reference 4 for visual.
- BACK-RIGHT (Blue Glacier slot): purple mucuna flower clusters + coffee beans + abundant plump fresh blueberries with silvery bloom. Use reference 5 for visual.

ABSOLUTE CRITICAL RULES:
- NO can body of any kind between the cap and band — not white, not transparent, not glass, not translucent, not faded. JUST OPEN AIR.
- NO DIALED logo, NO label artwork, NO wordmark, NO printed text anywhere in the middle section. Only the ingredients themselves are visible there.
- NO white solid mass / powder mound / blob of any kind. Just the colored ingredient items individually floating.
- Match reference 2's deconstructed style for HOW the ingredients hang in the open air — sculptural floating arrangement, each ingredient item individually visible, no container around them.

The mucuna flower rule: vivid purple-violet drooping flower racemes on green stems with green leaves. NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO dark purple bean-pod shapes — ONLY flower clusters with stems and leaves.

Style: high-end deconstructed beverage editorial / luxury product photography, hyper-realistic ingredients, glossy crisp finish, isolated on flat white ready for Photoshop.

Negative: NO can body anywhere (no white body, no glass body, no translucent body), NO DIALED logo or wordmark, NO label artwork, NO "CLEAN ENERGY & CALM FOCUS" banner, NO QR codes, NO Prize With Every Can text, NO COGNITION ELIXIR subtitle, NO velvet bean pods, NO white powder mound or blob, no environment, no podium, no shadows beyond the tiny base contact shadows, no can repositioning, no can resizing, no changed lighting, no changed background.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [
    inline(TRIO_SOURCE),
    inline(DECONSTRUCTED_REF),
    inline(ING_LEMONADE),
    inline(ING_BCV),
    inline(ING_BG),
    { text: PROMPT },
  ]}],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    fs.writeFileSync(OUT, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${OUT}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
