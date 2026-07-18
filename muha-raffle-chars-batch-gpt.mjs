#!/usr/bin/env node
// Per-character raffle cards — batch of remaining 9 (Aloha already done)
// Same locked border + Muha Members logo + GIVEAWAY hero. Palette varies per character.
// One-at-a-time sequential generation.
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
    file: "Arctic Blueberry.png",
    slug: "blueberry",
    desc: "ARCTIC BLUEBERRY — chad smooth-talker. Spherical deep purple-blue blueberry head with a small fluffy snow tuft at the crown, blueberry-blue skin head to fingertips. Unbuttoned plain solid blue button-up shirt over a plain solid blue tee. Half-smile + raised brow smooth-operator expression, one hand casually in pants pocket, the other doing a relaxed finger-gun gesture. Chad / gym-built broad-shouldered build. Pose: confident lean, weight on one leg, head tilted slightly with a chin-up swagger.",
    palette: "COLD ARCTIC palette — deep MIDNIGHT BLUE gradient background, frosty CYAN-WHITE highlights, soft icy lavender mid-tones, glittering snowflake bokeh drifting in the air, faint icicle silhouettes blurred in the deep background. Cold cinematic key light, blue-tinted atmosphere.",
  },
  {
    file: "Blue Slushie.png",
    slug: "slushie",
    desc: "BLUE SLUSHIE — brain-freeze drama queen. Spherical icy-blue slushie-themed head with frosted-blue cotton-candy / pastel-pink slushie 'hair' frizzing out, drinking-straw or cup-rim detail. Hands clutching the sides of her head mid-brain-freeze gasp, eyes wide, mouth open in dramatic 'AAA' overwhelm. Pose: theatrical over-reactor caught mid-meltdown.",
    palette: "BRIGHT CANDY-BLUE palette — vibrant electric-blue gradient background, hot magenta-pink accents, frosty white ice-cube bokeh floating in the air, sugar-crystal sparkle haze, frosted neon glow. Cool playful cartoon atmosphere.",
  },
  {
    file: "Frosted Mint Cookies.png",
    slug: "cookies",
    desc: "FROSTED MINT COOKIES — shy bashful adult woman. Round cookie-textured head (warm cookie-brown with darker chocolate-chip flecks), soft mint-green frosting drizzle on top of head, bashful blushing expression with a quiet sweet smile. Pose: gentle and reserved — hands clasped softly in front of her, slight head tilt, demure introvert energy. Adult, not childish.",
    palette: "WARM COZY BAKERY palette — soft CREAM gradient background with warm cookie-brown undertones, gentle mint-green sparkle accents, golden-honey glow, soft hazy bokeh of floating sugar dust / soft sparkles. Comfortable hot-cocoa-shop atmosphere.",
  },
  {
    file: "Frozen Pomegranate.png",
    slug: "pomegranate",
    desc: "FROZEN POMEGRANATE — hyper-buff bodybuilder gym-bro alpha-villain. Spherical deep crimson pomegranate head with the classic leathery pomegranate crown / calyx at the top, pomegranate-red skin head to fingertips, faint icy frost sheen on his brow ridges. Plain solid red sleeveless muscle tank stretched tight over his MASSIVE muscular chest and arms. Arms crossed across his chest, intimidating glare, scowling mean expression. Tallest most-muscular build. Pose: pure intimidation, alpha-bully stance.",
    palette: "FROZEN CRIMSON palette — deep DARK RED gradient background, icy frost-white frost crystals scattered in the air, cold dark-red cinematic shadows, faint pomegranate-seed sparkle bokeh, gym-locker-room cool side-lighting. Dramatic and intimidating.",
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
  {
    file: "Horchata.png",
    slug: "horchata",
    desc: "HORCHATA — passionate flamenco dancer / Latin drama queen. Creamy-cinnamon-swirl spherical head, cinnamon-stick curl hair flowing past her shoulders, a small red rose tucked behind one ear. Plain solid deep-red flamenco dress (ruffled silhouette is fine but no surface graphics). Mid-flamenco pose — one arm raised in a graceful arc above her head, the other curved across her front, head turned sharply to one side in dramatic side-glance. Smoldering Latin-drama smolder expression.",
    palette: "WARM SEVILLA SUNSET palette — rich TERRACOTTA-CINNAMON-BROWN gradient background, warm CREAM and golden-honey highlights, deep amber shadow, faint ornate Spanish-tile silhouette in the deep background blurred, atmospheric dust particles in the warm light. Dramatic golden-hour Sevilla courtyard mood.",
  },
  {
    file: "Lemon Cherry Fizz.png",
    slug: "lemon",
    desc: "LEMON CHERRY FIZZ — smart, quietly beautiful nerd girl. Bright sunny YELLOW spherical lemon head, lemon-yellow ears with glossy bright RED CHERRY EARRINGS dangling from them, a NEAT shoulder-length BOB of bright-green lemon LEAVES styled as her hair framing her face. Tortoiseshell round GLASSES on her face. A small cherry-red ribbon or hair-tie at the crown. Plain pastel-yellow button-up shirt under a plain solid cherry-red knit vest. Holds a closed BOOK tucked under one arm against her hip. The other hand raised to gently adjust the bridge of her glasses with index finger. Soft knowing smirk. Smart-bookish-cute energy.",
    palette: "WARM STUDY / LIBRARY palette — soft pale-yellow gradient background with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh, gentle sparkle dust. Cozy academic-warmth atmosphere.",
  },
  {
    file: "Watermelon Bubblegum.png",
    slug: "watermelon",
    desc: "WATERMELON BUBBLEGUM — playful openly-gay skater guy. WHOLE WATERMELON head — bright juicy GREEN rind with darker green wavy stripes wrapping the whole head, a glossy PINK BUBBLEGUM quiff styled on top of his head as his 'hair' (pink-gum hairstyle pulled back into a confident pomp). Mid-bubblegum-blow — a fist-sized translucent glossy PINK bubblegum bubble being blown out from his mouth. Plain solid green watermelon-rind MA-1 BOMBER JACKET layered open over a plain solid pink crewneck sweater. Plain dark charcoal cargo pants. Peace-sign / two-fingers-up gesture with one hand, the other casually tucked in pocket. Confident playful skater stance.",
    palette: "DREAMY BUBBLEGUM-WORLD palette — pink-to-green PASTEL GRADIENT background (soft watermelon-pink fading into soft watermelon-green), multiple FLOATING PINK BUBBLEGUM BUBBLES of varying sizes drifting through the air at different depths with bokeh blur, a couple of stylized green watermelon-vine leaves curling in from the frame edges, warm sunny golden-hour glow. Whimsical playful candy-world atmosphere.",
  },
];

const HERO_LOCKUP = `HERO TYPOGRAPHY LAYOUT — split the inner sticker zone into LEFT 50% (typography stack) and RIGHT 50% (character).

LEFT 50% — typography stack centered within the left half, top to bottom:
1. The Muha Members logo (reference 2 + reference 3): a blue scallop-edged badge with a thin black checkmark on its left, then the gold wordmark "Members"® on the right. The wordmark contains EXACTLY 7 letters total: capital M (rendered as the ornate baroque gold capital letterform with elaborate scrollwork from the references), followed immediately by lowercase letters e, m, b, e, r, s in clean gold sans-serif, ending with a small ®. ONE M total in the wordmark. NO extra m or floating ornament between the capital M and the lowercase "e".
2. Below the logo, with clear vertical breathing space (logo and headline do NOT touch), the word "GIVEAWAY" in chunky 3D vintage-Vegas display lettering — golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline. Spell exactly G-I-V-E-A-W-A-Y.
3. Below "GIVEAWAY", subtitle "WIN A FORD F-150 XLT" in cream / off-white chunky display lettering, smaller than the hero. Spell exactly: F-150 with hyphen, XLT three uppercase letters.

RIGHT 50% — the featured character is the visual hero filling the right half of the card, framed roughly MID-THIGH UP (head + full upper body + most of legs visible, cropped just above the knees). The character stays inside the gold border.`;

const TEMPLATE_LOCK = `TEMPLATE LOCK — reference image 1 is the APPROVED MASTER TEMPLATE. MATCH the border + outer card body + hero typography EXACTLY:
- Ornate gold ticket border at the inner sticker boundary: Art-Deco corner flourishes only in the 4 corners, double gold rule running parallel along all 4 edges, gold bead detail. NO starbursts at the edge midpoints — edges stay clean with just the double rule + bead.
- Outer card body (the ring outside the gold border, between the border and the canvas edge): deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern. Symmetric on all 4 sides.
- Border is the TOPMOST layer — character + text never cross past it.
- Centered layout — inner sticker area perfectly centered in the 2048x1024 canvas, top margin = bottom margin (~131 px), left = right (~91 px).

CANVAS — 2048 x 1024 px = full 90mm x 43mm raffle card. Inner peel-off sticker area = 82mm x 32mm ≈ 1866 x 762 px centered.`;

const STYLE_LOCK = `STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. NOT photoreal, NOT flat 2D. Cinematic hero-poster lighting.

NEGATIVE — solo character only, NO other characters. NO truck or vehicle. Do NOT misspell anything. Do NOT garble the Muha Members logo (one M only, lowercase "embers" follows, ® at end). Do NOT add an "ADMIT ONE" stub. Do NOT let hero content cross past the gold border. Anatomy: exactly 2 arms + 2 hands + 10 fingers per character — no extras.`;

const SIZE = "2048x1024";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character";
fs.mkdirSync(outDir, { recursive: true });

const templateBuf = fs.readFileSync(TEMPLATE_REF);
const logoBuf = fs.readFileSync(LOGO_REF);
const mMonoBuf = fs.readFileSync(M_MONO_REF);

for (const c of CHARS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating raffle card: ${c.file.replace(".png", "")}...`);

  const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — ${c.file.replace(".png", "").toUpperCase()} solo card.

This is one in a 10-card series of per-character raffle cards. All 10 cards share an identical locked border + outer card body + Muha Members logo + "GIVEAWAY" hero typography. Only the FEATURED CHARACTER and the BACKGROUND PALETTE change between cards.

${TEMPLATE_LOCK}

INSIDE THE INNER STICKER AREA (~30-40px safe-zone inset from the gold border):

FEATURED CHARACTER (solo, no truck, no other characters): ${c.desc}

${HERO_LOCKUP}

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
  const outPath = `${outDir}/${stamp}_muha-raffle-char-${c.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
