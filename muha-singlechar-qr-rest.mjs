#!/usr/bin/env node
// Remaining 7 single-character QR cards: character LEFT + QR/"SCAN TO ENTER" RIGHT, horizontal Mustang pony.
// Clean (non-anatomy-stacked) phrasing to avoid moderation blocks.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Single Character QR";
fs.mkdirSync(outDir, { recursive: true });

const CHARS = [
  { file: "Blue Slushie.png", slug: "slushie",
    desc: "BLUE SLUSHIE — brain-freeze drama queen. Spherical icy-blue slushie head with frosted-blue/pastel-pink cotton-candy slushie 'hair' frizzing out, expressive wide eyes, dramatic gasp.",
    pose: "gripping the key fob raised triumphantly in one hand with an over-the-top excited gasp, her other hand pressed to her cheek.",
    palette: "BRIGHT CANDY-BLUE — vibrant electric-blue gradient, hot magenta-pink accents, frosty white ice-cube bokeh in the air, sugar-crystal sparkle haze." },
  { file: "Frosted Mint Cookies.png", slug: "cookies",
    desc: "FROSTED MINT COOKIES — shy bashful adult woman. Round cookie-textured head (warm cookie-brown with chocolate-chip flecks), soft mint-green frosting drizzle on top, bashful blushing sweet smile.",
    pose: "holding the key fob up softly with both hands near her chest, a bashful happy smile and slight head tilt.",
    palette: "WARM COZY BAKERY — soft cream gradient with cookie-brown undertones, gentle mint-green sparkle accents, golden-honey glow, floating sugar-dust bokeh." },
  { file: "Frozen Pomegranate.png", slug: "pomegranate",
    desc: "FROZEN POMEGRANATE — hyper-buff bodybuilder alpha-villain. Spherical deep crimson pomegranate head with the leathery pomegranate crown on top, pomegranate-red skin head to fingertips, faint icy frost sheen, massive muscular build, plain solid red sleeveless muscle tank, intimidating smug expression.",
    pose: "gripping the key fob in one hand with a smug intimidating smirk, his other huge arm flexed across his chest.",
    palette: "FROZEN CRIMSON — deep dark-red gradient, icy frost-white crystals in the air, cold dark-red shadows, pomegranate-seed sparkle bokeh, dramatic cool side-lighting." },
  { file: "Galactic Diesel.png", slug: "diesel",
    desc: "GALACTIC DIESEL — cosmic rebel / space outlaw. Cosmic-purple spherical planet head with swirling violet/magenta nebula and a thin Saturn-style golden-orange ring orbiting the head, glowing electric-green eyes, plain black leather moto jacket over a plain dark cosmic-purple tee, cocky smirk.",
    pose: "gripping the key fob in one raised hand and admiring it with a cocky smirk, his other hand resting on his belt.",
    palette: "DEEP SPACE COSMIC — midnight navy-purple gradient with cosmic-magenta and electric-teal nebula glow, scattered gold stars, floating cosmic dust, faint planet silhouette blurred in the deep background." },
  { file: "Guava Mango.png", slug: "mango",
    desc: "GUAVA MANGO — funny class-clown laughing guy. Head split vertically half mango-yellow / half guava-green, leafy mango hair on top, caught mid-belly-laugh (head tilted back, eyes scrunched, wide cackle), plain solid yellow tee + open plain coral-pink button-up, moderate athletic build.",
    pose: "gripping the key fob up in one hand mid-laugh, his other hand pressed to his belly — joyful, natural two-handed pose.",
    palette: "TROPICAL SUNNY — warm golden-yellow gradient into mango-orange and soft guava-pink, soft palm-frond silhouettes blurred in the deep background, warm pink-orange bokeh, bright golden-hour light." },
  { file: "Horchata.png", slug: "horchata",
    desc: "HORCHATA — passionate flamenco dancer / Latin drama queen. Creamy-cinnamon-swirl spherical head, cinnamon-stick curl hair past her shoulders, a small red rose behind one ear, plain solid deep-red flamenco dress (ruffled silhouette, no surface graphics), smoldering dramatic expression.",
    pose: "firmly gripping the key fob in her raised hand at the top of a graceful flamenco arc (clutched in her closed hand, not dangling), her other arm curved elegantly across her front, head turned in a dramatic side-glance.",
    palette: "WARM SEVILLA SUNSET — rich terracotta-cinnamon-brown gradient, warm cream and golden-honey highlights, deep amber shadow, faint ornate Spanish-tile silhouette blurred in the deep background, warm atmospheric dust." },
  { file: "Watermelon Bubblegum.png", slug: "watermelon",
    desc: "WATERMELON BUBBLEGUM — playful skater guy. WHOLE WATERMELON head — bright green rind with darker wavy stripes, a glossy pink bubblegum quiff styled on top as his hair, mid-bubblegum-blow with a glossy pink bubble, plain green watermelon-rind MA-1 bomber open over a plain pink crewneck, dark charcoal cargo pants, confident playful stance.",
    pose: "gripping the key fob firmly in one raised hand to show it off with a confident grin, his other hand casually in his pocket.",
    palette: "DREAMY BUBBLEGUM-WORLD — soft watermelon pink-to-green pastel gradient, multiple floating pink bubblegum bubbles at varying depths with bokeh blur, curling green watermelon-vine leaves at the frame edges, warm sunny glow." },
];

const KEYPROP = `KEY PROP: a sleek BLACK FORD MUSTANG SMART KEY FOB — a rounded plastic key fob ONLY (no metal blade sticking out), with the chrome silver running-pony Mustang emblem and a small Ford blue-oval. The pony emblem reads HORIZONTALLY — upright and galloping sideways (left-to-right), held face-on, not rotated or vertical or downward.`;
const LAYOUT = `LAYOUT (2048x1024 landscape): LEFT ~65% = the featured character as the hero (mid-thigh up) on the themed background. RIGHT ~35% = a clean entry panel: a crisp high-contrast black-and-white QR CODE inside a white rounded-square tile, centered, with bold "SCAN TO ENTER" lettering directly below it in clean cream sans. The character stays left and does not overlap the QR.`;
const STYLE = `Unified PIXAR / Cinema 4D / Octane 3D animated-feature-film style for the character — cinematic hero lighting, NOT photoreal, NOT flat 2D.`;
const NEG = `NO other text besides "SCAN TO ENTER" — no giveaway title, no wordmark, no Muha mark, no logo, no badge. NO ornate ticket border. Solo character only — no other characters, no vehicle. Natural proportions, two arms.`;

for (const c of CHARS) {
  console.log(`Generating: ${c.slug}...`);
  const PROMPT = `Single-character raffle entry card, 2048x1024. ${STYLE}

FEATURED CHARACTER (solo, left side): ${c.desc}
POSE: ${c.pose}

${KEYPROP}

${LAYOUT}

BACKGROUND behind the character: ${c.palette}

${NEG}`;
  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), c.file);
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 200)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); continue; }
  fs.writeFileSync(`${outDir}/${c.slug}_qr_v1.png`, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${c.slug}`);
}
console.log("Done rest.");
