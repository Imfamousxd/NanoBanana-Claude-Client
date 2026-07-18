#!/usr/bin/env node
// Fixes: Blueberry (key FOB only, no metal blade; no watch) + Lemon (3-arm bug -> exactly 2 arms).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Single Character Key";
const STYLE = `Unified PIXAR / Cinema 4D / Octane 3D animated-feature-film style — cinematic hero lighting, NOT photoreal, NOT flat 2D.`;
const NEG = `ABSOLUTELY NO TEXT anywhere — no title, wordmark, logo, Muha mark, badge, poster, sign, letters or numbers. NO ornate border or ticket frame — clean full-bleed background. Solo character only — no other characters, no vehicle.`;

const JOBS = [
  {
    file: "Arctic Blueberry.png", slug: "blueberry",
    desc: "ARCTIC BLUEBERRY — chad smooth-talker. Spherical deep purple-blue blueberry head with a small fluffy snow tuft at the crown, blueberry-blue skin head to fingertips, gym-built broad-shouldered build. Unbuttoned plain solid blue button-up over a plain solid blue tee. Half-smile + raised-brow smooth-operator look.",
    pose: "gripping the Mustang key FOB firmly in one raised hand to show it off, the other hand doing a relaxed finger-gun gesture. Bare wrists — he wears NO wristwatch on either wrist. EXACTLY 2 arms / 2 hands / 10 fingers.",
    key: "a sleek BLACK FORD MUSTANG SMART KEY FOB — a rounded plastic key fob ONLY, with the chrome silver running-pony Mustang emblem and a small Ford blue-oval on it. It is JUST THE FOB with NO metal key blade, NO metal shaft, and NO key teeth sticking out of it. Gripped firmly in his hand at a believable size.",
    palette: "COLD ARCTIC palette — deep midnight-blue gradient, frosty cyan-white highlights, icy lavender mid-tones, glittering snowflake bokeh, faint icicle silhouettes blurred in the deep background, cold blue cinematic light.",
  },
  {
    file: "Lemon Cherry Fizz.png", slug: "lemon",
    desc: "LEMON CHERRY FIZZ — smart quietly-beautiful nerd girl. Bright yellow spherical lemon head, glossy red cherry earrings, a neat shoulder-length bob of bright-green lemon leaves as hair, round tortoiseshell glasses. Plain pastel-yellow button-up under a plain cherry-red knit vest. Soft knowing smirk.",
    pose: "ONE hand grips the Mustang key fob, raised up to show it off; her OTHER arm is bent holding a closed book against her hip. CRITICAL ANATOMY: she has EXACTLY TWO arms and TWO hands total — one hand on the key, one hand on the book — do NOT add a third arm or third hand, no extra limb adjusting glasses.",
    key: "a sleek BLACK FORD MUSTANG key fob — the fob shows the chrome silver running-pony Mustang emblem and a small Ford blue-oval, unmistakably a Mustang car key, at a believable hand-held size, gripped in her hand.",
    palette: "WARM STUDY / LIBRARY palette — soft pale-yellow gradient with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh.",
  },
];

for (const c of JOBS) {
  console.log(`Generating: ${c.slug}...`);
  const PROMPT = `Single-character collectible card artwork, 2048x1024 landscape. ${STYLE}

FEATURED CHARACTER (solo): ${c.desc}
POSE: ${c.pose}

KEY PROP: ${c.key}

The character is the hero — large and centered, framed roughly mid-thigh up, with cinematic rim light.

BACKGROUND (fills the entire card, themed to this flavor): ${c.palette}

${NEG} Anatomy: exactly 2 arms, 2 hands, 10 fingers — no extras.`;
  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), c.file);
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); continue; }
  fs.writeFileSync(`${outDir}/${c.slug}_key_v1.png`, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${c.slug}`);
}
console.log("Done fixes.");
