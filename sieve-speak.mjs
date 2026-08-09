#!/usr/bin/env node
// sieve-speak.mjs — the avatar's own voice, on demand.
//
//   node sieve-speak.mjs --avatar Marcus --text "So I— okay, I rested it. Six weeks." --out line.wav
//   node sieve-speak.mjs --avatar Marcus --text "..." --out line.wav --room clip.mp4
//   node sieve-speak.mjs --sync video.mp4 --audio line.wav --out synced.mp4
//
// WHY NOT JUST USE SEEDANCE'S AUDIO (E10/E11/E12, all measured 2026-07-28)
//   - Seedance generates voice and video jointly, so the mouth is a byproduct of sampling. Nothing
//     optimises phoneme accuracy, and loose sync is the single loudest "this is AI" signal.
//   - Its audio length is welded to the video length, so a short line gets stretched into an ad read.
//   - BUT its casting is good: the voice it invents suits the face because it derived one from the
//     other. So `sieve-avatar.mjs voice` harvests that casting into a voiceprint, and this speaks
//     from the voiceprint with full control over pace and delivery.
//
// ENGINE CHOICE IS NOT ARBITRARY. Measured three ways:
//   - generic `minimax` voice_id vs the character: similarity "none". It has never seen the face.
//   - disfluency written into minimax: rendered "artificial and robotic" — reads as voiceover.
//   - `resemble-ai/chatterbox` cloned from the voiceprint: similarity "strong", reads as a person,
//     and KEEPS the disfluency you wrote.
// So: chatterbox, cloned, always.
//
// WRITE THE LINE DIRTY. Clean text produces clean delivery, which is the tell. Put the false
// starts in: "So I— okay, I rested it. Six weeks. Six full weeks, and... honestly? Nothing."
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const H = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json" };
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };

async function run(model, input, timeoutS = 600) {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST", headers: { ...H, Prefer: "wait=60" }, body: JSON.stringify({ input }),
  });
  let p = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(p).slice(0, 220)}`);
  const t0 = Date.now();
  while (!["succeeded", "failed", "canceled"].includes(p.status)) {
    if ((Date.now() - t0) / 1000 > timeoutS) throw new Error("timeout");
    await new Promise((r) => setTimeout(r, 4000));
    p = await (await fetch(p.urls.get, { headers: H })).json();
  }
  if (p.status !== "succeeded") throw new Error(String(p.error ?? p.status));
  return Array.isArray(p.output) ? p.output[0] : p.output;
}
const dl = async (url, dst) => fs.writeFileSync(dst, Buffer.from(await (await fetch(url)).arrayBuffer()));
const uri = (p, mime) => `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;

// ─── --sync mode: lay finished audio onto a video ────────────────────────────
if (process.argv.includes("--sync")) {
  const video = arg("sync"), audio = arg("audio"), out = arg("out", "synced.mp4");
  if (!video || !audio) { console.error("usage: --sync <video.mp4> --audio <line.wav> --out <out.mp4>"); process.exit(2); }
  // Compress but DO NOT downscale. lipsync returns at the input resolution, so scaling here
  // silently halves your delivery res. Verified 2026-07-28: a 10s 1080x1920 clip at CRF 30 is
  // ~1.6 MB (~2.1 MB base64) and uploads fine — there was never a reason to drop to 720.
  const small = path.join(path.dirname(out), "_tosync.mp4");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-an", small]);
  console.log(`  lip-syncing ${path.basename(video)} …`);
  const url = await run("sync/lipsync-2-pro", {
    video: uri(small, "video/mp4"),
    audio: uri(audio, audio.endsWith(".mp3") ? "audio/mpeg" : "audio/wav"),
    sync_mode: arg("sync_mode", "cut_off"),
    temperature: Number(arg("temperature", "0.5")),
  }, 1200);
  await dl(url, out);
  fs.unlinkSync(small);
  console.log(`  ✓ ${out}`);
  process.exit(0);
}

// ─── speak mode ──────────────────────────────────────────────────────────────
const avatar = arg("avatar"), text = arg("text"), out = arg("out");
if (!avatar || !text || !out) {
  console.error(`usage: node sieve-speak.mjs --avatar <Name> --text "..." --out <file.wav> [--room <clip.mp4>]
       node sieve-speak.mjs --sync <video.mp4> --audio <line.wav> --out <out.mp4>

  --room <clip.mp4>   harvest room tone from that clip and mix it under the voice.
                      Verified to help: a dry take reads "too clean to be mistaken for a phone
                      recording"; with tone it "grounds the voice in an environment". Harvesting
                      beats synthesising noise — it is the room the video was generated in.
  --exaggeration      default 0.7. Higher = more expressive/disfluent.`);
  process.exit(2);
}

const idf = path.join(ROOT, "Avatars", avatar, "identity.json");
if (!fs.existsSync(idf)) { console.error(`No Avatars/${avatar}/identity.json`); process.exit(2); }
const kit = JSON.parse(fs.readFileSync(idf, "utf-8"));
if (!kit.voiceprint) { console.error(`${avatar} has no voiceprint — run: node sieve-avatar.mjs voice ${avatar}`); process.exit(2); }
const print = path.join(ROOT, "Avatars", avatar, kit.voiceprint);
if (!fs.existsSync(print)) { console.error(`Voiceprint missing: ${print}`); process.exit(2); }

const words = text.trim().split(/\s+/).length;
console.log(`\n${avatar} speaking — ${words} words, cloned from ${kit.voiceprint}`);

const url = await run("resemble-ai/chatterbox", {
  prompt: text,
  audio_prompt: uri(print, "audio/wav"),
  exaggeration: Number(arg("exaggeration", "0.7")),
  cfg_weight: Number(arg("cfg_weight", "0.4")),
  temperature: Number(arg("temperature", "0.9")),
});
const dry = out.replace(/\.wav$/i, "_dry.wav");
await dl(url, dry);

const room = arg("room");
if (room && fs.existsSync(room)) {
  const tmp = path.join(path.dirname(out), "_tone.wav");
  const bed = path.join(path.dirname(out), "_bed.wav");
  // Grab a quiet second of the clip's own ambience, loop it, sit it well under the voice.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", "8.6", "-t", "1.2", "-i", room, "-vn", "-ac", "1", "-ar", "24000", tmp]);
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", dry]).toString().trim();
  execFileSync("ffmpeg", ["-y", "-v", "error", "-stream_loop", "-1", "-i", tmp, "-t", dur, "-af", "volume=0.055,highshelf=g=-4:f=4000", bed]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", dry, "-i", bed, "-filter_complex",
    "[0:a]aresample=24000[v];[1:a]aresample=24000[b];[v][b]amix=inputs=2:duration=first:weights=1 1:normalize=0[o]",
    "-map", "[o]", out]);
  for (const f of [tmp, bed]) fs.unlinkSync(f);
  console.log(`  + room tone from ${path.basename(room)}`);
} else {
  fs.copyFileSync(dry, out);
}

const secs = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", out]).toString().trim());
console.log(`  ✓ ${out}  ${secs.toFixed(2)}s  (${(words / secs).toFixed(2)} words/sec)`);
if (words / secs < 2.3) console.log(`  ! under 2.3 w/s reads as narration — raise --exaggeration or write a longer line.`);
