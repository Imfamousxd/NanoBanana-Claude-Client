#!/usr/bin/env node
// Reposition the NuLumin master footer: cover the centered footer block using a clean
// green slice lifted from the original's empty left corner (matches the vertical
// gradient so no visible box), then place "MANUFACTURED BY NULUMIN" bottom-left and
// "NULUMIN.ORG" bottom-right (same format).
import sharp from "sharp";
import { execSync } from "child_process";

const SRC = "/tmp/nulumin_master15.png";
const OUT = "Nulumin Booth/30x70 Master Poster/nulumin-master_footer-corners.png";
const { width: W, height: H } = await sharp(SRC).metadata();

// cover region over the old centered footer (bar + 2 lines)
const cx = 205, cy = 1883, cw = 440, cyh = H - cy; // to bottom edge

// clean green slice from the original's empty far-left corner, same vertical band
const slice = await sharp(SRC).extract({ left: 30, top: cy, width: 70, height: cyh }).toBuffer();
const cover = await sharp(slice).resize(cw, cyh, { fit: "fill" }).png().toBuffer();

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="46" y="1966" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="20" letter-spacing="4">MANUFACTURED BY NULUMIN</text>
  <text x="${W - 46}" y="1970" text-anchor="end" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="32" letter-spacing="3">NULUMIN.ORG</text>
</svg>`;

await sharp(SRC)
  .composite([{ input: cover, left: cx, top: cy }, { input: Buffer.from(svg) }])
  .png().toFile(OUT);
console.log(`OK ${OUT}`);
try { execSync(`open -a Preview "${OUT}"`); } catch {}
