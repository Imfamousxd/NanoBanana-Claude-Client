#!/usr/bin/env node
// Regenerate Muha content 1 / 2 / 3 (Disclaimer Styled versions) using the
// three clean phone-screen references we just produced. Each job passes the
// source content as ref 1 (the LAYOUT ANCHOR) and the three clean phone
// screenshots as refs 2-4. The model is instructed to keep ref 1's background
// / headlines / logos / Challenger / QR / disclaimer 1:1 and only replace the
// three iPhone screen contents with refs 2-4 (in the same order phone 1 → 2 →
// 3 as they appear in the layout).
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

const PHONE1_REF = "Muha Giveaway Assets/raffles SS giveaway.png";        // menu w/ Giveaways highlighted
const PHONE2_REF = "Muha Giveaway Assets/raffle ss 2 giveaway.png";       // GIVEAWAYS header w/ GTA Giveaway card
const PHONE3_REF = "Muha Giveaway Assets/scan prod giveaway v2.png";      // EARN ENTRIES w/ Scan giveaway ticket

const COMMON_PROMPT = `LAYOUT EDIT — reference image 1 (the source content image) is the LAYOUT ANCHOR. Keep EVERY pixel of reference 1 IDENTICAL — same Vice City night background, same MM gold/cream monogram logo, same "HOW TO ENTER THE MUHA MEMBERS' / GIVEAWAY · Vice City" headline (every line, every color, every glow), same red Dodge Challenger photo, same gold "$25,000 CASH PRIZE + ALL-NEW DODGE CHALLENGER" panel if present, same QR code + "Scan To Find Out!" callout, same step-number circles and step-caption gold/cream text above each phone (1 "GO TO MORE AND TAP 'GIVEAWAYS'", 2 "SELECT 'GTA GIVEAWAY'", 3 "TAP 'SCAN GIVEAWAY TICKET'"), same disclaimer at the bottom ("✦ SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM ✦" or its styled form), same aspect ratio, same overall composition.

The ONLY change: replace the SCREEN CONTENT inside each of the three iPhone mock-ups with the corresponding clean reference image, while keeping the iPhone DEVICE CHROME (the frame, screen border, notch, side buttons, drop-shadow underneath) IDENTICAL to reference 1.

PHONE-TO-REFERENCE MAPPING:
- The FIRST / LEFT phone (the one labeled with step "1") — its on-screen content must be replaced with the exact UI shown in reference 2 (the side-menu screen with the ACCOUNT section header and the GIVEAWAYS row highlighted by a red rounded-rectangle outline). The status bar (8:38 / signal / 5G / 98% battery), the menu rows, the icons, the highlighted "Giveaways" row, and the bottom tab bar with MORE highlighted must all appear pixel-faithful to reference 2.
- The SECOND / MIDDLE phone (the one labeled with step "2") — its on-screen content must be replaced with the exact UI shown in reference 3 (the GIVEAWAYS top-bar header screen with "Your Total Entries" / "Across all active giveaways" / ACTIVE-UPCOMING-ENDED tabs / "GTA Giveaway" card with the muha members GIVEAWAY graphic and Dodge Challenger photo). The status bar (1:19 / 5G / 65%), the header, the entries row, the tabs, the card, and the bottom tab bar must all appear pixel-faithful to reference 3.
- The THIRD / RIGHT phone (the one labeled with step "3") — its on-screen content must be replaced with the exact UI shown in reference 4 (the EARN ENTRIES screen with the 1ST PLACE Dodge Challenger + $20,000 row, 2ND/3RD/4TH PLACE $1,000 rows, the highlighted "Scan giveaway ticket" row in a red outline, and the "Share giveaway" row beneath). The status bar (1:18 / 5G / 65%), every prize row, the EARN ENTRIES header, the highlighted row, and the Share giveaway row must all appear pixel-faithful to reference 4.

SCALE / FRAMING: render each replacement screen INSIDE the existing iPhone frame from reference 1 — fit the screen UI to fill the phone's display area, preserve the phone's aspect ratio and tilt/perspective if any. Do NOT change the size or position of any iPhone in the layout. Do NOT change the iPhone device frame color/shape/shadows.

TEXT LEGIBILITY: every text element on every phone screen must be crystal sharp and pixel-readable at the final resolution. Specifically the "Scan giveaway ticket" / "Share giveaway" / "1ST PLACE Dodge Challenger + $20,000" / "GIVEAWAYS" / "Giveaways" strings — no blur, no compression artifacts, no ghost text, no doubled letters.

NEGATIVE: do NOT change anything outside the three phone screens, do NOT change the Vice City background, do NOT change the MM logo, do NOT change the main "GIVEAWAY · Vice City" headline, do NOT change the Challenger photo, do NOT change the QR code, do NOT change the step captions above the phones, do NOT change the disclaimer at the bottom, do NOT shift the phones' positions, do NOT change colors anywhere, do NOT leave the word "raffle" / "raffles" visible anywhere in the output.

Output a single edited image at the same aspect ratio as reference 1.`;

const JOBS = [
  { name: "content 1.png" },
  { name: "content 2.png" },
  { name: "content 3.png" },
];

function loadInline(p) {
  const buf = fs.readFileSync(p);
  return { inline_data: { mime_type: "image/png", data: buf.toString("base64") } };
}

async function editOne(job, attempt = 1) {
  const src = path.join(SRC_DIR, job.name);
  if (!fs.existsSync(src)) return { ok: false, error: `missing ${src}` };
  const dst = path.join(OUT_DIR, job.name.replace(".png", " v3.png"));
  const parts = [
    loadInline(src),         // ref 1 - layout anchor
    loadInline(PHONE1_REF),  // ref 2 - phone 1 screen
    loadInline(PHONE2_REF),  // ref 3 - phone 2 screen
    loadInline(PHONE3_REF),  // ref 4 - phone 3 screen
    { text: COMMON_PROMPT },
  ];
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize: "4K" } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
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
      fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
      return { ok: true, dst };
    }
  }
  return { ok: false, error: "no image in response" };
}

console.log(`Regenerating ${JOBS.length} content image(s) with clean phone refs...`);
const results = await Promise.all(JOBS.map(j => editOne(j)));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.ok) console.log(`  ✓ ${JOBS[i].name} → ${r.dst}`);
  else console.log(`  ✗ ${JOBS[i].name}: ${r.error}`);
}
