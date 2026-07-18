#!/usr/bin/env node
// New DH instruction step — supplies laid out: gauze + DH-branded alcohol
// prep pad sachet + DH-branded round bandage strip, ready to use. Black
// line-art on white, 1:1, 4K. Refs guide bandage layout, sachet layout (with
// DH branding), and the DH logo lockup.
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
const OUT = "DIaled Health Instruction Graphics/generations";
fs.mkdirSync(OUT, { recursive: true });

const BANDAGE_REF = "DIaled Health Instruction Graphics/bandage.jpeg";
const PREP_PAD_REF = "DIaled Health Instruction Graphics/alcohol prep pads.jpeg";
const DH_LOGO = "DIaled Health Instruction Graphics/Product Refs/Dialed Health_Logo_Updated-02.png";

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, NO COLOR anywhere. Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no extra captions/numbers/arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

SCENE — depict THREE medical supplies laid out side-by-side on an invisible surface, no hands in the frame, ready for use. The viewer sees them flat, photographed from above. From LEFT to RIGHT:

1) GAUZE PAD (left third of frame): a small folded square of generic gauze — clean simple white folded square, ~25% canvas width, drawn with the slightly bumpy crosshatch-texture surface of a folded gauze square. Line-art outline only.

2) DH-BRANDED ALCOHOL PREP PAD (middle third): use reference 2 as the LAYOUT REFERENCE for the prep-pad sachet shape, proportions, and copy layout — but REPLACE the MEDLINE branding with the DIALED HEALTH lockup (reference 3). The square foil sachet stands roughly the same size as the gauze pad. On the sachet's front face, draw in black line-art:
   - TOP area: the DIALED HEALTH logo (reference 3) — "DIALED" word top-left of a thin horizontal line with a single EKG spike notch at center, "HEALTH" word bottom-right of the line — OFFSET DIAGONAL layout matching reference 3 precisely
   - Below the logo, large bold text "ALCOHOL" (caps), then "PREP PAD" (caps slightly smaller weight beneath)
   - Below that, smaller sub-line "70% ISOPROPYL ALCOHOL"
   - A small sub-line "Sterile in unopened, undamaged package"
   - At the bottom of the sachet face, a small four-cell info strip: "1 STERILE  |  2-PLY PAD  |  SINGLE USE ONLY  |  NOT MADE WITH NATURAL RUBBER LATEX"
   - On the right edge of the sachet, a tiny crimped/serrated tear edge
   Beside the sachet, ALSO draw the unfolded square gauze-textured pad (the alcohol-soaked square that came out of the sachet) — a slightly bumpy textured square, similar in style to reference 2's left-of-sachet square pad.

3) DH-BRANDED BANDAGE STRIP (right third): use reference 1 as the EXACT LAYOUT REFERENCE — a vertical strip of FIVE round circular DIALED HEALTH-branded bandages stacked one above the other, each round bandage with the DH offset-diagonal logo (DIALED top-left of EKG-spike line, HEALTH bottom-right) printed on its visible adhesive face. To the RIGHT of the bandages, a separate parallel STRIP of paper liner (a slim rectangular tab) showing where the backing peels off — exactly matching reference 1's two-strip side-by-side arrangement. Each round bandage and its corresponding backing-strip cell sized identically and stacked vertically in five rows.

All three supplies (gauze, prep-pad sachet + open pad, bandage strip) are laid out FLAT side-by-side, evenly spaced, all at roughly the same scale, no overlap. No hands. No other supplies. No table surface texture — clean white background.

KEY VISUAL RULES:
- The DIALED HEALTH logo must match reference 3 PRECISELY — same typeface, same offset-diagonal layout, same EKG-spike line. Do NOT center-stack the words.
- The bandage strip must match reference 1's layout precisely — five round bandages in a vertical column + adjacent paper-liner strip.
- The alcohol prep pad sachet copy must match reference 2's layout precisely — just with the MEDLINE branding replaced by the DH lockup.
- Black line-art ONLY — NO color, NO blue, NO red, NO gray fills. Just black ink on white.
- Hand-drawn instruction-illustration style.

Negative: no color anywhere (no blue, no red, no gray fills), no biohazard, no hands, no tools, no extra products, no captions/numbers/arrows in the illustration, no MEDLINE branding (replaced by DH), no warped DH logo, no center-stacked DH logo, no flat black silhouettes of the supplies.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(BANDAGE_REF), inline(PREP_PAD_REF), inline(DH_LOGO), { text: PROMPT }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
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
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dst = path.join(OUT, `${ts}_supplies-layout.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
