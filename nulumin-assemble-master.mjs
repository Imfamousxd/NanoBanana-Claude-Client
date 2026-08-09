#!/usr/bin/env node
// Assemble the final NuLumin master poster from an EQUAL-BANDS base:
// append a TOP purple strip (white NuLumin logo) + BOTTOM green strip (footer URL),
// both filled with the matching band edge color. Nothing in the base is resized.
// Usage: node nulumin-assemble-master.mjs <equal-base.png>
import fs from "fs";
import sharp from "sharp";
import { execSync } from "child_process";

const SRC = process.argv[2];
if (!SRC) { console.error("pass the equal-bands base png"); process.exit(1); }
const LOGO = "NuLumin Assets/NuLumin-logo-nobg-white.png";
const TOP_FRAC = 0.11;   // top purple logo strip height (fraction of base height)
const BOT_FRAC = 0.135;  // bottom green footer strip height

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
console.log(`top purple rgb(${top.r},${top.g},${top.b})  bottom green rgb(${bot.r},${bot.g},${bot.b})  +top ${topH}px +bot ${botH}px`);

// --- top strip: purple field + centered white logo (trimmed), crop-safe width ---
const logoTrim = await sharp(LOGO).trim().toBuffer();
const lt = await sharp(logoTrim).metadata();
let lh = Math.round(topH * 0.52);
let lw = Math.round(lh * (lt.width / lt.height));
const maxW = Math.round(W * 0.42);
if (lw > maxW) { lw = maxW; lh = Math.round(lw * (lt.height / lt.width)); }
const logoR = await sharp(logoTrim).resize(lw, lh).toBuffer();
const topStrip = await sharp({ create: { width: W, height: topH, channels: 4, background: { ...top, alpha: 1 } } })
  .composite([{ input: logoR, left: Math.round((W - lw) / 2), top: Math.round((topH - lh) / 2) }])
  .png().toBuffer();

// --- bottom strip: green field + footer (spectrum bar + 2 text lines), crop-safe ---
const barW = Math.round(W * 0.20), barX = Math.round((W - barW) / 2);
const cy = botH / 2;
const footSvg = `<svg width="${W}" height="${botH}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#6A2BAF"/><stop offset="27%" stop-color="#2D90D3"/>
    <stop offset="52%" stop-color="#2E9F6E"/><stop offset="76%" stop-color="#DBA32C"/>
    <stop offset="100%" stop-color="#DB3A8E"/></linearGradient></defs>
  <rect x="${barX}" y="${Math.round(cy - botH * 0.24)}" width="${barW}" height="${Math.round(botH * 0.045)}" rx="${Math.round(botH * 0.022)}" fill="url(#spec)"/>
  <text x="${W / 2}" y="${Math.round(cy + botH * 0.02)}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="${Math.round(botH * 0.13)}" letter-spacing="${Math.round(botH * 0.05)}">MANUFACTURED BY NULUMIN</text>
  <text x="${W / 2}" y="${Math.round(cy + botH * 0.30)}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(botH * 0.20)}" letter-spacing="${Math.round(botH * 0.08)}">NULUMIN.ORG</text>
</svg>`;
const botStrip = await sharp({ create: { width: W, height: botH, channels: 4, background: { ...bot, alpha: 1 } } })
  .composite([{ input: Buffer.from(footSvg) }]).png().toBuffer();

// --- stack: top strip / base / bottom strip ---
const baseBuf = await sharp(SRC).png().toBuffer();
const out = SRC.replace(/\.png$/, "_final.png");
await sharp({ create: { width: W, height: H + topH + botH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([
    { input: topStrip, top: 0, left: 0 },
    { input: baseBuf, top: topH, left: 0 },
    { input: botStrip, top: topH + H, left: 0 },
  ]).png().toFile(out);
console.log(`✓ ${out}  (${W}x${H + topH + botH})`);
try { execSync(`open -a Preview "${out}"`); } catch {}
