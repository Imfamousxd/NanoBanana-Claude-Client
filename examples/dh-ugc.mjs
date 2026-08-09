#!/usr/bin/env node
// dh-ugc.mjs — compile a UGC/creator video brief into engine batches.
//
//   node dh-ugc.mjs --brief briefs/ugc-recovery.json            # compile + lint, $0
//   node dh-ugc.mjs --brief briefs/ugc-recovery.json --frames    # run the first-frame batch
//   node dh-ugc.mjs --brief briefs/ugc-recovery.json --clips     # run the video batch
//
// ── Separate workflow, same chain ──────────────────────────────────────────
//
//   founder → Claude → dh-ugc.mjs → frames batch  → nanobanana.mjs   → API
//                                 → video batch   → seedance-batch.mjs → API
//
// The static workflow is new-job.mjs. This one is UGC only: it exists because a
// talking creator clip has different laws from a still (identity anchoring,
// spoken-word compliance, timed beats) and mixing them into one compiler would
// make both worse.
//
// ── Anchored on what the competitor tier actually does ─────────────────────
// Verified 2026-07-28 from live sites (Ro, Hims, Hone, Marek, Midi, Maximus)
// and the readable Ad Library tier:
//   • outcome-led, never mechanism-led — nobody writes "one dose, chosen not
//     defaulted"; they write "Look, Feel, & Perform Better Today"
//   • price stated plainly and early
//   • colour, real people, real rooms — the whole tier; none are monochrome
//   • the symptom list is the longest-running hook shape in the readable set
//     (Off Coast, ~280 days; T Zone, ~600 days)
//   • 7 of 8 conversions in this ad account came from vertical video
//
// ── Engine laws this enforces so they cannot be forgotten ──────────────────
//   • Seedance holds identity when anchored to a FACE (CLAUDE.md rule 10) —
//     every clip is built on an avatar's identity refs, never text-only
//   • 12s clips need EXPLICIT timed beats or the runtime is wasted
//     (dh-video-ads.mjs DH-V01 wasted 11s on "almost still")
//   • dialogue in quotes, acronyms spelled phonetically, dashes become audible
//     pauses — all caught by the voice-medium lint before a dollar is spent
//   • one take = one voice; Veo re-rolls a new voice per clip, so Seedance
//     carries any multi-clip script
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { lintVoiceover, hasConditionalFraming } from "./dh-ad-copy-lint.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const RUN_FRAMES = process.argv.includes("--frames");
const RUN_CLIPS = process.argv.includes("--clips");

const briefPath = arg("brief");
if (!briefPath) {
  console.error(`
dh-ugc.mjs — compile a UGC video brief

  node dh-ugc.mjs --brief <brief.json> [--frames] [--clips]

{
  "name": "ugc-recovery",
  "avatar": "Dialed_Ava",             // Avatars/<name>/ — identity refs required
  "pathway": "Recovery",
  "destination": "https://dialed-health.com/products/bpc-157-tb-500-v3",
  "clips": [{
    "id": "REC-ugc-01",
    "set": "a bright kitchen, morning, phone propped on the counter",
    "beats": [
      { "t": "0-3s",  "say": "I did six weeks of rest and it did nothing.",
                      "do": "she is mid-sentence, talking straight to the phone" },
      { "t": "3-7s",  "say": "So I stopped guessing and got an actual plan.",
                      "do": "small shrug, glances away then back" },
      { "t": "7-11s", "say": "A licensed provider set it. It is one forty four a month.",
                      "do": "relaxed nod, slight smile at the end" }
    ]
  }]
}`);
  process.exit(1);
}

const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const avatarDir = path.join(ROOT, "Avatars", brief.avatar ?? "");
const idDir = path.join(avatarDir, "identity");

// ── Gate 1: identity refs. Text-only prompts drift, and a creator who changes
// face between clips is not a creator. Same failure class as refs:[] on stills.
if (!fs.existsSync(idDir) || !fs.readdirSync(idDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).length) {
  console.error(`\n✗ REFUSING: avatar "${brief.avatar}" has no identity references at`);
  console.error(`  Avatars/${brief.avatar}/identity/`);
  console.error(`  Seedance holds a person only when every generation is anchored to their`);
  console.error(`  refs (CLAUDE.md rule 10 + Pattern E). Create the avatar first.`);
  process.exit(2);
}
const refs = fs.readdirSync(idDir).filter((f) => /\.(png|jpe?g)$/i.test(f))
  .map((f) => `./${path.relative(ROOT, path.join(idDir, f))}`);

const avatarMd = fs.existsSync(path.join(avatarDir, "AVATAR.md"))
  ? fs.readFileSync(path.join(avatarDir, "AVATAR.md"), "utf8") : "";
const grab = (h) => (avatarMd.match(new RegExp(`##\\s*${h}[^\\n]*\\n([\\s\\S]*?)(?=\\n##|$)`, "i")) || [, ""])[1]
  .replace(/\s+/g, " ").replace(/^LOCKED:\s*/i, "").trim();
const identity = grab("Identity");
const voice = grab("Voice");

// ── Gate 2: spoken-word compliance. Voice medium, so the phonetic + dash rules
// apply on top of the policy rules.
let errors = 0;
console.log(`\n${brief.name}  ·  avatar ${brief.avatar}  ·  ${refs.length} identity ref(s)`);
console.log(`pathway ${brief.pathway}  →  ${brief.destination}\n`);
for (const clip of brief.clips) {
  const spoken = clip.beats.map((b) => b.say).join(" ");
  const { errors: errs, warnings } = lintVoiceover(spoken, { tier: "rx", medium: "voice" });
  const secs = clip.beats.length ? Number(String(clip.beats.at(-1).t).match(/(\d+)s?$/)?.[1] ?? 11) : 11;
  console.log(`  ${errs.length ? "GATED" : "ready"}  ${clip.id}  ${secs}s · ${clip.beats.length} beats`);
  for (const b of clip.beats) console.log(`         ${b.t.padEnd(7)} "${b.say}"`);
  errs.forEach((e) => { console.log(`         ✗ ${e}`); errors++; });
  warnings.forEach((w) => console.log(`         ! ${w}`));
  if (!errs.length && !hasConditionalFraming(spoken)) {
    console.log(`         · no conditional hedge — fine unless the script claims a mechanism`);
  }
}
if (errors) { console.error(`\n✗ ${errors} compliance error(s). Nothing compiled.\n`); process.exit(2); }

// ── Compile the two batches ────────────────────────────────────────────────
const FRAME_LOOK = "Natural colour, real skin tones, real daylight. Shot-on-phone look, "
  + "not cinematic, not an advertisement. Chest-up framing, vertical. Ordinary room, lived-in.";

const frames = brief.clips.map((c) => ({
  prompt: `Use ONLY the likeness of the person in the reference images — same face, same hair, same build. `
    + `${identity} Scene: ${c.set}. ${FRAME_LOOK} The person is mid-sentence, talking directly to the phone, `
    + `natural relaxed expression. No text anywhere in the image, no logos, no on-screen graphics.`,
  aspectRatio: "9:16",
  imageSize: "2K",
  refImages: refs,
  _id: c.id,
}));

const clips = brief.clips.map((c) => {
  const beats = c.beats.map((b) => `Beat ${b.t}: ${b.do}. She says: "${b.say}"`).join(" ");
  const secs = Number(String(c.beats.at(-1).t).match(/(\d+)s?$/)?.[1] ?? 11);
  return {
    id: c.id,
    // Timed beats are mandatory — without them the model idles and the paid
    // runtime is wasted. Verified the hard way on DH-V01.
    // NO physical description here. The first frame already carries identity, and
    // stacking appearance detail ("fine lines...", "natural texture...") is the
    // known E005 sensitivity trigger class (00_ENGINE.md rule 9) — it failed a
    // live create on 2026-07-28. With an input image, describe ACTION only.
    prompt: `${voice} She talks straight to the phone's front camera, natural conversational `
      + `energy, small natural head movement, same person, same room and same framing as the `
      + `input image throughout. ${beats} `
      + `Only the face, jaw, eyes and slight head movements animate. Shot-on-phone look, not cinematic. `
      + `Quiet room ambience, no music, no on-screen text, no captions, no subtitles.`,
    image: `./generations/${c.id}_frame.png`,
    duration: Math.min(12, Math.max(5, secs)),
    aspect_ratio: "9:16",
    resolution: "1080p",
    generate_audio: true,
  };
});

fs.mkdirSync(path.join(ROOT, "batches"), { recursive: true });
const fFile = path.join("batches", `${brief.name}.frames.json`);
const vFile = path.join("batches", `${brief.name}.video.json`);
fs.writeFileSync(path.join(ROOT, fFile), JSON.stringify(frames, null, 2));
fs.writeFileSync(path.join(ROOT, vFile), JSON.stringify(clips, null, 2));

console.log(`\n✓ compiled`);
console.log(`  frames  ${fFile}   → node nanobanana.mjs --batch ${fFile}`);
console.log(`  clips   ${vFile}   → node seedance-batch.mjs --batch ${vFile}`);
console.log(`\n  Order matters: frames first, save each as generations/<id>_frame.png, then clips.`);
console.log(`  Whisper-QC every take's audio before approving (CLAUDE.md Pattern E).\n`);

const env = { ...process.env };
delete env.OPENAI_API_KEY;   // ~/.secrets exports a stale key that outranks .env
if (RUN_FRAMES) spawnSync("node", ["nanobanana.mjs", "--batch", fFile], { cwd: ROOT, stdio: "inherit", env });
if (RUN_CLIPS) spawnSync("node", ["seedance-batch.mjs", "--batch", vFile], { cwd: ROOT, stdio: "inherit", env });
