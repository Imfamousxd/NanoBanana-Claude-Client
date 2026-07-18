#!/usr/bin/env node
// Per-character RAFFLE BACK PLATES — the approved v2 scene (character + glossy BLACK Mustang)
// with ALL text + the logo REMOVED and the top-center kept OPEN, so a uniform logo + headline
// can be composited identically on every card. CLI slug filter; concurrent.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const V2_DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs No-QR v2";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs Plates";
fs.mkdirSync(outDir, { recursive: true });

const CHARS = [
  { slug: "aloha", file: "Aloha Passion Rush.png", pal: "TROPICAL SUNSET — warm coral-orange into hot pink and golden yellow, blurred palm silhouettes, golden-hour glow." },
  { slug: "blueberry", file: "Arctic Blueberry.png", pal: "FROZEN ARCTIC — icy frosted-blue gradient, gentle falling snow, cold frosty fog, soft cold light rays, frost sparkle." },
  { slug: "slushie", file: "Blue Slushie.png", pal: "NEON GAMER (e-girl) — soft blurred gamer-room glow with electric-blue and hot-pink neon LED strips, floating translucent ice cubes, pink-and-blue haze." },
  { slug: "cookies", file: "Frosted Mint Cookies.png", pal: "WARM COZY BAKERY — soft cream with cookie-brown undertones, mint-green sparkle accents, golden-honey glow, soft sugar-dust bokeh." },
  { slug: "pomegranate", file: "Frozen Pomegranate.png", pal: "FROZEN CRIMSON — deep dark-red gradient, icy frost-white crystals in the air, cold dark-red shadows, pomegranate-seed sparkle." },
  { slug: "diesel", file: "Galactic Diesel.png", pal: "DEEP SPACE COSMIC — midnight navy-purple with cosmic-magenta and electric-teal nebula glow, scattered glowing gold stars, cosmic-dust particles." },
  { slug: "mango", file: "Guava Mango.png", pal: "TROPICAL SUNNY — warm golden-yellow into mango-orange and guava-pink, blurred palm fronds, warm bokeh, sunny golden-hour light." },
  { slug: "horchata", file: "Horchata.png", pal: "WARM SEVILLA SUNSET — rich terracotta-cinnamon-brown, cream and golden-honey highlights, deep amber shadow, warm dusty light." },
  { slug: "lemon", file: "Lemon Cherry Fizz.png", pal: "WARM STUDY / LIBRARY — soft pale-yellow with honey-gold undertones, cherry-red glow accent, faint blurred bookshelf, golden-hour bokeh." },
  { slug: "watermelon", file: "Watermelon Bubblegum.png", pal: "DREAMY BUBBLEGUM — pink-to-green pastel gradient, floating pink bubblegum bubbles, curling green watermelon-vine leaves at the edges, warm golden-hour glow." },
];

const latestV2 = (slug) => {
  const hit = fs.readdirSync(V2_DIR).filter((f) => f.endsWith(`-${slug}.png`)).sort().pop();
  return hit ? path.join(V2_DIR, hit) : null;
};

const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const queue = (wanted.length ? CHARS.filter((c) => wanted.includes(c.slug)) : CHARS).filter((c) => latestV2(c.slug));

async function genPlate(c) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Plate: ${c.slug}...`);
  const PROMPT = `Clean background PLATE for a raffle-card back — ${c.slug.toUpperCase()}.

REFERENCE IMAGE 1 is the finished card. Reproduce the SAME scene: the SAME character on the LEFT and the SAME glossy BLACK 2026 Ford Mustang on the right, in the SAME unified Pixar / Cinema4D / Octane 3D animated style, over the SAME full-bleed background — ${c.pal}

REMOVE COMPLETELY every piece of TEXT and the LOGO: delete the entire "WIN A 2026 FORD MUSTANG" headline and the Muha Members badge/wordmark. The result must contain ABSOLUTELY ZERO text, ZERO letters, ZERO numbers, and NO logo or badge anywhere.

COMPOSITION: keep the character on the LEFT and the black Mustang on the lower-right, and keep the TOP-CENTER ~40% of the frame as OPEN clean background only — no character head, no car roof, no objects crossing that top-center band. That empty space is reserved for a headline added later.

REFERENCE IMAGE 2 is the character portrait — keep the character's exact likeness, outfit and colors. Keep the Mustang glossy BLACK with hero rim-light and glowing lights. FULL BLEED, no border, no panel, and NO text or logo of any kind.`;

  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(latestV2(c.slug))], { type: "image/png" }), "finished-card.png");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), "character.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); return null; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); return null; }
  const out = `${outDir}/${stamp}_plate-${c.slug}.png`;
  fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${out}`);
  return out;
}

const results = (await Promise.all(queue.map((c) => genPlate(c).catch((e) => { console.error(`${c.slug}: ${e.message}`); return null; })))).filter(Boolean);
console.log(`\nDone — ${results.length}/${queue.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
