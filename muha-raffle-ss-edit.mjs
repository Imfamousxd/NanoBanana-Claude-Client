#!/usr/bin/env node
// Surgical NB edits on the two iPhone-mockup screenshots in Muha Giveaway
// Assets that contain "Raffle"/"Raffles" text. Output keeps every pixel of
// the source identical EXCEPT the listed text strings, which get swapped to
// "Giveaway"/"Giveaways".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const JOBS = [
  {
    src: "Muha Giveaway Assets/raffles SS.png",
    dst: "Muha Giveaway Assets/raffles SS giveaway.png",
    prompt: `SURGICAL TEXT REPLACEMENT — the highlighted menu row (the one with the red rounded-rectangle outline around it, 5th item in the list) currently shows the bold title "Raffles" with subtitle "Enter to win prizes" beneath. Replace the title "Raffles" with "Giveaways".

CRITICAL EXECUTION RULES (the previous attempt failed because the new word was painted ON TOP of the old word, producing a doubled/ghosted/smudgy overlay — DO NOT make that mistake again):
1. First, the original "Raffles" letterforms must be COMPLETELY REMOVED — every pixel of the old "R", "a", "f", "f", "l", "e", "s" glyphs must be erased and the dark menu-row card background filled in cleanly underneath, as if the old text never existed. NO ghost text, NO smudge, NO faded overlay, NO second word peeking through.
2. THEN render the new word "Giveaways" cleanly on top of that clean background, in the same position the old title occupied.

Render "Giveaways" CRYSTAL CLEAR and pixel-sharp using the SAME modern sans-serif typeface, SAME bold weight, SAME size, SAME cream/white color, and SAME left-alignment as the surrounding row titles ("My Account", "My Events", "Verification", "Rewards", "My Orders", "Promotions", "Report Counterfeit", "My Posts"). "Giveaways" is two letters longer than "Raffles" — tighten the letter-spacing slightly if needed to fit cleanly within the same row width; do NOT shrink the type and do NOT break to a new line.

KEEP IDENTICAL TO SOURCE (every pixel outside the single title-string area must match the input 1:1):
- iPhone device chrome (silver-edge frame, screen rounded corners, notch/dynamic island, side button silhouettes)
- iOS status bar (time "8:38" left, signal/5G/98% battery right)
- Deep-black OLED app background
- "ACCOUNT" section header
- Every other menu row's icon, title, subtitle, and styling — UNCHANGED
- The subtitle "Enter to win prizes" beneath the highlighted row — UNCHANGED
- The small ticket-style icon on the left of the highlighted row — UNCHANGED
- The right-arrow chevron on the highlighted row — UNCHANGED
- The red rounded-rectangle outline around the highlighted row — UNCHANGED (same stroke width, same red color, same corner radius)
- Bottom tab bar (HOME / SOCIAL / VERIFY / EVENTS / MORE) with MORE highlighted — UNCHANGED
- Aspect ratio — UNCHANGED
- Soft surrounding background — UNCHANGED

NEGATIVE: no doubled / ghosted / smudged text, no overlay of two words on top of each other, no blur, no compression artifacts. If you can see ANY remnant of the word "Raffles" in the output (even faintly), the edit has failed.

Output a single edited image at the same aspect ratio as the input.`,
  },
  {
    src: "Muha Giveaway Assets/raffle ss 2.png",
    dst: "Muha Giveaway Assets/raffle ss 2 giveaway.png",
    prompt: `SURGICAL TEXT EDIT — keep this iPhone screenshot 1:1 with the source. Preserve EVERY pixel of the deep-black OLED app background, the iOS status bar (time "1:19" left, signal/5G/65% battery right), the small back-arrow chevron, the gold star icon on the right side of the "Your Total Entries" row, the ACTIVE / UPCOMING / ENDED tab styling and the underline under ACTIVE, the entire "GTA Raffle" card (the muha members GIVEAWAY $25,000 CASH PRIZE A BRAND NEW DODGE CHALLENGER SRT graphic and the red Challenger photo and palm trees and all the typography inside that graphic — DO NOT change anything inside the card graphic), the "2 entered" / "0 entries" rows, the pill tags ("Dodge Challenger" / "$5,000" / "+3 more"), the bottom tab bar (HOME / SOCIAL / VERIFY / EVENTS / MORE) with the MORE tab highlighted in a gold/red rounded outline, the overall aspect ratio.

THE ONLY CHANGES — replace these EXACT text strings with their giveaway versions:

1) Top page-title header "RAFFLES" → "GIVEAWAYS" (same uppercase, same letter-spacing, same cream/white color, same font weight, same size, same horizontal centering)

2) Subtitle row underneath "Your Total Entries": "Across all active raffles" → "Across all active giveaways" (same dim-gray small text, same font, same size, same alignment)

3) Card title BELOW the GTA graphic: "GTA Raffle" → "GTA Giveaway" (same bold cream/white, same font, same size, same left-alignment)

All other "raffle"/"raffles" instances anywhere on the screen → "giveaway"/"giveaways" — but DO NOT modify the text WITHIN the "muha members GIVEAWAY $25,000 CASH PRIZE..." graphic itself (that graphic already says "GIVEAWAY" and stays unchanged pixel-for-pixel).

Render every replaced text string CRYSTAL CLEAR and pixel-sharp using the SAME typeface, SAME weight, SAME size, SAME color as the source. "GIVEAWAYS" is two letters longer than "RAFFLES" — tighten letter-spacing minimally if needed to fit; do NOT shrink the type.

NEGATIVE: do NOT change the GTA card graphic, do NOT change the Challenger photo, do NOT change the pill tags or their values, do NOT change the entries counters, do NOT change the tab styling, do NOT change the bottom tab bar, do NOT change the status bar, do NOT change any icons, do NOT introduce any new graphics, do NOT leave the word "Raffle"/"Raffles" visible anywhere outside the protected graphic.

Output a single edited image at the same aspect ratio as the input.`,
  },
];

function loadB64(p) { return fs.readFileSync(p).toString("base64"); }

async function editOne(job, attempt = 1) {
  if (!fs.existsSync(job.src)) return { ok: false, error: `missing ${job.src}` };
  const b64 = loadB64(job.src);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ inline_data: { mime_type: "image/png", data: b64 } }, { text: job.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize: "4K" } },
  };
  let res;
  try {
    res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 3000)); return editOne(job, attempt + 1); }
    return { ok: false, error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise(r => setTimeout(r, 5000 * attempt));
      return editOne(job, attempt + 1);
    }
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      fs.writeFileSync(job.dst, Buffer.from(part.inlineData.data, "base64"));
      return { ok: true, dst: job.dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Editing ${JOBS.length} raffle screenshots → giveaway...`);
const results = await Promise.all(JOBS.map(j => editOne(j)));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.ok) console.log(`  ✓ ${JOBS[i].src} → ${r.dst}`);
  else console.log(`  ✗ ${JOBS[i].src}: ${r.error}`);
}
