import sharp from "sharp";

const src = "DIaled Health.png";
// Downscale the huge 6467px source first, then trim + flatten onto dark charcoal
const small = await sharp(src).resize({ width: 1600 }).png().toBuffer();
const logo = await sharp(small).trim().toBuffer();
const lm = await sharp(logo).metadata();
const pad = Math.round(lm.width * 0.10);
await sharp({
  create: { width: lm.width + pad * 2, height: lm.height + pad * 2, channels: 4, background: { r: 34, g: 34, b: 38, alpha: 1 } },
})
  .composite([{ input: logo, left: pad, top: pad }])
  .png()
  .toFile("Dialed Rythm Rebrand/_ref_logo_full_on_dark.png");
console.log("DONE full logo ref:", lm.width, "x", lm.height);
