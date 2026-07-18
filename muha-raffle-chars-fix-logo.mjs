#!/usr/bin/env node
// Targeted re-rolls for 3 cards where the Muha Members logo got garbled:
// - Lemon Cherry Fizz
// - Galactic Diesel
// - Guava Mango
// Strongest possible logo-spelling lock.
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

const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const M_MONO_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";
const TEMPLATE_REF = "AI Fruit VIdeos Muha/Raffle Card Designs/2026-05-31T02-02-35_muha-raffle-A-characters-only-v14.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";

const CHARS = [
  {
    file: "Lemon Cherry Fizz.png",
    slug: "lemon",
    desc: "LEMON CHERRY FIZZ — smart, quietly beautiful nerd girl. Bright sunny YELLOW spherical lemon head, lemon-yellow ears with glossy bright RED CHERRY EARRINGS dangling from them, a NEAT shoulder-length BOB of bright-green lemon LEAVES styled as her hair framing her face. Tortoiseshell round GLASSES on her face. A small cherry-red ribbon or hair-tie at the crown. Plain pastel-yellow button-up shirt under a plain solid cherry-red knit vest. Holds a closed BOOK tucked under one arm against her hip. The other hand raised to gently adjust the bridge of her glasses with index finger. Soft knowing smirk. Smart-bookish-cute energy.",
    palette: "WARM STUDY / LIBRARY palette — soft pale-yellow gradient background with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh, gentle sparkle dust. Cozy academic-warmth atmosphere.",
  },
  {
    file: "Galactic Diesel.png",
    slug: "diesel",
    desc: "GALACTIC DIESEL — badass cosmic rebel / space outlaw. Cosmic-purple spherical planet head with swirling violet/magenta nebula patterns and a thin Saturn-style golden-orange ring orbiting the head, glowing electric-green eyes. Plain black leather moto jacket over plain dark cosmic-purple tee. Cocky smirk. Pose: weight cocked on one hip, one hand resting on his belt, the other flicking a small glowing cosmic spark between his fingertips — outlaw cool.",
    palette: "DEEP SPACE COSMIC palette — deep MIDNIGHT NAVY-PURPLE gradient background with cosmic-magenta and electric-teal nebula glow, scattered glowing GOLD STARS / star-sparkles, floating cosmic-dust particles, faint stylized planet silhouette blurred in deep background. Cinematic deep-space mood.",
  },
  {
    file: "Guava Mango.png",
    slug: "mango",
    desc: "GUAVA MANGO — funny class-clown laughing guy. Head split vertically half mango-yellow / half guava-green, with leafy mango hair on top. Caught mid-belly-laugh — head tilted back, eyes scrunched shut into happy crescents, wide-open mouth in genuine cackle. Plain solid yellow tee + open plain solid coral-pink button-up. Moderate athletic masculine build. Pose: one hand pressed lightly to his belly mid-laugh, the other thrown out in joy. EXACTLY 2 arms / 2 hands total, no extras.",
    palette: "TROPICAL SUNNY palette — warm GOLDEN YELLOW gradient background blending into MANGO ORANGE and soft GUAVA-PINK, soft palm-frond silhouettes blurred in the deep background, floating bokeh sparkles in warm pink-orange tones. Bright sunny golden-hour cinematic key light. Joyful playful atmosphere.",
  },
];

const LOGO_LOCK = `LOGO LOCK — CRITICAL, DO THIS RIGHT.

The Muha Members logo at the top of the LEFT half of the card has EXACTLY TWO parts, left-to-right:

PART 1 (LEFT side of the logo): a blue scallop-edged badge (sunburst shape) with a thin black checkmark inside it. That's it for part 1.

PART 2 (RIGHT side of the logo): the gold wordmark spelling the English word "MEMBERS" (the word). The word "Members" has SEVEN letters total. Render exactly those seven letters in this exact order, no more, no less:
- Position 1: an UPPERCASE M, rendered as the ORNATE BAROQUE gold capital letterform from reference 3 (the standalone gold M reference) — elaborate scrollwork, crown-like top silhouette. It LOOKS decorative but it IS just one capital M letter.
- Position 2: a LOWERCASE e in gold sans-serif
- Position 3: a LOWERCASE m in gold sans-serif
- Position 4: a LOWERCASE b in gold sans-serif
- Position 5: a LOWERCASE e in gold sans-serif
- Position 6: a LOWERCASE r in gold sans-serif
- Position 7: a LOWERCASE s in gold sans-serif
Then a small ® registered-trademark symbol after position 7.

That is the COMPLETE logo. Two parts: [blue scallop+checkmark badge] [ornate-M + embers + ®]. Nothing else.

DO NOT add any extra lowercase m or extra capital M between position 1 (the ornate M) and position 2 (the lowercase e). The character that immediately follows the ornate gold capital M is the LOWERCASE LETTER E. Not another m. Not a small floating monogram. Just lowercase e.

DO NOT skip any letter. The sequence is M, then e, then m, then b, then e, then r, then s, then ®. Seven letters + one trademark symbol.

DO NOT render the wordmark as "Mmbers" (missing the first e). DO NOT render it as "MMembers" (extra capital M). DO NOT render it as "Memmbers" (extra middle m). DO NOT render it as "Mmembers" (extra lowercase m after the M). The wordmark is exactly "Members" — M-e-m-b-e-r-s.

Render PIXEL-FAITHFUL to the visual reference images (reference 2 shows the full logo, reference 3 shows the standalone ornate M for the capital-M letterform shape).`;

const TEMPLATE_LOCK = `TEMPLATE LOCK — reference image 1 is the APPROVED MASTER TEMPLATE. MATCH the border + outer card body + hero typography EXACTLY:
- Ornate gold ticket border at the inner sticker boundary: Art-Deco corner flourishes only in the 4 corners, double gold rule running parallel along all 4 edges, gold bead detail. NO starbursts at the edge midpoints — edges stay clean with just the double rule + bead.
- Outer card body (the ring outside the gold border, between the border and the canvas edge): deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern. Symmetric on all 4 sides.
- Border is the TOPMOST layer — character + text never cross past it.
- Centered layout — inner sticker area perfectly centered in the 2048x1024 canvas, top margin = bottom margin (~131 px), left = right (~91 px).

CANVAS — 2048 x 1024 px = full 90mm x 43mm raffle card. Inner peel-off sticker area = 82mm x 32mm ≈ 1866 x 762 px centered.`;

const HERO_LOCKUP = `HERO TYPOGRAPHY LAYOUT — split the inner sticker zone into LEFT 50% (typography stack) and RIGHT 50% (character).

LEFT 50% — typography stack centered within the left half, top to bottom:
1. The Muha Members logo at the top — see LOGO LOCK below.
2. Below the logo, with clear vertical breathing space, the word "GIVEAWAY" in chunky 3D vintage-Vegas display lettering — golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline. Spell exactly G-I-V-E-A-W-A-Y.
3. Below "GIVEAWAY", subtitle "WIN A FORD F-150 XLT" in cream / off-white chunky display lettering, smaller than the hero. Spell exactly: F-150 with hyphen, XLT three uppercase letters.

RIGHT 50% — the featured character is the visual hero filling the right half of the card, framed roughly MID-THIGH UP (head + full upper body + most of legs visible, cropped just above the knees). The character stays inside the gold border.`;

const STYLE_LOCK = `STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. NOT photoreal, NOT flat 2D. Cinematic hero-poster lighting.

NEGATIVE — solo character only, NO other characters. NO truck or vehicle. Do NOT misspell anything. Anatomy: exactly 2 arms + 2 hands + 10 fingers per character — no extras. Do NOT let hero content cross past the gold border. Do NOT add an "ADMIT ONE" stub.`;

const SIZE = "2048x1024";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Approved Raffle Cards";
fs.mkdirSync(outDir, { recursive: true });

const templateBuf = fs.readFileSync(TEMPLATE_REF);
const logoBuf = fs.readFileSync(LOGO_REF);
const mMonoBuf = fs.readFileSync(M_MONO_REF);

for (const c of CHARS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Re-rolling raffle card: ${c.file.replace(".png", "")} (logo fix)...`);

  const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — ${c.file.replace(".png", "").toUpperCase()} solo card (LOGO FIX RE-ROLL).

This is one in a 10-card series of per-character raffle cards. All 10 cards share an identical locked border + outer card body + Muha Members logo + "GIVEAWAY" hero typography. Only the FEATURED CHARACTER and the BACKGROUND PALETTE change between cards.

${TEMPLATE_LOCK}

INSIDE THE INNER STICKER AREA (~30-40px safe-zone inset from the gold border):

FEATURED CHARACTER (solo, no truck, no other characters): ${c.desc}

${HERO_LOCKUP}

${LOGO_LOCK}

BACKGROUND inside the inner area (character-specific): ${c.palette}

${STYLE_LOCK}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([templateBuf], { type: "image/png" }), "template-A-v14.png");
  form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
  form.append("image[]", new Blob([mMonoBuf], { type: "image/png" }), "mm-gold-monogram.png");
  const charBuf = fs.readFileSync(path.join(CHAR_DIR, c.file));
  form.append("image[]", new Blob([charBuf], { type: "image/png" }), c.file);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 400)}`);
    continue;
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${c.slug})`); continue; }
  const outPath = `${outDir}/${stamp}_muha-raffle-char-${c.slug}-logofix.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
