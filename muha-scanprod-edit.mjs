#!/usr/bin/env node
// Surgical NB edit on Muha Giveaway Assets/scan prod.png:
// - 1st-place top header → "Dodge Challenger + $20,000"
// - 2nd / 3rd / 4th place rows → $1,000 each
// - REMOVE the 5th-place row entirely
// - "Scan product code" → "Scan giveaway ticket"
// - All "raffle" → "giveaway" in subtitles
// Keep everything else 1:1 with the source.
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
const SRC = "Muha Giveaway Assets/scan prod.png";
const DST = "Muha Giveaway Assets/scan prod giveaway.png";

const PROMPT = `SURGICAL EDIT — keep this iPhone screenshot 1:1 with the source. Preserve every pixel of the dark OLED app background, the status bar (time "1:18", signal/5G/battery icons), the back-arrow + gold-star top header, the EXACT same row styling/dividers/corner-radius/icons/spacing, the same typography/font/weights/sizes, the same red rounded-rectangle highlight outline, the same disclaimer footer text and icon, the same overall aspect ratio.

THE ONLY CHANGES:

1) TOP HEADER ROW ("1st-place" Dodge Challenger row at the very top of the screen, just below the status bar):
   - Keep the back-arrow and the gold star icon and the "1:18 Dodge Challenger" status-bar/title rendering
   - Update the SUBTITLE under the bold "Dodge Challenger" title (currently reads "Dodge Challenger") to read "Dodge Challenger + $20,000" — same cream/gray subtitle color, same font weight, same size, same position
   - The bold title "Dodge Challenger" stays as-is

2) PRIZE ROWS — currently shows 4 rows (2ND PLACE, 3RD PLACE, 4TH PLACE, 5TH PLACE), each with "$5,000" as the bold value and "$5,000" as the smaller subtitle. EDIT AS FOLLOWS:
   - 2ND PLACE row: change BOTH the bold value AND the subtitle from "$5,000" / "$5,000" to "$1,000" / "$1,000"
   - 3RD PLACE row: same change — "$1,000" / "$1,000"
   - 4TH PLACE row: same change — "$1,000" / "$1,000"
   - REMOVE the 5TH PLACE row ENTIRELY (delete the entire row including its star icon, label, value, subtitle, dividers). Close the gap so the layout flows naturally: the 4TH PLACE row is now the last prize row, followed directly by the "EARN ENTRIES" section header with its usual margin.
   - Keep all row styling (icon position, font weights, colors, dividers, corner radius, padding) IDENTICAL to the existing 2nd-4th rows

3) "EARN ENTRIES" section header — UNCHANGED (same caps, same letter-spacing, same color, same position)

4) HIGHLIGHTED ROW (currently "Scan product code" with red outline):
   - Title: change "Scan product code" → "Scan giveaway ticket" (same font, weight, size, color, alignment)
   - Subtitle below: change "Verify Muha Meds products to earn raffle entries for this campaign." → "Scan a QR code on your Muha Members giveaway ticket to claim your entry"
   - Icon on the left: keep the same QR/scanner icon — DO NOT change it
   - Red rounded-rectangle outline around the row: keep IDENTICAL (same stroke, same red color, same corner radius)

5) "SHARE RAFFLE" ROW BELOW:
   - Title: change "Share raffle" → "Share giveaway" (same font, weight, size, color)
   - Subtitle: change "Share this raffle with a friend to earn +10 entries. Limited to 1 share per raffle." → "Share this giveaway with a friend to earn +10 entries. Limited to 1 share per giveaway."
   - Icon on the left: keep IDENTICAL

6) DISCLAIMER FOOTER ("All entries are subject to review..."): keep IDENTICAL

NEGATIVE RULES:
- Do NOT change the status bar
- Do NOT change icons (star icons, scanner icon, share icon, info icon)
- Do NOT change colors anywhere except the literal text strings listed above
- Do NOT change the red highlight outline
- Do NOT change row spacing/padding (apart from collapsing the 5th-place gap)
- Do NOT add new rows
- Do NOT introduce new graphics
- Do NOT change the font — use the EXACT same modern sans-serif typeface, weights, and sizes as the source
- Do NOT leave any "raffle" or "$5,000" or "5TH PLACE" visible anywhere
- Render every changed text string CRYSTAL CLEAR and pixel-sharp — no blur, no compression artifacts, no fuzzy edges
- Aspect ratio stays the same as the input

Output the edited screenshot at the same aspect ratio as the input.`;

const b64 = fs.readFileSync(SRC).toString("base64");

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

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    fs.writeFileSync(DST, Buffer.from(part.inlineData.data, "base64"));
    console.log(`Saved: ${DST}`);
    process.exit(0);
  }
}
console.error("no image in response");
process.exit(1);
