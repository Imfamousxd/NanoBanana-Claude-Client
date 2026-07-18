#!/usr/bin/env node
// Re-roll Lemon Cherry Fizz raffle card — fix "GIVEAWAY" spelling
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
const CHAR_FILE = "Lemon Cherry Fizz.png";

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — LEMON CHERRY FIZZ solo card (LOGO + HEADLINE SPELLING FIX).

TEMPLATE LOCK — reference image 1 is the APPROVED MASTER TEMPLATE. MATCH the border + outer card body + hero typography EXACTLY:
- Ornate gold ticket border at the inner sticker boundary: Art-Deco corner flourishes only in the 4 corners, double gold rule along all 4 edges, gold bead detail. NO starbursts at edge midpoints.
- Outer card body: deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern, symmetric on all 4 sides.
- Border is the TOPMOST layer.
- Inner sticker area perfectly centered in the 2048x1024 canvas, top margin = bottom margin (~131 px), left = right (~91 px).

CANVAS — 2048 x 1024 px = 90mm x 43mm raffle card. Inner sticker area ~1866 x 762 px centered.

INSIDE THE INNER STICKER AREA (~30-40px safe-zone inset):

LEFT 50% — typography stack centered top to bottom:

(1) MUHA MEMBERS LOGO at the top. The logo has exactly 2 parts left-to-right:
   (a) Blue scallop-edged badge with a thin black checkmark inside.
   (b) Gold wordmark spelling "Members". The wordmark contains EXACTLY 7 letters total, in this exact order: M (ornate baroque gold capital from reference 3), e (lowercase), m (lowercase), b (lowercase), e (lowercase), r (lowercase), s (lowercase). Then a small ® after the s. ONE M total in the wordmark. The letter immediately after the ornate capital M is the LOWERCASE e — not another m. Reads "Members" — 7 letters.

(2) HEADLINE "GIVEAWAY" below the logo with breathing space. Render this word in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel, thick deep magenta-purple drop shadow, slight cream/white outline.

CRITICAL HEADLINE SPELLING — the headline word is spelled with EXACTLY 8 letters in this order:
- Position 1: G (uppercase)
- Position 2: I (uppercase)
- Position 3: V (uppercase)
- Position 4: E (uppercase)
- Position 5: A (uppercase)
- Position 6: W (uppercase)
- Position 7: A (uppercase)
- Position 8: Y (uppercase) — the LAST letter is the LETTER Y, NOT another W.

The word reads "GIVEAWAY" — G-I-V-E-A-W-A-Y. EIGHT LETTERS, ending in Y. DO NOT render it as "GIVEAWAW" (ending in W instead of Y). DO NOT render an extra W or A at the end. The final character is the letter Y with a single descending stem and an upward-V open top. Count the letters: G(1), I(2), V(3), E(4), A(5), W(6), A(7), Y(8). Exactly 8 glyphs.

(3) SUBTITLE "WIN A FORD F-150 XLT" in cream / off-white chunky display lettering, smaller than the headline. Spell exactly: W-I-N space A space F-O-R-D space F-hyphen-1-5-0 space X-L-T.

RIGHT 50% — featured character LEMON CHERRY FIZZ as the visual hero filling the right half, framed mid-thigh up:

LEMON CHERRY FIZZ — smart, quietly beautiful nerd girl. Bright sunny YELLOW spherical lemon head, lemon-yellow ears with glossy bright RED CHERRY EARRINGS dangling from them, a NEAT shoulder-length BOB of bright-green lemon LEAVES styled as her hair framing her face. Tortoiseshell round GLASSES on her face. A small cherry-red ribbon at the crown. Plain pastel-yellow button-up shirt under a plain solid cherry-red knit vest. Holds a closed BOOK tucked under one arm against her hip. The other hand raised to gently adjust the bridge of her glasses with index finger. Soft knowing smirk. Smart-bookish-cute energy. Stays inside the gold border.

BACKGROUND — WARM STUDY / LIBRARY palette — soft pale-yellow gradient background with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh, gentle sparkle dust. Cozy academic-warmth atmosphere.

STYLE — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. NOT photoreal, NOT flat 2D.

NEGATIVE — solo character only, NO others. NO truck. Do NOT misspell "GIVEAWAY" — final letter is Y not W, 8 letters total. Do NOT garble the Muha Members logo — 7 letters Members + ®, one M total, lowercase e immediately after the ornate M. Do NOT let hero content cross past the gold border. Anatomy: exactly 2 arms + 2 hands per character.`;

const SIZE = "2048x1024";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");
form.append("image[]", new Blob([fs.readFileSync(TEMPLATE_REF)], { type: "image/png" }), "template-A-v14.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(M_MONO_REF)], { type: "image/png" }), "mm-gold-monogram.png");
form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, CHAR_FILE))], { type: "image/png" }), CHAR_FILE);

console.log("Re-rolling Lemon Cherry Fizz raffle card (GIVEAWAY spelling fix)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Approved Raffle Cards";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-raffle-char-lemon-fix2.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
