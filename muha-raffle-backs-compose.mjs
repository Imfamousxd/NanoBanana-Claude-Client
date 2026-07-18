#!/usr/bin/env node
// Composite the REAL Muha Members logo + ONE fixed 3-line 3D headline onto every clean plate,
// so the text/logo are pixel-identical across all 10 cards. CLI slug filter.
// Tunables via env: LOGO_W, HX (center), W1/W2 (font sizes), Y0/Y1/Y2 (baselines), LOGO_Y.
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLATE_DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs Plates";
const LOGO = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs/Per-Character Backs FINAL";
fs.mkdirSync(outDir, { recursive: true });
const W = 2048, H = 1024;

const HX = +(process.env.HX || 1024);                 // headline center x
const W1 = +(process.env.W1 || 66);                    // "WIN A" size
const W2 = +(process.env.W2 || 118);                   // big lines size
const Y0 = +(process.env.Y0 || 250), Y1 = +(process.env.Y1 || 372), Y2 = +(process.env.Y2 || 496); // baselines
const LOGO_W = +(process.env.LOGO_W || 470), LOGO_Y = +(process.env.LOGO_Y || 36);

const FONT = `font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle"`;
const NAVY = "#0b1330";
// faux-3D line: blurred shadow + stacked extrusion + white face with navy outline
function line(txt, y, size, ls) {
  let ex = "";
  for (let i = 1; i <= 9; i++) ex += `<text x="${HX}" y="${y + i}" ${FONT} font-size="${size}" letter-spacing="${ls}" fill="${NAVY}">${txt}</text>`;
  return `
  <text x="${HX + 5}" y="${y + 15}" ${FONT} font-size="${size}" letter-spacing="${ls}" fill="#000" opacity="0.45" filter="url(#sh)">${txt}</text>
  ${ex}
  <text x="${HX}" y="${y}" ${FONT} font-size="${size}" letter-spacing="${ls}" fill="#ffffff" stroke="${NAVY}" stroke-width="4" paint-order="stroke">${txt}</text>`;
}
const headlineSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs>
  ${line("WIN A", Y0, W1, 4)}
  ${line("2026 FORD", Y1, W2, 2)}
  ${line("MUSTANG", Y2, W2, 6)}
</svg>`);

const latest = (slug) => { const h = fs.readdirSync(PLATE_DIR).filter(f => f.endsWith(`-${slug}.png`)).sort().pop(); return h ? path.join(PLATE_DIR, h) : null; };
const ALL = ["aloha", "blueberry", "slushie", "cookies", "pomegranate", "diesel", "mango", "horchata", "lemon", "watermelon"];
const wanted = process.argv.slice(2).map(s => s.toLowerCase());
const queue = (wanted.length ? wanted : ALL).filter(latest);

const logoBuf = await sharp(LOGO).resize({ width: LOGO_W }).png().toBuffer();
const logoH = Math.round(LOGO_W * 2512 / 7556), logoX = Math.round((W - LOGO_W) / 2);

const out = [];
for (const slug of queue) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const p = `${outDir}/${stamp}_back-final-${slug}.png`;
  await sharp(latest(slug))
    .composite([{ input: logoBuf, top: LOGO_Y, left: logoX }, { input: headlineSvg, top: 0, left: 0 }])
    .png().toFile(p);
  console.log(`✓ ${p}`); out.push(p);
}
console.log(`\nDone — ${out.length}/${queue.length}  (logo ${LOGO_W}x${logoH} @ ${logoX},${LOGO_Y})`);
if (out.length) { try { execSync(`open -a Preview ${out.map(r => `"${r}"`).join(" ")}`); } catch {} }
