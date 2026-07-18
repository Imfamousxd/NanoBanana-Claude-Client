#!/usr/bin/env node
// Recreate the LEMON CHERRY FIZZ raffle-card BACK with NO raffle-ticket QR stub on the right —
// the character + 2026 Mustang scene goes FULL BLEED across the whole 2048x1024 card. 2 candidates.
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
const CHAR = "AI Fruit VIdeos Muha/Generated Characters/Lemon Cherry Fizz.png";
const CANON_TEXT_REF = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Mustang v4 consistent/2026-06-08T21-35-49_muha-raffle-mustang-v4-diesel.png";

const LOOK = "LEMON CHERRY FIZZ — Pixar-3D nerd girl: sunny yellow LEMON head, green-leaf BOB hair, round tortoiseshell GLASSES, glossy red CHERRY EARRINGS, pastel-yellow button-up under a cherry-red knit vest, soft knowing smirk (may hold a small closed book).";
const PALETTE = "WARM STUDY / LIBRARY — soft pale-yellow with honey-gold undertones, cherry-red glow accent, faint blurred bookshelf, golden-hour bokeh.";

const CAR = `THE PRIZE CAR — a sleek modern 2026 FORD MUSTANG coupe in GLOSSY BLACK paint (deep black, NOT red — black bodywork with bright reflections/highlights), current-generation S650 look: aggressive low front fascia, tri-bar LED headlights and tri-bar LED taillights, muscular haunches, the chrome running-horse Mustang PONY badge on the grille, rendered in the SAME unified PIXAR / CINEMA 4D / OCTANE 3D animated style as the character (NOT photoreal). Three-quarter front view, hero-lit, headlights glowing. It is clearly a BLACK Ford Mustang sports car.`;

const HEADLINE = `HEADLINE — over the LEFT scene (do NOT let it extend into the reserved right space), the prize text "WIN A 2026 FORD MUSTANG" in ONE single UNIFIED style, ALL PURE WHITE, broken across EXACTLY THREE lines:
  line 1: "WIN A"   (top, smaller)
  line 2: "2026 FORD"
  line 3: "MUSTANG"   (largest)
CRITICAL: all three lines use the EXACT SAME chunky 3D beveled white display font — same outline weight, same drop shadow, same glossy finish — differing ONLY in scale ("WIN A" smallest on top, "MUSTANG" biggest on the bottom line). Every word and number WHITE (not blue), with a soft dark drop shadow so the white reads on any background. Spell exactly: WIN A 2026 FORD MUSTANG, with the line breaks after "WIN A" and after "2026 FORD".

MUHA MEMBERS LOGO — near the top, reproduce the Muha Members logo CLEANLY and EXACTLY as in reference 2 (the master lockup) and reference 3: a blue scallop-edged badge with a thin black checkmark on the LEFT, then the gold wordmark to its right spelling "Members"® — exactly ONE ornate baroque gold capital M (the scrollwork letterform from reference 4) followed immediately by lowercase gold letters e-m-b-e-r-s and a small ® at the end. ONE capital M ONLY; do NOT duplicate the M, do NOT add stray letters/ornaments between the M and "embers", do NOT warp or garble the wordmark. Keep it crisp, level, and legible.`;

const STYLE = `STYLE — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature look, cinematic hero lighting, FULL BLEED (the scene fills the whole 2048x1024 canvas to all four edges; NO outer border, NO frame, NO margin).

NEGATIVE — exactly ONE character + ONE Mustang car, no other characters, no other vehicle. NO raffle-ticket stub, NO QR code, NO "SCAN TO ENTER", NO "ENTER HERE", NO arrow, NO perforation / tear-line / ticket notch, NO drawn panel or divider of any kind. The BACKGROUND is full-bleed edge to edge, but the character, car, and 3-line headline all stay in the LEFT ~68% — the RIGHT ~32% is left as clean OPEN background (empty, for a QR card to be added in post). Correct spelling: "WIN A 2026 FORD MUSTANG". Do NOT include "OFFICIAL ENTRY" or "MUHA MEMBERS RAFFLE". Do NOT garble the Members logo (one M, lowercase "embers", ® at end). NO Mustang key fob (this side shows the actual car). NO barcodes, phone numbers, or dates anywhere.`;

const PROMPT = `MUHA MEMBERS — RAFFLE CARD BACK — LEMON CHERRY FIZZ. Full-bleed landscape card, the character standing NEXT TO / leaning casually on the prize car and gesturing toward it like "this could be yours" (confident, fun). The character does NOT hold a key.

REFERENCE IMAGE 1 is the official character: use it for the character's EXACT likeness, outfit, and colors. Do NOT copy its background or any printed text.

SCENE — compose the character + Mustang in the LEFT ~68% of the card. Leave the RIGHT ~32% as CLEAN, simple, OPEN background space (a calm continuation of the library background only — NO character, NO car, NO headline, NO QR, NO panel, NO divider) reserved so a QR "scan to enter" card can be dropped there later in post. Do NOT center the car across the whole width — keep the car and character in the LEFT portion, with the character gesturing toward the open right space. ${LOOK}

${CAR}

BACKGROUND — ${PALETTE} Full bleed.

${HEADLINE}

${STYLE}`;

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs No-QR v4";
fs.mkdirSync(outDir, { recursive: true });

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "2");
form.append("image[]", new Blob([fs.readFileSync(CHAR)], { type: "image/png" }), "character.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(M_MONO_REF)], { type: "image/png" }), "mm-gold-monogram.png");
form.append("image[]", new Blob([fs.readFileSync(CANON_TEXT_REF)], { type: "image/png" }), "master-text-lockup.png");

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
const data = ((await res.json()).data || []);
if (!data.length) { console.error("no image"); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outs = [];
data.forEach((item, i) => { if (!item?.b64_json) return; const out = `${outDir}/${stamp}_muha-raffle-back-noqr-v6-lemon-black-c${i + 1}.png`; fs.writeFileSync(out, Buffer.from(item.b64_json, "base64")); console.log("✓ " + out); outs.push(out); });
console.log(`\nDone — ${outs.length}`);
if (outs.length) { try { execSync(`open -a Preview ${outs.map(r => `"${r}"`).join(" ")}`); } catch {} }
