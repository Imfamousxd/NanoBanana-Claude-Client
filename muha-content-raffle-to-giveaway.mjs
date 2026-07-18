#!/usr/bin/env node
// Edit Muha content 1/2/3 (Disclaimer Styled versions): replace every instance
// of "raffle" / "raffles" with "giveaway" / "giveaways" throughout the layout
// AND inside the iPhone screenshots, then make the iPhone screen text crisp
// and legible (especially the third screen showing "Scan giveaway ticket").
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
const SRC_DIR = "Muha Giveaway Redesigned/Disclaimer Styled";
const OUT_DIR = "Muha Giveaway Redesigned/Raffle to Giveaway";

fs.mkdirSync(OUT_DIR, { recursive: true });

const FILES = ["content 1.png", "content 2.png", "content 3.png"];

const PROMPT = `Edit this image to replace EVERY instance of the word "raffle" / "raffles" (case-insensitive) with "giveaway" / "giveaways" — both in the large step headlines AND inside every iPhone screenshot on the canvas. Keep EVERYTHING ELSE in the image IDENTICAL — same Vice City background, same MM monogram logo, same "GIVEAWAY · Vice City" main headline, same red Challenger, same QR code, same iPhone device frames, same iPhone screen layouts/colors/icons, same disclaimer at the bottom, same composition, same aspect ratio. Only the word "raffle"/"raffles" changes to "giveaway"/"giveaways", and the iPhone screen text becomes sharper/cleaner.

EXACT REPLACEMENTS (apply wherever each appears in this image — some may apply, some may not):

Step-headline replacements (the big cream/gold labels above or beside each phone):
- "TAP 'RAFFLES'" → "TAP 'GIVEAWAYS'"
- "SELECT 'GTA RAFFLE'" → "SELECT 'GTA GIVEAWAY'"
- "TAP 'SCAN RAFFLE TICKET'" → "TAP 'SCAN GIVEAWAY TICKET'"

iPhone screenshot text replacements (inside each phone's screen):
- Side-menu list item "Raffles" → "Giveaways" (keep the same highlight/red outline if it was highlighted)
- Top-bar screen title "RAFFLES" → "GIVEAWAYS"
- Card title "GTA Raffle" → "GTA Giveaway"
- Option row "Scan raffle ticket" → "Scan giveaway ticket"
- Option row "Share raffle" → "Share giveaway"
- Any other "raffle" string anywhere on a phone screen → "giveaway"

iPhone screen text LEGIBILITY (CRITICAL — especially for the third phone which shows the prize-list / earn-entries / "Scan giveaway ticket" view):
- Render the phone-screen typography CRISP and SHARP, fully readable at this resolution
- The "Scan giveaway ticket" row must be clearly legible — bold cream/white text on the dark menu row, with the highlighted red outline around it preserved exactly
- Surrounding rows ("Share giveaway", prize amounts like "Dodge Challenger", "$1,000", "Earn Entries" section header) must also be sharp and legible — no muddy/blurred text
- Do NOT change the iPhone status bar (time, signal, battery), do NOT change the iPhone frame, do NOT change the dark UI background of the screens, do NOT change icon positions, do NOT change the prize amounts or any other content beyond the raffle→giveaway swaps

TYPOGRAPHY: keep the EXACT same typeface and weight as the original headlines/screens. The replacement word must read as if it were always there — same spacing, same alignment, same kerning. "GIVEAWAY" is one letter longer than "RAFFLE" — if needed, tighten letter-spacing slightly so the line still fits cleanly, but do NOT shrink the type so much that it looks smaller than the surrounding step text.

Negative: do NOT leave any "raffle" word visible anywhere, do NOT add new graphics, do NOT change the background, do NOT change the Challenger, do NOT change the headline "GIVEAWAY · Vice City", do NOT shift other elements, do NOT change colors, do NOT change the QR code, do NOT alter the disclaimer at the bottom.

Output a single edited image at the same aspect ratio as the input.`;

function loadB64(p) { return fs.readFileSync(p).toString("base64"); }

async function editOne(filename, attempt = 1) {
  const src = path.join(SRC_DIR, filename);
  if (!fs.existsSync(src)) return { ok: false, error: "missing source" };
  const b64 = loadB64(src);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: "image/png", data: b64 } },
        { text: PROMPT },
      ],
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { imageSize: "4K" },
    },
  };
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 3000)); return editOne(filename, attempt + 1); }
    return { ok: false, error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise(r => setTimeout(r, 5000 * attempt));
      return editOne(filename, attempt + 1);
    }
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, "base64");
      const dst = path.join(OUT_DIR, filename);
      fs.writeFileSync(dst, buf);
      return { ok: true, dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Editing ${FILES.length} Muha content image(s) — raffle → giveaway...`);
const CONCURRENCY = 3;
const queue = [...FILES];
let ok = 0, fail = 0;
const saved = [];
async function worker() {
  while (queue.length) {
    const f = queue.shift();
    if (!f) break;
    const r = await editOne(f);
    if (r.ok) { ok++; saved.push(r.dst); console.log(`  ✓ ${f} → ${r.dst}`); }
    else { fail++; console.log(`  ✗ ${f}: ${r.error}`); }
  }
}
await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));
console.log(`\nDone: ${ok}/${FILES.length} → ${OUT_DIR}/`);
if (saved.length) console.log(`Saved:\n  ${saved.join("\n  ")}`);
