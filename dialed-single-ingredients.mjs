#!/usr/bin/env node
// Stage 2 — for each approved single-can shot, replace the WHITE cylindrical
// body with the deconstructed ingredient column (purple mucuna L-Dopa flowers
// + raw brown coffee beans + small white L-theanine powder mound + per-flavor
// fruit). Preserve the colored top cap, colored bottom band, can silhouette,
// position, size, angle, and the white background exactly.
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

const SINGLE_DIR = "Dialed Moods L-Doba Generations/Single Cans";
const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const OUT_DIR = "Dialed Moods L-Doba Generations/Single Cans Ingredients";
fs.mkdirSync(OUT_DIR, { recursive: true });

const FLAVORS = [
  {
    slug: "lemonade",
    source: "single-lemonade-anchor.png",
    productRef: "Lemonade.png",
    name: "Lemonade",
    capColor: "bright sunshine yellow",
    bottomColor: "bright sunshine yellow",
    fruit: "several fresh lemons — one whole lemon at top, one halved lemon (cut side facing camera with juicy yellow flesh and small seeds), one halved lemon at lower portion, drawn with vivid yellow rind and slight green stem nub",
  },
  {
    slug: "lychee",
    source: "single-lychee.png",
    productRef: "Lychee.png",
    name: "Lychee",
    capColor: "soft baby pink",
    bottomColor: "soft baby pink",
    fruit: "three or four whole lychee fruits with rough pink-red bumpy textured shells, one or two cracked open showing the translucent white flesh inside",
  },
  {
    slug: "black-cherry-vanilla",
    source: "single-black-cherry-vanilla.png",
    productRef: "black cherry vanilla.png",
    name: "Black Cherry Vanilla",
    capColor: "deep magenta / berry pink",
    bottomColor: "deep magenta / berry pink",
    fruit: "an abundant pile of glossy dark black cherries with stems (multiple cherries clustered together), and two or three whole vanilla bean pods (long dark brown slightly twisted)",
  },
  {
    slug: "secret-juice",
    source: "single-secret-juice.png",
    productRef: "SecretJuice_Front.png",
    name: "Secret Juice (Strawberry Kiwi)",
    capColor: "red (top)",
    bottomColor: "green (bottom)",
    fruit: "several fresh red strawberries with green leaves AND a sliced kiwi fruit (whole and halved, showing its bright green flesh and tiny black seeds)",
  },
  {
    slug: "sour-watermelon",
    source: "single-sour-watermelon.png",
    productRef: "Sour watermelon candy.png",
    name: "Sour Watermelon Candy",
    capColor: "bright lime green",
    bottomColor: "bright lime green",
    fruit: "several wedges of juicy red watermelon with visible black seeds and green rind",
  },
  {
    slug: "blue-glacier",
    source: "single-blue-glacier.png",
    productRef: "Blue glacier.png",
    name: "Blue Glacier",
    capColor: "light cyan / sky blue",
    bottomColor: "light cyan / sky blue",
    fruit: "an abundant cluster of plump fresh blueberries (many berries) with their natural silvery bloom",
  },
];

function makePrompt(flavor) {
  return `Take reference image 1 (an intact Dialed Moods ${flavor.name} can isolated on flat white). Reproduce reference 1 PIXEL-FAITHFULLY in every aspect EXCEPT the change described below — same camera angle, same can sizing, same can position, same framing, same margins, same lighting, same contact-shadow style, same flat white background.

DECONSTRUCTED EDIT — REPLACE only the WHITE CYLINDRICAL BODY of the can (the middle section between the colored top cap and the colored bottom band — the area currently containing the gold "DIALED" wordmark, "CLEAN ENERGY & CALM FOCUS" banner, vertical flavor ribbon, fruit illustration, QR sticker, "Prize With Every Can" text, "COGNITION ELIXIR" subtitle). REMOVE all of that white-body content entirely and REPLACE it with a photoreal floating INGREDIENT COLUMN occupying the EXACT same cylindrical footprint the white body currently occupies — same width, same height, same position, same perspective as the rest of the can.

KEEP IDENTICAL to reference 1:
- The colored TOP CAP (${flavor.capColor}) with the small black sipping mouth ring — pixel-identical position, size, color, shape
- The colored BOTTOM BAND (${flavor.bottomColor}) with the small "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)" text — pixel-identical position, size, color, shape
- The can's outer silhouette and edges where the cap and bottom band meet the body
- The can's overall position, size, and angle in the frame
- The flat white #FFFFFF background
- The tiny contact shadow beneath the can's base

INGREDIENT COLUMN (filling the space the white body used to occupy):
- CORE TRIO (present in every flavor, shared across the catalog):
  • Vivid purple-violet MUCUNA / L-DOPA flower clusters on green stems with green leaves — drooping flower racemes occupying ~30–35% of the column's volume. PRESENT and visible but NOT dominating. CRITICAL: NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO dark purple bean-pod shapes — ONLY flower clusters with their stems and leaves.
  • A GENEROUS scatter of raw brown COFFEE BEANS (caffeine source) suspended throughout the column.
  • A small mound of pure WHITE L-THEANINE POWDER, prominent near the bottom of the column.
- SIGNATURE FRUIT (this flavor's identifying ingredient, occupying ~35–40% of the column, sitting visually on top of / mixed with the core trio): ${flavor.fruit}. Use reference 2 as the visual reference for this flavor's fruit appearance.

The ingredients appear suspended / floating / mid-pour, photoreal, sharply lit, glossy crisp — like a luxury deconstructed beverage editorial. The ingredient column occupies the precise volume where the white body used to be — viewing it the cylindrical shape is implied by the ingredients filling that space, but the white body itself is GONE.

Style: high-end deconstructed beverage editorial / luxury product photography. Hyper-realistic ingredients. Glossy crisp finish. Isolated on flat white ready for Photoshop.

Negative: no full white can body, no gold DIALED wordmark, no fruit illustrations from the original label, no QR code, no "Prize With Every Can" text, no "COGNITION ELIXIR" subtitle, no logos, no environment, no podium, no shadows beyond the tiny base contact shadow, NO velvet bean pods of any color (no long curved purple, brown, or black pod shapes hanging from the plant — only flower clusters remain), no warped or repositioned top cap or bottom band, no changed lighting.`;
}

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function genOne(flavor, attempt = 1) {
  const sourcePath = path.join(SINGLE_DIR, flavor.source);
  const refPath = path.join(REF_DIR, flavor.productRef);
  const parts = [inline(sourcePath), inline(refPath), { text: makePrompt(flavor) }];
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "3:4", imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let res;
  try {
    res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
      const dst = path.join(OUT_DIR, `ingredients-${flavor.slug}.png`);
      fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
      return { ok: true, dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Generating ${FLAVORS.length} ingredient versions...`);
const results = await Promise.allSettled(FLAVORS.map(f => genOne(f)));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.status === "fulfilled" && r.value.ok) console.log(`  ✓ ${FLAVORS[i].name} → ${r.value.dst}`);
  else console.log(`  ✗ ${FLAVORS[i].name}: ${r.status === "fulfilled" ? r.value.error : r.reason.message}`);
}
