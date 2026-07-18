#!/usr/bin/env node
// Regenerate Muha content 1 / 2 / 3 via gpt-image-2 /v1/images/edits using
// the 3 clean phone screenshots as references. gpt-image-2 renders the small
// in-screen typography more crisply than Nano Banana for this kind of layout.
import fs from "fs";

const SRC_DIR = "Muha Giveaway Redesigned/Disclaimer Styled";
const PHONE1 = "Muha Giveaway Assets/raffles SS giveaway.png";
const PHONE2 = "Muha Giveaway Assets/raffle ss 2 giveaway.png";
const PHONE3 = "Muha Giveaway Assets/scan prod giveaway v2.png";

const PROMPT = `LAYOUT REGENERATION — reference image 1 is the LAYOUT ANCHOR. Reproduce reference 1 pixel-faithfully: same Vice City night background with palms and city skyline and red neon glow, same MM gold/cream monogram logo, same "HOW TO ENTER THE MUHA MEMBERS / GIVEAWAY · Vice City" headline (cream letterpress headline + handwritten "Vice City" script), same star ornaments, same red Dodge Challenger photo and lighting, same gold "$25,000 CASH PRIZE + ALL-NEW DODGE CHALLENGER" panel if present, same QR code + "Scan To Find Out!" callout, same step-number circles and step-caption gold/cream text above each phone (1 "GO TO MORE AND TAP 'GIVEAWAYS'", 2 "SELECT 'GTA GIVEAWAY'", 3 "TAP 'SCAN GIVEAWAY TICKET'"), same styled disclaimer at the bottom, same aspect ratio, same composition, same arrangement of the three iPhone mock-ups.

PHONE-SCREEN REPLACEMENT — fill each iPhone's display area with the corresponding clean UI mock-up. The screen UI must read pixel-sharp at this resolution. Every menu row, every status-bar character, every prize-row label, every row title and subtitle must be CRYSTAL CLEAR — no blur, no compression artifacts, no doubled letters, no ghost text, no warped typography.

PHONE-TO-REFERENCE MAPPING:
- Phone 1 (above step caption "1"): fill its display with reference 2 — the side-menu screen with the ACCOUNT header and rows (My Account / My Events / Verification / Rewards / GIVEAWAYS / My Orders / Promotions / Report Counterfeit / My Posts), with GIVEAWAYS row highlighted by a thin red rounded-rectangle outline. Status bar 8:38 / signal / 5G / 98% battery. Bottom tab bar HOME / SOCIAL / VERIFY / EVENTS / MORE with MORE highlighted in a red rounded outline. Use the EXACT same UI from reference 2.
- Phone 2 (above step caption "2"): fill its display with reference 3 — the GIVEAWAYS top-bar header screen, "Your Total Entries" / "Across all active giveaways" subtitle / gold star / ACTIVE-UPCOMING-ENDED tabs with ACTIVE underlined / "GTA Giveaway" card with the muha members GIVEAWAY $25,000 graphic and red Challenger / "2 entered" / "0 entries" / pill tags / bottom tab bar. Use the EXACT same UI from reference 3.
- Phone 3 (above step caption "3"): fill its display with reference 4 — the prize-list + EARN ENTRIES screen: status bar 1:18 / 5G / 65%, back-arrow nav row, 1ST PLACE with gold-filled star + "Dodge Challenger" + "+ $20,000" subtitle, 2ND / 3RD / 4TH PLACE rows each "$1,000" / "$1,000", EARN ENTRIES section header, highlighted "Scan giveaway ticket" row inside thin red rounded outline (QR icon + subtitle), "Share giveaway" row, small disclaimer footer. Use the EXACT same UI from reference 4.

KEEP IDENTICAL TO REFERENCE 1:
- iPhone device chrome (frame, screen rounded corners, notch, side buttons) for all three phones
- Size, position, tilt/perspective, and drop-shadow of each iPhone in the layout
- The Vice City background, headlines, MM logo, Challenger, gold panel, QR, step captions, and disclaimer
- The aspect ratio

TEXT-CLARITY MANDATE: every piece of text inside each iPhone screen must be at maximum sharpness. The viewer must be able to read "GIVEAWAYS", "Giveaways", "Enter to win prizes", "Across all active giveaways", "GTA Giveaway", "1ST PLACE", "Dodge Challenger", "+ $20,000", "2ND/3RD/4TH PLACE / $1,000", "EARN ENTRIES", "Scan giveaway ticket", "Share giveaway", and every status-bar character without any blur or compression. The small in-screen typography MUST be crisp.

NEGATIVE: do NOT change the Vice City background, MM logo, main headline, Challenger photo, QR code, step captions, or styled disclaimer; do NOT shift the phones' positions or change the iPhone frames; do NOT leave the word "raffle" / "raffles" visible anywhere in the output; no blur on phone-screen text; no compression artifacts; no doubled letters; no warped type.`;

const jobs = [
  {
    prompt: PROMPT,
    aspectRatio: "4:5",
    imageSize: "4K",
    refImages: [`${SRC_DIR}/content 1.png`, PHONE1, PHONE2, PHONE3],
    _meta: { name: "content-1-gpt-clean" },
  },
  {
    prompt: PROMPT,
    aspectRatio: "4:5",
    imageSize: "4K",
    refImages: [`${SRC_DIR}/content 2.png`, PHONE1, PHONE2, PHONE3],
    _meta: { name: "content-2-gpt-clean" },
  },
  {
    prompt: PROMPT,
    aspectRatio: "4:5",
    imageSize: "4K",
    refImages: [`${SRC_DIR}/content 3.png`, PHONE1, PHONE2, PHONE3],
    _meta: { name: "content-3-gpt-clean" },
  },
];

fs.writeFileSync("muha-content-regen-gpt.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} jobs`);
