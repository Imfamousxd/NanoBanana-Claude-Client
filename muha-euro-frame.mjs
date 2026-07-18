#!/usr/bin/env node
// EURO SUMMER — draw CLEAN, perfectly-even borders in CODE (sharp + SVG) over the
// full-bleed art base. No AI-drawn frames = no wonky/asymmetric edges.
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const BASE = path.join(DIR, "2026-06-08T21-32-10_euro-summer-FULLBLEED.png");
const W = 2048, H = 1024;
const NAVY = "#0F1A3C", GOLD = "#D8B45B", GOLD_HI = "#EAD08A", CREAM = "#F2EAD6";

const svg = (inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`);

// A — minimal double gold keyline (square corners), navy under-stroke for legibility on busy art.
const keyline = svg(`
  <rect x="46" y="46" width="${W-92}" height="${H-92}" fill="none" stroke="${NAVY}" stroke-width="10" opacity="0.55"/>
  <rect x="46" y="46" width="${W-92}" height="${H-92}" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <rect x="64" y="64" width="${W-128}" height="${H-128}" fill="none" stroke="${GOLD_HI}" stroke-width="2.5"/>`);

// B — clean navy matte band (60px, square) + gold inner hairline accent.
const B = 60;
const matte = svg(`
  <path fill-rule="evenodd" fill="${NAVY}" d="M0 0 H${W} V${H} H0 Z M${B} ${B} H${W-B} V${H-B} H${B} Z"/>
  <rect x="${B}" y="${B}" width="${W-2*B}" height="${H-2*B}" fill="none" stroke="${GOLD}" stroke-width="4"/>`);

// C — modern rounded card: round the art corners, thin navy frame band + gold hairline.
const RX = 40, CB = 40, IRX = 18;
const roundMask = svg(`<rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}" fill="#fff"/>`);
const roundedFrame = svg(`
  <path fill-rule="evenodd" fill="${NAVY}"
        d="M0 ${RX} a${RX} ${RX} 0 0 1 ${RX} -${RX} H${W-RX} a${RX} ${RX} 0 0 1 ${RX} ${RX} V${H-RX} a${RX} ${RX} 0 0 1 -${RX} ${RX} H${RX} a${RX} ${RX} 0 0 1 -${RX} -${RX} Z
           M${CB} ${CB+IRX} a${IRX} ${IRX} 0 0 1 ${IRX} -${IRX} H${W-CB-IRX} a${IRX} ${IRX} 0 0 1 ${IRX} ${IRX} V${H-CB-IRX} a${IRX} ${IRX} 0 0 1 -${IRX} ${IRX} H${CB+IRX} a${IRX} ${IRX} 0 0 1 -${IRX} -${IRX} Z"/>
  <rect x="${CB}" y="${CB}" width="${W-2*CB}" height="${H-2*CB}" rx="${IRX}" ry="${IRX}" fill="none" stroke="${GOLD}" stroke-width="3.5"/>`);

const out = [];
async function save(name, buf) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const p = `${DIR}/${stamp}_euro-summer-v4-${name}.png`;
  await buf.png().toFile(p);
  console.log(`✓ ${p}`); out.push(p);
}

// A
await save("A-keyline", sharp(BASE).composite([{ input: keyline, top: 0, left: 0 }]));
// B
await save("B-matte", sharp(BASE).composite([{ input: matte, top: 0, left: 0 }]));
// C — clip to rounded corners first, then frame
const clipped = await sharp(BASE).composite([{ input: roundMask, blend: "dest-in" }]).png().toBuffer();
await save("C-rounded", sharp(clipped).composite([{ input: roundedFrame, top: 0, left: 0 }]));

console.log(`\nDone — ${out.length}/3`);
try { execSync(`open -a Preview ${out.map(r => `"${r}"`).join(" ")}`); } catch {}
