#!/usr/bin/env node
// Muha Members — IN-APP VOTING cards, one per fruit character. 1:1 square (1024x1024).
// gpt-image-2 edits, each character's source png as the on-model ref.
// Run `node muha-vote-cards.mjs --test` to generate just the first 2 (design lock), else all 10.
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
const SIZE = "1024x1024"; // 1:1 square
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const outDir = "AI Fruit VIdeos Muha/Vote Cards";
fs.mkdirSync(outDir, { recursive: true });

// name = the flavor name printed on the card; accent = signature color for glow/background.
let CHARS = [
  { file: "Frozen Pomegranate.png",   slug: "pomegranate", name: "FROZEN POMEGRANATE",   accent: "deep crimson red with icy-blue frost" },
  { file: "Aloha Passion Rush.png",   slug: "aloha",       name: "ALOHA PASSION RUSH",   accent: "tropical coral-pink & sunset orange" },
  { file: "Lemon Cherry Fizz.png",    slug: "lemon",       name: "LEMON CHERRY FIZZ",    accent: "bright lemon-yellow & cherry red" },
  { file: "Watermelon Bubblegum.png", slug: "watermelon",  name: "WATERMELON BUBBLEGUM", accent: "watermelon pink & green" },
  { file: "Guava Mango.png",          slug: "mango",       name: "GUAVA MANGO",          accent: "warm mango orange & guava pink" },
  { file: "Galactic Diesel.png",      slug: "diesel",      name: "GALACTIC DIESEL",      accent: "cosmic deep purple & electric blue" },
  { file: "Horchata.png",             slug: "horchata",    name: "HORCHATA",             accent: "creamy cinnamon beige & caramel" },
  { file: "Frosted Mint Cookies.png", slug: "cookies",     name: "FROSTED MINT COOKIES", accent: "cool mint green & cookie brown" },
  { file: "Blue Slushie.png",         slug: "slushie",     name: "BLUE SLUSHIE",         accent: "icy electric blue & frost white" },
  { file: "Arctic Blueberry.png",     slug: "blueberry",   name: "ARCTIC BLUEBERRY",     accent: "deep blueberry indigo & frost" },
];
if (process.argv.includes("--test")) CHARS = CHARS.slice(0, 2);
if (process.argv.includes("--rest")) CHARS = CHARS.slice(2);
// --only=slug1,slug2 → regenerate just those characters (e.g. retry failures)
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
if (onlyArg) {
  const want = onlyArg.slice("--only=".length).split(",").map((s) => s.trim());
  CHARS = CHARS.filter((c) => want.includes(c.slug));
}

const TEMPLATE = (c) => `Square 1:1 IN-APP VOTING CARD for the Muha Members fan-favorite character vote. The character in the reference image is rendered in a unified PIXAR / Cinema 4D / Octane glossy 3D animated-feature style — REPRODUCE that exact character EXACTLY (same fruit head, features, outfit, colors), three-quarter or waist-up, in a confident dynamic "pick me" hero pose, composed to fit a square frame.

LAYOUT (top to bottom):
- BACKGROUND: a premium deep midnight-navy card with a soft glowing ${c.accent} radial bloom behind the character, subtle bokeh, faint gold pinstripe edge, clean and app-ready.
- TOP: a small blue rounded CHECKMARK badge + "MUHA MEMBERS" in clean bold white caps, and just under it a tracked-out gold kicker "VOTE FOR YOUR FAVORITE".
- CENTER: the character as the large hero, well-lit, sharp, centered.
- LOWER: a clean nameplate bar showing "${c.name}" in bold caps.
- BOTTOM: a big glossy 3D gold pill BUTTON reading "VOTE" with a small heart/star icon.

CRITICAL TEXT — the ONLY text on the card is exactly: "MUHA MEMBERS", "VOTE FOR YOUR FAVORITE", "${c.name}", and "VOTE". Spell every word EXACTLY, no other or gibberish text. No giveaway text, no car, no other characters. Consistent template so all cards in the series look identical except the character, accent glow, and name.`;

const results = [];
for (const c of CHARS) {
  console.log(`Generating vote card: ${c.slug}...`);
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", TEMPLATE(c));
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), c.file);
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`  HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`  no image (${c.slug})`); continue; }
  const outPath = `${outDir}/vote_${c.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`  ✓ ${outPath} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${CHARS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
