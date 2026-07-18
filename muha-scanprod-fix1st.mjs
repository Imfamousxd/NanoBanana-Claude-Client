#!/usr/bin/env node
// Fix the 1st-place row visibility — currently it's crammed behind the iPhone
// status bar. Move it down so it sits as a proper prize-list row matching the
// 2nd/3rd/4th rows, and give the status bar its own clear strip at the top.
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
const SRC = "Muha Giveaway Assets/scan prod giveaway.png";
const DST = "Muha Giveaway Assets/scan prod giveaway v2.png";

const PROMPT = `SURGICAL LAYOUT EDIT — fix the 1st-place row at the top of this iPhone screen. The current issue: the 1ST PLACE prize row is sitting BEHIND the iOS status bar so the "1:18" time text and "5G/65% battery" icons are overlapping the row content, making it crammed and unreadable. Fix this by giving the status bar its own clear strip and moving the 1st-place row down to its proper position as the FIRST prize row in the list.

KEEP IDENTICAL TO SOURCE:
- The deep black OLED background
- All four prize rows' typography and styling
- The 2ND PLACE / 3RD PLACE / 4TH PLACE rows (each "$1,000" / "$1,000" subtitle, star icons, dividers, corner radius, spacing) — UNCHANGED
- The "EARN ENTRIES" section header — UNCHANGED
- The "Scan giveaway ticket" highlighted red-outlined row (icon, title, subtitle, red outline) — UNCHANGED
- The "Share giveaway" row below it — UNCHANGED
- The disclaimer footer at the bottom — UNCHANGED
- The overall aspect ratio — UNCHANGED

FIX THE TOP OF THE SCREEN:

1) STATUS BAR (top ~3% of canvas height) — clean iOS status bar on its own strip, no overlap with any content row beneath it:
   - Left: time "1:18" in cream/white
   - Right: cellular signal bars, "5G", battery icon with "65" — all in cream/white
   - Centered notch/dynamic-island area (small dark pill) if visible in source — keep
   - Below the status bar there should be CLEAR DARK BACKGROUND with NO content overlap

2) NAVIGATION ROW (just below status bar, ~5% canvas height) — small back-arrow chevron "<" on the left, in a small circular dark button. Nothing else in this row. Keep the small "<" back-arrow chevron from the source.

3) 1ST PLACE PRIZE ROW (below the nav row) — render this as a PROPER prize-list row matching the EXACT same visual treatment as the 2nd/3rd/4th rows below it (same row height, same corner-rounded dark card, same horizontal padding, same left-icon-box size, same typography, same dividers). The row contents:
   - LEFT: a square rounded icon box matching the size and style of the 2nd/3rd/4th icon boxes; inside it a GOLD-FILLED star icon (filled solid gold/orange to indicate "1st place winner" — the same star icon shape as the other rows but solid gold fill instead of outline)
   - Right of icon: stacked text, left-aligned:
     • Small caps label "1ST PLACE" in dim cream/gray at ~60% opacity, tracked-out, matching the "2ND PLACE / 3RD PLACE / 4TH PLACE" labels in the rows below — same font, same size, same color
     • Below that, BOLD primary value "Dodge Challenger" in cream — same font weight and size as "$1,000" in the other rows
     • Below that, smaller subtitle "+ $20,000" in dim cream at ~60% opacity — same style as the subtitle "$1,000" in the other rows

NEW STRUCTURE TOP-TO-BOTTOM:
- Status bar strip (clear, no overlap)
- Nav row with back-arrow
- 1ST PLACE prize row (gold star, Dodge Challenger, + $20,000)
- 2ND PLACE row ($1,000 / $1,000) — exactly as in source
- 3RD PLACE row ($1,000 / $1,000) — exactly as in source
- 4TH PLACE row ($1,000 / $1,000) — exactly as in source
- "EARN ENTRIES" section header — exactly as in source
- "Scan giveaway ticket" highlighted row — exactly as in source
- "Share giveaway" row — exactly as in source
- Disclaimer footer — exactly as in source

The 1ST PLACE row must look like it belongs in the same prize-list as 2nd/3rd/4th — visually consistent. NO page-title styling, NO oversized title text. Just a normal prize-list row with "1ST PLACE" label + "Dodge Challenger" bold value + "+ $20,000" subtitle, gold-filled star icon to indicate the winning tier.

NEGATIVE:
- The status bar must NOT overlap any prize-row content
- The "1:18" / "5G" / battery icons stay in their iOS status bar at the very top
- NO "Dodge Challenger" page-title heading anywhere — that styling is gone; it becomes the 1ST PLACE row instead
- The gold star in the 1st place row must be FILLED gold (winner indicator), not the outline-style star used in 2nd/4th
- Every text string must be crystal sharp — no blur, no compression artifacts
- The aspect ratio stays the same as the input
- No changes to anything below the 4th-place row

Output a single edited image at the same aspect ratio as the input.`;

const b64 = fs.readFileSync(SRC).toString("base64");
const body = {
  contents: [{ parts: [{ inline_data: { mime_type: "image/png", data: b64 } }, { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize: "4K" } },
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
