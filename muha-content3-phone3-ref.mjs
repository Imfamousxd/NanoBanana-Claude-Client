#!/usr/bin/env node
// Stage 1: generate a clean isolated iPhone screen render of the Muha Members
// app's "EARN ENTRIES" view, with "Scan giveaway ticket" + "Share giveaway"
// options. Used as a hyper-reference when redoing content 3 so the third
// phone in the composite has crisp legible text.
import fs from "fs";

const jobs = [
  {
    prompt: `A clean, isolated iPhone screen mock-up — 9:16 portrait — showing a single mobile app screen. NO iPhone frame around it, NO surrounding context, NO background — just the full app screen filling the entire canvas edge-to-edge. The screen is the "EARN ENTRIES" view of the Muha Members loyalty app.

DESIGN SYSTEM:
- Pure deep-black background (#0A0A0A), the kind of true-black OLED app background
- All text in clean off-white #F4F1EA cream
- Accent color is warm gold #D6B36A for selected/highlighted elements
- Rows separated by thin subtle dark-gray dividers
- Font: clean modern sans-serif (think Inter or Söhne) — bold for titles, regular for body, all rendered crystal clear at high resolution

SCREEN LAYOUT, top-to-bottom:

1) STATUS BAR (very top, ~3% canvas height): time "1:18" left, cellular signal + wifi + battery icons right, all in cream on the black bg

2) TITLE: "Dodge Challenger" in bold cream, slightly larger than body text, left-aligned with ~6% canvas-width left margin, ~2% margin below status bar. Beneath it a small subtitle row reading "Dodge Challenger × $25,000" in dimmer cream at ~60% opacity, same left alignment.

3) PRIZE LIST — five horizontal rows stacked, each row ~6% canvas height, full width, with subtle dark-gray bottom borders between them. Each row has:
   - Small circular cream icon on the left (~6% margin from left edge)
   - Prize label centered-vertically in cream bold
   - Right side: prize value in cream regular
   Row contents top-to-bottom:
   - "Dodge Challenger" — value "Dodge Challenger × $25,000"
   - "$1,000" — value "$1,000"
   - "$1,000" — value "$1,000"
   - "$1,000" — value "$1,000"
   - "$1,000" — value "$1,000"

4) Section header "EARN ENTRIES" in tracked-out caps, dimmer cream at ~50% opacity, ~6% left margin, with a small bit of breathing room above and below

5) "SCAN GIVEAWAY TICKET" ROW — HIGHLIGHTED with a thin warm-RED rounded-rectangle OUTLINE around the entire row (~2px stroke, no fill, color a saturated brand red #E53935), interior fades to a very subtle dim red wash. Inside the row:
   - Small QR/scanner icon on the left in cream
   - Bold cream title "Scan giveaway ticket"
   - Subtitle in dim cream at ~60% opacity: "Scan a QR code on your Muha Members giveaway ticket to claim your entry"
   The text must be CRYSTAL CLEAR and fully legible — no blur, no compression, no fuzzy edges. Render at hi-fi UI quality.

6) "SHARE GIVEAWAY" ROW — same row format as above but WITHOUT the red outline. Inside:
   - Small share icon on the left in cream
   - Bold cream title "Share giveaway"
   - Subtitle in dim cream at ~60% opacity: "Share this giveaway with a friend to earn +25 entries when they follow our socials"

7) Bottom safe-area gap below the last row, then the iOS home-indicator pill — a small horizontal cream pill at the very bottom-center

CRITICAL: every piece of text on this screen must be sharp and readable at full 4K resolution. NO garbled letters, NO blurred type, NO misspellings. Spell exactly:
- "Scan giveaway ticket" (not raffle)
- "Share giveaway" (not raffle)
- "EARN ENTRIES"
- "Dodge Challenger"
- "$1,000"
- "$25,000"

Style: clean modern UI design mockup, OLED-black dark-mode interface, premium loyalty/rewards app aesthetic. Negative: no iPhone frame, no notch, no surrounding shadow, no background, no extra text, no logos, no warped typography, no blur, no compression artifacts, never write "raffle".`,
    aspectRatio: "9:16",
    imageSize: "4K",
    refImages: [],
    _meta: { name: "muha-phone3-screen-ref" },
  },
];

fs.writeFileSync("muha-content3-phone3-ref.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
