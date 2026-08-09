#!/usr/bin/env node
// Dialed Health — 9:16 video ad pipeline.
//
//   env -u OPENAI_API_KEY node dh-video-ads.mjs                 # dry run, $0
//   env -u OPENAI_API_KEY node dh-video-ads.mjs --only DH-V01 --live
//   env -u OPENAI_API_KEY node dh-video-ads.mjs --live --force   # ignore destination gate
//
// The OPENAI_API_KEY strip is mandatory on this Mac — see CLAUDE.md "LOCAL
// MACHINE NOTE": ~/.secrets exports an older key that silently wins over .env.
//
// ── Why this exists ────────────────────────────────────────────────────────
// The account's own numbers: seven of eight conversions came from vertical
// video (Reels 4, Stories 3). Instagram is 76% of spend, iPhone 98%, 100%
// California, women 72% of spend with 35-44 the efficient segment.
//
// Dialed Health's finished creative library is 10 static ads, of which 3 are
// 9:16, and ZERO video. The video stack in this repo is proven — Seedance 1.5
// Pro talking clips, Kling b-roll, last-frame chaining, ffmpeg stitch — it has
// simply never been pointed at Dialed Health. This points it.
//
// ── The rules this encodes so they cannot be forgotten ─────────────────────
// 1. 9:16 only. Never lead with 1:1; Facebook feed is the worst placement in
//    the account and gets no bespoke creative.
// 2. Hook inside 2 seconds, re-hook every 3-5. Silent viewing is the default,
//    so anything load-bearing must also be legible without audio.
// 3. Never let the model render legible text (HANDOFF rule 2). Generated small
//    type comes out as gibberish and generated lab values are fabricated
//    medical data. All type is composited deterministically afterwards by
//    dh-ad-compositor.py.
// 4. Every voiceover is linted before a dollar is spent — see dh-ad-copy-lint.
// 5. No clip is generated for a destination that is still a soft 404. An ad
//    approved by Meta that lands on nothing is worse than no ad.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { lintVoiceover, hasConditionalFraming } from "./dh-ad-copy-lint.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const LIVE = process.argv.includes("--live");
const FORCE = process.argv.includes("--force");
// Gate the $0.13 before the $1.50. A bad first frame guarantees a bad clip —
// the iPhone-mockup bezel that shipped into DH-V01's first cut would have been
// caught here for 8% of the cost.
const FRAME_ONLY = process.argv.includes("--frame-only");
const ONLY = arg("only");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const REPLICATE = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` };
const FRAME_MODEL = "gemini-3-pro-image-preview";
const VIDEO_MODEL = "bytedance/seedance-1.5-pro";
const OUT = "Dialed Health Video Ads";

const COST_FRAME = 0.13;
const COST_CLIP = 1.50;

// ── Shared visual language, lifted from dh-bloodwork-ads.mjs so stills and
//    video read as one campaign rather than two vendors. ────────────────────
const KIT = `The Dialed Health at-home blood-collection kit: a small ROUND BALLOON-SHAPED collection device with a RED puncture button on its face, a tiny graduated collection vial, a matte-black DH-branded specimen bag, a rigid protector tube, and a FedEx return mailer.`;
const CLEAN = `Photorealistic, shot on 35mm with real film grain and slightly imperfect natural shadows — not smooth, not computer-generated. Shallow depth of field like a real lens. Muted desaturated palette of near-black, warm grey and soft white. Calm clinical restraint, no clutter, generous empty space. NO text anywhere in frame. No watermarks, no misspellings.`;
// ⚠️ Do NOT reintroduce the words "phone", "iPhone", "screen", "camera" or
// "front camera" into a FRAME prompt. HANDOFF rule 1: the model renders what you
// name and ignores what you ask it to omit. The first cut of this constant read
// "framed like a phone camera held by hand" and NanoBanana dutifully rendered
// the whole scene inside an iPhone mockup, bezel and notch included — verified
// on DH-V01's first frame. Seedance then "pushed in" only because it was
// escaping the bezel. Describe the LOOK, never the device.
const SNAPSHOT_LOOK = `Vertical 9:16 full-bleed photograph that fills the entire frame edge to edge. Casual handheld snapshot, slightly off-level, not cinematic, not an advertisement. Real domestic California daylight. No device, no bezel, no border, no frame within the frame, no mockup.`;

/**
 * Motion brief builder.
 *
 * ⚠️ Never brief a b-roll clip as "almost still". DH-V01's first cut did, and
 * Seedance obeyed perfectly: 11 seconds in which the hands never moved and the
 * only change was a steam plume that grew until it read as fog. A still
 * photograph with a steam overlay does not stop a scroll, and the hook has to
 * land inside 2 seconds.
 *
 * So every b-roll clip states a VISIBLE PHYSICAL EVENT in the first second and a
 * second event mid-clip to re-hook.
 *
 * ⚠️ The `restraint` slot is NOT for negatives. Take 2 of DH-V01 briefed "only
 * fine wisps of steam, barely visible. Never a plume, never smoke, never fog"
 * and Seedance produced a heavy smoke column anyway — naming steam/plume/smoke/
 * fog is what put four kinds of smoke in the prompt. Same failure mode as the
 * iPhone bezel. To suppress an effect, do not mention it, and prefer a scene
 * with no hot liquid in it at all.
 *
 * ⚠️ Prop b-roll is against this model's grain. Take 2 also lost the second mug
 * entirely partway through, changed the front mug from a cream mug to a dark
 * tumbler and back, and mangled the hands into an extra forearm by second 9.
 * Seedance 1.5 Pro holds identity when it is anchored to a FACE (CLAUDE.md
 * Pattern E — that is what the 92 proven clips in this repo are). Multi-object
 * still lifes animated by hands are where it loses object permanence. Prefer
 * `mode: 'talking'` with an avatar for anything that has to survive review.
 */
const MOTION_EVENT = (openingBeat, midBeat, restraint) =>
  `${openingBeat} ${midBeat} ${restraint} The camera does not move: framing is locked, no zoom, no push, no pan. Only the described action animates. Real hands, real weight, unhurried.`;

// Destinations. `/bloodwork`, `/panel` and `/microdosing` all return HTTP 200
// with a byte-identical 1,133-byte events-app shell — verified. Meta's crawler
// approves the ad and the user lands on nothing, which is worse than a 404.
const DESTINATIONS = {
  "semaglutide-v3": { live: true, url: "/products/semaglutide-v3" },
  "tirzepatide-v3": { live: true, url: "/products/tirzepatide-v3" },
  "blood-panel": { live: false, url: "/bloodwork", note: "soft 404 — lander not built" },
};

/**
 * mode:
 *   broll   — Seedance renders silent motion; the VO ships as a sidecar .txt to
 *             be recorded or TTS'd and married in ffmpeg. No face, so no avatar
 *             decision and no personal-attributes surface.
 *   talking — Seedance renders native speech from a face anchored to an avatar's
 *             identity refs. One take = one voice, no seams. Requires an avatar.
 */
const CLIPS = [
  {
    id: "DH-V01-sister-in-law",
    dest: "semaglutide-v3",
    mode: "broll",
    tier: "rx",
    // AgelessRx's live pattern: third person about someone else. PHASE-1 §4
    // calls this the register that clears Meta's personal-attributes policy.
    vo: `My sister in law started something in the spring. I finally asked. Telehealth, licensed provider, weekly dose, delivered. She said somebody actually checks in.`,
    // Frame approved 2026-07-26 and saved, so re-rolls cost $1.50 not $1.63 and
    // the scene cannot drift between takes (CLAUDE.md Pattern E: start warm).
    frame: { reuse: "Avatars/_dh-scenes/DH-V01_kitchen-mugs_APPROVED.png" },
    motion: MOTION_EVENT(
      `In the first second both hands lift the near mug straight up and out of the top of the frame.`,
      `Around the middle of the clip the hands bring the mug back down and set it on the counter, fingers settling around it.`,
      `Only fine wisps of steam, barely visible. Never a plume, never smoke, never fog.`,
    ),
  },
  {
    id: "DH-V02-no-membership",
    dest: "semaglutide-v3",
    mode: "broll",
    tier: "rx",
    // Good Life Meds' four trust tokens in eleven words, aimed at Hims' $39
    // membership. Named-comparator-free, so nothing to substantiate.
    vo: `Her plan has no membership fee. No hidden charges. Licensed pharmacy, and the dose is set by a provider. That was the whole reason she picked it.`,
    // No "phone" as a scene object either — see the SNAPSHOT_LOOK warning. Car
    // keys carry the same "ordinary weekday" read without the mockup hazard.
    frame: { new: true, prompt: `${SNAPSHOT_LOOK} A matte-black unbranded medication box sits alone on a pale marble counter beside a set of car keys. Shot slightly from above. Soft window light from camera left. No text, no labels, no logos. ${CLEAN}` },
    motion: MOTION_EVENT(
      `In the first second a hand enters from the bottom of the frame and slides the black box several inches toward the camera.`,
      `The hand then lifts the lid partly open and holds it, revealing shadow inside but no contents and no text.`,
      `No other movement anywhere in the frame.`,
    ),
  },
  {
    id: "DH-V03-perimenopause-reframe",
    dest: "semaglutide-v3",
    mode: "broll",
    tier: "rx",
    // PHASE-1 §4: reframe GLP-1 out of weight loss entirely. Weight loss is the
    // most policed health category; metabolic/perimenopause framing is not.
    vo: `She was not trying to lose weight. She was forty three and something had shifted. Her provider called it metabolic support. Research suggests it may help.`,
    frame: { new: true, prompt: `${SNAPSHOT_LOOK} A woman in her early forties stands at a window with her back to camera, holding a mug, looking out at flat California morning light. Silhouetted, face not visible. Natural hair, plain cream knit. Quiet, ordinary, unposed. ${CLEAN}` },
    motion: MOTION_EVENT(
      `In the first second she turns her head and shoulders away from the window toward the room, still never showing her face to camera.`,
      `She then lifts the mug and drinks, lowering it again.`,
      `The curtain moves only slightly. No other movement.`,
    ),
  },
  {
    id: "DH-V04-self-inject-normalize",
    dest: "semaglutide-v3",
    mode: "broll",
    tier: "rx",
    // Normalising the friction is AgelessRx's third move. It pre-empts the
    // single biggest silent objection without making a claim.
    vo: `She does the injection herself. Once a week. She said it sounds far scarier than it is. The needle is thinner than the dentist's.`,
    frame: { new: true, prompt: `${SNAPSHOT_LOOK} Extreme close-up of a woman's hands on a pale counter holding a very small unbranded pen-style auto-injector, cap still on. Only hands and forearms in frame, natural unretouched skin. Soft directional window light. No text or markings on the device. ${CLEAN}` },
    motion: MOTION_EVENT(
      `In the first second her fingers rotate the small device so it catches the window light and its shape reads clearly.`,
      `She then sets it down flat on the counter and withdraws her hands from the frame.`,
      `No other movement.`,
    ),
  },
  {
    id: "DH-V05-kit-unbox",
    dest: "blood-panel",
    mode: "broll",
    tier: "rx",
    // PHASE-1 §3.2: "Hook in the first 2 seconds: the kit box, not a vial. The
    // box is novel; a vial is not." Reuses the approved BW-01 still as frame 1,
    // which costs $0 and guarantees continuity with the static campaign.
    vo: `A box came for her. Not pills. A collection device, a vial, a prepaid mailer. She did it at the counter before work.`,
    frame: { reuse: "Dialed Health Bloodwork Ads/BW-01-kit-hero-FIXED.png" },
    motion: MOTION_EVENT(`In the first second two hands enter and lift the lid of the box clear away, revealing the components inside.`, `The hands then pick up the small round collection device and hold it steady toward the camera.`, `${KIT} stays exactly as in the input image, unchanged in shape and colour.`),
  },
  {
    id: "DH-V06-shelf-vs-labs",
    dest: "blood-panel",
    mode: "broll",
    tier: "rx",
    vo: `Eleven bottles on her shelf. Not one chosen from her own bloodwork. She sent a panel in. The plan came back built around the numbers.`,
    frame: { new: true, prompt: `${SNAPSHOT_LOOK} A crowded bathroom shelf of eight to ten anonymous unbranded supplement bottles in muted plastic and amber glass, overlapping, dim flat light. No readable labels anywhere, no brand names, no legible text. ${CLEAN}` },
    motion: MOTION_EVENT(`In the first second a hand reaches in and pushes two of the bottles aside, knocking one lightly against another.`, `The hand then withdraws from the frame, leaving a visible gap in the row.`, `The remaining bottles settle and stay still.`),
  },
];

// ── Lint gate — runs in dry run too, so a bad line is caught for free ───────
function audit() {
  const rows = [];
  let blocked = 0;

  for (const clip of CLIPS) {
    const { ok, errors, warnings } = lintVoiceover(clip.vo, { tier: clip.tier });
    const dest = DESTINATIONS[clip.dest];
    const destOk = dest?.live === true;
    const words = clip.vo.trim().split(/\s+/).length;
    const gated = !ok || (!destOk && !FORCE);
    if (gated) blocked++;

    rows.push({ clip, ok, errors, warnings, dest, destOk, words, gated });
  }

  console.log(`\nDialed Health — 9:16 video ads   ${CLIPS.length} clips, ${blocked} gated\n`);

  for (const r of rows) {
    const flag = r.gated ? "GATED " : "READY ";
    console.log(`${flag} ${r.clip.id}   ${r.clip.mode}  ~${Math.min(12, Math.round(r.words / 2.5) + 1)}s  → ${r.clip.dest}`);
    if (!r.destOk) console.log(`         ⛔ destination ${r.dest?.url ?? "?"} — ${r.dest?.note ?? "unknown"}`);
    for (const e of r.errors) console.log(`         ✗ ${e}`);
    for (const w of r.warnings) console.log(`         ! ${w}`);
    if (r.ok && !hasConditionalFraming(r.clip.vo)) {
      console.log(`         · no conditional hedge ("may support" / "if prescribed") — fine for a non-mechanism line`);
    }
    console.log(`         "${r.clip.vo.slice(0, 96)}${r.clip.vo.length > 96 ? "…" : ""}"`);
  }

  const runnable = rows.filter((r) => !r.gated && (!ONLY || r.clip.id.startsWith(ONLY)));
  const frames = runnable.filter((r) => r.clip.frame.new).length;
  const est = frames * COST_FRAME + runnable.length * COST_CLIP;

  console.log(`\nWould generate ${runnable.length} clip(s), ${frames} new frame(s)`);
  console.log(`Estimated spend  $${est.toFixed(2)}   (frame $${COST_FRAME} · clip ~$${COST_CLIP})`);
  if (!LIVE) console.log(`\nDRY RUN — nothing billed. Pass --live to generate.\n`);

  return runnable;
}

// ── Stage 1: first frame ───────────────────────────────────────────────────
async function buildFrame(clip, dir) {
  if (clip.frame.reuse) {
    const src = clip.frame.reuse;
    if (!fs.existsSync(src)) throw new Error(`reuse frame missing: ${src}`);
    const dst = path.join(dir, "frame_00.png");
    fs.copyFileSync(src, dst);
    console.log(`  frame: reused ${src} ($0)`);
    return dst;
  }

  const body = {
    contents: [{ parts: [{ text: clip.frame.prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "2K" } },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${FRAME_MODEL}:generateContent?key=${GEMINI_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json();
  if (j.error) throw new Error(`frame: ${j.error.message?.slice(0, 160)}`);
  const b64 = (j?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData?.data;
  if (!b64) throw new Error("frame: no image returned");

  const dst = path.join(dir, "frame_00.png");
  fs.writeFileSync(dst, Buffer.from(b64, "base64"));
  console.log(`  frame: generated ($${COST_FRAME})`);
  return dst;
}

// ── Stage 2: animate ───────────────────────────────────────────────────────
async function uploadToReplicate(file) {
  const form = new FormData();
  const png = /\.png$/i.test(file);
  form.append("content", new Blob([fs.readFileSync(file)], { type: png ? "image/png" : "image/jpeg" }), path.basename(file));
  const res = await fetch("https://api.replicate.com/v1/files", { method: "POST", headers: REPLICATE, body: form });
  const j = await res.json();
  if (!res.ok) throw new Error(`upload: ${JSON.stringify(j).slice(0, 200)}`);
  return j.urls.get;
}

async function animate(clip, framePath, dir, seconds) {
  const image = await uploadToReplicate(framePath);

  // b-roll is generated SILENT on purpose. Seedance's native speech needs a
  // visible speaker to lip-sync to; asking it to narrate over hands produces a
  // disembodied voice with mouth artefacts elsewhere in frame. The VO ships as
  // a sidecar for recording or TTS, then married in ffmpeg.
  const talking = clip.mode === "talking";
  const prompt = talking
    ? `${clip.motion} She speaks directly to the phone front camera, natural conversational energy: "${clip.vo}" Only the face, jaw, eyes and small head movements animate. Shot-on-phone look, not cinematic. No on-screen text, no captions.`
    : `${clip.motion} No people speaking, no faces turning to camera. Quiet natural room ambience only, no music, no voice. No on-screen text, no captions, no subtitles.`;

  const create = await fetch(`https://api.replicate.com/v1/models/${VIDEO_MODEL}/predictions`, {
    method: "POST", headers: { ...REPLICATE, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { prompt, image, duration: seconds, generate_audio: talking, camera_fixed: true } }),
  });
  const pred = await create.json();
  if (!create.ok) throw new Error(`create: ${JSON.stringify(pred).slice(0, 300)}`);

  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const p = await (await fetch(pred.urls.get, { headers: REPLICATE })).json();
    if (p.status === "succeeded") {
      const url = Array.isArray(p.output) ? p.output[0] : p.output;
      const mp4 = path.join(dir, `${clip.id}_9x16.mp4`);
      fs.writeFileSync(mp4, Buffer.from(await (await fetch(url)).arrayBuffer()));
      return mp4;
    }
    if (p.status === "failed" || p.status === "canceled") throw new Error(`${p.status}: ${p.error}`);
  }
  throw new Error("timeout");
}

// ── Run ────────────────────────────────────────────────────────────────────
const runnable = audit();
if (!LIVE) process.exit(0);
if (!runnable.length) { console.log("Nothing runnable. Fix the gates above or pass --force.\n"); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });

for (const { clip, words } of runnable) {
  const dir = path.join(OUT, clip.id);
  fs.mkdirSync(dir, { recursive: true });
  const seconds = Math.min(12, Math.max(4, Math.round(words / 2.5) + 1));

  console.log(`\n${clip.id}  (${seconds}s, ${clip.mode})`);
  try {
    // Sidecar VO first: if generation fails the script is still captured, and
    // for b-roll it is the deliverable a voice actor or TTS pass consumes.
    fs.writeFileSync(path.join(dir, "voiceover.txt"), `${clip.vo}\n`);

    const frame = await buildFrame(clip, dir);
    if (FRAME_ONLY) { console.log(`  → frame only. Inspect ${frame}, then rerun without --frame-only.`); continue; }
    const mp4 = await animate(clip, frame, dir, seconds);
    console.log(`  ✓ ${mp4}`);
    if (clip.mode === "broll") console.log(`  → VO not in the mp4 by design. Record voiceover.txt, then ffmpeg -i clip.mp4 -i vo.wav -c:v copy -shortest out.mp4`);
    else console.log(`  → Whisper-QC the audio before approving (CLAUDE.md).`);
  } catch (e) {
    console.log(`  ✗ ${clip.id}: ${e.message}`);
  }
}

console.log(`\nOutput: ${OUT}/`);
console.log(`Type is NOT burned in — composite headlines with dh-ad-compositor.py so one clip carries N hooks.\n`);
