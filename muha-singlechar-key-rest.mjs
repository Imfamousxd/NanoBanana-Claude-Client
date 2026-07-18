#!/usr/bin/env node
// Remaining 7 single-character key cards (same recipe as the approved 3-char test):
// NO text/logo/border — character holding a FORD MUSTANG key on a flavor-correlated full-bleed bg.
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
  { file: "Arctic Blueberry.png", slug: "blueberry",
    desc: "ARCTIC BLUEBERRY — chad smooth-talker. Spherical deep purple-blue blueberry head with a small fluffy snow tuft at the crown, blueberry-blue skin head to fingertips, gym-built broad-shouldered build. Unbuttoned plain solid blue button-up over a plain solid blue tee. Half-smile + raised-brow smooth-operator look.",
    pose: "holding the Mustang key up and pointing at it with a relaxed finger-gun gesture, the other hand casually in his pocket — confident swagger.",
    palette: "COLD ARCTIC palette — deep midnight-blue gradient, frosty cyan-white highlights, icy lavender mid-tones, glittering snowflake bokeh, faint icicle silhouettes blurred in the deep background, cold blue cinematic light." },
  { file: "Blue Slushie.png", slug: "slushie",
    desc: "BLUE SLUSHIE — brain-freeze drama queen. Spherical icy-blue slushie head with frosted-blue/pastel-pink cotton-candy slushie 'hair' frizzing out, eyes wide and expressive, mouth in a dramatic gasp.",
    pose: "holding the Mustang key up triumphantly in one hand with an over-the-top excited gasp, the other hand pressed to her cheek in drama.",
    palette: "BRIGHT CANDY-BLUE palette — vibrant electric-blue gradient, hot magenta-pink accents, frosty white ice-cube bokeh floating in the air, sugar-crystal sparkle haze, frosted neon glow." },
  { file: "Frosted Mint Cookies.png", slug: "cookies",
    desc: "FROSTED MINT COOKIES — shy bashful adult woman. Round cookie-textured head (warm cookie-brown with darker chocolate-chip flecks), soft mint-green frosting drizzle on top, bashful blushing sweet smile. Adult, not childish.",
    pose: "holding the Mustang key shyly with both hands up near her chest, a bashful happy smile and slight head tilt.",
    palette: "WARM COZY BAKERY palette — soft cream gradient with warm cookie-brown undertones, gentle mint-green sparkle accents, golden-honey glow, soft hazy bokeh of floating sugar dust." },
  { file: "Frozen Pomegranate.png", slug: "pomegranate",
    desc: "FROZEN POMEGRANATE — hyper-buff bodybuilder alpha-villain. Spherical deep crimson pomegranate head with the leathery pomegranate crown at the top, pomegranate-red skin head to fingertips, faint icy frost sheen, MASSIVE muscular build. Plain solid red sleeveless muscle tank. Intimidating smug expression.",
    pose: "holding the Mustang key in one hand with a smug intimidating smirk, the other huge arm flexed across his chest — alpha flex.",
    palette: "FROZEN CRIMSON palette — deep dark-red gradient, icy frost-white crystals scattered in the air, cold dark-red cinematic shadows, faint pomegranate-seed sparkle bokeh, dramatic cool side-lighting." },
  { file: "Guava Mango.png", slug: "mango",
    desc: "GUAVA MANGO — funny class-clown laughing guy. Head split vertically half mango-yellow / half guava-green, leafy mango hair on top, caught mid-belly-laugh — head tilted back, eyes scrunched, wide-open cackle. Plain solid yellow tee + open plain coral-pink button-up. Moderate athletic build.",
    pose: "holding the Mustang key up in one hand mid-laugh, the other hand pressed to his belly — joyful. EXACTLY 2 arms / 2 hands total.",
    palette: "TROPICAL SUNNY palette — warm golden-yellow gradient blending into mango-orange and soft guava-pink, soft palm-frond silhouettes blurred in the deep background, warm pink-orange bokeh, bright golden-hour light." },
  { file: "Horchata.png", slug: "horchata",
    desc: "HORCHATA — passionate flamenco dancer / Latin drama queen. Creamy-cinnamon-swirl spherical head, cinnamon-stick curl hair past her shoulders, a small red rose behind one ear. Plain solid deep-red flamenco dress (ruffled silhouette, no surface graphics). Smoldering dramatic expression.",
    pose: "one arm raised in a graceful flamenco arc holding the Mustang key aloft, the other curved across her front, head turned in a dramatic side-glance.",
    palette: "WARM SEVILLA SUNSET palette — rich terracotta-cinnamon-brown gradient, warm cream and golden-honey highlights, deep amber shadow, faint ornate Spanish-tile silhouette blurred in the deep background, warm atmospheric dust." },
  { file: "Lemon Cherry Fizz.png", slug: "lemon",
    desc: "LEMON CHERRY FIZZ — smart quietly-beautiful nerd girl. Bright yellow spherical lemon head, glossy red cherry earrings, a neat shoulder-length bob of bright-green lemon leaves as hair, round tortoiseshell glasses. Plain pastel-yellow button-up under a plain cherry-red knit vest. Soft knowing smirk.",
    pose: "holding the Mustang key up in one hand while the other gently adjusts the bridge of her glasses, a closed book tucked under one arm — clever-cute.",
    palette: "WARM STUDY / LIBRARY palette — soft pale-yellow gradient with warm honey-gold undertones, hints of cherry-red glow accent, faint blurred wooden-bookshelf silhouette in the deep background, soft golden-hour bokeh." },
];

const STYLE = `Unified PIXAR / Cinema 4D / Octane 3D animated-feature-film style — cinematic hero lighting, NOT photoreal, NOT flat 2D.`;
const KEYPROP = `KEY PROP: the character is clearly holding a sleek BLACK FORD MUSTANG car key fob — the fob shows the chrome silver running-pony Mustang emblem (and a small Ford blue-oval), unmistakably a Mustang car key, at a believable hand-held size.`;
const NEG = `ABSOLUTELY NO TEXT anywhere — no title, wordmark, logo, Muha mark, badge, poster, sign, letters or numbers. NO ornate border or ticket frame — clean full-bleed background. Solo character only — no other characters, no vehicle. Anatomy: exactly 2 arms, 2 hands, 10 fingers — no extras.`;

for (const c of CHARS) {
  console.log(`Generating: ${c.slug}...`);
  const PROMPT = `Single-character collectible card artwork, 2048x1024 landscape. ${STYLE}

FEATURED CHARACTER (solo): ${c.desc}
POSE: ${c.pose}

${KEYPROP}

The character is the hero — large and centered, framed roughly mid-thigh up, with cinematic rim light.

BACKGROUND (fills the entire card, themed to this flavor): ${c.palette}

${NEG}`;
  const form = new FormData();
  form.append("model", MODEL); form.append("prompt", PROMPT); form.append("size", SIZE); form.append("quality", "high"); form.append("n", "1");
  const charBuf = fs.readFileSync(path.join(CHAR_DIR, c.file));
  form.append("image[]", new Blob([charBuf], { type: "image/png" }), c.file);
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); continue; }
  fs.writeFileSync(`${outDir}/${c.slug}_key_v1.png`, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${c.slug}`);
}
console.log("Done rest.");
