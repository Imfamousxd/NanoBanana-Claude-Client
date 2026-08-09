#!/usr/bin/env node
// Make Glow + Klow white-bg purple shots IDENTICAL: recolor ONE (Glow) blue->purple as
// the anchor, then derive Klow from that exact purple image by changing only name+dose.
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
const D = "/Users/mario/Downloads/nulumin-tissue-purple_plus-glow-klow";
const COLOR_REF = `${D}/tissue-purple-lightstreak/KPV_10mg_purple.jpg`;
const GLOW_SRC = `${D}/glow-klow-white-background/Glow-Blend_70mg_white-bg.png`;
const GLOW_OUT = `${D}/glow-klow-white-background/Glow-Blend_70mg_white-bg_purple.png`;
const KLOW_OUT = `${D}/glow-klow-white-background/Klow-Blend_80mg_white-bg_purple.png`;

const inline = (p) => ({ inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } });

async function gen(parts, label, out) {
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`${label} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const raw = out.replace(/\.png$/, "_raw.png");
      fs.writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
      await sharp(raw).resize(724, 724, { fit: "cover" }).png().toFile(out);
      fs.unlinkSync(raw);
      console.log(`OK ${label} -> ${out}`);
      return out;
    }
  }
  console.error(`${label}: no image`); return null;
}

// STEP 1 — anchor: recolor Glow blue -> KPV purple, keep white studio bg
const ANCHOR_PROMPT = `Reference 1 is a clean NuLumin Bio-Sciences STUDIO product shot — the "Glow Blend" vial on a plain light studio WHITE / very-light-grey background — currently with a BLUE brand accent (blue cap, blue vertical accent bar on the label, blue '70mg' dose). Reference 2 (KPV) shows the PURPLE/VIOLET brand accent to match.
Recreate reference 1 EXACTLY and pixel-faithfully — identical vial, glass, metallic crimp, cream label, 'NuLumin' logo, 'BIO SCIENCES', italic 'Glow Blend' name, boxed research text, '70mg' dose, 'Manufactured by NuLumin' line, same soft studio lighting/reflection/shadow, same clean studio WHITE background.
THE ONLY CHANGE: recolor the BLUE accents to the PURPLE/VIOLET of reference 2 — the cap, the vertical accent bar, and the '70mg' dose number become that exact purple. KEEP THE BACKGROUND CLEAN STUDIO WHITE/LIGHT-GREY (no purple background, no streaks). Output a SQUARE 1:1 image.`;
const glow = await gen([inline(GLOW_SRC), inline(COLOR_REF), { text: ANCHOR_PROMPT }], "Glow (anchor)", GLOW_OUT);

// STEP 2 — derive Klow from the EXACT purple Glow, changing only name + dose
if (glow) {
  const DERIVE_PROMPT = `Reference 1 is a finished NuLumin "Glow Blend 70mg" studio product shot on a white background with PURPLE brand accents. Recreate it COMPLETELY IDENTICALLY — the EXACT same vial, the same purple cap, the same purple accent bar, the same purple dose color, the same cream label, same 'NuLumin' logo, same 'BIO SCIENCES', same boxed research text, same 'Manufactured by NuLumin' line, the same studio WHITE background, the same lighting, reflection, shadow, position, framing and scale — pixel-for-pixel identical.
THE ONLY TWO CHANGES: (1) change the italic serif product name from 'Glow Blend' to 'Klow Blend'; (2) change the dose number from '70mg' to '80mg' (kept in the SAME purple color and SAME style/position). Nothing else changes at all — same purple, same everything. Output a SQUARE 1:1 image identical to reference 1 except those two text changes.`;
  await gen([inline(GLOW_OUT), { text: DERIVE_PROMPT }], "Klow (derived)", KLOW_OUT);
}

try { execSync(`open -a Preview "${GLOW_OUT}" "${KLOW_OUT}"`); } catch {}
console.log("DONE");
