// Probe — everything we can know about a file WITHOUT a model: dimensions, duration, codecs, alpha,
// perceptual hash (dedupe and near-duplicate grouping), dominant colours, keyframes, a contact sheet
// and a small proxy. All of it is deterministic and free, so it runs on every file and is the base
// the paid stages stand on.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mediaKindForName } from "./taxonomy.mjs";

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

export function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath).on("data", (chunk) => hash.update(chunk)).on("end", () => resolve(hash.digest("hex"))).on("error", reject);
  });
}

export function ratioLabel(width, height) {
  if (!width || !height) return null;
  const r = width / height;
  const table = { "9:16": 9 / 16, "4:5": 0.8, "1:1": 1, "3:4": 0.75, "4:3": 4 / 3, "16:9": 16 / 9, "2:3": 2 / 3, "3:2": 1.5, "21:9": 21 / 9 };
  let best = "other";
  let bestDelta = Infinity;
  for (const [label, value] of Object.entries(table)) {
    const delta = Math.abs(value - r);
    if (delta < bestDelta) { best = label; bestDelta = delta; }
  }
  return bestDelta <= 0.04 * (table[best] || 1) ? best : "other";
}

/** 64-bit DCT-free average-hash on a 8x8 luminance grid (fast, good enough for exact/near dupes). */
export async function perceptualHash(sharpInstance) {
  const { data } = await sharpInstance.clone().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  // difference hash: compare horizontally adjacent pixels on a 9x8 grid -> 64 bits
  let bits = "";
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      bits += left > right ? "1" : "0";
    }
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

export function hammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return 64;
  let x = BigInt(`0x${hexA}`) ^ BigInt(`0x${hexB}`);
  let count = 0;
  while (x) { count += Number(x & 1n); x >>= 1n; }
  return count;
}

export async function dominantColors(sharpInstance, count = 5) {
  const { data, info } = await sharpInstance.clone().resize(48, 48, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] >> 4, g = data[i + 1] >> 4, b = data[i + 2] >> 4;
    const key = (r << 8) | (g << 4) | b;
    const entry = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    entry.n += 1; entry.r += data[i]; entry.g += data[i + 1]; entry.b += data[i + 2];
    buckets.set(key, entry);
  }
  const total = data.length / info.channels;
  return [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count).map((entry) => ({
    hex: `#${[entry.r, entry.g, entry.b].map((value) => Math.round(value / entry.n).toString(16).padStart(2, "0")).join("")}`,
    share: Math.round((entry.n / total) * 1000) / 1000,
  }));
}

export async function probeImage(filePath) {
  const { default: sharp } = await import("sharp");
  const image = sharp(filePath, { failOn: "none", limitInputPixels: 300_000_000 });
  const meta = await image.metadata();
  const [phash, colors] = await Promise.all([perceptualHash(image), dominantColors(image)]);
  return {
    kind: "image",
    width: meta.width || null,
    height: meta.height || null,
    orientation: ratioLabel(meta.width, meta.height),
    hasAlpha: Boolean(meta.hasAlpha),
    format: meta.format || null,
    pages: meta.pages || 1,
    phash,
    dominantColors: colors,
  };
}

export async function ffprobe(filePath) {
  const { stdout } = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels", "-of", "json", filePath], { maxBuffer: 8 * 1024 * 1024 });
  const data = JSON.parse(stdout || "{}");
  const video = (data.streams || []).find((stream) => stream.codec_type === "video") || null;
  const audio = (data.streams || []).find((stream) => stream.codec_type === "audio") || null;
  const fps = video?.r_frame_rate ? (() => { const [n, d] = video.r_frame_rate.split("/").map(Number); return d ? Math.round((n / d) * 100) / 100 : null; })() : null;
  return {
    durationS: Number(data.format?.duration) || null,
    bitRate: Number(data.format?.bit_rate) || null,
    width: video?.width || null,
    height: video?.height || null,
    fps,
    videoCodec: video?.codec_name || null,
    audioCodec: audio?.codec_name || null,
    hasAudio: Boolean(audio),
    sampleRate: audio?.sample_rate ? Number(audio.sample_rate) : null,
  };
}

/** Extract one JPEG frame at `t` seconds. Returns the output path or null if the frame could not be read. */
export async function extractFrame(filePath, t, outPath, { maxWidth = 1280 } = {}) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  try {
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-ss", t.toFixed(3), "-i", filePath, "-frames:v", "1", "-vf", `scale='min(${maxWidth},iw)':-2`, "-q:v", "3", outPath], { maxBuffer: 1024 * 1024 });
    return fs.existsSync(outPath) ? outPath : null;
  } catch {
    return null;
  }
}

/** Keyframe timestamps: first usable frame, the 1s hook frame, then shot midpoints (or even spacing). */
export function keyframeTimes(durationS, cuts = [], count = 10) {
  if (!durationS || durationS <= 0) return [0];
  const times = new Set([Math.min(0.2, durationS / 4), Math.min(1, durationS / 2)]);
  const boundaries = [0, ...cuts.filter((t) => t > 0 && t < durationS), durationS];
  const midpoints = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) midpoints.push((boundaries[i] + boundaries[i + 1]) / 2);
  if (midpoints.length > count - 2) {
    const step = midpoints.length / (count - 2);
    for (let i = 0; i < count - 2; i += 1) times.add(midpoints[Math.floor(i * step)]);
  } else {
    for (const t of midpoints) times.add(t);
    // pad with even spacing when there are few cuts
    let need = count - times.size;
    for (let i = 1; need > 0 && i <= count; i += 1) {
      const t = (durationS * i) / (count + 1);
      if (![...times].some((existing) => Math.abs(existing - t) < durationS / (count * 2))) { times.add(t); need -= 1; }
    }
  }
  return [...times].filter((t) => t < durationS).sort((a, b) => a - b).slice(0, count);
}

/** Keyframes from a remote URL via ranged seeks — for files too large to download whole. */
export async function extractKeyframesFromUrl(url, times, outDir, { maxWidth = 1280 } = {}) {
  const frames = [];
  fs.mkdirSync(outDir, { recursive: true });
  for (const [index, t] of times.entries()) {
    const outPath = path.join(outDir, `kf_${String(index).padStart(2, "0")}_${t.toFixed(2)}s.jpg`);
    try {
      await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5", "-ss", t.toFixed(3), "-i", url, "-frames:v", "1", "-vf", `scale='min(${maxWidth},iw)':-2`, "-q:v", "3", outPath], { maxBuffer: 1024 * 1024, timeout: 120_000 });
      if (fs.existsSync(outPath)) frames.push({ t: Math.round(t * 100) / 100, path: outPath });
    } catch { /* a seek that fails just loses one frame */ }
  }
  return frames;
}

export async function extractKeyframes(filePath, times, outDir) {
  const frames = [];
  for (const [index, t] of times.entries()) {
    const outPath = path.join(outDir, `kf_${String(index).padStart(2, "0")}_${t.toFixed(2)}s.jpg`);
    const saved = await extractFrame(filePath, t, outPath);
    if (saved) frames.push({ t: Math.round(t * 100) / 100, path: saved });
  }
  return frames;
}

/** Grid contact sheet with a timestamp strip — what the model reads instead of the whole video. */
export async function contactSheet(frames, outPath, { columns = 4, tile = 480 } = {}) {
  if (!frames.length) return null;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const { default: sharp } = await import("sharp");
  const rows = Math.ceil(frames.length / columns);
  const label = 26;
  const composites = [];
  for (const [index, frame] of frames.entries()) {
    const buffer = await sharp(frame.path).resize(tile, tile, { fit: "contain", background: "#111" }).jpeg({ quality: 82 }).toBuffer();
    const x = (index % columns) * tile;
    const y = Math.floor(index / columns) * (tile + label);
    composites.push({ input: buffer, left: x, top: y });
    const svg = Buffer.from(`<svg width="${tile}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="18" font-family="Helvetica,Arial" font-size="15" fill="#fff">#${index + 1}  t=${frame.t}s</text></svg>`);
    composites.push({ input: svg, left: x, top: y + tile });
  }
  await sharp({ create: { width: columns * tile, height: rows * (tile + label), channels: 3, background: "#111" } }).composite(composites).jpeg({ quality: 82 }).toFile(outPath);
  return outPath;
}

export async function makeThumb(sourcePath, outPath, width = 512) {
  const { default: sharp } = await import("sharp");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(sourcePath, { failOn: "none" }).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).flatten({ background: "#f1f1f1" }).jpeg({ quality: 80 }).toFile(outPath);
  return outPath;
}

/** A model-sized JPEG (<= maxEdge px, <= ~1.5MB) for the vision call. */
export async function modelImage(sourcePath, outPath, { maxEdge = 1536 } = {}) {
  const { default: sharp } = await import("sharp");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(sourcePath, { failOn: "none" }).rotate().resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toFile(outPath);
  return outPath;
}

/** 720p H.264 preview proxy, capped to `maxSeconds` (kept short: it is for browsing, not delivery). */
export async function makeVideoProxy(filePath, outPath, { height = 720, maxSeconds = 90 } = {}) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", filePath, "-t", String(maxSeconds), "-vf", `scale=-2:'min(${height},ih)'`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", outPath], { maxBuffer: 1024 * 1024 });
  return outPath;
}

export async function extractAudio(filePath, outPath, { maxSeconds = 900 } = {}) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", filePath, "-t", String(maxSeconds), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "48k", outPath], { maxBuffer: 1024 * 1024 });
  return outPath;
}

/** Page 1 of a PDF as a JPEG: pdftoppm (Linux/Docker) or sips (macOS). Returns the path or null. */
export async function renderPdfFirstPage(filePath, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const stem = outPath.replace(/\.jpg$/i, "");
  try {
    await run("pdftoppm", ["-jpeg", "-r", "110", "-f", "1", "-l", "1", "-singlefile", filePath, stem], { maxBuffer: 1024 * 1024 });
    if (fs.existsSync(`${stem}.jpg`)) return `${stem}.jpg`;
  } catch { /* no poppler here */ }
  try {
    await run("sips", ["-s", "format", "jpeg", filePath, "--out", outPath], { maxBuffer: 1024 * 1024 });
    if (fs.existsSync(outPath)) return outPath;
  } catch { /* not macOS */ }
  return null;
}

/** Probe any file: returns a normalised technical record. Videos also get a first-frame phash. */
export async function probeFile(filePath, workDir) {
  const kind = mediaKindForName(filePath);
  const stat = fs.statSync(filePath);
  const base = { kind, bytes: stat.size, contentHash: await sha256File(filePath) };
  if (kind === "image") {
    try { return { ...base, ...(await probeImage(filePath)) }; } catch (error) { return { ...base, error: `image probe: ${error.message}` }; }
  }
  if (kind === "document" && /\.pdf$/i.test(filePath)) {
    const rendered = await renderPdfFirstPage(filePath, path.join(workDir, "pdf", `${base.contentHash.slice(0, 16)}.jpg`));
    if (!rendered) return { ...base, error: "pdf render: no pdftoppm or sips available" };
    try { const image = await probeImage(rendered); return { ...base, ...image, kind: "document", pdfRender: rendered }; } catch (error) { return { ...base, error: `pdf probe: ${error.message}` }; }
  }
  if (kind === "video") {
    try {
      const info = await ffprobe(filePath);
      const frameDir = path.join(workDir, "probe");
      const first = await extractFrame(filePath, Math.min(0.5, (info.durationS || 1) / 3), path.join(frameDir, `${base.contentHash.slice(0, 16)}_first.jpg`));
      let phash = null;
      let colors = null;
      if (first) {
        const { default: sharp } = await import("sharp");
        const image = sharp(first);
        [phash, colors] = await Promise.all([perceptualHash(image), dominantColors(image)]);
      }
      return { ...base, ...info, orientation: ratioLabel(info.width, info.height), phash, dominantColors: colors, firstFrame: first };
    } catch (error) {
      return { ...base, error: `ffprobe: ${error.message}` };
    }
  }
  return base;
}
