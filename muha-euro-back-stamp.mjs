#!/usr/bin/env node
// EURO SUMMER — BACK v2: map is the hero. QR = a real scannable code inside a perforated
// POSTAGE STAMP; "SCAN TO ENTER" on a gold vintage RIBBON. Even outer border (matches front).
// Swap target:  QR_URL="https://..." node muha-euro-back-stamp.mjs
import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const BASE = path.join(DIR, "2026-06-08T21-51-49_euro-summer-BACK-map-FULLBLEED.png");
const QR_URL = process.env.QR_URL || "https://muhameds.com/euro-summer"; // PLACEHOLDER
const W = 2048, H = 1024;
const NAVY = "#0F1A3C", GOLD = "#C9A24B", PAPER = "#FBF4E2", INK = "#16213f";

// ---- scalloped (postage-stamp) outline -------------------------------------
function scallop(x, y, w, h, r) {
  const nx = Math.max(4, Math.round(w / (2 * r))), ny = Math.max(4, Math.round(h / (2 * r)));
  const sx = w / nx, sy = h / ny;
  let d = `M ${x} ${y} `;
  for (let i = 0; i < nx; i++) d += `a ${sx / 2} ${sx / 2} 0 0 1 ${sx} 0 `;
  for (let i = 0; i < ny; i++) d += `a ${sy / 2} ${sy / 2} 0 0 1 0 ${sy} `;
  for (let i = 0; i < nx; i++) d += `a ${sx / 2} ${sx / 2} 0 0 1 ${-sx} 0 `;
  for (let i = 0; i < ny; i++) d += `a ${sy / 2} ${sy / 2} 0 0 1 0 ${-sy} `;
  return d + "Z";
}

// ---- placement -------------------------------------------------------------
const B = 56;                          // outer matte band
const cxR = 1700;                      // right-region center
const SW = 404, SH = 452, sx0 = cxR - SW / 2, sy0 = 118;   // stamp box
const QRW = 286, qx = Math.round(cxR - QRW / 2), qy = sy0 + 96;
const RW = 548, RH = 104, rx0 = cxR - RW / 2, ry0 = 636, t = 46;  // ribbon (t = tail length)

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#EBCB74"/><stop offset="0.5" stop-color="#CBA24C"/><stop offset="1" stop-color="#A9802F"/>
  </linearGradient>
</defs>

<!-- outer even matte border + gold rule (matches front) -->
<path fill-rule="evenodd" fill="${NAVY}" d="M0 0 H${W} V${H} H0 Z M${B} ${B} H${W - B} V${H - B} H${B} Z"/>
<rect x="${B}" y="${B}" width="${W - 2 * B}" height="${H - 2 * B}" fill="none" stroke="${GOLD}" stroke-width="4"/>

<!-- POSTAGE STAMP: soft shadow, white scalloped paper, inner perforation keyline -->
<path d="${scallop(sx0 + 7, sy0 + 8, SW, SH, 15)}" fill="#000" opacity="0.22"/>
<path d="${scallop(sx0, sy0, SW, SH, 15)}" fill="${PAPER}" stroke="#d8cba6" stroke-width="1.5"/>
<rect x="${sx0 + 22}" y="${sy0 + 22}" width="${SW - 44}" height="${SH - 44}" fill="none" stroke="${NAVY}" stroke-width="2" stroke-dasharray="2 7" opacity="0.5"/>
<text x="${cxR}" y="${sy0 + 64}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="700" letter-spacing="3" fill="${NAVY}">EURO SUMMER</text>
<text x="${cxR}" y="${sy0 + SH - 30}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" letter-spacing="2" fill="${GOLD}">$20K&#160;TRIP</text>

<!-- gold vintage RIBBON: SCAN TO ENTER -->
<polygon points="${rx0},${ry0 + 14} ${rx0 + t},${ry0} ${rx0 + t},${ry0 + RH} ${rx0},${ry0 + RH + 14}" fill="#8f6a26"/>
<polygon points="${rx0 + RW},${ry0 + 14} ${rx0 + RW - t},${ry0} ${rx0 + RW - t},${ry0 + RH} ${rx0 + RW},${ry0 + RH + 14}" fill="#8f6a26"/>
<rect x="${rx0 + t - 6}" y="${ry0}" width="${RW - 2 * t + 12}" height="${RH}" rx="6" fill="url(#gold)" stroke="#7d5c20" stroke-width="2"/>
<rect x="${rx0 + t + 8}" y="${ry0 + 10}" width="${RW - 2 * t - 16}" height="${RH - 20}" rx="4" fill="none" stroke="#fff6dd" stroke-width="1.5" opacity="0.7"/>
<text x="${cxR}" y="${ry0 + RH / 2 + 14}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700" letter-spacing="4" fill="${NAVY}">SCAN TO ENTER</text>

<!-- tiny caption under ribbon -->
<text x="${cxR}" y="${ry0 + RH + 60}" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-style="italic" fill="${PAPER}">every scan = one entry · Muha Members app</text>
</svg>`);

const qrPng = await QRCode.toBuffer(QR_URL, { type: "png", errorCorrectionLevel: "H", margin: 1, width: QRW, color: { dark: "#101a3a", light: "#FBF4E2" } });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = `${DIR}/${stamp}_euro-summer-BACK-v2.png`;
await sharp(BASE).composite([{ input: svg, top: 0, left: 0 }, { input: qrPng, top: qy, left: qx }]).png().toFile(out);
console.log(`✓ ${out}\n  QR -> ${QR_URL}`);
try { execSync(`open -a Preview "${out}"`); } catch {}
