#!/usr/bin/env node
// Muha Members Giveaway IG — 3 more variants in the "A / group-hero" family.
// 04 + 05 = placement variants of A (ref = approved post 01 for crew/Mustang/style consistency).
// 06 = "HOW TO ENTER" using the real app screenshots (raffles + scan-product) as phone mockups.
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
const SIZE = "1536x1920"; // 4:5 IG portrait
const outDir = "AI Fruit VIdeos Muha/Mustang Giveaway IG";
fs.mkdirSync(outDir, { recursive: true });

const GROUP_REF = "AI Fruit VIdeos Muha/Mustang Giveaway IG/2026-06-07T22-17-51_01-group-hero.png";
const SS_RAFFLES = "Muha Giveaway Assets/raffles SS.png";
const SS_SCAN = "Muha Giveaway Assets/scan prod.png";

const A_LOCK = `REFERENCE IMAGE 1 IS THE APPROVED POST. Keep the SAME crew of Muha fruit characters (buff crimson Pomegranate, tropical purple Aloha, dark Galactic Diesel, pink-green Watermelon, yellow Lemon nerd-girl in glasses), the SAME glossy black FORD MUSTANG GT (correct running-pony grille emblem + Ford oval), the SAME unified Pixar/Octane glossy 3D style, and the SAME vibrant neon-Miami-night palette with bokeh + confetti. ONLY change the layout/placement of the elements as described. Keep the gold lockup premium and every word spelled EXACTLY.`;

const TEXT = `TEXT (spell EXACTLY, nothing else): "MUHA MEMBERS", "GIVEAWAY", "WIN A FORD MUSTANG", "LINK IN BIO TO ENTER". Blue checkmark badge beside MUHA MEMBERS; "GIVEAWAY" as glossy 3D gold Art-Deco bubble lettering.`;

const CONCEPTS = [
  {
    slug: "04-A-lockup-bottom",
    refs: [GROUP_REF],
    prompt: `Vertical 4:5 Instagram giveaway post. ${A_LOCK}

PLACEMENT VARIANT — FLIP THE LAYOUT: the characters + black Mustang fill the TOP two-thirds of the frame (hero crew up top, car prominent), and the GOLD GIVEAWAY LOCKUP sits as a bold band across the BOTTOM third: "✓ MUHA MEMBERS" kicker, big gold "GIVEAWAY" bubble, and "WIN A FORD MUSTANG" bar, with a "LINK IN BIO TO ENTER" pill at the very bottom edge. Clean separation so the lockup reads instantly. ${TEXT}`,
  },
  {
    slug: "05-A-mustang-hero",
    refs: [GROUP_REF],
    prompt: `Vertical 4:5 Instagram giveaway post. ${A_LOCK}

PLACEMENT VARIANT — MUSTANG AS CENTER HERO: the glossy black Ford Mustang is the large centered centerpiece (3/4 front angle), with the fruit characters arranged lower and to BOTH sides flanking it (peeking around the car). A small "✓ MUHA MEMBERS" kicker top-left, and make "WIN A FORD MUSTANG" the DOMINANT large gold headline across the lower third (bigger than "GIVEAWAY", which becomes a smaller gold kicker above it). "LINK IN BIO TO ENTER" pill at the bottom. ${TEXT}`,
  },
  {
    slug: "06-how-to-enter",
    refs: [GROUP_REF, SS_RAFFLES, SS_SCAN],
    prompt: `Vertical 4:5 Instagram "HOW TO ENTER" post for the Muha Members Giveaway, same neon style and crew as reference image 1 (use just 2-3 of the characters, e.g. the yellow Lemon nerd-girl in glasses as the helpful guide plus the buff Pomegranate), with the black Ford Mustang small in the background.

LAYOUT: a big gold "HOW TO ENTER" headline at the TOP (with a small "✓ MUHA MEMBERS GIVEAWAY" kicker above it). Below, THREE numbered steps stacked vertically, each step = a clean modern SMARTPHONE MOCKUP showing the Muha app screen, with a short white caption beside it and a character pointing/gesturing toward it:
- STEP 1 "Open the Muha app → tap RAFFLES": phone screen styled like REFERENCE IMAGE 2 — a dark app menu with a highlighted "Raffles — Enter to win prizes" row and a bottom nav.
- STEP 2 "Scan your product code": phone screen styled like REFERENCE IMAGE 3 — a dark "EARN ENTRIES" screen with a highlighted "Scan product code" row and a QR/scan icon.
- STEP 3 "More scans = more entries": phone screen showing a clean success/entries-counter screen with a checkmark.
At the bottom, a gold bar "WIN A FORD MUSTANG" + a "LINK IN BIO TO ENTER" pill.

IMPORTANT: render the phone screens as clean dark app UI focused ONLY on the highlighted action rows shown in references 2 and 3. Do NOT display any other car name, brand, or dollar amounts on the phone screens. Keep UI text minimal and legible. TEXT on the post overall, spelled EXACTLY: "MUHA MEMBERS GIVEAWAY", "HOW TO ENTER", "Open the Muha app", "tap RAFFLES", "Scan your product code", "More scans = more entries", "WIN A FORD MUSTANG", "LINK IN BIO TO ENTER". No gibberish text.`,
  },
];

const results = [];
for (const c of CONCEPTS) {
  console.log(`Generating: ${c.slug}...`);
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", c.prompt);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  for (const r of c.refs) form.append("image[]", new Blob([fs.readFileSync(r)], { type: "image/png" }), path.basename(r));
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`  HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`  no image (${c.slug})`); continue; }
  const outPath = `${outDir}/${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}_${c.slug}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`  ✓ ${outPath} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${CONCEPTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
