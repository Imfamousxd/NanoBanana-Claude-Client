#!/usr/bin/env node
// Per-character raffle cards — MUSTANG REVISION (all 10).
// Revisions vs the approved per-character set:
//   1) Every character now HOLDS UP a Ford Mustang smart-key fob (ref: mustang key.jpg).
//   2) Hero text: Muha Members logo -> "GIVEAWAY" in BLUE (was gold 3D) -> subtitle "WIN A FORD MUSTANG" (was F-150 XLT).
// Each card is anchored on its OWN approved v1 card so border + character + palette stay locked;
// only the held key + the two text changes differ.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "2048x1024";

const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const M_MONO_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";
const KEY_REF = "AI Fruit VIdeos Muha/refs/mustang key.jpg";
const TECHLINE_REF = "AI Fruit VIdeos Muha/refs/tech-line-border.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const APPROVED_DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Approved Raffle Cards";
// Anchor-source dirs in priority order (newest treatment first).
const ANCHOR_DIRS = [
  "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang v3 fullbleed",
  "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang v2",
  "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang",
];

// Master text/logo lockup — the single source of truth so every card's text matches exactly.
const CANON_TEXT_REF = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang v3 fullbleed/2026-06-08T21-22-36_muha-raffle-mustang-v3-diesel.png";

// Anchor each card on the closest existing render of that character (for likeness + palette + layout).
// Prefer the most recent Mustang treatment; fall back to the approved v1 card.
// Per-character `charRef` (a fresh portrait) overrides the anchor for brand-new character art.
function findAnchor(c) {
  if (c.charRef) return c.charRef;
  for (const dir of ANCHOR_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const hit = fs.readdirSync(dir).filter((f) => f.endsWith(`-${c.slug}.png`)).sort().pop();
    if (hit) return path.join(dir, hit);
  }
  return path.join(APPROVED_DIR, c.approved);
}

const CHARS = [
  {
    slug: "aloha", file: "Aloha Passion Rush.png",
    approved: "2026-05-31T04-04-57_muha-raffle-char-aloha.png",
    desc: "ALOHA PASSION RUSH — seductive tropical heartbreaker, Pixar 3D young-adult woman. Large glossy purple-yellow PASSIONFRUIT head with cartoon features painted on, a crown of vibrant pink/red HIBISCUS flowers on top, sultry half-lidded smolder. Plain tropical-floral cropped Hawaiian-style top (solid coral/red/yellow, no readable graphics). POSE: one hand on her hip, the OTHER HAND raised holding up the Ford Mustang smart key, body slightly turned, weight on one leg, smoldering glance.",
    palette: "TROPICAL SUNSET palette — vibrant Hawaiian sunset gradient of warm CORAL ORANGE into hot PINK and rich GOLDEN YELLOW, soft palm-tree silhouettes blurred in the deep background, atmospheric haze, floating gold sparkles. Warm golden-hour key light.",
  },
  {
    slug: "blueberry", file: "Arctic Blueberry.png",
    approved: "2026-05-31T04-12-13_muha-raffle-char-blueberry.png",
    newChar: true,
    charRef: "AI Fruit VIdeos Muha/Generated Characters/Arctic Blueberry.png",
    desc: "ARCTIC BLUEBERRY — cool iced-out flex guy (new design, match reference 1 exactly). A big round deep blue-purple BLUEBERRY head with a snow-dusted little crown and the small star-shaped calyx at the very top, blueberry blue-purple skin, smug half-lidded eyes and a sly confident smirk. Outfit: a clean light baby-blue HOODIE, ripped light-wash JEANS, an ICED-OUT diamond CUBAN-LINK CHAIN around his neck and a diamond-encrusted luxury WATCH on his wrist (lots of sparkle). POSE: one hand tucked in his hoodie pocket, the OTHER HAND raised holding up the Ford Mustang smart key near his shoulder, showing it off with a cool confident flex. EXACTLY 2 arms / 2 hands.",
    palette: "FROZEN ARCTIC palette filling the whole frame — icy frosted-blue gradient, gentle falling SNOW, cold frosty fog, soft cold light rays, a faint blurred frozen-forest / ice-crystal texture, sparkles of frost. Cold premium icy mood.",
  },
  {
    slug: "slushie", file: "Blue Slushie.png",
    approved: "2026-05-31T04-14-22_muha-raffle-char-slushie.png",
    newChar: true,
    charRef: "AI Fruit VIdeos Muha/Generated Characters/Blue Slushie.png",
    desc: "BLUE SLUSHIE — playful e-girl gamer (new design, match reference 1 exactly). Icy pale-blue skin with a frosty sugar-crystal sheen and tiny pink HEART blush marks on her cheeks, big bright-blue anime eyes, cotton-candy PINK hair in two high space-buns with long wavy strands (pink fading toward blue), wearing white CAT-EAR GAMING HEADPHONES with glowing cyan/pink cat-ear accents and little frost drips. Outfit: a pink-and-blue color-split cropped tank top, a pleated pink-and-blue mini skirt, and pink-and-blue striped arm-warmer sleeves; frosty icy texture across her skin. Bubbly confident e-girl energy, bright open smile. POSE: one hand on her hip, the OTHER HAND raised holding up the Ford Mustang smart key. EXACTLY 2 arms / 2 hands.",
    palette: "NEON GAMER e-girl palette filling the whole frame — a soft blurred gamer-bedroom glow with electric-blue and hot-pink NEON LED light strips, floating translucent ICE CUBES and sugar-crystal sparkle, frosty pink-and-blue haze. Playful candy-neon atmosphere kept soft/blurred so the character and text read clearly.",
  },
  {
    slug: "cookies", file: "Frosted Mint Cookies.png",
    approved: "2026-05-31T04-16-47_muha-raffle-char-cookies.png",
    desc: "FROSTED MINT COOKIES — shy bashful adult woman. Round cookie-textured head (warm cookie-brown with darker chocolate-chip flecks), soft mint-green frosting drizzle on top, bashful blushing quiet smile. Adult, not childish. POSE: holding the Ford Mustang smart key shyly with both hands close to her chest, slight head tilt, demure introvert energy.",
    palette: "WARM COZY BAKERY palette — soft CREAM gradient background with warm cookie-brown undertones, gentle mint-green sparkle accents, golden-honey glow, soft hazy bokeh of floating sugar dust. Comfortable hot-cocoa-shop atmosphere.",
  },
  {
    slug: "pomegranate", file: "Frozen Pomegranate.png",
    approved: "2026-05-31T04-18-53_muha-raffle-char-pomegranate.png",
    desc: "FROZEN POMEGRANATE — hyper-buff bodybuilder gym-bro alpha-villain. Spherical deep crimson pomegranate head with the leathery crown/calyx at the top, pomegranate-red skin head to fingertips, faint icy frost sheen, scowling intimidating glare. Plain solid red sleeveless muscle tank over a MASSIVE muscular chest and arms. Tallest, most-muscular build. POSE: one huge arm flexed, the OTHER HAND holding up the Ford Mustang smart key pinched between thick fingers, alpha-bully stance. EXACTLY 2 arms / 2 hands.",
    palette: "FROZEN CRIMSON palette — deep DARK RED gradient background, icy frost-white crystals scattered in the air, cold dark-red cinematic shadows, faint pomegranate-seed sparkle bokeh, cool side-lighting. Dramatic and intimidating.",
  },
  {
    slug: "diesel", file: "Galactic Diesel.png",
    approved: "2026-05-31T20-27-36_muha-raffle-char-diesel-logofix.png",
    desc: "GALACTIC DIESEL — badass cosmic rebel / space outlaw. Cosmic-purple spherical planet head with swirling violet/magenta nebula patterns and a thin Saturn-style golden-orange ring orbiting it, glowing electric-green eyes, cocky smirk. Plain black leather moto jacket over a plain dark cosmic-purple tee. POSE: one hand resting on his belt, the OTHER HAND holding up the Ford Mustang smart key with a small glowing cosmic spark glinting off the chrome pony emblem.",
    palette: "DEEP SPACE COSMIC palette — deep MIDNIGHT NAVY-PURPLE gradient with cosmic-magenta and electric-teal nebula glow, scattered glowing GOLD STARS, floating cosmic-dust particles, faint blurred planet silhouette. Cinematic deep-space mood.",
  },
  {
    slug: "mango", file: "Guava Mango.png",
    approved: "2026-05-31T20-29-41_muha-raffle-char-mango-logofix.png",
    desc: "GUAVA MANGO — funny class-clown laughing guy. Head split vertically half mango-yellow / half guava-green, leafy mango hair on top. Caught mid-belly-laugh — head tilted back, eyes scrunched into happy crescents, wide-open cackle. Plain solid yellow tee + open plain solid coral-pink button-up. Moderate athletic build. POSE: one hand on his belly mid-laugh, the OTHER HAND thrown up holding the Ford Mustang smart key in celebration. EXACTLY 2 arms / 2 hands total, no extras.",
    palette: "TROPICAL SUNNY palette — warm GOLDEN YELLOW gradient blending into MANGO ORANGE and soft GUAVA-PINK, soft palm-frond silhouettes blurred in the deep background, floating warm bokeh sparkles. Bright sunny golden-hour key light. Joyful atmosphere.",
  },
  {
    slug: "horchata", file: "Horchata.png",
    approved: "2026-05-31T04-25-24_muha-raffle-char-horchata.png",
    desc: "HORCHATA — passionate flamenco dancer / Latin drama queen. Creamy-cinnamon-swirl spherical head, cinnamon-stick curl hair past her shoulders, a small red rose behind one ear, smoldering smolder. Plain solid deep-red flamenco dress (ruffled silhouette ok, no surface graphics). POSE: mid-flamenco — one arm raised gracefully overhead holding the Ford Mustang smart key aloft like a prize, the other arm curved across her front, head turned sharply in a dramatic side-glance.",
    palette: "WARM SEVILLA SUNSET palette — rich TERRACOTTA-CINNAMON-BROWN gradient, warm CREAM and golden-honey highlights, deep amber shadow, faint blurred ornate Spanish-tile silhouette in the deep background, atmospheric dust in the warm light. Dramatic golden-hour Sevilla courtyard mood.",
  },
  {
    slug: "lemon", file: "Lemon Cherry Fizz.png",
    approved: "2026-05-31T20-39-45_muha-raffle-char-lemon-fix2.png",
    desc: "LEMON CHERRY FIZZ — smart, quietly beautiful nerd girl. Bright sunny YELLOW spherical lemon head, lemon-yellow ears with glossy bright RED CHERRY EARRINGS, a neat shoulder-length BOB of bright-green lemon LEAVES as her hair, tortoiseshell round GLASSES, a small cherry-red ribbon at the crown, soft knowing smirk. Plain pastel-yellow button-up under a plain solid cherry-red knit vest. POSE: a closed BOOK tucked under one arm against her hip, the OTHER HAND raised holding up the Ford Mustang smart key. Glasses stay on (no longer adjusting them).",
    palette: "WARM STUDY / LIBRARY palette — soft pale-yellow gradient with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh, gentle sparkle dust. Cozy academic warmth.",
  },
  {
    slug: "watermelon", file: "Watermelon Bubblegum.png",
    approved: "2026-05-31T04-29-35_muha-raffle-char-watermelon.png",
    desc: "WATERMELON BUBBLEGUM — playful openly-gay skater guy. WHOLE WATERMELON head — bright juicy GREEN rind with darker green wavy stripes, a glossy PINK BUBBLEGUM quiff styled on top as his 'hair' pulled back into a confident pomp. Mid-bubblegum-blow — a fist-sized translucent glossy PINK bubblegum bubble from his mouth. Plain solid green watermelon-rind MA-1 BOMBER JACKET open over a plain solid pink crewneck, plain dark charcoal cargo pants. POSE: one hand holding up the Ford Mustang smart key, the other casually tucked in his pocket. Confident playful skater stance.",
    palette: "DREAMY BUBBLEGUM-WORLD palette — pink-to-green PASTEL GRADIENT background (soft watermelon-pink into soft watermelon-green), multiple FLOATING PINK BUBBLEGUM BUBBLES of varying sizes drifting at different depths with bokeh blur, a couple of stylized green watermelon-vine leaves curling in from the frame edges, warm sunny golden-hour glow. Whimsical candy-world atmosphere.",
  },
];

const KEY_PROP = `THE FORD MUSTANG KEY (reference image 4) — a matte-BLACK rectangular smart car-key fob with rounded edges, a polished CHROME-SILVER side trim strip, a small metal KEYRING LOOP at one end, and a shiny CHROME running-horse MUSTANG PONY emblem (a galloping horse silhouette) on its face. Render it clearly and at a readable size held in the character's hand, hero-lit so the chrome pony emblem catches the light. It is a KEY FOB, not a whole car. The hand holding it has a NATURAL grip — exactly the normal number of fingers, no extra hands or fingers.`;

const HERO_LOCKUP = `HERO TYPOGRAPHY LAYOUT — split the inner sticker zone into LEFT 50% (typography stack) and RIGHT 50% (character).

LEFT 50% — typography stack centered within the left half, top to bottom:
1. The Muha Members logo (reference 2 + reference 3): a blue scallop-edged badge with a thin black checkmark on its left, then the gold wordmark "Members"® on the right. The wordmark contains EXACTLY 7 letters: a capital M (the ornate baroque gold capital letterform with scrollwork from the references) followed immediately by lowercase e, m, b, e, r, s in clean gold sans-serif, ending with a small ®. ONE M total in the wordmark. NO extra m or floating ornament between the capital M and the lowercase "e".
2. Below the logo, with clear vertical breathing space, the word "GIVEAWAY" in chunky 3D display lettering rendered in a BRIGHT, LUMINOUS ELECTRIC AZURE BLUE — a vivid glowing cyan-leaning blue, clearly LIGHTER and BRIGHTER than navy (think bright sky-blue / electric neon blue, not dark royal), with a glossy 3D bevel, a bright inner highlight, a thin white outline, and only a soft subtle shadow (NO heavy dark-navy shadow that dulls the color). Spell exactly G-I-V-E-A-W-A-Y. (This word is BRIGHT BLUE, not gold, not dark.)
3. Below "GIVEAWAY", subtitle "WIN A FORD MUSTANG" in PURE WHITE chunky display lettering (clean bright white, only a soft shadow for legibility), smaller than the hero word. Spell exactly: F-O-R-D  M-U-S-T-A-N-G.

RIGHT 50% — the featured character is the visual hero filling the right half of the card, framed roughly MID-THIGH UP (head + full upper body + most of the legs, cropped just above the knees), holding up the Ford Mustang key. The character runs all the way to the bottom and right edges of the card (no margin), only the readable text is kept a small safe distance from the edges.`;

const ANCHOR_LOCK = `REFERENCE IMAGE 1 is an earlier raffle card of THIS character. COPY from it ONLY: the character's exact likeness, the left-typography / right-character layout, and the background palette/scene. The text reads exactly: "GIVEAWAY" in BRIGHT LUMINOUS ELECTRIC BLUE and the subtitle "WIN A FORD MUSTANG" in PURE WHITE, and the character HOLDS UP the Ford Mustang key fob from reference 4.

CRITICAL — DO NOT copy reference 1's FRAME or MARGINS:
(a) REMOVE every border/frame — no gold tech-line/circuit border, no ornate gold Art-Deco filigree, scrollwork, corner flourish, rule, or bead. ZERO border of any kind.
(b) REMOVE the dark outer margin / ring / empty space around the artwork. There is NO surrounding frame zone.
(c) The artwork is FULL BLEED: the background scene and the character extend all the way to all four edges of the 2048x1024 canvas, edge to edge, with nothing around them.`;

const TEXT_LOCK = `TEXT & LOGO CONSISTENCY — REFERENCE IMAGE 5 is the MASTER TEXT LOCKUP, the single source of truth for ALL text on this card. Reproduce the Muha Members logo, the word "GIVEAWAY", and the subtitle "WIN A FORD MUSTANG" to MATCH REFERENCE 5 EXACTLY and IDENTICALLY: same letterforms/font, same bright electric-blue GIVEAWAY fill, same bevel/gloss, same drop shadow, same glow, same outline, same PURE WHITE subtitle, same relative sizes, and same left-side stacked position. Every card in this series shares this one identical lockup — do NOT restyle, recolor, re-shadow, or re-glow the text differently between cards. IGNORE any text styling in reference 1; reference 5 is authoritative for all text and the logo.`;

const PORTRAIT_LOCK = `REFERENCE IMAGE 1 is the official CHARACTER PORTRAIT of THIS character (the new design). Use it for the character's EXACT likeness ONLY — same head, face, hair, headwear/accessories, outfit, and color palette. Do NOT copy the portrait's vertical poster framing, its background scene, or any title / flavor-name text printed inside it. INSTEAD build the horizontal FULL-BLEED raffle-card layout described below: Muha Members logo + bright-blue GIVEAWAY + white WIN A FORD MUSTANG stacked on the LEFT, and the character as the hero on the RIGHT holding up the Mustang key. The card is FULL BLEED with NO border and NO margin.`;

const FULLBLEED = `FULL-BLEED COMPOSITION — the card is borderless and frameless. The character-specific background fills the ENTIRE 2048x1024 canvas corner to corner with no margin, no dark ring, and no frame. The peel/sticker artwork IS the full card — there is no gap or empty space between the artwork and the card's outer dimensions. Do NOT draw any rectangle, outline, frame, ticket border, or decorative edge. Keep the text within a small (~40px) safe area from the edges so nothing important is clipped, but the background and character art bleed fully off all four edges.`;

const STYLE_LOCK = `STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style. NOT photoreal, NOT flat 2D. Cinematic hero-poster lighting.

NEGATIVE — solo character only, NO other characters, NO whole car or truck (the Mustang appears ONLY as the small key fob). Do NOT misspell anything (GIVEAWAY, FORD MUSTANG). Do NOT garble the Muha Members logo (one M only, lowercase "embers" follows, ® at end). NO border or frame of ANY kind — no gold tech-line/circuit border, no ornate gold filigree/scrollwork, no rectangle outline; and NO dark margin / ring / empty space around the art (it is FULL BLEED to all four edges). Do NOT keep a gold or dark GIVEAWAY (must be BRIGHT blue); do NOT keep a cream subtitle (must be WHITE); do NOT keep the old "F-150 XLT" wording. Do NOT add an "ADMIT ONE" stub, phone numbers, dates, URLs, barcodes, or background flavor-name signs/neon. Anatomy: exactly 2 arms + 2 hands + 10 fingers — no extra hands/fingers from holding the key.`;

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang v4 consistent";
fs.mkdirSync(outDir, { recursive: true });

const logoBuf = fs.readFileSync(LOGO_REF);
const mMonoBuf = fs.readFileSync(M_MONO_REF);
const keyBuf = fs.readFileSync(KEY_REF);
const canonTextBuf = fs.readFileSync(CANON_TEXT_REF);

// Optional CLI slug filter: `node muha-raffle-chars-mustang.mjs blueberry slushie cookies`
const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const queue = wanted.length ? CHARS.filter((c) => wanted.includes(c.slug)) : CHARS;

async function genCard(c) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Mustang raffle card: ${c.slug}...`);

  const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — ${c.slug.toUpperCase()} solo card (FORD MUSTANG revision).

This is one in a 10-card series of per-character raffle cards. All 10 share an identical FULL-BLEED (borderless) layout + Muha Members logo + hero typography. Only the FEATURED CHARACTER and BACKGROUND PALETTE change between cards.

${c.newChar ? PORTRAIT_LOCK : ANCHOR_LOCK}

${FULLBLEED}

CANVAS — 2048 x 1024 px = full 90mm x 43mm raffle card, FULL BLEED. The artwork fills the entire canvas to all four edges with NO border and NO surrounding margin.

FEATURED CHARACTER (solo, no other characters): ${c.desc}

${KEY_PROP}

${HERO_LOCKUP}

${TEXT_LOCK}

BACKGROUND inside the inner area (character-specific): ${c.palette}

${STYLE_LOCK}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  // ref 1: anchor card (character likeness + palette + layout)
  form.append("image[]", new Blob([fs.readFileSync(findAnchor(c))], { type: "image/png" }), "anchor.png");
  // ref 2: Muha Members logo
  form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
  // ref 3: ornate gold M
  form.append("image[]", new Blob([mMonoBuf], { type: "image/png" }), "mm-gold-monogram.png");
  // ref 4: Ford Mustang key fob
  form.append("image[]", new Blob([keyBuf], { type: "image/jpeg" }), "mustang-key.jpg");
  // ref 5: master text/logo lockup (authoritative for all text)
  form.append("image[]", new Blob([canonTextBuf], { type: "image/png" }), "master-text-lockup.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 400)}`);
    return null;
  }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${c.slug})`); return null; }
  const outPath = `${outDir}/${stamp}_muha-raffle-mustang-v4-${c.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  return outPath;
}

// Generate the selected cards concurrently (the batch is sized by the caller — 3 at a time).
const results = (await Promise.all(queue.map((c) => genCard(c).catch((e) => { console.error(`${c.slug}: ${e.message}`); return null; })))).filter(Boolean);

console.log(`\nDone — ${results.length}/${queue.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
