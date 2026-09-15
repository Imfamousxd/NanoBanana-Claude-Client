// Measure — arithmetic about a video, never a judgement: cuts, shot rhythm, loudness, camera motion,
// speech statistics. The same measurements sieve-corpus.py and the videogen MCP's reference_breakdown
// make, so a DAM row and a house law talk about the same numbers.
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

/** Scene-change timestamps (seconds). threshold 0.3 matches the corpus tooling. */
export async function sceneCuts(filePath, { threshold = 0.3, maxSeconds = 900 } = {}) {
  try {
    const { stdout, stderr } = await run(FFMPEG, ["-hide_banner", "-t", String(maxSeconds), "-i", filePath, "-filter_complex", `select='gt(scene,${threshold})',metadata=print:file=-`, "-an", "-f", "null", "-"], { maxBuffer: 32 * 1024 * 1024 });
    const text = `${stdout}\n${stderr}`;
    const cuts = [];
    for (const line of text.split("\n")) {
      const match = line.match(/pts_time:([0-9.]+)/);
      if (match) cuts.push(Math.round(Number(match[1]) * 100) / 100);
    }
    return cuts;
  } catch {
    return [];
  }
}

/** EBU R128 integrated loudness (LUFS) or null when there is no audio. */
export async function loudnessLufs(filePath, { maxSeconds = 900 } = {}) {
  try {
    const { stderr } = await run(FFMPEG, ["-hide_banner", "-t", String(maxSeconds), "-i", filePath, "-af", "ebur128=peak=true", "-f", "null", "-"], { maxBuffer: 32 * 1024 * 1024 });
    let value = null;
    for (const line of stderr.split("\n")) {
      const match = line.match(/^\s*I:\s*(-?[0-9.]+)\s*LUFS/);
      if (match) value = Number(match[1]);
    }
    return value;
  } catch {
    return null;
  }
}

/**
 * Camera/motion energy from a 2 fps 32x32 greyscale stream: mean absolute frame difference per step.
 * mean = how much the picture changes; jitter = how erratic that change is (handheld reads high);
 * stillRatio = share of steps with almost no change (tripod talking head reads high).
 */
export function motionStats(rawGray, width = 32, height = 32) {
  const frameSize = width * height;
  const frames = Math.floor(rawGray.length / frameSize);
  if (frames < 2) return { frames, mean: null, p90: null, jitter: null, stillRatio: null, series: [] };
  const series = [];
  for (let f = 1; f < frames; f += 1) {
    let sum = 0;
    const a = (f - 1) * frameSize;
    const b = f * frameSize;
    for (let i = 0; i < frameSize; i += 1) sum += Math.abs(rawGray[b + i] - rawGray[a + i]);
    series.push(sum / frameSize / 255);
  }
  const sorted = [...series].sort((x, y) => x - y);
  const mean = series.reduce((x, y) => x + y, 0) / series.length;
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  const diffs = series.slice(1).map((value, index) => Math.abs(value - series[index]));
  const jitter = diffs.length ? diffs.reduce((x, y) => x + y, 0) / diffs.length : 0;
  const stillRatio = series.filter((value) => value < 0.01).length / series.length;
  return { frames, mean: round(mean, 4), p90: round(p90, 4), jitter: round(jitter, 4), stillRatio: round(stillRatio, 3), series: series.map((value) => round(value, 4)) };
}

export function motionSeries(filePath, { fps = 2, size = 32, maxSeconds = 900 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-t", String(maxSeconds), "-i", filePath, "-vf", `fps=${fps},scale=${size}:${size},format=gray`, "-f", "rawvideo", "-"]);
    const chunks = [];
    let total = 0;
    child.stdout.on("data", (chunk) => { if (total < 64 * 1024 * 1024) { chunks.push(chunk); total += chunk.length; } });
    child.on("close", () => resolve(motionStats(Buffer.concat(chunks), size, size)));
    child.on("error", () => resolve(motionStats(Buffer.alloc(0), size, size)));
  });
}

/** Speech statistics from transcript segments [{start,end,text}] — the articulation gate the house laws use. */
export function speechStats(segments = []) {
  const clean = segments.filter((segment) => segment && typeof segment.text === "string" && segment.text.trim());
  const text = clean.map((segment) => segment.text.trim()).join(" ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const speaking = clean.reduce((sum, segment) => sum + Math.max(0, (segment.end || 0) - (segment.start || 0)), 0);
  const pauses = [];
  for (let i = 1; i < clean.length; i += 1) {
    const gap = (clean[i].start || 0) - (clean[i - 1].end || 0);
    if (gap >= 0.3) pauses.push(round(gap, 2));
  }
  return {
    text,
    words,
    speaking_s: round(speaking, 2),
    articulation_wps: speaking > 0.5 ? round(words / speaking, 2) : null,
    hook_end_s: clean.length ? round(clean[0].end, 2) : null,
    hook_words: clean.length ? clean[0].text.trim().split(/\s+/).length : 0,
    tail_words: clean.length ? clean.at(-1).text.trim().split(/\s+/).length : 0,
    pauses_over_300ms: pauses,
  };
}

export function shotRhythm(durationS, cuts) {
  const count = cuts.length + 1;
  return { shot_count: count, avg_shot_s: durationS ? round(durationS / count, 2) : null, lane: count === 1 ? "single-take" : count <= 4 ? "few-cuts" : "montage" };
}

export async function measureVideo(filePath, { durationS, hasAudio, width, height, fps, maxSeconds = 900 } = {}) {
  const [cuts, lufs, motion] = await Promise.all([
    sceneCuts(filePath, { maxSeconds }),
    hasAudio ? loudnessLufs(filePath, { maxSeconds }) : Promise.resolve(null),
    motionSeries(filePath, { maxSeconds }),
  ]);
  const { series: _series, ...motionSummary } = motion;
  return {
    duration_s: durationS ? round(durationS, 2) : null,
    width, height, fps,
    ratio: width && height ? `${width}x${height}` : null,
    has_audio: Boolean(hasAudio),
    cuts,
    ...shotRhythm(durationS, cuts),
    loudness_lufs: lufs,
    motion: motionSummary,
    camera_read: cameraRead(motionSummary),
  };
}

/** Deterministic first read of the camera; the model refines it from the contact sheet. */
export function cameraRead(motion) {
  if (motion.mean === null) return "unknown";
  if (motion.stillRatio >= 0.7 && motion.jitter < 0.01) return "locked-off";
  if (motion.mean < 0.03 && motion.jitter < 0.015) return "mostly-still";
  if (motion.jitter > 0.03) return "handheld-erratic";
  return "moving";
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
