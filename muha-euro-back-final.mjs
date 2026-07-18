#!/usr/bin/env node
// EURO SUMMER — BACK final: drop the REAL QR into the painted stamp's blank center
// (color-matched to the paper so it looks printed), + even outer border matching the front.
// Swap target:  QR_URL="https://..." node muha-euro-back-final.mjs
import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const BASE = path.join(DIR, "2026-06-08T22-05-12_euro-summer-BACK-painted.png");
const QR_URL = process.env.QR_URL || "https://muhameds.com/euro-summer"; // PLACEHOLDER
const W = 2048, H = 1024, B = 56;
const NAVY = "#0F1A3C", GOLD = "#C9A24B";

// blank stamp center (measured from the painted render)
const CX = Number(process.env.CX || 1703), CY = Number(process.env.CY || 406), QRW = Number(process.env.QRW || 290);
const qx = Math.round(CX - QRW / 2), qy = Math.round(CY - QRW / 2);

const border = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <path fill-rule="evenodd" fill="${NAVY}" d="M0 0 H${W} V${H} H0 Z M${B} ${B} H${W - B} V${H - B} H${B} Z"/>
  <rect x="${B}" y="${B}" width="${W - 2 * B}" height="${H - 2 * B}" fill="none" stroke="${GOLD}" stroke-width="4"/>
</svg>`);

const layers = [{ input: border, top: 0, left: 0 }];
let note = "no QR composited (blank painted stamp)";
if (!process.env.NO_QR) {
  // sample the paper color at the stamp center so the QR background blends in
  const [r, g, b] = await sharp(BASE).extract({ left: CX - 15, top: CY - 15, width: 30, height: 30 }).resize(1, 1).raw().toBuffer();
  const paper = `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
  const qrPng = await QRCode.toBuffer(QR_URL, { type: "png", errorCorrectionLevel: "H", margin: 2, width: QRW, color: { dark: "#14213f", light: paper } });
  layers.unshift({ input: qrPng, top: qy, left: qx });
  note = `QR -> ${QR_URL}  (paper ${paper}, ${QRW}px @ ${CX},${CY})`;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = `${DIR}/${stamp}_euro-summer-BACK${process.env.NO_QR ? "-noqr" : "-FINAL"}.png`;
await sharp(BASE).composite(layers).png().toFile(out);
console.log(`✓ ${out}\n  ${note}`);
try { execSync(`open -a Preview "${out}"`); } catch {}
