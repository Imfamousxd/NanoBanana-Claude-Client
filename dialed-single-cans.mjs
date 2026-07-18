#!/usr/bin/env node
// Stage 1 — render a single hero shot of EACH of the 6 Dialed Moods L-Doba
// flavors, all matched to the same low up-angle / can sizing / lighting as
// the approved 6-can hero (6can-final-v4.png). Isolated on pure flat white
// for Photoshop removability. Nano Banana for hero-scale label fidelity.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const ANGLE_REF = "Dialed Moods L-Doba Generations/6can-final-v4.png";
const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const OUT_DIR = "Dialed Moods L-Doba Generations/Single Cans";
fs.mkdirSync(OUT_DIR, { recursive: true });

const FLAVORS = [
  { slug: "lychee",              file: "Lychee.png",                name: "Lychee",
    capColor: "soft baby pink",  ribbon: "LYCHEE" },
  { slug: "black-cherry-vanilla", file: "black cherry vanilla.png", name: "Black Cherry Vanilla",
    capColor: "deep magenta / berry pink", ribbon: "BLACK CHERRY VANILLA" },
  { slug: "secret-juice",        file: "SecretJuice_Front.png",     name: "Secret Juice",
    capColor: "red top + green bottom (dual-tone)", ribbon: "STRAWBERRY KIWI (with large diagonal SECRET JUICE banner across the front)" },
  { slug: "lemonade",            file: "Lemonade.png",              name: "Lemonade",
    capColor: "bright sunshine yellow", ribbon: "LEMONADE" },
  { slug: "sour-watermelon",     file: "Sour watermelon candy.png", name: "Sour Watermelon Candy",
    capColor: "bright lime green", ribbon: "SOUR WATERMELON CANDY" },
  { slug: "blue-glacier",        file: "Blue glacier.png",          name: "Blue Glacier",
    capColor: "light cyan / sky blue", ribbon: "BLUE GLACIER" },
];

function makePrompt(flavor) {
  return `Hero product photograph — 3:4 vertical — of ONE intact Dialed Moods Cognition Elixir can (12 fl oz tall slim aluminum format), isolated on a PURE FLAT WHITE BACKGROUND (#FFFFFF, uniform, no gradient, no ledge, no surface, no environment, no shadow beyond a tiny tight contact shadow directly under the can's base).

CAMERA — head-on product shot:
- The camera is at the can's MID-BODY height, looking DEAD-ON at the can from straight in front (eye-level with the can's center).
- The can faces the camera FRONT-ON — the label's flat plane is parallel to the camera lens.
- NO rotation off-axis — the can shows a clean front elevation (the full front face of the label, no side curvature visible apart from the natural cylindrical edges of the can body).
- NO upward tilt, NO downward tilt — a straight perpendicular shot.
- The top cap and bottom band both read as VERY THIN ellipses (because we're looking straight at them edge-on, with only the slightest natural cylindrical curve visible).
- The can stands UPRIGHT vertically, the camera axis is horizontal — a clean catalog-style head-on hero product shot.
- Composition: can horizontally centered, vertically centered in the frame, occupying ~75% of canvas height.

REFERENCE 1 is the approved 6-can hero composition for additional angle anchoring — match its low up-angle character and the same lighting setup:
- Bright soft diffused studio lighting from above-front
- Subtle cool rim highlight running down one edge, soft warm fill on the opposite edge
- Glossy crisp metallic surface character

The can in this shot is the ${flavor.name} flavor — use REFERENCE 2 for EXACT label artwork. Preserve every detail of reference 2 pixel-faithfully:
- The TOP colored cap (${flavor.capColor}) with the small black sipping mouth ring
- The TOP banner band reading "CLEAN ENERGY & CALM FOCUS"
- The white MAIN body with the gold/cream "DIALED" wordmark prominently center (with its black drop-shadow), the vertical flavor ribbon on the left reading "${flavor.ribbon}", "Prize With Every Can" vertical text, the fruit illustration / artwork, the QR sticker, the "COGNITION ELIXIR" subtitle below DIALED
- The BOTTOM colored band with "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)"
- All typography hyperrealistic, sharp, fully legible — no warping, no garbling

The can stands UPRIGHT, horizontally centered, occupying ~75% of canvas height, with a small comfortable margin top and bottom. Slight 3/4 off-axis rotation (the can rotated ~15° so right side curvature is visible).

Style: clean modern beverage commercial, magazine-grade product photography shot from low angle, hyper-realistic can rendering, glossy crisp finish, isolated on flat white ready for Photoshop.

Negative: no upward tilt, no downward tilt, no off-axis rotation, no 3/4 view, no can physically tilted, no extra cans, no ledge, no environment, no colored background, no gradient, no warped typography, no inaccurate label colors, no off-white tinting, no hands, no people.`;
}

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function genOne(flavor, attempt = 1) {
  const parts = [
    inline(ANGLE_REF),
    inline(path.join(REF_DIR, flavor.file)),
    { text: makePrompt(flavor) },
  ];
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: "3:4", imageSize: "4K" },
    },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 3000)); return genOne(flavor, attempt + 1); }
    return { ok: false, error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise(r => setTimeout(r, 5000 * attempt));
      return genOne(flavor, attempt + 1);
    }
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const dst = path.join(OUT_DIR, `single-${flavor.slug}.png`);
      fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
      return { ok: true, dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Generating ${FLAVORS.length} single-can shots...`);
const results = await Promise.allSettled(FLAVORS.map(f => genOne(f)));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.status === "fulfilled" && r.value.ok) console.log(`  ✓ ${FLAVORS[i].name} → ${r.value.dst}`);
  else console.log(`  ✗ ${FLAVORS[i].name}: ${r.status === "fulfilled" ? r.value.error : r.reason.message}`);
}
