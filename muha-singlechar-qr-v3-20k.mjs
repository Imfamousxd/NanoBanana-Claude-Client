#!/usr/bin/env node
// Single-character QR cards v3: SAME locked structure as v2 (ornate border, navy body, right QR panel
// with "SCAN TO ENTER") BUT now the LEFT side carries the giveaway lockup:
// "✓ MUHA MEMBERS" + gold "GIVEAWAY" + "WIN $20,000", and the Mustang key fob is swapped for a CASH fan.
// Two sides: TEXT side (no QR) | QR side (QR + SCAN TO ENTER). Cards: aloha, pomegranate, lemon.
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
const TEMPLATE = "AI Fruit VIdeos Muha/Raffle Card Designs/Approved Raffle Cards/2026-05-31T00-19-25_muha-raffle-D-with-qr-v4.png";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Single Character QR v3";
fs.mkdirSync(outDir, { recursive: true });
const tmplBuf = fs.readFileSync(TEMPLATE);

const CHARS = [
  { file: "Aloha Passion Rush.png", slug: "aloha",
    desc: "ALOHA PASSION RUSH — seductive tropical Bond-girl. Spherical passionfruit-purple head, green tropical-leaf hair, pink hibiscus tucked in, glossy red lips, half-lidded sultry gaze, hibiscus lei, plain coral-pink tied-front tropical top.",
    pose: "holding up a fanned stack of crisp $100 bills near her shoulder, the other hand on her hip.",
    palette: "tropical sunset — warm coral/orange/pink sunset-beach tones with blurred palms and hibiscus." },
  { file: "Frozen Pomegranate.png", slug: "pomegranate",
    desc: "FROZEN POMEGRANATE — hyper-buff bodybuilder alpha-villain. Spherical deep crimson pomegranate head with the leathery pomegranate crown on top, pomegranate-red skin head to fingertips, faint icy frost, massive muscular build, plain solid red sleeveless muscle tank, intimidating smug expression.",
    pose: "gripping a thick fanned stack of crisp $100 bills in one hand with a smug intimidating smirk, his other huge arm flexed across his chest.",
    palette: "frozen crimson — deep dark-red tones with icy frost-white crystals and cool dark-red shadows." },
  { file: "Lemon Cherry Fizz.png", slug: "lemon",
    desc: "LEMON CHERRY FIZZ — smart nerd girl. Bright yellow spherical lemon head, glossy red cherry earrings, neat shoulder-length bob of green lemon leaves as hair, round tortoiseshell glasses, plain pastel-yellow button-up under a plain cherry-red knit vest, soft knowing smirk.",
    pose: "holding up a small fan of crisp $100 bills in one hand, while her other arm cradles a closed book against her hip — a relaxed natural two-handed pose.",
    palette: "warm library — soft pale-yellow with honey-gold undertones, cherry-red glow accent, faint blurred bookshelf behind." },
];

const TEMPLATE_LOCK = `REFERENCE IMAGE 1 IS THE LOCKED MASTER CARD. Reproduce these elements EXACTLY and IDENTICALLY (they must look the same on every card in this series):
- The ornate GOLD Art-Deco TICKET BORDER tracing the inner peel-sticker boundary (corner flourishes + double gold rule + gold-bead edge). The border sits in the card-body ring just OUTSIDE the peel-sticker area.
- The OUTER CARD BODY: deep midnight-navy-purple with faint gold pinstripe / micro-dot pattern, filling the ring OUTSIDE the border (between the border and the canvas edge), symmetric on all 4 sides.
- The RIGHT-SIDE QR ENTRY PANEL (the QR side): a styled deep-navy section (separated from the left art by the gold divider) holding a crisp high-contrast black-and-white QR CODE with bold GOLD "SCAN TO ENTER" lettering — match this panel's styling and the "SCAN TO ENTER" text exactly from reference 1. This QR side has NO other text.
- The border is the TOPMOST layer; the character and art never cross past it.

DIMENSIONS: canvas 2048x1024 px = full 90mm x 43mm card. Inner peel-off sticker area = 82mm x 32mm ≈ 1866 x 762 px, perfectly centered (≈91 px left/right margin, ≈131 px top/bottom margin). All hero artwork lives INSIDE the peel-sticker area; the border lives at the peel boundary; the outer card body fills the ring outside it.`;

const GIVEAWAY_LOCK = `LEFT SIDE = THE TEXT SIDE (no QR code here). It contains BOTH the featured character AND the giveaway lockup. Lay out the giveaway text across the TOP of the left side, with the character below/beside it, all inside the peel-sticker area:
- A small top kicker: a blue rounded CHECKMARK badge immediately followed by "MUHA MEMBERS" in clean bold white/gold caps (the verified-members tag).
- Directly below it, the word "GIVEAWAY" rendered LARGE as glossy 3D gold Art-Deco BUBBLE lettering with beveled highlights, matching the gold of the ticket border — this is the dominant headline.
- Directly below that, a tidy bar reading "WIN $20,000" in bold contrasting caps (white on a slim deep-navy/gold pill), clearly legible.
All three lines stay inside the gold border and never overlap the character's face.`;

const CASHPROP = `PRIZE PROP: a neat fanned stack of crisp US $100 bills (green Benjamin Franklin notes), clearly reading as a cash prize. NO car key, NO key fob, NO vehicle anywhere on the card.`;

const results = [];
for (const c of CHARS) {
  console.log(`Generating: ${c.slug}...`);
  const PROMPT = `Single-character MUHA MEMBERS raffle entry card — solo ${c.slug.toUpperCase()} card, one in a consistent series. Unified PIXAR / Cinema 4D / Octane 3D animated-feature style for the character; cinematic hero lighting.

${TEMPLATE_LOCK}

${GIVEAWAY_LOCK}

CHARACTER (the hero on the left/text side, framed mid-thigh up): ${c.desc}
POSE: ${c.pose}
BACKGROUND behind the character (themed): ${c.palette}

${CASHPROP}

CRITICAL TEXT RULES — the ONLY text anywhere on the card is exactly: "MUHA MEMBERS" (with the blue check kicker), "GIVEAWAY", "WIN $20,000" on the LEFT text side, and "SCAN TO ENTER" inside the RIGHT QR panel. Spell every word EXACTLY, no extra or gibberish text. NO "WIN A FORD", NO truck, NO key. Solo character only (no other characters, no vehicle). Natural proportions, two arms.`;

  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
  form.append("image[]", new Blob([tmplBuf], { type: "image/png" }), "D-template.png");
  form.append("image[]", new Blob([fs.readFileSync(path.join(CHAR_DIR, c.file))], { type: "image/png" }), c.file);
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c.slug}): ${(await res.text()).slice(0, 250)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${c.slug})`); continue; }
  const outPath = `${outDir}/${c.slug}_qr_v3_20k.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${c.slug}`);
  results.push(outPath);
}
console.log(`\nDone — ${results.length}/${CHARS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
