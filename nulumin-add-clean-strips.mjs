#!/usr/bin/env node
// Add CLEAN empty reserved strips to a NuLumin equal-bands base: a TOP strip in the
// top band's color (for a logo, added in post) + a BOTTOM strip in the bottom band's
// color (for footer text, added in post). No logo, no text. Nothing in the base is resized.
// Usage: node nulumin-add-clean-strips.mjs <base.png> [topFrac] [botFrac]
import sharp from "sharp";
import { execSync } from "child_process";

const SRC = process.argv[2];
if (!SRC) { console.error("pass the base png"); process.exit(1); }
const TOP_FRAC = Number(process.argv[3] || 0.11);
const BOT_FRAC = Number(process.argv[4] || 0.135);

const base = sharp(SRC);
const { width: W, height: H } = await base.metadata();
const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;
const sampleRow = (y) => {
  let r = 0, g = 0, b = 0, n = 0;
  for (let x = Math.floor(W * 0.35); x < W * 0.65; x += 3) { const i = (y * W + x) * ch; r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
};
const top = sampleRow(2), bot = sampleRow(H - 3);
const topH = Math.round(H * TOP_FRAC), botH = Math.round(H * BOT_FRAC);
console.log(`top rgb(${top.r},${top.g},${top.b})  bottom rgb(${bot.r},${bot.g},${bot.b})  +top ${topH}px +bot ${botH}px`);

const topStrip = await sharp({ create: { width: W, height: topH, channels: 4, background: { ...top, alpha: 1 } } }).png().toBuffer();
const botStrip = await sharp({ create: { width: W, height: botH, channels: 4, background: { ...bot, alpha: 1 } } }).png().toBuffer();
const baseBuf = await sharp(SRC).png().toBuffer();

const out = SRC.replace(/\.png$/, "_strips.png");
await sharp({ create: { width: W, height: H + topH + botH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([
    { input: topStrip, top: 0, left: 0 },
    { input: baseBuf, top: topH, left: 0 },
    { input: botStrip, top: topH + H, left: 0 },
  ]).png().toFile(out);
console.log(`✓ ${out}  (${W}x${H + topH + botH})`);
try { execSync(`open -a Preview "${out}"`); } catch {}
