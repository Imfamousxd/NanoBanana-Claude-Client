// Minimal RGBA PNG writer + rectangular mask generator (no external deps).
// For gpt-image-2 /v1/images/edits: TRANSPARENT (alpha 0) areas are EDITABLE,
// OPAQUE (alpha 255) areas are FROZEN. We make a horizontal band editable.
import zlib from "zlib";
import fs from "fs";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// editableBands: array of [y0frac, y1frac] ranges that should be TRANSPARENT (editable).
export function writeRectMask(outPath, width, height, editableBands) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type 6 = RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const frac = y / height;
    let editable = false;
    for (const [a, b] of editableBands) if (frac >= a && frac < b) { editable = true; break; }
    const alpha = editable ? 0 : 255;
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 4;
      raw[p] = 0; raw[p + 1] = 0; raw[p + 2] = 0; raw[p + 3] = alpha;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(outPath, png);
  return outPath;
}
