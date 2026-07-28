import fs from "node:fs";
import path from "node:path";
import { mimeForPath, resolveInside, sha256Buffer } from "../core/files.mjs";

function pngInfo(buffer) {
  if (buffer.length < 26 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") return null;
  const colorType = buffer[25];
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    alphaChannel: colorType === 4 || colorType === 6,
  };
}

function jpegInfo(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (startOfFrame.has(marker)) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
        bitDepth: buffer[offset + 4],
        alphaChannel: false,
      };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function webpInfo(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const format = buffer.toString("ascii", 12, 16);
  if (format === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height, alphaChannel: Boolean(buffer[20] & 0x10) };
  }
  return null;
}

export function inspectImageBuffer(buffer, _declaredMime) {
  const png = pngInfo(buffer);
  if (png) return { mime: "image/png", ...png };
  const jpeg = jpegInfo(buffer);
  if (jpeg) return { mime: "image/jpeg", ...jpeg };
  const webp = webpInfo(buffer);
  if (webp) return { mime: "image/webp", ...webp };
  return null;
}

export function inspectAsset(root, asset) {
  const filePath = resolveInside(root, asset.path, `asset ${asset.role}`);
  const stat = fs.statSync(filePath);
  const extensionMime = mimeForPath(filePath);
  const buffer = fs.readFileSync(filePath);
  const image = extensionMime.startsWith("image/") ? inspectImageBuffer(buffer, extensionMime) : null;
  const mime = image?.mime || extensionMime;
  return {
    path: asset.path,
    absolutePath: filePath,
    role: asset.role,
    instructions: asset.instructions || "",
    bytes: stat.size,
    mime,
    extensionMime,
    extensionMismatch: Boolean(image && image.mime !== extensionMime),
    sha256: sha256Buffer(buffer),
    media: image ? { kind: "image", ...image } : { kind: mime.split("/")[0] || "file" },
    basename: path.basename(filePath),
  };
}

export function inspectAssets(root, assets) {
  return assets.filter((asset) => fs.existsSync(path.resolve(root, asset.path))).map((asset) => inspectAsset(root, asset));
}
