#!/usr/bin/env node
// The Secret Juice version captured the off-axis low up-angle correctly while
// the others came out head-on. Regen the other 5 flavors using Secret Juice's
// generation as the camera-angle / composition anchor — match its exact pose.
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

const ANGLE_REF = "Dialed Moods L-Doba Generations/Single Cans/single-secret-juice.png";
const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const OUT_DIR = "Dialed Moods L-Doba Generations/Single Cans";

const FLAVORS = [
  { slug: "lychee",               file: "Lychee.png",                name: "Lychee",
    capColor: "soft baby pink",   ribbon: "LYCHEE" },
  { slug: "black-cherry-vanilla", file: "black cherry vanilla.png",  name: "Black Cherry Vanilla",
    capColor: "deep magenta / berry pink", ribbon: "BLACK CHERRY VANILLA" },
  { slug: "lemonade",             file: "Lemonade.png",              name: "Lemonade",
    capColor: "bright sunshine yellow", ribbon: "LEMONADE" },
  { slug: "sour-watermelon",      file: "Sour watermelon candy.png", name: "Sour Watermelon Candy",
    capColor: "bright lime green", ribbon: "SOUR WATERMELON CANDY" },
  { slug: "blue-glacier",         file: "Blue glacier.png",          name: "Blue Glacier",
    capColor: "light cyan / sky blue", ribbon: "BLUE GLACIER" },
];

function makePrompt(flavor) {
  return `Take reference image 1 (a hero product shot of the Dialed Moods Secret Juice can captured at a low up-angle with a slight 3/4 rotation, isolated on flat white). Reproduce reference 1's CAMERA ANGLE, can sizing, can framing, perspective, tilt, lighting, contact-shadow style, and white background PIXEL-FAITHFULLY.

ONLY MODIFY: replace the Secret Juice label artwork with the ${flavor.name} flavor's label, using reference 2 as the EXACT visual ref for the label. Preserve every detail of reference 2 pixel-faithfully:
- TOP colored cap: ${flavor.capColor}, with the small black sipping mouth ring
- TOP banner band reading "CLEAN ENERGY & CALM FOCUS"
- White MAIN body with the gold/cream "DIALED" wordmark centered (with its black drop-shadow), vertical flavor ribbon on the left reading "${flavor.ribbon}", "Prize With Every Can" vertical text, the fruit illustration/artwork specific to this flavor, the QR sticker, the "COGNITION ELIXIR" subtitle under DIALED
- BOTTOM colored band with "DIETARY SUPPLEMENT  5 CALORIE  ZERO SUGAR  12 FL OZ (355 mL)"

All typography hyperrealistic, sharp, fully legible. The can's pose / position / scale / camera angle MUST match reference 1 exactly — only the label content changes.

Style: clean modern beverage commercial, magazine-grade product photography shot from a low up-angle with a slight 3/4 rotation, hyper-realistic can rendering, glossy crisp finish, isolated on flat white #FFFFFF ready for Photoshop.

Negative: do NOT change the camera angle, do NOT change to a head-on / dead-on front elevation, do NOT change to eye-level, do NOT change the can's pose / tilt / position / sizing, do NOT change lighting, do NOT add colored background, do NOT add a ledge or environment, do NOT add extra cans, no warped typography, no inaccurate label colors, no off-white tinting.`;
}

function inline(p) {
  return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } };
}

async function genOne(flavor, attempt = 1) {
  const parts = [inline(ANGLE_REF), inline(path.join(REF_DIR, flavor.file)), { text: makePrompt(flavor) }];
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
      const dst = path.join(OUT_DIR, `single-${flavor.slug}.png`);
      fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
      return { ok: true, dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Regenerating ${FLAVORS.length} flavors to match Secret Juice's angle...`);
const results = await Promise.allSettled(FLAVORS.map(f => genOne(f)));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.status === "fulfilled" && r.value.ok) console.log(`  ✓ ${FLAVORS[i].name} → ${r.value.dst}`);
  else console.log(`  ✗ ${FLAVORS[i].name}: ${r.status === "fulfilled" ? r.value.error : r.reason.message}`);
}
