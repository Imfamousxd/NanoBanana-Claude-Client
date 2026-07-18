#!/usr/bin/env node
// Final inpaint pass — pass trio-cans.png as source + the THREE approved
// single-can ingredient versions as per-can visual templates. NB should
// preserve the trio composition + apply each single can's deconstructed look
// to the matching can in the trio.
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
const APPROVED_DIR = "Dialed Moods L-Doba Generations/Approved Single Cans Ingredients";
const ING_BCV = path.join(APPROVED_DIR, "ingredients-black-cherry-vanilla.png");
const ING_LEMONADE = path.join(APPROVED_DIR, "ingredients-lemonade.png");
const ING_BG = path.join(APPROVED_DIR, "ingredients-blue-glacier.png");
const DST = "Dialed Moods L-Doba Generations/Trio/trio-deconstructed.png";

const PROMPT = `Reference image 1 is the SOURCE — the trio of three intact Dialed Moods cans (Black Cherry Vanilla back-left, Lemonade front-center, Blue Glacier back-right) at a low up-angle isolated on flat white. Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the change described below — same camera angle, same can positions, same can sizes, same triangle formation, same lighting, same contact shadows, same flat white background, same colored top caps (with their top "CLEAN ENERGY & CALM FOCUS" banners), same colored bottom bands (with their dietary text).

CRITICAL — for each of the three cans in reference 1, apply the SAME deconstructed transformation already shown in the approved single-can templates (references 2, 3, 4). Each template shows the EXACT result we want for its respective can in the trio:

- BACK-LEFT can (Black Cherry Vanilla): apply the deconstructed look from reference 2 (the approved Black Cherry Vanilla ingredient version). In reference 2 the can's white middle body has been removed entirely, leaving only the magenta top cap (with its top banner) and magenta bottom band floating with open air between them, and inside that open air the deconstructed BCV ingredients hover (purple mucuna L-Dopa flower clusters + brown coffee beans + glossy black cherries with stems + vanilla bean pods). Apply that EXACT treatment to the BCV can in the trio.

- FRONT-CENTER can (Lemonade): apply the deconstructed look from reference 3 (the approved Lemonade ingredient version). Yellow top cap + yellow bottom band float with open air between them, and inside that open air the deconstructed Lemonade ingredients hover (purple mucuna flowers + coffee beans + fresh lemons whole and halved).

- BACK-RIGHT can (Blue Glacier): apply the deconstructed look from reference 4 (the approved Blue Glacier ingredient version). Cyan top cap + cyan bottom band float with open air between, and inside that open air the deconstructed Blue Glacier ingredients hover (purple mucuna flowers + coffee beans + plump blueberries).

The colored top caps and bottom bands in your output should match reference 1 PIXEL-FAITHFULLY (positions, sizes, colors, shapes, including the small "CLEAN ENERGY & CALM FOCUS" banners just below each cap and the dietary text on each bottom band). Only the MIDDLE white-body section of each can changes — it becomes the deconstructed ingredient zone shown in the matching template (references 2/3/4).

NO can body remains in the middle of any can — no white, no glass, no translucent shell, no faded label. Just open air with the ingredients floating in it, exactly as shown in references 2/3/4.

NO DIALED wordmark, NO label artwork, NO QR code, NO "Prize With Every Can" text, NO "COGNITION ELIXIR" subtitle, NO vertical flavor ribbon, NO fruit illustration on a label — those are all GONE in the middle of each can, replaced by the deconstructed ingredient zone.

Style: high-end deconstructed beverage editorial, hyper-realistic ingredients, glossy crisp finish, isolated on flat white.

Negative: do NOT keep the original label artwork inside the middle of any can, do NOT render the middle as a translucent or glass cylinder, do NOT render the top caps or bottom bands differently from reference 1, do NOT change the can positions / sizes / triangle formation / camera angle / lighting / background, do NOT add velvet bean pods or curved seed pods, do NOT add white powder mounds, do NOT add a solid white blob.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [
    inline(SRC),          // 1: trio source
    inline(ING_BCV),      // 2: BCV template
    inline(ING_LEMONADE), // 3: Lemonade template
    inline(ING_BG),       // 4: Blue Glacier template
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
