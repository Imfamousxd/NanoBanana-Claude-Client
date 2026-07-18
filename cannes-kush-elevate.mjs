#!/usr/bin/env node
// Cannes Kush — ELEVATE the approved v7 concept (city engraved WITHIN the peace-sign band, gaps empty)
// into a cooler, premium collectible-grade emblem. 5 high-end treatments. Refs anchored + v7 for layout.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const OUT = "euro Music theme/Generated";
const REFDIR = "euro Music theme/strain refs";
const inline = (p, mime = "image/png") => ({ inline_data: { mime_type: mime, data: fs.readFileSync(p).toString("base64") } });
const peaceRef = inline(path.join(REFDIR, "cannes peace cloud ref.png"));
const fontRef = inline(path.join(REFDIR, "keinemusik wordmark ref.png"));
const v7Ref = inline(path.join(OUT, "Cannes_Kush_v7.png"));

const BASE = `Elevate this premium cannabis-FLAVOR BADGE "CANNES KUSH" into a striking, high-end, collectible-quality emblem.

KEEP THE CONCEPT (use the LAYOUT of reference image 3): a PEACE SIGN made of a puffy white CLOUD band/ribbon (cloud style of reference image 1) with a red contour edge, on deep navy. The OUTLINE of the Cannes skyline (Le Suquet stone bell tower, the Palais des Festivals, Riviera waterfront buildings, palm trees, a yacht) is engraved in GOLD line-art WITHIN the white peace-sign band itself, following the ribbon all the way around. The open inner negative-space gaps stay CLEAN and EMPTY (no buildings in the gaps).

WORDMARK: "CANNES KUSH" in the jagged, hand-cut, distressed tattoo lettering of reference image 2. Spell it EXACTLY and legibly: "CANNES KUSH" (two N's in CANNES; K-U-S-H).

HARD RULES: NO cannabis leaf, NO bud/flower, NO smoke, NO "Muha" mark, NO "KM"/monogram/initials.

NOW MAKE IT LOOK COOLER, RICHER AND MORE PREMIUM — much more polished and detailed than reference image 3:`;

const VARIANTS = [
  { name: "e1", desc: `LUXE GOLD FOIL: render the Cannes city as fine, intricate guilloche / banknote-grade gold engraving; crisp clean puffy clouds with a bold candy-red outline and a soft drop shadow that lifts the emblem off a rich midnight-navy field; a subtle radiating gold sunburst behind the peace sign; the wordmark in brushed metallic gold with a thin red edge and slight emboss. Polished collectible coin/sticker quality.` },
  { name: "e2", desc: `RIVIERA SUNSET: a deep navy sky melting into a warm gold-and-coral Cannes-sunset glow behind the emblem with a scatter of tiny gold stars; warm rim-light catching the cloud edges; the engraved gold city glowing softly inside the band; cinematic, dreamy, premium.` },
  { name: "e3", desc: `DIE-STRUCK ENAMEL MEDALLION: render as a high-end die-struck enamel pin / metal medal — glossy raised white cloud, recessed deep-navy, real gold-foil city engraving with metallic sheen and soft bevel highlights, a thin polished gold rim encircling the whole badge; tactile, luxe, three-dimensional.` },
  { name: "e4", desc: `BOLD STREETWEAR DROP: punchy high-contrast streetwear-merch finish — a bolder thicker red outline, ultra-clean crisp clouds, vivid rich gold city engraving, and a confident chunky jagged wordmark; iconic, sticker/patch-ready, instantly cool.` },
  { name: "e5", desc: `FESTIVAL CREST: frame it as an elevated crest — a slim ornate gold border ring around the badge, a tasteful Palme d'Or golden-laurel motif and small Riviera flourishes worked into the composition (NO cannabis leaf), refined balance and depth; prestigious, award-show luxe.` },
];

async function gen(parts, outName, label) {
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } } };
  console.log(`  · ${label}`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`    HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); return null; }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) { const out = path.join(OUT, outName); fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64")); console.log(`    ✓ ${out}`); return out; }
  }
  console.error("    no image"); return null;
}

console.log("→ Cannes Kush — 5 elevated premium treatments");
for (const v of VARIANTS) {
  const prompt = `${BASE}\n\n${v.desc}\n\nReference image 1 = cloud peace-sign style, image 2 = jagged lettering, image 3 = the layout to keep. Render high resolution, square 1:1.`;
  await gen([peaceRef, fontRef, v7Ref, { text: prompt }], `Cannes_Kush_${v.name}.png`, v.name);
}
console.log("\nDone.");
