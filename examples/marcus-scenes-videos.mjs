// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE — kept for its SHAPE, and specifically for HANDLOCK below, which is the
// documented workaround for golden rule 10 (Seedance loses object permanence in
// hands). Not meant to be re-run as-is:
//
// 1. The `frame:` paths point into the old generations/ folder, which did not come
//    across with the engine. Regenerate first frames and repoint them.
// 2. The `VOICE` string ends "never robotic or announcer-like" — golden rule 9 says
//    negatives summon what they name, so that clause argues for the thing it forbids.
//    Say what the voice IS, and state pace positively (Pattern I: target 2.5–3.5
//    words/sec, and "natural cadence" must be qualified as FAST or it reads as slow).
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const H = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` };
const HANDLOCK = "His hand holding the tiny vial stays LOCKED in exactly the same position for the entire video. The hand and the vial do not move, drift, lower, rotate, switch hands, or gesture at all. Only his face, jaw, eyes and slight head movements animate as he speaks.";
const VOICE = "warm mid-range American male voice with completely natural human cadence, real pauses and breaths, clean phone-microphone recording quality, quiet room, no reverb, never robotic or announcer-like";
const CLIPS = [
  { key: "couch", frame: "generations/2026-07-23T03-09-34_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "Real talk. BPC one fifty-seven is one of the most researched peptides in tissue repair science. NuLumin makes it research grade. Details at nulumin dot org.",
    scene: "He stays lounged back on the sofa in the warm golden light, relaxed and casual" },
  { key: "jacket", frame: "generations/2026-07-23T03-09-55_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "Quality is everything in research. NuLumin makes thirty one research peptides. Lighting the path forward. Find the full catalog at nulumin dot org.",
    scene: "He stays seated in the leather chair in the moody studio light, confident and composed" },
  { key: "hallway", frame: "generations/2026-07-23T03-10-20_Use_ONLY_the_likeness_of_the_man_from_re.jpg",
    line: "Researchers everywhere are studying peptides like BPC one fifty-seven for tissue repair. Research use only. That's nulumin dot org.",
    scene: "He stands still in the grand marble hallway, poised and relaxed" },
];
async function makeClip({ key, frame, line, scene }) {
  const form = new FormData();
  form.append("content", new Blob([fs.readFileSync(frame)], { type: "image/jpeg" }), "frame.jpg");
  const up = await fetch("https://api.replicate.com/v1/files", { method: "POST", headers: H, body: form });
  const upJson = await up.json();
  if (!up.ok) throw new Error(`${key} upload: ${JSON.stringify(upJson).slice(0,200)}`);
  const create = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-1.5-pro/predictions", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ input: {
      prompt: `${scene}, talking directly to the camera in a natural, friendly, conversational tone, ${VOICE}: '${line}' ${HANDLOCK} Static framing, no captions, no on-screen text, quiet ambience, no background music.`,
      image: upJson.urls.get, duration: 12, generate_audio: true, camera_fixed: true,
    } }),
  });
  const pred = await create.json();
  if (!create.ok) throw new Error(`${key} create: ${JSON.stringify(pred).slice(0,300)}`);
  for (let i = 0; i < 180; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const pj = await (await fetch(pred.urls.get, { headers: H })).json();
    if (pj.status === "succeeded") {
      const out = Array.isArray(pj.output) ? pj.output[0] : pj.output;
      const file = `generations/INFLUENCER_${key}_12s.mp4`;
      fs.writeFileSync(file, Buffer.from(await (await fetch(out)).arrayBuffer()));
      return file;
    }
    if (pj.status === "failed" || pj.status === "canceled") throw new Error(`${key} ${pj.status}: ${pj.error}`);
  }
  throw new Error(`${key}: timeout`);
}
const results = await Promise.allSettled(CLIPS.map(makeClip));
results.forEach((r, i) => console.log(CLIPS[i].key + ":", r.status === "fulfilled" ? r.value : "FAILED — " + (r.reason?.message || r.reason)));
