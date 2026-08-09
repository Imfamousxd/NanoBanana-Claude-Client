// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE — kept for its SHAPE (frame → per-scene prompt → 12s clip), not to re-run.
//
// 1. The `frame:` paths below point into the old generations/ folder, which did not
//    come across with the engine. Regenerate first frames and repoint them.
// 2. DO NOT COPY THE `VOICE` STRING. It predates the Pattern I pacing findings and
//    breaks two of them:
//      · "natural conversational pace" — CLAUDE.md Pattern I: the model reads this
//        (and "unhurried") as SLOW. State pace positively: "FAST natural cadence —
//        the speed of real casual conversation, not narration."
//      · "never announcer-like" — golden rule 9: negatives summon what they name.
//        Say what the voice IS.
//    Clips built with this string measured 1.0–1.6 words/sec and were judged
//    "slow, deliberate, monotone." Target 2.5–3.5 words/sec.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const H = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` };

const VOICE = "warm mid-range American male voice, natural conversational pace, casual and friendly, never announcer-like";
const STYLE = `He ends with a relaxed nod and easy smile. Static handheld phone framing with tiny natural shake, soft natural window light, quiet room ambience, no background music, no captions, no on-screen text. The tiny vial stays small at his fingertips, label sharp and unchanged.`;

const CLIPS = [
  { key: "bpc157", frame: "generations/2026-07-23T02-07-41_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "Hey — this is BPC one fifty-seven from NuLumin. Researchers are studying this peptide for tissue repair — tendons, ligaments, gut lining. Research use only — details at nulumin dot org." },
  { key: "tb500", frame: "generations/2026-07-23T02-08-04_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "This is TB five hundred from NuLumin. Researchers are studying it for how tissue recovers — cell migration, flexibility, repair. Research use only — everything's at nulumin dot org." },
  { key: "ghkcu", frame: "generations/2026-07-23T02-08-29_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "This is GHK copper from NuLumin. Researchers are studying this copper peptide in skin, collagen, and repair research. Research use only — details at nulumin dot org." },
  { key: "nadplus", frame: "generations/2026-07-23T02-08-53_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "This is NAD plus from NuLumin. Researchers are studying it for cellular energy and how our cells age. Research use only — full details at nulumin dot org." },
  { key: "blend", frame: "generations/2026-07-23T02-09-20_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "This is the BPC one fifty-seven and TB five hundred blend from NuLumin. Researchers are studying these two together for tissue recovery. Research use only — nulumin dot org." },
];

async function uploadFile(path) {
  const form = new FormData();
  form.append("content", new Blob([fs.readFileSync(path)], { type: "image/jpeg" }), "frame.jpg");
  const res = await fetch("https://api.replicate.com/v1/files", { method: "POST", headers: H, body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`upload: ${JSON.stringify(json).slice(0,200)}`);
  return json.urls.get;
}

async function makeClip({ key, frame, line }) {
  const img = await uploadFile(frame);
  const create = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-1.5-pro/predictions", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ input: {
      prompt: `The man talks directly to the camera in a natural, friendly, conversational tone, ${VOICE}, holding the tiny one-inch peptide vial at his fingertips at shoulder height, label toward camera, small natural head movements: '${line}' ${STYLE}`,
      image: img, duration: 12, generate_audio: true, camera_fixed: true,
    } }),
  });
  const pred = await create.json();
  if (!create.ok) throw new Error(`${key} create: ${JSON.stringify(pred).slice(0,300)}`);
  for (let i = 0; i < 180; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const p = await fetch(pred.urls.get, { headers: H });
    const pj = await p.json();
    if (pj.status === "succeeded") {
      const out = Array.isArray(pj.output) ? pj.output[0] : pj.output;
      const dl = await fetch(out);
      const file = `generations/pep_${key}_talk12s.mp4`;
      fs.writeFileSync(file, Buffer.from(await dl.arrayBuffer()));
      return file;
    }
    if (pj.status === "failed" || pj.status === "canceled") throw new Error(`${key} ${pj.status}: ${pj.error}`);
  }
  throw new Error(`${key}: timeout`);
}

const results = await Promise.allSettled(CLIPS.map(makeClip));
results.forEach((r, i) => console.log(CLIPS[i].key + ":", r.status === "fulfilled" ? r.value : "FAILED — " + (r.reason?.message || r.reason)));
