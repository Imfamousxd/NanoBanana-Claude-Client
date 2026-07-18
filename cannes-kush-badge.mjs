#!/usr/bin/env node
// Cannes Kush — Keinemusik-style cloud PEACE SIGN badge with the CANNES skyline as gold line-art
// inside the peace sign, and jagged hand-cut "CANNES KUSH" lettering. Nano Banana Pro, refs anchored.
// Refs: 1) cloud peace-sign style, 2) Keinemusik jagged wordmark. 3 variants.
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

const BASE = `Design a premium cannabis-FLAVOR BADGE logo for the flavor "CANNES KUSH". This is a clean self-contained emblem/logo (NOT a poster, NOT a full scene).

HARD RULES: NO cannabis leaf, NO marijuana bud/flower, NO smoke, NO company logo, NO "Muha" text/mark, NO brand monogram or initials (do NOT include the "KM" letters from the reference).

HERO MOTIF — a PEACE SIGN built entirely from puffy, rounded, billowing CUMULUS-CLOUD lobes, exactly in the style of the FIRST reference image: a chubby cloud-puff peace symbol with a clean bold colored contour outline. Match that cloud-puff peace-sign look faithfully.

INSIDE THE PEACE SIGN — fill the open negative-space areas inside the peace circle with a delicate GOLD LINE-ART OUTLINE of the CANNES (French Riviera) skyline and landmarks: the Palais des Festivals, the Le Suquet old-town hill with its stone bell tower, tall palm trees along the Croisette, and a sleek yacht on the bay. Fine gold engraved line-work, a clearly different/contrasting color sitting inside the white clouds.

WORDMARK — "CANNES KUSH" rendered in the EXACT jagged, spiky, hand-cut, distressed tattoo-style lettering of the SECOND reference image (the Keinemusik font): rough irregular angular letters. Spell it exactly C-A-N-N-E-S K-U-S-H, every letter crisp and legible.

PALETTE — French Riviera red-white-blue: deep navy, white clouds, bold red outline, with GOLD (Palme d'Or / Cannes film-festival gold) for the skyline line-art and accents. Premium, balanced, centered.`;

const VARIANTS = [
  {
    name: "v1",
    desc: `LAYOUT: faithful to the first reference — a full DEEP-NAVY square field; the white cloud peace sign with a bold RED contour outline centered; the gold Cannes skyline line-art filling the three open sections inside the peace circle; "CANNES KUSH" in jagged Keinemusik-style lettering (red and gold) arched along the bottom. Do NOT include any "KM" monogram.`,
  },
  {
    name: "v2",
    desc: `LAYOUT: a contained circular MEDALLION on a clean WHITE background — a deep-navy disc holding the white cloud peace sign (with a thin gold contour), the gold Cannes skyline line-art inside the peace circle, a thin gold rim around the disc, and "CANNES KUSH" in jagged Keinemusik-style gold lettering wrapping/arched around the medallion. Premium badge format.`,
  },
  {
    name: "v3",
    desc: `LAYOUT: skyline-forward on a deep-navy field with a subtle warm gold Riviera-sunset glow behind — the cloud peace sign in white with a red outline, and the gold Cannes coastline skyline rendered as a continuous fine line-silhouette band running across the CENTER of the peace sign; "CANNES KUSH" in bold jagged Keinemusik-style lettering below the emblem.`,
  },
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

console.log("→ Cannes Kush — Keinemusik cloud peace sign + Cannes skyline (3 variants)");
const made = [];
for (const v of VARIANTS) {
  const prompt = `${BASE}\n\n${v.desc}\n\nUse reference image 1 for the cloud peace-sign style and reference image 2 for the jagged lettering style. Render high resolution, square 1:1.`;
  const out = await gen([peaceRef, fontRef, { text: prompt }], `Cannes_Kush_${v.name}.png`, v.name);
  if (out) made.push(out);
}
fs.writeFileSync("/tmp/cannes_made.txt", made.join("\n"));
console.log("\nDone:", made.length, "variants");
