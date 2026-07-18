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

const VIAL_REF = "NuLumin Assets/NuL_CFC_5mg.png";
const STREAK_PINK = "_ref_streak_pink.png";
const STREAK_BLUE = "_ref_streak_blue.png";

const PRODUCTS = [
  {
    name: "NuL_CJCIpam_5mg_streakv3",
    productName: "CJC-1295 + Ipamorelin Blend",
    dose: "5mg",
    streakRef: STREAK_PINK,
    capColor: "the same exact pink as in reference 1 (do NOT alter the cap color)",
    accentColor: "the same exact pink as the cap in reference 1",
    bgColorDesc: "the same saturated hot pink / magenta as in reference 2 — a vivid pink that matches the cap color tone",
  },
  {
    name: "NuL_GlowBlend_70mg_streakv3",
    productName: "Glow Blend",
    dose: "70mg",
    streakRef: STREAK_BLUE,
    capColor: "soft baby blue (clean pastel sky / cornflower blue) — replace reference 1's pink cap with this baby blue, identical shape and finish",
    accentColor: "soft baby blue matching the cap",
    bgColorDesc: "the same saturated cyan / sky blue as in reference 2 — a vivid blue background that matches the baby blue cap tone",
  },
  {
    name: "NuL_KlowBlend_80mg_streakv3",
    productName: "Klow Blend",
    dose: "80mg",
    streakRef: STREAK_BLUE,
    capColor: "soft baby blue (clean pastel sky / cornflower blue) — replace reference 1's pink cap with this baby blue, identical shape and finish",
    accentColor: "soft baby blue matching the cap",
    bgColorDesc: "the same saturated cyan / sky blue as in reference 2 — a vivid blue background that matches the baby blue cap tone",
  },
];

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function generateOne(product) {
  const PROMPT = `Reference 1 is the NuLumin vial — its label layout, brand lockup, glass, proportions, and (where noted) cap color/style. Reference 2 is the COMPOSITION + LIGHTING + BACKGROUND TARGET — match its dramatic light-streak treatment EXACTLY. Read reference 2 carefully:

- The background is a richly saturated solid color that is DARKER at the TOP and BRIGHTER at the BOTTOM. A soft white/bright glow emanates from the BOTTOM of the frame, washing upward and creating a luminous gradient.
- The light streaks in reference 2 are THIN, ETHEREAL, SWEEPING LIGHT TRAILS — like long-exposure motion blur of a sparkler, or like graceful ribbons of glowing light flowing through the air. Each streak has a CRISP bright white core (very thin, ~3-5 px) with a soft colored halo bloom around it. The streaks are NOT thick glowing neon tubes, NOT pipes, NOT solid 3D ropes — they are wispy, airy, hair-thin light trails that flow in elegant S-curves and waves across the entire frame.
- There are MANY streaks (8-15+ thin trails), some sweeping diagonally, some curving in S-shapes, some nearly vertical, layered at different distances — some pass behind the vial (you can see them through the glass), some pass in front of the vial, weaving around it from multiple angles. Together they create a dynamic woven layered look filling the frame.
- The vial floats mid-air, slightly tilted, hero-lit. A soft bright halo glows behind the cap.

CHANGES / SPECIFICATIONS FOR THIS RENDER:

1. BACKGROUND: ${product.bgColorDesc}. CRITICAL — the lighting gradient must come from the BOTTOM: darker saturated color at the top of the frame, brighter white-glow wash at the bottom, exactly mirroring reference 2's lighting direction.

2. LIGHT STREAKS: thin wispy ethereal light trails (like sparkler motion blur), NOT thick neon tubes. Many streaks (8-15+) sweeping in S-curves and diagonal waves across the entire frame, layered at various depths, some behind the vial and some in front, weaving around it. Each streak is a crisp thin bright white core with a soft colored halo bloom. The overall effect is a luminous, flowing, layered ribbon-of-light atmosphere — exactly matching reference 2's streak style.

2. CAP: ${product.capColor}.

3. ACCENT COLOR on the label (the thin vertical stripe on the left edge of the label + the dose text): ${product.accentColor}.

4. LABEL PRODUCT NAME: replace "CJC-1295(N)" with "${product.productName}" set in the SAME italic script display font as reference 1's product name, in BLACK / dark charcoal (NOT the accent color — the product name is always BLACK on these labels). Same position, same size scale. If the full name is too long for one line, set it on TWO lines (still italic script, centered, BLACK) so it fits within the label area.

5. LABEL DOSE: "${product.dose}" below the product name, same heavy sans italic style as reference 1's "5mg", in the accent color (cap color).

6. KEEP from reference 1: the NuLumin Bio-Sciences brand lockup ("NuLumin" wordmark + thin divider + "BIO SCIENCES" tagline), the small side spec text block on the upper right of the label, the "Manufactured by NuLumin" line at the bottom, the label texture and proportions, the vial body shape and glass material.

7. ASPECT RATIO: 1:1 square. Recompose reference 2's vertical layout into a centered 1:1 square frame — the vial sits centered in the square, the light streaks curve around it, and the saturated color background fills the square evenly.

The final image should look like a hero product shot suitable for an Instagram feed post — single vial centered against the colored streak background, with the light streaks creating drama and energy around it.

Negative: do NOT put the product name in the accent color (BLACK only), do NOT change the NuLumin brand lockup, do NOT change the side spec text block, do NOT add any extra graphics or icons, do NOT add multiple vials, do NOT crop or warp the vial, do NOT change the streak treatment from reference 2's style.`;

  const body = {
    contents: [{ parts: [inline(VIAL_REF), inline(product.streakRef), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "4K" } },
  };

  console.log(`\n→ ${product.name}: ${product.productName} ${product.dose}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    console.error(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const outPath = `generations/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_${product.name}.png`;
      fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${outPath}`);
      return outPath;
    }
  }
  console.error("  no image in response");
  return null;
}

const results = [];
for (const product of PRODUCTS) {
  const out = await generateOne(product);
  if (out) results.push(out);
}

console.log(`\nDone — ${results.length}/${PRODUCTS.length} generated`);
for (const r of results) console.log(`  ${r}`);
