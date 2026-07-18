#!/usr/bin/env node
// Surgical Nano Banana edit on content 3 — keep every pixel of the source
// identical, only replace "raffle"/"raffles" strings with "giveaway"/
// "giveaways" inside the third iPhone's screen and inside the step-3 caption.
// The screen layout (icons, row positions, colors, dividers, highlight, status
// bar, prize rows, section headers) must remain 1:1 with the source.
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
const SRC = "Muha Giveaway Redesigned/Disclaimer Styled/content 3.png";
const OUT_DIR = "Muha Giveaway Redesigned/Raffle to Giveaway";
fs.mkdirSync(OUT_DIR, { recursive: true });

const PROMPT = `SURGICAL TEXT EDIT — keep this image PIXEL-PERFECT 1:1 with the source. Every pixel must remain identical to the input EXCEPT for the specific text-string substitutions listed below.

The image is a Muha Members giveaway promo containing: a Vice City background, MM monogram logo, "GIVEAWAY · Vice City" headline, "$25,000 CASH PRIZE + ALL-NEW DODGE CHALLENGER" gold panel, a red Challenger car, a "Scan To Find Out!" QR code, and at the bottom THREE iPhone mock-ups arranged left-to-right showing the app flow (steps 1, 2, 3). A "See official rules in app or at muhamembers.com" disclaimer sits at the very bottom.

CRITICAL — preserve 1:1: keep all THREE iPhone frames, their layouts, the dark UI backgrounds, every icon, every divider line, every row position, every prize value ($1,000 / Dodge Challenger / $25,000), every status-bar element (time, signal, wifi, battery), every menu position, every highlight, every glow, the home indicator pill, the QR code, the headline, the gold panel, the Challenger photo, the disclaimer, the aspect ratio, every margin, every spacing.

THE ONLY CHANGES — replace these EXACT text strings with their giveaway versions, wherever they appear in this image (in the step captions above the phones AND inside the phone screens):

1. Step caption ABOVE phone 1: "TAP 'RAFFLES'" → "TAP 'GIVEAWAYS'"
2. Step caption ABOVE phone 2: "SELECT 'GTA RAFFLE'" → "SELECT 'GTA GIVEAWAY'"
3. Step caption ABOVE phone 3: "TAP 'SCAN RAFFLE TICKET'" → "TAP 'SCAN GIVEAWAY TICKET'"
4. Inside phone 1's screen (side-menu list item): "Raffles" → "Giveaways"
5. Inside phone 2's screen (top-bar header): "RAFFLES" → "GIVEAWAYS"
6. Inside phone 2's screen (card title): "GTA Raffle" → "GTA Giveaway"
7. Inside phone 3's screen (highlighted red-outlined row title): "Scan raffle ticket" → "Scan giveaway ticket"
8. Inside phone 3's screen (row title below): "Share raffle" → "Share giveaway"
9. ANY other occurrence of "raffle" / "raffles" anywhere → "giveaway" / "giveaways"

TEXT RENDERING REQUIREMENTS for phone 3's screen (CRITICAL — current output has been artifacting here):
- The "Scan giveaway ticket" row text must be CRYSTAL CLEAR and pixel-sharp — same font, same weight, same size, same cream color as in the source, just the word "raffle" replaced with "giveaway"
- The thin red rounded-rectangle outline around the "Scan giveaway ticket" row stays IDENTICAL (same stroke width, same red color, same corner radius)
- The subtitle text below "Scan giveaway ticket" stays identical except any "raffle" → "giveaway" within it
- The "Share giveaway" row text below must be equally sharp and legible
- Every other prize row above ("Dodge Challenger", "$1,000" repeated) must remain BYTE-IDENTICAL
- The "EARN ENTRIES" section header must remain BYTE-IDENTICAL
- The iOS status bar at the top of phone 3 (time, signal, battery) must remain BYTE-IDENTICAL
- No font substitution, no kerning changes outside the swapped words, no anti-aliasing artifacts, no color drift

Where a replacement word ("GIVEAWAY"/"GIVEAWAYS") is longer than the original ("RAFFLE"/"RAFFLES"), keep the SAME font, SAME size, SAME alignment — tighten letter-spacing minimally if needed so the line still fits naturally without shrinking the type or breaking to a new line.

Output the same image at the same 4:5 aspect ratio with these surgical text changes applied and nothing else changed.`;

function loadB64(p) { return fs.readFileSync(p).toString("base64"); }

async function run(attempt = 1) {
  if (!fs.existsSync(SRC)) throw new Error(`missing source: ${SRC}`);
  const b64 = loadB64(SRC);
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
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise(r => setTimeout(r, 5000 * attempt));
      return run(attempt + 1);
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, "base64");
      const dst = path.join(OUT_DIR, "content 3 v2.png");
      fs.writeFileSync(dst, buf);
      console.log(`Saved: ${dst}`);
      return dst;
    }
  }
  throw new Error("no image in response");
}

run().catch(e => { console.error(e.message); process.exit(1); });
