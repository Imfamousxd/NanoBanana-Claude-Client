#!/usr/bin/env node
// EURO SUMMER — BACK: composite the even outer border + a right-side QR panel (own border)
// with code-drawn "SCAN TO ENTER" text and a REAL scannable QR code. All geometry computed
// => perfectly even. Swap the QR target with:  QR_URL="https://..." node muha-euro-back-frame.mjs
import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const BASE = path.join(DIR, "2026-06-08T21-51-49_euro-summer-BACK-map-FULLBLEED.png");
const QR_URL = process.env.QR_URL || "https://muhameds.com/euro-summer"; // PLACEHOLDER — swap for real entry link
const W = 2048, H = 1024;
const NAVY = "#0F1A3C", GOLD = "#C9A24B", GOLD_HI = "#EAD08A", CREAM = "#F4EBD6";

// ---- right-side QR panel geometry ----
const B = 56;                 // outer matte band
const G = 26;                 // gap from inner frame to panel
const PW = 540;               // panel width
const px2 = W - B - G, px1 = px2 - PW;        // panel x range
const py1 = B + G, py2 = H - B - G;           // panel y range
const cx = (px1 + px2) / 2;                    // panel center x
// QR backing
const QB = 452;               // white backing square
const qbx = Math.round(cx - QB / 2), qby = 300;
const QRW = 396;              // qr image size
const qrx = Math.round(cx - QRW / 2), qry = qby + (QB - QRW) / 2;

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- subtle ticket perforation just left of the panel -->
  <line x1="${px1 - 18}" y1="${py1 - 6}" x2="${px1 - 18}" y2="${py2 + 6}" stroke="${NAVY}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 15" opacity="0.55"/>
  <!-- outer even matte band + gold inner rule -->
  <path fill-rule="evenodd" fill="${NAVY}" d="M0 0 H${W} V${H} H0 Z M${B} ${B} H${W - B} V${H - B} H${B} Z"/>
  <rect x="${B}" y="${B}" width="${W - 2 * B}" height="${H - 2 * B}" fill="none" stroke="${GOLD}" stroke-width="4"/>
  <!-- QR panel: cream card w/ navy border + gold inner rule -->
  <rect x="${px1}" y="${py1}" width="${PW}" height="${py2 - py1}" rx="22" fill="${CREAM}" stroke="${NAVY}" stroke-width="7"/>
  <rect x="${px1 + 12}" y="${py1 + 12}" width="${PW - 24}" height="${py2 - py1 - 24}" rx="14" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
  <!-- panel text -->
  <text x="${cx}" y="${py1 + 70}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6" fill="${GOLD}">EURO SUMMER</text>
  <text x="${cx}" y="${py1 + 132}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="50" font-weight="800" letter-spacing="2" fill="${NAVY}">SCAN TO ENTER</text>
  <line x1="${cx - 150}" y1="${py1 + 158}" x2="${cx + 150}" y2="${py1 + 158}" stroke="${GOLD}" stroke-width="2.5"/>
  <!-- white QR backing -->
  <rect x="${qbx}" y="${qby}" width="${QB}" height="${QB}" rx="16" fill="#FFFFFF" stroke="${NAVY}" stroke-width="2"/>
  <!-- captions under QR -->
  <text x="${cx}" y="${qby + QB + 56}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${NAVY}">Every scan = 1 entry</text>
  <text x="${cx}" y="${qby + QB + 100}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="1" fill="${GOLD}">MUHA MEMBERS APP</text>
  <text x="${cx}" y="${qby + QB + 138}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${NAVY}">${QR_URL.replace(/^https?:\/\//, "")}</text>
</svg>`);

const qrPng = await QRCode.toBuffer(QR_URL, { type: "png", errorCorrectionLevel: "H", margin: 2, width: QRW, color: { dark: "#0E1430", light: "#FFFFFF" } });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = `${DIR}/${stamp}_euro-summer-BACK-v1.png`;
await sharp(BASE)
  .composite([{ input: svg, top: 0, left: 0 }, { input: qrPng, top: qry, left: qrx }])
  .png().toFile(out);
console.log(`✓ ${out}\n  QR -> ${QR_URL}`);
try { execSync(`open -a Preview "${out}"`); } catch {}
