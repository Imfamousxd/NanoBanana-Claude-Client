#!/usr/bin/env node
// sieve-veo.mjs — long-form talking video in ONE model, natively.
//
//   node sieve-veo.mjs --spec sieve/longform/veo-30s.json [--dry-run]
//
// WHY THIS REPLACES THE STITCHING PIPELINE
// Veo 3.1 generates audio and video jointly, so lip sync is native rather than assembled, and
// `video` extension CONTINUES one generation instead of starting a new one. That means voice,
// face, wardrobe and room carry across every seam for free — no seed matching, no voice cloning,
// no TTS, no post-hoc lip-sync, no frame chaining.
//
// The alternative built earlier (Seedance segments -> cloned TTS -> lipsync-2-pro -> concat) exists
// because a stale note claimed Veo extension was 16:9-only. It is not; verified in 9:16.
//
// HARD CONSTRAINTS, all found by probing (2026-07-29):
//   - extension input MUST be 720p. 1080p is rejected outright, so long-form tops out at 720x1280.
//     Need 1080p? Then you get one 8s shot, no extension.
//   - extension takes a URI, NOT inline bytes ("Video URI not found in the request").
//   - `durationSeconds` must be 8 when using extension, referenceImages, or 1080p/4k.
//   - each extension adds ~7s; documented up to 20 extensions (~148s).
//   - `referenceImages` (max 3) is mutually exclusive with `image`, and on :predictLongRunning it
//     wants {image:{bytesBase64Encoded,mimeType},referenceType:"asset"} — NOT the `inlineData`
//     shape ai.google.dev documents, which 400s.
//
// SPEC:
//   { "id":"REC-veo-30", "avatar":"Tasha",
//     "firstFrame":"path.png",              // optional; or "identity":[up to 3 anchor paths]
//     "aspect_ratio":"9:16",
//     "opening":"<what she says first>",
//     "extensions":["<next line>","<next line>"],   // ~7s each
//     "style":"<shared staging/look sentence appended to every beat>" }
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.GEMINI_API_KEY;
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "veo-3.1-fast-generate-preview";   // $0.12/s; standard tier is $0.40/s for no gain here

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry-run");
// chain  = each beat extends the previous OUTPUT. One continuous take, but drift COMPOUNDS:
//          measured 72% voice-timbre jump and visible composition creep by beat 2.
// anchor  = each beat generated independently from the SAME approved frame + SAME voice
//          descriptor, then cut together. Nothing inherits from a drifted parent, so nothing
//          accumulates. Costs hard cuts every ~8s, which UGC does constantly anyway.
const MODE = (() => { const i = process.argv.indexOf("--mode"); return i > -1 ? process.argv[i+1] : "anchor"; })();
if (!["chain","anchor"].includes(MODE)) { console.error(`--mode must be chain or anchor`); process.exit(2); }
const specPath = arg("spec");
if (!KEY) { console.error("GEMINI_API_KEY not set"); process.exit(1); }
if (!specPath) { console.error("usage: node sieve-veo.mjs --spec <spec.json> [--dry-run]"); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.isAbsolute(specPath) ? specPath : path.join(ROOT, specPath), "utf-8"));

const errs = [];
if (!spec.opening) errs.push("no `opening` line");
if ((spec.extensions ?? []).length > 20) errs.push("max 20 extensions (~148s)");
if (spec.firstFrame && !fs.existsSync(path.join(ROOT, spec.firstFrame))) errs.push(`firstFrame not found: ${spec.firstFrame}`);
if ((spec.identity ?? []).length > 3) errs.push("referenceImages accepts at most 3");
if (spec.firstFrame && spec.identity?.length) errs.push("`firstFrame` and `identity` are mutually exclusive");
if (errs.length) { console.error("\nSPEC REJECTED:\n" + errs.map((e) => "  - " + e).join("\n") + "\n"); process.exit(2); }

// The avatar's VOICE DESCRIPTOR, pulled from its kit and prepended VERBATIM to every beat.
// This is what makes an avatar sound like the same person ACROSS separate pieces. Extensions
// already carry the voice WITHIN a piece, but a fresh generation is a fresh roll: measured
// 2026-07-29 (E19), two runs without a shared descriptor sat 15.2% apart in median pitch; with a
// byte-identical descriptor, 3.7% — inside normal human speaker variation. Do not paraphrase it
// per-shot, or the avatar drifts into a different person between videos.
let voice = spec.voice ? spec.voice.trim() + " " : "";
if (voice) console.log(`  voice descriptor: inline on the spec`);
if (!voice && spec.avatar) {
  const kitPath = path.join(ROOT, "Avatars", spec.avatar, "identity.json");
  if (fs.existsSync(kitPath)) {
    const kit = JSON.parse(fs.readFileSync(kitPath, "utf-8"));
    if (kit.veoVoice) { voice = kit.veoVoice.trim() + " "; console.log(`  voice descriptor: from Avatars/${spec.avatar}/identity.json`); }
    else console.log(`  ! ${spec.avatar} has no \`veoVoice\` — this piece will not match their other videos.\n`
      + `    Add one to its identity.json so the voice is stable across pieces.`);
  }
}

const beats = [spec.opening, ...(spec.extensions ?? [])];
const total = 8 + (beats.length - 1) * 7;
console.log(`\n${spec.id} — ${beats.length} beat(s), ~${total}s · ${MODEL}`);
console.log(MODE === "chain"
  ? `  720p forced · chain: one continuous take, but drift compounds every hop`
  : `  ${beats.length} independent beat(s) from the same anchor · no compounding · hard cuts between`);
beats.forEach((b, i) => console.log(`  ${String(i + 1).padStart(2)}. ${i ? "+7s" : " 8s"}  ${b.slice(0, 66)}`));
console.log(`  est. cost ~$${(total * 0.12).toFixed(2)}\n`);
if (DRY) { console.log("DRY RUN — nothing billed.\n"); process.exit(0); }

const img = (p) => {
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  const ext = path.extname(abs).toLowerCase();
  return { bytesBase64Encoded: fs.readFileSync(abs).toString("base64"),
           mimeType: ext === ".png" ? "image/png" : "image/jpeg" };
};

// A Veo output lands in the Files API and is briefly PROCESSING. Extending it in that window
// fails with the misleading "Input video must be a video that was generated by VEO that has been
// processed" — which reads like the video is the wrong KIND, not the wrong TIME. Verified
// 2026-07-29: the identical file rejected mid-run was accepted minutes later once ACTIVE.
// So chaining works; it just has to wait its turn.
async function waitActive(uri, label) {
  const id = uri.match(/files\/([^:?/]+)/)?.[1];
  if (!id) return;
  for (let i = 0; i < 60; i++) {
    const r = await fetch(`${BASE}/files/${id}`, { headers: { "x-goog-api-key": KEY } });
    if (r.ok) {
      const f = await r.json();
      if (f.state === "ACTIVE") { if (i) console.log(`    (ready after ${i * 5}s)`); return; }
      if (f.state === "FAILED") throw new Error(`${label}: source video FAILED processing`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`${label}: source video never became ACTIVE`);
}

async function submit(instance, label) {
  const res = await fetch(`${BASE}/models/${MODEL}:predictLongRunning`, {
    method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ instances: [instance],
      parameters: { durationSeconds: 8, resolution: "720p", aspectRatio: spec.aspect_ratio ?? "9:16" } }),
  });
  if (!res.ok) throw new Error(`${label}: ${res.status} ${(await res.text()).slice(0, 240)}`);
  const { name } = await res.json();
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const d = await (await fetch(`${BASE}/${name}`, { headers: { "x-goog-api-key": KEY } })).json();
    if (d.error) throw new Error(`${label}: ${JSON.stringify(d.error).slice(0, 220)}`);
    if (d.done) {
      const r = d.response ?? {};
      const v = r.generateVideoResponse?.generatedSamples ?? r.generatedSamples
        ?? r.generateVideoResponse?.generatedVideos ?? r.generatedVideos ?? [];
      const uri = v[0]?.video?.uri;
      if (!uri) throw new Error(`${label}: no video in response`);
      return uri;
    }
  }
  throw new Error(`${label}: timed out`);
}

const OUT = path.join(ROOT, "generations", "veo", spec.id);
fs.mkdirSync(OUT, { recursive: true });

const style = spec.style ? " " + spec.style : "";
const parts = [];
let uri = null;

for (const [i, beat] of beats.entries()) {
  const n = i + 1;
  console.log(`beat ${n}/${beats.length} — ${i ? "extending" : "opening"} …`);
  const instance = { prompt: voice + (i ? `Unbroken continuation, same person, same room, same energy. ` : "")
    + `They say: "${beat}"` + style };

  if (i === 0) {
    // referenceImages locks identity but forbids a first frame; a first frame also fixes the
    // aspect ratio, which is why a 9:16 SCENE frame (not a 3:4 portrait) matters here.
    if (spec.identity?.length) instance.referenceImages = spec.identity.map((p) => ({ image: img(p), referenceType: "asset" }));
    else if (spec.firstFrame) instance.image = img(spec.firstFrame);
  } else if (MODE === "chain") {
    await waitActive(uri, `beat${n}`);                 // must be ACTIVE or the extend 400s
    instance.video = { uri, mimeType: "video/mp4" };   // URI, never inline bytes
  } else {
    // ANCHOR: restart from the original anchor every time. Identical conditioning each beat.
    if (spec.identity?.length) instance.referenceImages = spec.identity.map((p) => ({ image: img(p), referenceType: "asset" }));
    else if (spec.firstFrame) instance.image = img(spec.firstFrame);
  }

  try {
    uri = await submit(instance, `beat${n}`);
  } catch (e) {
    console.error(`  ✗ ${e.message}`);
    console.error(`  Stopping — a piece missing its middle is not deliverable.`);
    break;
  }
  const f = path.join(OUT, `beat${String(n).padStart(2, "0")}.mp4`);
  fs.writeFileSync(f, Buffer.from(await (await fetch(`${uri}&key=${KEY}`)).arrayBuffer()));
  parts.push(f);
  console.log(`  ✓ ${path.relative(ROOT, f)}`);
}

if (!parts.length) process.exit(1);
const final = path.join(OUT, `${spec.id}_FINAL.mp4`);
if (MODE === "chain") {
  // Each extension returns the WHOLE video so far, so the last file IS the piece.
  fs.copyFileSync(parts[parts.length - 1], final);
} else {
  // Anchor beats are independent clips; join them. Re-encode rather than stream-copy so the
  // cut points are clean and the timebases agree.
  const lst = path.join(OUT, "beats.txt");
  fs.writeFileSync(lst, parts.map((f) => `file '${path.basename(f)}'`).join("\n"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "beats.txt",
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", path.basename(final)],
    { cwd: OUT });
}
const p = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=width,height", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", final]).toString().trim().split("\n");
console.log(`\n✓ ${path.relative(ROOT, final)}  ${p[0]}x${p[1]}  ${Number(p[2]).toFixed(1)}s`);
console.log(`\nVerify the face held:  node sieve-avatar.mjs verify ${spec.avatar ?? "<Avatar>"} --candidates '<frames dir>'\n`);
