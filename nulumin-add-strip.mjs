#!/usr/bin/env node
// Append an empty GREEN link strip beneath the green band of a NuLumin no-logo poster.
// Strip is filled with the band's own bottom-edge green and matched to the band's exact width.
// Nothing in the poster is resized — no squish.  Usage: node nulumin-add-strip.mjs <src.png> [frac]
import sharp from "sharp";
import { execSync } from "child_process";

const src = process.argv[2];
const frac = Number(process.argv[3] || 0.12);
if (!src) { console.error("pass a source png"); process.exit(1); }

const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: ch } = info;
const isWhite = (i) => data[i] > 242 && data[i + 1] > 242 && data[i + 2] > 242;

// bottom edge of the green band = last row (scanning center cols) that isn't all white
const cx0 = Math.floor(W * 0.30), cx1 = Math.floor(W * 0.70);
const rowWhite = (y) => { for (let x = cx0; x < cx1; x += 6) if (!isWhite((y * W + x) * ch)) return false; return true; };
let gb = H - 1; for (let y = H - 1; y >= 0; y--) { if (!rowWhite(y)) { gb = y; break; } }

// green horizontal extent on that row (so the strip matches the band's width, keeping any white side margins)
let lx = W, rx = 0;
for (let x = 0; x < W; x++) { if (!isWhite((gb * W + x) * ch)) { if (x < lx) lx = x; if (x > rx) rx = x; } }
const coreW = Math.max(1, rx - lx + 1);

// average the band's bottom-edge green across that extent
let r = 0, g = 0, b = 0, cnt = 0;
for (let y = Math.max(0, gb - 5); y <= gb; y++) for (let x = lx; x <= rx; x++) { const i = (y * W + x) * ch; if (!isWhite(i)) { r += data[i]; g += data[i + 1]; b += data[i + 2]; cnt++; } }
r = Math.round(r / cnt); g = Math.round(g / cnt); b = Math.round(b / cnt);
console.log(`band bottom y=${gb}, x[${lx}..${rx}], green=rgb(${r},${g},${b})`);

const stripH = Math.round(H * frac);
const cut = Math.min(gb + 1, H);
const bottomH = H - cut;

const greenCore = await sharp({ create: { width: coreW, height: stripH, channels: 4, background: { r, g, b, alpha: 1 } } }).png().toBuffer();
const strip = await sharp({ create: { width: W, height: stripH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([{ input: greenCore, top: 0, left: lx }]).png().toBuffer();
const top = await sharp(src).extract({ left: 0, top: 0, width: W, height: cut }).png().toBuffer();

const layers = [{ input: top, top: 0, left: 0 }, { input: strip, top: cut, left: 0 }];
if (bottomH > 0) {
  const bottom = await sharp(src).extract({ left: 0, top: cut, width: W, height: bottomH }).png().toBuffer();
  layers.push({ input: bottom, top: cut + stripH, left: 0 });
}

const dst = src.replace(/(_linkspace)?\.png$/, "_linkspace.png");
await sharp({ create: { width: W, height: H + stripH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite(layers).png().toFile(dst);
console.log(`✓ ${dst}  (+${stripH}px green link strip)`);
