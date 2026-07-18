#!/usr/bin/env node
// Per-character raffle card — ALOHA PASSION RUSH (solo, tropical sunset palette)
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
const CHAR_FILE = "Aloha Passion Rush.png";

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — ALOHA PASSION RUSH solo card.

This is one in a 10-card series of per-character raffle cards. All 10 cards share an identical locked border + outer card body + Muha Members logo + "GIVEAWAY" hero typography. Only the FEATURED CHARACTER and the BACKGROUND PALETTE change between cards.

TEMPLATE LOCK — reference image 1 (the master template) shows the LOCKED border + outer card body + hero typography from the approved Variation A. MATCH EXACTLY:
- Ornate gold ticket border at the inner sticker boundary — Art-Deco corner flourishes only in the 4 corners, double gold rule running parallel along all 4 edges, gold bead detail. NO starbursts at edge midpoints — edges stay clean with just the double rule + bead.
- Outer card body (the ring outside the gold border, between the border and the canvas edge) — deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern. Symmetric on all 4 sides.
- Border is the TOPMOST layer — all hero content (character + text) lives INSIDE the border, never crossing past it.
- Centered layout: the inner sticker area (~1866x762 px) is PERFECTLY CENTERED in the 2048x1024 canvas. Top margin = bottom margin (~131 px). Left = right (~91 px).

CANVAS — 2048 x 1024 pixels = full 90mm x 43mm raffle card. Inner peel-off sticker area = 82mm x 32mm ≈ 1866 x 762 px centered.

INSIDE THE INNER STICKER AREA (all hero content lives here, ~30-40px safe-zone inset):

FEATURED CHARACTER — ALOHA PASSION RUSH only. Solo card, NO other characters, NO truck, NO vehicle.

Aloha is the seductive tropical heartbreaker — Pixar 3D young-adult woman (mid-20s) with:
- A large glossy purple-yellow PASSIONFRUIT HEAD (the entire head is the fruit), face features painted cartoon-style on the passionfruit surface
- A CROWN of vibrant pink/red HIBISCUS FLOWERS sitting on top of her head like a tropical headpiece
- Skin tone matching the passionfruit (purple-yellow gradient, NOT human flesh)
- Sultry confident smolder expression, half-lidded eyes, glossy smile
- Wearing a plain tropical-floral cropped Hawaiian-style top (warm coral / red / yellow palette, but render it as plain solid colors with no readable graphics)
- A small hibiscus lei or single flower accent around her neck or in her hand
- Pose: confident heartbreaker — one hand on her hip, the other lightly touching the hibiscus crown or trailing through her hair. Body slightly turned, weight on one leg, smoldering glance back over her shoulder
- Bombshell-confident energy, NOT shy

FRAMING — the character is the visual hero of the card. Position her on the RIGHT side of the inner sticker zone, framed roughly MID-THIGH UP (full upper body + head + most of the legs visible, cropped just above the knees). She fills the right half of the card. Her head + shoulders + arms + torso are all clearly visible inside the border.

HERO TYPOGRAPHY (left side of the card, taking up the LEFT half of the inner sticker zone):

LOGO at the top — render the Muha Members logo (reference 2: the blue scallop-badge with checkmark on the left, then the gold wordmark "Members"® on the right). The gold wordmark spells exactly SEVEN letters: M, e, m, b, e, r, s — the first letter is an ornate baroque gold capital M (the elaborate scrollwork letterform from reference 2/3), and the next six are lowercase gold sans-serif (e, m, b, e, r, s) followed by a small ®. ONE M total, no extra m or floating ornament between the capital M and the lowercase "e". The logo is the top portion of the hero lockup.

Beneath the logo with clear vertical breathing room, render the word "GIVEAWAY" alone in chunky 3D vintage-Vegas display lettering — golden-yellow fill with subtle 3D bevel, thick deep magenta-purple drop shadow, slight cream outline. Spell: G-I-V-E-A-W-A-Y.

Beneath "GIVEAWAY", a subtitle line reading exactly "WIN A FORD F-150 XLT" in cream / off-white chunky display lettering, smaller than the hero text but bold and readable. Spell: F-150 with hyphen, XLT three letters.

LAYOUT — split the inner sticker zone vertically into:
- LEFT 50%: Muha Members logo on top, then "GIVEAWAY" headline, then "WIN A FORD F-150 XLT" subtitle, stacked vertically and centered within the left half.
- RIGHT 50%: Aloha Passion Rush as the featured character, mid-thigh up, the visual hero of the card.

BACKGROUND inside the inner area (Aloha-specific palette, TROPICAL SUNSET) — vibrant Hawaiian sunset gradient: warm CORAL ORANGE blending into hot PINK and rich GOLDEN YELLOW, soft palm tree silhouettes blurred in the deep background, atmospheric haze, floating gold sparkles, tropical bokeh. NO Miami neon, NO Vegas strip — this card uses Aloha's tropical sunset vibe. Warm cinematic golden-hour key light.

STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style matching the locked design of Aloha's reference character. NOT photoreal, NOT flat 2D. Cinematic hero-poster lighting.

NEGATIVE — do NOT add any other characters (no Blueberry, no Pomegranate, no other cast members — solo Aloha only). Do NOT add the F-150 truck or any vehicle. Do NOT use Christmas red. Do NOT misspell anything (MUHA, GIVEAWAY, FORD F-150 XLT). Do NOT duplicate or garble the Members logo (one M only, lowercase "embers" follows, ® at end). Do NOT let hero content bleed past the gold border. Do NOT add an "ADMIT ONE" stub. Do NOT use the Miami-neon palette — this card is TROPICAL SUNSET (coral / pink / golden).`;

const SIZE = "2048x1024";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// Template (locked A v14) first — establishes border, outer card body, hero typography
const templateBuf = fs.readFileSync(TEMPLATE_REF);
form.append("image[]", new Blob([templateBuf], { type: "image/png" }), "template-A-v14.png");
// Muha Members logo
const logoBuf = fs.readFileSync(LOGO_REF);
form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
// Standalone ornate M
const mMonoBuf = fs.readFileSync(M_MONO_REF);
form.append("image[]", new Blob([mMonoBuf], { type: "image/png" }), "mm-gold-monogram.png");
// Featured character
const charBuf = fs.readFileSync(path.join(CHAR_DIR, CHAR_FILE));
form.append("image[]", new Blob([charBuf], { type: "image/png" }), CHAR_FILE);

console.log(`Generating raffle card: ${CHAR_FILE.replace(".png", "")} (tropical sunset palette)...`);
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

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-raffle-char-aloha.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
