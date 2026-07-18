#!/usr/bin/env node
// Raffle Ticket — Variation A (Characters only) — v9
// Establishes the LOCKED border + typography + outer card body for the whole set.
// Once A is approved, B, C, D will reuse the exact same border/layout treatment.
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
const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck frront.png";
const TEMPLATE_REF = "AI Fruit VIdeos Muha/Raffle Card Designs/2026-05-31T02-02-35_muha-raffle-A-characters-only-v14.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
// REDUCED hero cast for variation C — 5 characters only (Pomegranate, Blueberry, Aloha, Horchata, Mango)
const CHARACTERS = [
  "Frozen Pomegranate.png",
  "Arctic Blueberry.png",
  "Aloha Passion Rush.png",
  "Horchata.png",
  "Guava Mango.png",
];

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — VARIATION C (TRUCK-HERO, front-three-quarter view).

TEMPLATE LOCK — IMPORTANT: reference image #1 is the APPROVED MASTER TEMPLATE (Variation A) for this 4-card series. STUDY IT CAREFULLY and MATCH EXACTLY:
- The ORNATE GOLD TICKET BORDER — same corner flourishes (Art-Deco filigree only in the 4 corners), same DOUBLE GOLD RULE running parallel along all 4 edges, same gold bead detail along the rule. CRITICAL: NO STARBURST / SUN / STAR / DECORATIVE-ORNAMENT accents at the midpoints of the top, bottom, left, or right edges — the EDGES ARE CLEAN with only the double rule + bead. Only the 4 corners have the decorative filigree.
- The OUTER CARD BODY (the ring outside the border, between the border and canvas edge) — same deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern.
- The HERO LOCKUP — same Muha Members logo (blue-check + gold M monogram + gold cursive "Members") on top, with "GIVEAWAY" in chunky 3D vintage-Vegas gold-and-magenta-shadow type below.
- Same Miami-neon Vegas-strip background palette (deep navy-purple, hot magenta, electric teal, gold sparkles).
- Same border-layer-order: border is the TOPMOST layer, all content INSIDE, no limbs crossing past.
- CENTERED LAYOUT — the inner sticker area (~1866 x 762 px) and the gold border around it are PERFECTLY CENTERED in the 2048 x 1024 canvas. The top margin (canvas-top to border-top) MUST EQUAL the bottom margin (border-bottom to canvas-bottom) — both approximately 131 px. The left margin MUST EQUAL the right margin — both approximately 91 px. The outer card-body ring is symmetric on all 4 sides. Do NOT shift the border up or down — it sits dead-center vertically in the canvas. Verify visually: same gap above the border as below.

The ONLY differences from Variation A:
(1) The black Ford F-150 XLT pickup truck from reference image #3 is the visual HERO — three-quarter FRONT-RIGHT view (front grille + hood + side from a low cool angle), headlights glowing. The truck is the dominant element in the scene, larger than the characters. The truck must be CLEARLY VISIBLE and recognizable as a Ford F-150 XLT, rendered in PIXAR-3D animated style.
(2) FORD OVAL EMBLEM REQUIRED — render the iconic Ford oval badge (blue oval, white cursive "Ford" wordmark inside) centered on the truck's front GRILLE, clean and clearly visible. This is the ONLY real-world brand element allowed.
(3) NO CHARACTERS ON THE TRUCK — do NOT place any character on the hood, roof, bed, or any part of the truck. All 10 characters are posed ON THE GROUND around the truck (standing in front, beside, or slightly behind in dynamic poses).
(4) GALACTIC DIESEL LAYER ORDER — Galactic Diesel is the FURTHEST-BACK character in the composition, partially obscured by other characters in front of him, peeking out from the deepest layer. All other 9 characters are in front of him.
(5) A subtitle "WIN A FORD F-150 XLT" is added in cream beneath "GIVEAWAY".

CANVAS — 2048 x 1024 pixels representing a full 90mm x 43mm physical raffle card.

INNER PEEL-OFF STICKER AREA — 82mm x 32mm ≈ 1866 x 762 pixels, centered in the canvas. Leaves ~91 px L/R margin and ~131 px T/B margin between the inner border and the canvas edges.

LOCKED OUTER CARD BODY (~91 px L/R, ~131 px T/B ring outside the inner border) — deep midnight-navy-purple background with subtle gold ornamental pinstripes / tiny gold dot pattern. Premium, quiet, this is the part of the card surrounding the peel-off sticker.

LOCKED ORNATE TICKET BORDER — sits at the boundary of the inner 1866x762 sticker area. The border treatment:
- A thin GOLD inner rule (1-2 px) outlining the full sticker rectangle
- Ornate ART-DECO GOLD CORNER FLOURISHES in all 4 corners (filigree / scrollwork motif, Vegas-jackpot vibe)
- A second thinner gold rule running slightly inside the main border, creating a double-line frame
- Subtle gold dot-bead detail along the edges between the corner flourishes
- NO STARBURST OR STAR ACCENTS at the midpoints of the edges. The top, bottom, left, and right edges of the border are CLEAN with only the double-rule frame + bead detail — no decorative stars / starbursts / sun-rays interrupting the midpoint of any edge.
The border weight, color, and ornament style must be CRISP and CLEARLY READABLE — this is the visual signature that will repeat on every variation in the set.

INSIDE THE INNER STICKER AREA (all hero content lives here, ~30-40px safe-zone inset):

BORDER LAYER ORDER — IMPORTANT: the GOLD TICKET BORDER is the TOPMOST layer of the design. Every character, the hero text, and all scene elements live UNDERNEATH / INSIDE the border. NO character body part, arm, hand, hair, leaf, or accessory may cross over / extend past / break / overlap the border on top. If a character's pose would naturally extend past the border edge, the border CLIPS them at that edge — the border stays unbroken and the character's silhouette ends cleanly at the border line. The character on the far left (Aloha) and the character on the far right (Watermelon Bubblegum or similar) must keep all their limbs INSIDE the border — no arm, elbow, or hand crossing outside.

CHARACTERS — all 10 Muha fruit-drama characters from the reference images, exactly ONE instance of each. Final character count: TEN (10) total, ten distinct individuals. Roster:
REDUCED HERO CAST — only FIVE (5) characters appear in this variation, ONE instance of each. Total character count: 5. No additional characters, no duplicates, no extras. The five characters are:

1. FROZEN POMEGRANATE — buff red-skinned gym-bro with the spherical deep crimson pomegranate head (small leathery crown / calyx at the top), pomegranate-red skin head to fingertips, plain red sleeveless muscle tank stretched tight over a HUGE muscular chest, arms crossed across his chest. He is the TALLEST and MOST MUSCULAR character in the scene — visibly bigger than everyone else, towering by a clear margin (head-and-shoulders above the next-tallest character). He is the lead supporting hero behind the truck — alpha enforcer.

2. ARCTIC BLUEBERRY — chad smooth-talker. Spherical deep purple-blue blueberry head with a small fluffy snow tuft at the crown, blueberry-blue skin head to fingertips. Unbuttoned plain solid blue button-up shirt over a plain solid blue tee. Half-smile + raised brow, one hand in pocket, the other doing a chill finger-gun. Tall and broad-shouldered (second-tallest, slightly shorter than Pomegranate).

3. ALOHA PASSION RUSH — seductive tropical heartbreaker. Passionfruit head with a hibiscus-flower crown of red/pink tropical blooms. Confident sultry pose. Average adult-female height (clearly shorter than the guys).

4. HORCHATA — passionate flamenco dancer. Creamy cinnamon-swirl spherical head with cinnamon-stick curl hair and a red rose tucked behind one ear. Plain solid red flamenco dress. Mid-flamenco pose — one arm raised in a graceful arc. Average adult-female height.

5. GUAVA MANGO — funny class-clown laughing guy. Head split vertically half mango-yellow / half guava-green, with leafy mango hair on top. Caught mid-belly-laugh — head tilted back, eyes scrunched, wide open mouth. Plain yellow tee + plain coral-pink open button-up. Tall masculine build (similar height to Blueberry). ANATOMY: exactly TWO arms attached at his two shoulders, ending in TWO hands with five fingers each. TOTAL: 2 arms + 2 hands + 10 fingers. NO third arm, NO extra floating hand, NO duplicated limb. If posing mid-laugh, one hand on belly + other hand thrown out — but only TWO hands TOTAL.

ABSOLUTE COUNT: 5 characters total. Zero duplicates. No Blue Slushie, no Cookies, no Diesel, no Lemon Cherry Fizz, no Watermelon Bubblegum in this variation — those 5 are NOT in this scene. Only the five listed above appear.

FRAMING — UPPER-HALF CROP: this variation is composed so that the CHARACTERS are framed from roughly MID-CHEST UP only (head + shoulders + upper torso visible — waist down is CROPPED OFF the bottom edge of the inner sticker zone). This brings the characters in close so they're visibly large and detailed, while the centered truck fits comfortably between them.

The TRUCK in the CENTER is shown fully visible from FRONT BUMPER UP TO THE ROOF in a complete front-three-quarter view — the truck is the dominant centered element, not cropped, but it occupies roughly the middle 40-50% of the inner-sticker width. Around the truck, the characters' upper-body chest-up portraits frame it on both sides.

CHARACTER FRAMING — chest-up portraits:
- LEFT side of truck (2 characters): ALOHA Passion Rush + ARCTIC BLUEBERRY chad — both shown chest-up, their heads at upper-frame level, shoulders and upper torso filling the left side of the inner sticker zone. Their bodies crop off below the chest.
- RIGHT side of truck (3 characters): FROZEN POMEGRANATE buff guy (innermost, closest to truck), HORCHATA flamenco dancer (middle), GUAVA MANGO laughing class-clown (outermost) — all shown chest-up, heads at upper-frame level, upper torsos filling the right side.

VISUAL HIERARCHY (heads-up portraits):
- POMEGRANATE has the BIGGEST head + shoulders in the right cluster — clearly the most massive (buff red pomegranate head + thick neck + massive shoulders visible).
- BLUEBERRY has a similarly broad upper-chest silhouette in the left cluster (chad smooth-talker, square shoulders).
- The girls (Aloha, Horchata) have smaller-framed upper bodies relative to the guys' broader shoulders.
- Even in chest-up framing the size differential reads — guys are visibly broader-shouldered than the girls.

The truck silhouette is fully unobstructed — front bumper, grille (with Ford oval), hood, headlights, windshield, cab roof all visible. The chest-up characters frame it from both sides without blocking it.

TRUCK — IMPORTANT: the BLACK FORD F-150 XLT pickup truck from the truck reference is the centered visual anchor. Three-quarter FRONT-RIGHT view from a low confident angle. Headlights glowing. Rendered in PIXAR-3D animated style.

FORD OVAL EMBLEM — the iconic Ford oval badge (blue oval, white cursive "Ford" wordmark inside) is rendered centered on the truck's front GRILLE, clean and clearly visible. Strip ALL other branding (no dealership text, no plate text). Position the truck and characters so they all stay INSIDE the inner border (border still clips the topmost layer — nothing crosses the gold frame).

HERO TYPOGRAPHY / LOGO LOCKUP — IMPORTANT: do NOT spell out "MUHA MEMBERS" in text. Instead, the top of the two-line hero lockup is the actual MUHA MEMBERS LOGO from reference 1 placed BIG and CENTERED across the top of the hero zone.

LOGO PLACEMENT — render the Muha Members logo at the top of the inner sticker zone exactly as it appears in reference 1.

LOGO WORDMARK LETTER COUNT — the gold wordmark spells one English word: "Members". Letter count: SEVEN letters total, in this exact order: M (uppercase), e (lowercase), m (lowercase), b (lowercase), e (lowercase), r (lowercase), s (lowercase). Then a small ® symbol. So you draw seven letterforms, no more no less.

THE FIRST LETTER (the uppercase M) is drawn as an ELABORATE BAROQUE GOLD CAPITAL M with stylized scrollwork — its silhouette has a decorative crown-like top that LOOKS like two interlocking M peaks, but it is ONE single capital M letter, counted as one of the seven letters in "Members".

THE NEXT SIX LETTERS (e, m, b, e, r, s) are drawn as normal lowercase gold sans-serif letters in a clean wordmark style, all on the same baseline as the capital M, immediately to the right of the capital M with normal letter spacing.

LETTER SEQUENCE — when written out it reads: M (ornate capital) → e → m → b → e → r → s → ® . That is the COMPLETE wordmark. Nothing between the ornate capital M and the lowercase "e" that follows it. Do NOT add an extra lowercase m before "embers". Do NOT add a small floating m ornament near the wordmark. There is ONE M total in the entire wordmark and it is the ornate capital at position 1.

To the LEFT of the wordmark sits a BLUE SCALLOP-EDGED BADGE with a thin checkmark inside it. That's the only other element of the logo.

LOGO PARTS — exactly two: (1) blue scallop badge with checkmark on the left, (2) the seven-letter wordmark "Members" + ® on the right. Nothing else. No floating decorations, no extra letters, no duplicate M ornaments.

Render PIXEL-FAITHFUL TO REFERENCE 1.

Beneath the logo, with CLEAR VERTICAL SPACING (a comfortable gap of empty space between them — the Muha Members logo and the "GIVEAWAY" wordmark do NOT touch or overlap, there is breathing room between them), render the word "GIVEAWAY" alone in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline. Slightly larger than the logo above it. Spell-check: "GIVEAWAY" is exactly G-I-V-E-A-W-A-Y.

So the hero lockup reads visually as: [Muha Members Logo] / GIVEAWAY — logo on top, word "GIVEAWAY" below. NO additional "MUHA MEMBERS" text anywhere — the logo replaces that text.

SUBTITLE — beneath "GIVEAWAY", add a single subtitle line reading exactly "WIN A FORD F-150 XLT" in cream / off-white chunky display lettering, smaller than the hero text but still bold and clearly readable. Same lettering style family as the hero (vintage-Vegas display), centered under "GIVEAWAY". Spell-check: F-150 with hyphen, XLT three letters.

BACKGROUND inside the inner area — Miami-neon Vegas-strip palette: deep midnight navy-purple gradient with hot magenta + electric teal light bursts, floating gold sparkles, atmospheric haze. NO Christmas red, NO holiday crimson.

STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style matching the locked design of the 10 character references. Not photoreal, not flat 2D. Cinematic hero-poster lighting.

NEGATIVE — do NOT use Christmas red as a dominant color. Do NOT include phone numbers, dates, URLs, barcodes. Do NOT misspell MUHA. Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub. Do NOT include dealership signage on the truck (the only Ford branding allowed is the oval emblem on the grille). Do NOT place any character ON the truck (no hood / roof / bed / fender / windshield) — all characters are on the ground around it. Do NOT let hero artwork or the gold border bleed into the outer card body. Do NOT redraw the Muha Members logo — placed as-is from reference. Do NOT let any character's limb cross outside the gold border. ANATOMY: every character has EXACTLY two arms and two hands (5 fingers each). NO third arm, NO floating extra hand, NO duplicated limb on any character — especially Guava Mango (count his hands: must be exactly two).`;

const SIZE = "2048x1024";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// Template (locked A v14) FIRST so the model sees it as the master border reference
const templateBuf = fs.readFileSync(TEMPLATE_REF);
form.append("image[]", new Blob([templateBuf], { type: "image/png" }), "template-A-v14.png");
const logoBuf = fs.readFileSync(LOGO_REF);
form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
const mMonoBuf = fs.readFileSync(M_MONO_REF);
form.append("image[]", new Blob([mMonoBuf], { type: "image/png" }), "mm-gold-monogram.png");
const truckBuf = fs.readFileSync(TRUCK_REF);
form.append("image[]", new Blob([truckBuf], { type: "image/png" }), "truck-front.png");
for (const charFile of CHARACTERS) {
  const p = path.join(CHAR_DIR, charFile);
  const buf = fs.readFileSync(p);
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Raffle C v29 (logo wordmark = 7 letters total spelling Members)...");
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

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-raffle-C-truck-hero-v29.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
