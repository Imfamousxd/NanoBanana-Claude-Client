#!/usr/bin/env node
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
const STYLE_REF = "NuLumin Assets/NuL_CFC_5mg.png";
const COLOR_REF = "_ref_cjc_pink.png";

const PROMPT = `Reproduce reference 1 PIXEL-FAITHFULLY as a NuLumin Bio-Sciences product studio shot, with the specific changes below. Reference 2 is provided ONLY as a COLOR SAMPLE — pull the hot pink / magenta cap and accent color from reference 2 and apply it to this render. Do NOT use reference 2's background, lighting, or composition — ignore everything in reference 2 except the pink color value.

LOCKED FROM REFERENCE 1 (do not change):
- Bright clean white studio background, soft even studio lighting, single vial centered front-facing.
- Vial body shape, proportions, glass material, label layout, label texture, label placement on the vial, vial reflections/shadows on the surface beneath, camera angle (slightly above eye level, straight head-on), depth of field, and overall photographic style.
- The NuLumin Bio-Sciences brand lockup on the label — "NuLumin" wordmark (Nu bold sans + Lumin thin) on top, thin horizontal divider line beneath, "BIO SCIENCES" tracked small caps beneath the divider.
- The small side text block on the upper right of the label (the multi-line spec/usage text). Keep that block intact.
- "Manufactured by NuLumin" line at the bottom of the label.

CHANGES FOR THIS RENDER:
1. CAP COLOR: bright saturated HOT PINK / MAGENTA — sample the exact color from the cap in reference 2 (a vivid, vibrant pink, NOT a warm coral, NOT a soft pastel pink). It is a bold saturated fuchsia-leaning pink. The cap should look identical in shape, height, and finish to the reference 1 cap, only the color changes to this brighter hot pink.
2. ACCENT COLOR: same hot pink / magenta as the cap (matching reference 2's pink), used for the thin vertical accent stripe on the left edge of the label, the divider line under the wordmark, and the dose text. Replace the warmer pink accents that appear in reference 1 with this brighter, more saturated hot pink.
3. LABEL PRODUCT NAME: replace "CJC-1295(N)" on the label with "CJC-1295 + Ipamorelin Blend" set in the SAME italic script display font as reference 1, in the same hot pink as the cap, same position, same size scale. If the full name is too long for one line, set it on TWO lines (still italic script, centered) so it fits cleanly within the label area.
4. LABEL DOSE: keep "5mg" below the product name in the same heavy sans italic style as reference 1, in the same hot pink accent color.

Render at high resolution, 5:4 aspect ratio.

Negative: do not change the white studio background, do not change the vial proportions, do not change the NuLumin lockup, do not warp the wordmark, do not change the side spec text block, do not change the camera angle, do not import any pink background or neon light streaks from reference 2, do not change the "Manufactured by NuLumin" line, do not introduce shadows or props that aren't in reference 1.`;

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(STYLE_REF), inline(COLOR_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "5:4", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_NuL_CJCIpam_5mg_hotpink.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
