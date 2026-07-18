#!/usr/bin/env node
// Cannes Kush v2 — FIX: the Cannes building outline must live INSIDE the peace-sign SHAPE itself,
// in a different (gold) color — peace sign filled with / a window onto the Cannes skyline.
// Keinemusik cloud peace-sign style + jagged lettering. Refs anchored. 3 executions.
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

HARD RULES: NO cannabis leaf, NO marijuana bud/flower, NO smoke, NO "Muha" mark, NO brand monogram or initials (do NOT include the "KM" letters from the reference).

HERO MOTIF — a PEACE SIGN drawn in the puffy cloud-puff style of the FIRST reference image (chubby billowing cumulus-cloud lobes with a bold contour outline).

THE SINGLE MOST IMPORTANT REQUIREMENT: the OUTLINE of the CANNES city skyline/buildings must sit *INSIDE the peace-sign shape itself*, rendered in a DIFFERENT, contrasting GOLD color. The peace sign is essentially a window/stencil that reveals the Cannes skyline drawn in fine gold line-art — the gold building outlines are CONTAINED ENTIRELY WITHIN the body/area of the peace symbol, following and filling its shape. Do NOT place the skyline in the empty background, and do NOT scatter it only in the corner gaps — it belongs INSIDE the peace sign. Cannes landmarks to include in the gold line-outline: the Palais des Festivals, the Le Suquet old-town hill with its stone bell tower, Riviera waterfront buildings, tall palm trees, and a sleek yacht on the bay, arranged as one continuous little skyline inside the peace sign.

WORDMARK — "CANNES KUSH" in the EXACT jagged, spiky, hand-cut, distressed tattoo-style lettering of the SECOND reference image (the Keinemusik font). Spell it exactly C-A-N-N-E-S K-U-S-H, every letter legible.

PALETTE — French Riviera red-white-navy with GOLD (Palme d'Or) for the Cannes skyline line-art inside the peace sign. Premium, balanced, centered.`;

const VARIANTS = [
  {
    name: "v4",
    desc: `EXECUTION: keep the white puffy CLOUD peace sign with a bold RED contour outline on a deep-navy field — but the entire INSIDE/body of the peace-sign shape is filled with the GOLD line-outline of the Cannes skyline (the gold city drawing runs all through the interior of the peace symbol, clipped to its shape). "CANNES KUSH" in jagged Keinemusik lettering arched along the bottom.`,
  },
  {
    name: "v5",
    desc: `EXECUTION: the peace sign is a WINDOW — its shape is cut out to reveal a deep-navy panel showing a full GOLD line-art CANNES skyline inside the peace-sign silhouette; a white puffy cloud band with a thin red edge forms the frame/outline of the peace sign around that window. The gold city is clearly visible inside the peace shape. "CANNES KUSH" in jagged Keinemusik lettering below, on the navy background.`,
  },
  {
    name: "v6",
    desc: `EXECUTION: a bold clean peace sign whose ENTIRE interior surface is a finely engraved GOLD Cannes cityscape outline on deep navy (buildings, bell tower, palms, yacht filling the inside of the peace sign), with a crisp white-and-red cloud-puff rim tracing the outer edge of the peace symbol. A subtle warm gold glow behind it. "CANNES KUSH" in jagged Keinemusik lettering below.`,
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

console.log("→ Cannes Kush v2 — skyline INSIDE the peace sign (3 executions)");
for (const v of VARIANTS) {
  const prompt = `${BASE}\n\n${v.desc}\n\nUse reference image 1 for the cloud peace-sign style and reference image 2 for the jagged lettering. Render high resolution, square 1:1.`;
  await gen([peaceRef, fontRef, { text: prompt }], `Cannes_Kush_${v.name}.png`, v.name);
}
console.log("\nDone.");
