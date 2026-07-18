#!/usr/bin/env node
// Redo single-character cards: NO text/logo/border — just the character holding a FORD MUSTANG key
// on a flavor-correlated full-bleed background. gpt-image-2, 2048x1024 (physical card shape).
// TEST: 3 characters first (Aloha, Galactic Diesel, Watermelon).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const SIZE = "2048x1024";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Single Character Key";
fs.mkdirSync(outDir, { recursive: true });

const CHARS = [
  {
    file: "Aloha Passion Rush.png", slug: "aloha",
    desc: "ALOHA PASSION RUSH — seductive tropical Bond-girl. Spherical passionfruit-purple head with green tropical-leaf hair, pink hibiscus flowers tucked in, long lashes, glossy red lips, half-lidded sultry gaze. Plain coral-pink tied-front tropical top, a hibiscus lei. Slim feminine build.",
    pose: "one hand holding up the Mustang key near her shoulder, the other resting on her hip — confident sultry pose.",
    palette: "TROPICAL SUNSET palette — warm coral/orange/pink sunset-beach gradient, blurred palm silhouettes, hibiscus blooms and golden sun-flare bokeh, warm golden-hour cinematic light.",
  },
  {
    file: "Galactic Diesel.png", slug: "diesel",
    desc: "GALACTIC DIESEL — cosmic rebel / space outlaw. Cosmic-purple spherical planet head with swirling violet/magenta nebula patterns and a thin Saturn-style golden-orange ring orbiting the head, glowing electric-green eyes. Plain black leather moto jacket over plain dark cosmic-purple tee. Cocky smirk.",
    pose: "holding the Mustang key up between two fingers and admiring it with a cocky smirk, other hand resting on his belt — outlaw cool.",
    palette: "DEEP SPACE COSMIC palette — midnight navy-purple gradient with cosmic-magenta and electric-teal nebula glow, scattered glowing gold stars, floating cosmic dust, faint planet silhouette blurred in deep background.",
  },
  {
    file: "Watermelon Bubblegum.png", slug: "watermelon",
    desc: "WATERMELON BUBBLEGUM — playful skater guy. WHOLE WATERMELON head — bright green rind with darker wavy stripes, a glossy pink bubblegum quiff styled on top as his hair, mid-bubblegum-blow with a glossy pink bubble. Plain green watermelon-rind MA-1 bomber open over a plain pink crewneck, dark charcoal cargo pants. Confident playful stance.",
    pose: "twirling/dangling the Mustang key on one finger with a playful grin, the other hand casually in his pocket.",
    palette: "DREAMY BUBBLEGUM-WORLD palette — soft watermelon pink-to-green pastel gradient, multiple floating pink bubblegum bubbles at varying depths with bokeh blur, curling green watermelon-vine leaves at the frame edges, warm sunny glow.",
  },
];

const STYLE = `Unified PIXAR / Cinema 4D / Octane 3D animated-feature-film style — cinematic hero lighting, NOT photoreal, NOT flat 2D.`;
const KEYPROP = `KEY PROP: the character is clearly holding a sleek BLACK FORD MUSTANG car key fob — the fob shows the chrome silver running-pony Mustang emblem (and a small Ford blue-oval), unmistakably a Mustang car key. Held so it reads clearly, at a believable hand-held size.`;
const NEG = `ABSOLUTELY NO TEXT anywhere — no title, wordmark, logo, Muha mark, badge, poster, sign, letters or numbers. NO ornate border or ticket frame — clean full-bleed background. Solo character only — no other characters, no vehicle. Anatomy: exactly 2 arms, 2 hands, 10 fingers — no extras.`;

for (const c of CHARS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating: ${c.slug}...`);
  const PROMPT = `Single-character collectible card artwork, 2048x1024 landscape. ${STYLE}

FEATURED CHARACTER (solo): ${c.desc}
POSE: ${c.pose}

${KEYPROP}

The character is the hero — large and centered, framed roughly mid-thigh up, looking great with cinematic rim light.

BACKGROUND (fills the entire card, themed to this flavor): ${c.palette}

${NEG}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  const charBuf = fs.readFileSync(path.join(CHAR_DIR, c.file));
  form.append("image[]", new Blob([charBuf], { type: "image/png" }), c.file);

  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); continue; }
  const outPath = `${outDir}/${c.slug}_key_v1.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
console.log("Done test.");
