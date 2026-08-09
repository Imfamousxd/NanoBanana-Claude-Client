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

const PROMPT = `Reproduce reference 1 PIXEL-FAITHFULLY. Everything in reference 1 stays IDENTICAL — same exact cap (same exact pink color, same shape, same finish, same shape, same gloss, do not alter the cap at ALL), same vial body, same glass, same label background, same label texture, same vertical accent stripe, same divider line color, same NuLumin Bio-Sciences wordmark, same side spec text block, same "Manufactured by NuLumin" line, same white studio background, same lighting, same camera angle, same shadows, same composition, same dose text styling.

ONLY ONE CHANGE: replace the italic script text that currently reads "CJC-1295(N)" on the label with the italic script text "CJC-1295 + Ipamorelin Blend" — same font, same BLACK color, same position on the label, same size scale. If the new product name is too long to fit on one line, set it on TWO lines (still italic script, still centered, still BLACK) so it fits cleanly within the label area without overlapping anything else.

Keep "5mg" below the product name EXACTLY as it appears in reference 1 — same pink color, same font, same position.

Render at high resolution, 5:4 aspect ratio.

Negative: do NOT change the cap color (must be the same exact pink as in reference 1), do NOT alter the cap in any way, do NOT change the label accent color, do NOT change the vial proportions, do NOT change the NuLumin lockup, do NOT change the side spec text, do NOT change the background, do NOT change anything other than the product name text.`;

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(STYLE_REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "5:4", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_NuL_CJCIpam_5mg_v3.png`;
    fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${outPath}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
