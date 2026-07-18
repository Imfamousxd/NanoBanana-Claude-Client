#!/usr/bin/env node
// Cannes Kush v3 — FIX2: the Cannes buildings outline must be WITHIN THE PEACE-SIGN BAND/RIBBON itself
// (the drawn strokes of the symbol), NOT in the open gaps. Gaps stay empty navy. Lock spelling.
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

const BASE = `Design a premium cannabis-FLAVOR BADGE for the flavor "CANNES KUSH". A clean self-contained emblem.

HARD RULES: NO cannabis leaf, NO marijuana bud/flower, NO smoke, NO "Muha" mark, NO brand monogram/initials (do NOT include the "KM" letters).

HERO MOTIF — a PEACE SIGN drawn as a thick, puffy WHITE CLOUD BAND / RIBBON (the outer circular ring PLUS the three inner spokes) in the cloud-puff style of the FIRST reference image, with a bold red contour edge, on a deep-navy field.

*** THE SINGLE MOST IMPORTANT REQUIREMENT — READ CAREFULLY ***
The OUTLINE of the Cannes city buildings must be drawn WITHIN THE WHITE BAND/RIBBON THAT FORMS THE PEACE SIGN ITSELF — i.e. embedded directly inside the actual drawn strokes/shape of the peace symbol — rendered in a contrasting GOLD line-art. The gold Cannes skyline (Le Suquet bell tower, the Palais des Festivals, Riviera waterfront buildings, palm trees, a yacht) runs along and FILLS the white peace-sign ribbon, following its curves, as if the peace-sign band is a window-strip revealing the city.
The OPEN NEGATIVE-SPACE GAPS inside the circle (the empty areas between the spokes) MUST STAY COMPLETELY EMPTY plain navy — do NOT draw any buildings, skyline, palms, or art in those gaps. The city exists ONLY within the drawn peace-sign band/strokes, NOT in the holes.

WORDMARK — "CANNES KUSH" in the jagged, hand-cut, distressed tattoo lettering of the SECOND reference image. CRITICAL: spell it EXACTLY, correctly and legibly: C-A-N-N-E-S then a space then K-U-S-H = "CANNES KUSH". Two N's in CANNES; KUSH is K-U-S-H. Do not add, drop, swap, or scramble any letters.

PALETTE — deep navy field, white peace-sign band, bold red contour, GOLD (Palme d'Or) for the Cannes building outlines inside the band. Premium, centered, balanced.`;

const VARIANTS = [
  { name: "v7", desc: `EXECUTION: keep the white cloud peace-sign ribbon clearly white with a red edge; the gold Cannes building outlines are drawn INSIDE that white ribbon (clipped to the band, following its shape all the way around). Gaps empty navy. "CANNES KUSH" jagged lettering arched along the bottom.` },
  { name: "v8", desc: `EXECUTION: render the peace-sign band as if it is a continuous gold-line CANNES CITYSCAPE — the buildings, bell tower and palms form a frieze running all along the ribbon of the peace sign, set on white cloud with a thin red edge; gaps empty navy. "CANNES KUSH" jagged lettering below.` },
  { name: "v9", desc: `EXECUTION: white cloud peace-sign ribbon, and the gold Cannes skyline is concentrated as a clear horizontal building-frieze embedded within the LOWER curve of the ring and the central column of the peace-sign band, the rest of the band plain white; gaps empty navy; subtle warm gold glow behind. "CANNES KUSH" jagged lettering below.` },
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

console.log("→ Cannes Kush v3 — buildings WITHIN the peace-sign band (gaps empty), spelling locked");
for (const v of VARIANTS) {
  const prompt = `${BASE}\n\n${v.desc}\n\nUse reference image 1 for the cloud peace-sign style and reference image 2 for the jagged lettering. Render high resolution, square 1:1.`;
  await gen([peaceRef, fontRef, { text: prompt }], `Cannes_Kush_${v.name}.png`, v.name);
}
console.log("\nDone.");
