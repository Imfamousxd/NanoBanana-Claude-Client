#!/usr/bin/env node
// Per-character RAFFLE CARD BACKS — NO-QR version. Same as the approved backs (character next to
// the 2026 Ford Mustang + "WIN A 2026 FORD MUSTANG" headline + Muha Members logo) but the entire
// right-side QR / "SCAN TO ENTER" stub, the divider, and the "ENTER HERE" arrow are REMOVED, and
// the scene runs FULL-BLEED across the whole card. Each card references its prior back for
// consistency. CLI slug filter; concurrent.  e.g.  node muha-raffle-backs-noqr.mjs diesel slushie
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
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const CANON_TEXT_REF = process.env.CANON || "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs No-QR v2/2026-06-08T23-38-34_muha-raffle-back-noqr-v2-diesel.png";
const PRIORBACK_DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs No-QR";

const CHARS = [
  { slug: "aloha", file: "Aloha Passion Rush.png",
    look: "ALOHA PASSION RUSH — Pixar-3D tropical heartbreaker woman: glossy purple-yellow PASSIONFRUIT head with cartoon features, a crown of pink/red HIBISCUS flowers, plain coral/red tropical cropped Hawaiian top.",
    palette: "TROPICAL SUNSET — warm coral-orange into hot pink and golden yellow, blurred palm silhouettes, golden-hour glow." },
  { slug: "blueberry", file: "Arctic Blueberry.png",
    look: "ARCTIC BLUEBERRY — Pixar-3D iced-out cool guy: big round deep blue-purple BLUEBERRY head with a snow-dusted cap + small calyx, smug half-lidded eyes, light baby-blue HOODIE, ICED-OUT diamond CUBAN-LINK CHAIN + diamond WATCH, ripped light jeans." },
  { slug: "slushie", file: "Blue Slushie.png",
    look: "BLUE SLUSHIE — Pixar-3D playful e-girl gamer: icy pale-blue skin with frosty sheen and tiny pink heart blush marks, big bright-blue anime eyes, cotton-candy PINK hair in two high space-buns, white CAT-EAR GAMING HEADPHONES with cyan/pink accents, pink-and-blue color-split crop tank + pleated mini skirt + pink/blue striped arm-warmers." },
  { slug: "cookies", file: "Frosted Mint Cookies.png",
    look: "FROSTED MINT COOKIES — Pixar-3D shy adult woman: round cookie-textured head (cookie-brown with chocolate-chip flecks) with mint-green frosting drizzle on top, bashful blush, cozy mint knit sweater.",
    palette: "WARM COZY BAKERY — soft cream with cookie-brown undertones, mint-green sparkle accents, golden-honey glow, soft sugar-dust bokeh." },
  { slug: "pomegranate", file: "Frozen Pomegranate.png",
    look: "FROZEN POMEGRANATE — Pixar-3D hyper-buff gym-bro: deep crimson POMEGRANATE head with leathery crown/calyx, intimidating glare, plain red sleeveless muscle tank over a massive muscular chest. Tallest, most muscular.",
    palette: "FROZEN CRIMSON — deep dark-red gradient, icy frost-white crystals in the air, cold dark-red shadows, pomegranate-seed sparkle." },
  { slug: "diesel", file: "Galactic Diesel.png",
    look: "GALACTIC DIESEL — Pixar-3D cosmic rebel: cosmic-purple planet head with swirling violet/magenta nebula and a thin Saturn-style golden-orange ring, glowing electric-green eyes, cocky smirk, black leather moto jacket over a dark cosmic-purple tee.",
    palette: "DEEP SPACE COSMIC — midnight navy-purple with cosmic-magenta and electric-teal nebula glow, scattered glowing gold stars, cosmic-dust particles." },
  { slug: "mango", file: "Guava Mango.png",
    look: "GUAVA MANGO — Pixar-3D laughing class-clown guy: head split vertically half mango-yellow / half guava-green with leafy mango hair, big happy grin, plain yellow tee + open coral-pink button-up. EXACTLY 2 arms / 2 hands.",
    freshPose: true,
    pose: "stands UPRIGHT and confident with a big open-mouthed laugh, BOTH feet planted on the ground and his torso fully vertical, one hand relaxed on his hip and the other arm raised gesturing toward the Mustang — he is NOT leaning on anything, his arms and elbows do NOT rest, prop, or lean on any surface, ledge, or the car (no propping on empty air); both arms are clearly free-standing and unsupported",
    palette: "TROPICAL SUNNY — warm golden-yellow into mango-orange and guava-pink, blurred palm fronds, warm bokeh, sunny golden-hour light." },
  { slug: "horchata", file: "Horchata.png",
    look: "HORCHATA — Pixar-3D flamenco dancer woman: creamy cinnamon-swirl head, cinnamon-stick curl hair, a red rose behind one ear, plain deep-red flamenco dress, smoldering smolder.",
    palette: "WARM SEVILLA SUNSET — rich terracotta-cinnamon-brown, cream and golden-honey highlights, deep amber shadow, faint blurred Spanish-tile, warm dusty light." },
  { slug: "lemon", file: "Lemon Cherry Fizz.png",
    look: "LEMON CHERRY FIZZ — Pixar-3D nerd girl: sunny yellow LEMON head, green-leaf BOB hair, round tortoiseshell GLASSES, glossy red CHERRY EARRINGS, pastel-yellow button-up under a cherry-red knit vest, soft knowing smirk (may hold a small closed book).",
    palette: "WARM STUDY / LIBRARY — soft pale-yellow with honey-gold undertones, cherry-red glow accent, faint blurred bookshelf, golden-hour bokeh." },
  { slug: "watermelon", file: "Watermelon Bubblegum.png",
    look: "WATERMELON BUBBLEGUM — Pixar-3D playful skater guy: WHOLE WATERMELON head (green rind with darker stripes) with a glossy PINK BUBBLEGUM quiff, plain green watermelon-rind MA-1 bomber open over a plain pink crewneck, charcoal cargo pants.",
    palette: "DREAMY BUBBLEGUM — pink-to-green pastel gradient, floating pink bubblegum bubbles at varying depths, curling green watermelon-vine leaves at the frame edges, warm golden-hour glow." },
];
const NEW_CHAR = new Set(["slushie", "blueberry"]);
const PAL = {
  blueberry: "FROZEN ARCTIC — icy frosted-blue gradient, gentle falling snow, cold frosty fog, soft cold light rays, frost sparkle.",
  slushie: "NEON GAMER (e-girl) — soft blurred gamer-room glow with electric-blue and hot-pink neon LED strips, floating translucent ice cubes, sugar-crystal sparkle, pink-and-blue haze.",
};

const CAR = `THE PRIZE CAR — a sleek modern 2026 FORD MUSTANG coupe (current-generation S650 look: aggressive low front fascia, tri-bar LED headlights and tri-bar LED taillights, muscular haunches, the chrome running-horse Mustang PONY badge on the grille), finished in GLOSSY PIANO-BLACK paint on EVERY card (the SAME black on all 10, regardless of the character's palette). Give it bright hero RIM-LIGHTING, crisp chrome/silver trim, glowing tri-bar LED head- and tail-lights, and clean studio reflections so the black body reads clearly on BOTH dark and light backgrounds. Rendered in the SAME unified PIXAR / CINEMA 4D / OCTANE 3D animated style as the character (NOT photoreal). Three-quarter front view, hero-lit. Clearly a BLACK Ford Mustang sports car.`;

const HEADLINE = `HEADLINE — the prize text reads "WIN A 2026 FORD MUSTANG", broken onto EXACTLY THREE lines, stacked and HORIZONTALLY CENTERED on the card:
  Line 1: "WIN A"
  Line 2: "2026 FORD"
  Line 3: "MUSTANG"
(Break after "WIN A", break after "2026 FORD", leaving "MUSTANG" alone on line 3.) All three lines in ONE unified style, ALL PURE WHITE: the same chunky 3D beveled glossy white display font, same outline weight, same soft dark drop shadow on every line so the white reads on any background. "WIN A" is a touch smaller on top; "2026 FORD" and "MUSTANG" are the big bold lines. The three lines share the SAME vertical center axis, are evenly spaced and tidy — a clean, symmetric centered lockup — centered within the LEFT ~68% content area (above/around the character + car) and must NOT extend into the empty reserved RIGHT ~32%. Do not overlap the character's face. Spell exactly, no extra words: WIN A / 2026 FORD / MUSTANG. SPELLING GUARD: line 2 is the number "2026" then the word "FORD" spelled with EXACTLY four letters F-O-R-D (one F, one O, one R, one D — never "FFORD", never "FOFRD"); line 3 is "MUSTANG" spelled M-U-S-T-A-N-G. Render each letter once, crisp and correct.

MASTER STYLE LOCK — REFERENCE IMAGE 4 is the MASTER headline+logo. Reproduce the headline lettering EXACTLY as in reference 4: the SAME font, SAME bold weight, SAME bevel/3D depth, SAME size relationship between the lines, SAME letter-spacing, SAME drop shadow and SAME centered position. The headline must look IDENTICAL across every card — do not change its boldness, style, or proportions from reference 4 in any way; only the background scene behind it differs.
SCALE — the headline is LARGE and bold: the two big lines "2026 FORD" and "MUSTANG" each span almost the full width of the LEFT ~68% content area (the same big scale as reference 4). Do NOT render the headline small or shrunken — it is a dominant hero element. Keep it entirely within the left content area; it does NOT cross into the empty right zone.

MUHA MEMBERS LOGO — centered at the very TOP, above the headline, reproduce the Muha Members logo CLEANLY and EXACTLY as in the logo references: a blue scallop-edged badge with a thin black checkmark on the LEFT, then the gold wordmark to its right spelling "Members"® — exactly ONE ornate baroque gold capital M followed immediately by lowercase gold letters e-m-b-e-r-s and a small ® at the end. ONE capital M ONLY; do NOT duplicate the M, do NOT add stray letters/ornaments between the M and "embers", do NOT warp or garble the wordmark. Keep it crisp, level, and legible.`;

const PRIOR = `REFERENCE IMAGE 5 is the PRIOR version of THIS exact card. Use it ONLY for the character's likeness/pose and the glossy BLACK Mustang look. Do NOT copy its layout: SHIFT the character and the car LEFT into the left two-thirds and leave the RIGHT THIRD EMPTY — do NOT place the car on the right edge as the reference does. Do NOT copy its headline; the headline's style/weight/size come STRICTLY from master reference 4 (identical on every card). NO stub, NO QR, NO divider, NO arrow.`;

const STYLE = `STYLE — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature look, cinematic hero lighting, FULL BLEED (the scene fills the entire 2048x1024 canvas to all four edges; NO outer border, NO frame, NO margin, NO panel/stub of any kind).

NEGATIVE — exactly ONE character + ONE Mustang car, no other characters, no other vehicle. The Mustang is GLOSSY BLACK on every card — NOT colored, NOT matched to the character palette. The headline is THREE lines (WIN A / 2026 FORD / MUSTANG) — do NOT keep it on two lines. Keep the RIGHT ~32% of the card EMPTY — background only, with NO car, NO character, NO text, and NO QR there (the QR is added later in post). All content (character, car, headline, logo) stays in the LEFT ~68%. ABSOLUTELY NO QR code or QR-style tile, NO "SCAN TO ENTER", NO "ENTER HERE", NO arrow, NO raffle-ticket stub or side panel, NO perforation / tear-line / divider, NO barcodes, NO phone numbers, NO dates. Correct spelling: "WIN A 2026 FORD MUSTANG". Do NOT garble the Members logo (one M, lowercase "embers", ® at end). Do NOT include "OFFICIAL ENTRY" or "MUHA MEMBERS RAFFLE". The character does NOT hold a key. Full bleed, no border/margin.`;

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs v4 QR-space";
fs.mkdirSync(outDir, { recursive: true });
const logoBuf = fs.readFileSync(LOGO_REF);
const mMonoBuf = fs.readFileSync(M_MONO_REF);
const canonTextBuf = fs.readFileSync(CANON_TEXT_REF);

function latestPriorBack(slug) {
  try {
    const hit = fs.readdirSync(PRIORBACK_DIR).filter((f) => f.endsWith(`-${slug}.png`) && !f.startsWith("_")).sort().pop();
    return hit ? path.join(PRIORBACK_DIR, hit) : null;
  } catch { return null; }
}

const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const queue = wanted.length ? CHARS.filter((c) => wanted.includes(c.slug)) : CHARS;

async function genBack(c) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating NO-QR back: ${c.slug}...`);
  const palette = PAL[c.slug] || c.palette;
  const priorPath = c.freshPose ? null : latestPriorBack(c.slug);

  const PROMPT = `MUHA MEMBERS — RAFFLE CARD BACK (NO-QR) — ${c.slug.toUpperCase()}.

REFERENCE IMAGE 1 is the official ${NEW_CHAR.has(c.slug) ? "CHARACTER PORTRAIT" : "character"}: use it for the character's EXACT likeness, outfit, and colors. Do NOT copy its background or any printed text.

SCENE (LEFT TWO-THIRDS ONLY) — the character ${c.pose || "stands NEXT TO / leans casually on the prize car, gesturing toward it (confident, fun)"}. The character does NOT hold a key. Place the character on the FAR LEFT and the Mustang LEFT-OF-CENTER: the car's right edge must NOT pass ~64% of the card width. The ENTIRE RIGHT THIRD (right ~34% of the width) is COMPLETELY EMPTY — clean, uncluttered background only (the scene's atmosphere / gradient simply continues, nothing in it) with NO character, NO car, NO bumper, NO text, NO objects whatsoever — this empty right third is reserved for a QR added later in post. Pull the whole composition LEFT to guarantee that empty right third. ${c.look}

${CAR}

BACKGROUND — ${palette} Full bleed.

${HEADLINE}

${priorPath ? PRIOR : ""}

${STYLE}`;

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), "character.png");
  form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
  form.append("image[]", new Blob([mMonoBuf], { type: "image/png" }), "mm-gold-monogram.png");
  form.append("image[]", new Blob([canonTextBuf], { type: "image/png" }), "master-text-lockup.png");
  if (priorPath) form.append("image[]", new Blob([fs.readFileSync(priorPath)], { type: "image/png" }), "prior-back.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 400)}`); return null; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${c.slug})`); return null; }
  const outPath = `${outDir}/${stamp}_muha-raffle-back-v4-${c.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
  return outPath;
}

const results = (await Promise.all(queue.map((c) => genBack(c).catch((e) => { console.error(`${c.slug}: ${e.message}`); return null; })))).filter(Boolean);
console.log(`\nDone — ${results.length}/${queue.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
