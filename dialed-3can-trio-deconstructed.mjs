#!/usr/bin/env node
// FRESH generation of the deconstructed trio — not an edit. Compose using:
//   - 6can-ingredients-mid-v1.png as the DECONSTRUCTED STYLE anchor (top caps
//     + bottom bands only, ingredients hovering in open air between, NO can
//     body / NO glass / NO label artwork)
//   - trio-cans.png as the COMPOSITION anchor (which 3 cans, triangle, angle)
// Generate fresh rather than edit — NB keeps refusing to remove the can body
// in edit mode.
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

const DECON_STYLE = "Dialed Moods L-Doba Generations/6can-ingredients-mid-v1.png";
const TRIO_COMP = "Dialed Moods L-Doba Generations/Trio/trio-cans.png";
const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const DST = "Dialed Moods L-Doba Generations/Trio/trio-deconstructed.png";

const PROMPT = `Cinematic deconstructed beverage hero — 4:3 landscape — isolated on PURE FLAT WHITE BACKGROUND (#FFFFFF), low up-angle camera (~20° upward tilt). Three Dialed Moods Cognition Elixir flavor slots arranged in a TRIANGLE formation, but each slot is RENDERED IN DECONSTRUCTED STYLE — see reference 1 (the previously-approved deconstructed 6-can hero) for the exact look:

Reference 1 is the STYLE TARGET. In reference 1 each "can" is shown as just TWO pieces — the COLORED TOP CAP (with its top banner) and the COLORED BOTTOM BAND — floating in mid-air with OPEN AIR / EMPTY WHITE SPACE between them. INSIDE that open air, the can's ingredients hover freely (purple mucuna flower clusters, coffee beans, signature fruit). There is NO can body, NO glass, NO translucent cylinder, NO label, NO DIALED logo, NO "CLEAN ENERGY & CALM FOCUS" banner inside the open space — just the floating ingredients between the cap and band. Match reference 1's deconstructed style precisely for each of the three slots in this output.

Reference 2 is the COMPOSITION TARGET — three cans arranged in a triangle (Lemonade front-center largest, Black Cherry Vanilla back-left peeking, Blue Glacier back-right peeking) at a low up-angle on a flat white background. Match reference 2's composition: 3 slots in the same triangle arrangement, same low up-angle camera, same approximate scale and positions, same lighting.

PER-SLOT MAPPING (left to right in the triangle):
- BACK-LEFT slot (Black Cherry Vanilla flavor): a deep magenta/berry-pink TOP CAP (with the small black sipping mouth ring on top) + a deep magenta BOTTOM BAND (with the small "DIETARY SUPPLEMENT  5 CALORIE - ZERO SUGAR  12 FL OZ" text printed on it). Use reference 3 to match the magenta hue. The cap floats at the top of the slot, the band floats at the bottom, with OPEN AIR between. In that open air: vivid purple-violet mucuna L-Dopa flower clusters on green stems with leaves + scattered raw brown coffee beans + an abundant pile of glossy dark black cherries with stems + two or three whole vanilla bean pods (long dark brown slightly twisted).
- FRONT-CENTER slot (Lemonade flavor, largest in the triangle): a bright sunshine yellow TOP CAP + bright sunshine yellow BOTTOM BAND. Use reference 4. Open air between holds: purple mucuna flower clusters + scattered coffee beans + several fresh lemons (one whole + halved lemons showing juicy yellow flesh).
- BACK-RIGHT slot (Blue Glacier flavor): a light cyan/sky-blue TOP CAP + light cyan BOTTOM BAND. Use reference 5. Open air between holds: purple mucuna flower clusters + scattered coffee beans + an abundant cluster of plump fresh blueberries with their natural silvery bloom.

The TOP CAP of each slot includes a small "CLEAN ENERGY & CALM FOCUS" colored banner just below the cap (matching the cap color), as in the original product. The BOTTOM BAND has the small dietary text. These two colored pieces float at the top and bottom of each slot with NOTHING but open air and floating ingredients between them.

CAMERA: low up-angle ~20°, slight 3/4 perspective, ALL THREE SLOTS share the same invisible ground plane (the bottom bands of all three sit at the same Y coordinate in world space; due to perspective the back-left and back-right bands appear slightly higher in the frame). Triangle formation: 1 front + 2 back.

LIGHTING: bright soft diffused studio lighting from above-front, subtle rim highlights on the colored cap/band ellipses, tiny tight contact shadows directly below each bottom band.

Mucuna rule: vivid purple-violet drooping flower racemes on green stems with green leaves. NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO bean-pod shapes — only flower clusters with stems and leaves.

Style: high-end deconstructed beverage editorial / luxury product photography, hyper-realistic ingredients, glossy crisp finish, isolated on pure flat white #FFFFFF.

Negative: NO can body of any kind in the middle of any slot (no white, no glass, no translucent, no faded shell — just OPEN AIR), NO DIALED wordmark anywhere, NO "CLEAN ENERGY & CALM FOCUS" banner inside the open space (only on the top cap area), NO vertical flavor ribbon, NO fruit illustration on a label, NO QR code, NO "Prize With Every Can", NO "COGNITION ELIXIR" subtitle, NO ingredient list "20mg / 200mg", NO white solid blob / powder mound / mass, NO velvet bean pods, no environment, no podium, no colored background, no gradient, no warped or repositioned caps or bands.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [
    inline(DECON_STYLE),
    inline(TRIO_COMP),
    inline(path.join(REF_DIR, "black cherry vanilla.png")),
    inline(path.join(REF_DIR, "Lemonade.png")),
    inline(path.join(REF_DIR, "Blue glacier.png")),
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
