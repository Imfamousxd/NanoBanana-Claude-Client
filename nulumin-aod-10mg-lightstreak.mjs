#!/usr/bin/env node
// AOD-9604 10mg lightstreak — match the 5mg master EXACTLY, change ONLY the dose to 10mg.
// Nano Banana Pro (best ref fidelity). 9:16, then resized to the master's 1143x2048.
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const REF = "/Users/mario/Downloads/AOD-9604-10mg-render-brief/MASTERS_to_match/AOD-9604_5mg_yellow__MASTER_lightstreak.jpg";
const outDir = "/Users/mario/Downloads/AOD-9604-10mg-render-brief";

const PROMPT = `Reference 1 is a finished NuLumin Bio-Sciences product render (AOD-9604, gold "Metabolic" light-streak lifestyle shot). Recreate it EXACTLY and pixel-faithfully — IDENTICAL in every single way: same clear glass vial with the same shape, size, angle and position; same metallic yellow-gold crimp cap; same cream/off-white wrap-label in the same place; same 'NuLumin' logo with the gold double-bar and 'BIO SCIENCES' underneath; same italic serif 'AOD-9604' product name; same small boxed "For Research / Not For..." text block on the right of the label; same italic gold dose text; same 'Manufactured by NuLumin' line at the bottom of the label; same glowing gold/yellow metabolic LIGHT-STREAK ribbons in the background; same lighting, glow, reflections, shadows, depth of field and overall composition and color grade.

THE ONE AND ONLY CHANGE: the dosage text on the label currently reads "5mg" — change it to read "10mg" instead. Keep it the EXACT same italic gold font, same size, same color, same position on the label — only the number changes from 5 to 10 (so it becomes "10mg"). Do NOT alter anything else: not the vial, not the cap, not the logo, not the 'AOD-9604' name, not the background streaks, not the lighting. Everything except that one dose number stays pixel-identical to reference 1.

Output the full image at the same tall portrait aspect ratio as reference 1.`;

const inline = (p) => ({ inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } });
const body = {
  contents: [{ parts: [inline(REF), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const raw = `${outDir}/_gen_AOD-9604_10mg_yellow_raw.png`;
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    const out = `${outDir}/AOD-9604_10mg_yellow.jpg`;
    await sharp(raw).resize(1143, 2048, { fit: "cover" }).jpeg({ quality: 95 }).toFile(out);
    console.log(`OK ${out}`);
    try { execSync(`open -a Preview "${out}"`); } catch {}
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
