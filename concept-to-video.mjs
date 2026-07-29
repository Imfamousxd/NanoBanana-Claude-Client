// concept-to-video.mjs — NuMoon bridge: engine concept JSON -> avatar talking-head video.
//   env -u OPENAI_API_KEY node concept-to-video.mjs --concept <file.json> --avatar Marcus [--dry-run|--live]
// Per CLAUDE.md + Avatars/<name>/AVATAR.md: NanoBanana first frame (identity refs first) ->
// Seedance 1.5 Pro talking takes (<=12s, audio, periods only) -> last-frame chaining -> ffmpeg stitch.
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i+1] : d; };
const LIVE = process.argv.includes("--live");
const conceptPath = arg("concept");
const avatarName = arg("avatar", "Marcus");
const RES = arg("resolution", "720p");
const VIDEO_MODEL = arg("model", "bytedance/seedance-1.5-pro");
if (!conceptPath) { console.error("need --concept <file.json>"); process.exit(1); }

const c = JSON.parse(fs.readFileSync(conceptPath, "utf-8"));
const avatarDir = path.join("Avatars", avatarName);
const avatarDoc = fs.readFileSync(path.join(avatarDir, "AVATAR.md"), "utf-8");
const idRefs = fs.readdirSync(path.join(avatarDir, "identity")).filter(f => /\.(png|jpe?g)$/i.test(f)).map(f => path.join(avatarDir, "identity", f));

const spoken = [c.hook, c.body, c.cta].filter(Boolean).join(" ")
  .replace(/—|–|--/g, ".").replace(/\s+\./g, ".").replace(/\.{2,}/g, ".");
// Closing quotes ride with the sentence they close. Without the trailing class, a quoted line
// whose em-dash became a period ("caffeine doesn't wake me up — it puts me to sleep.") ends a
// sentence one character early and leaves a bare ' to OPEN the next take, which the avatar then
// speaks. Seen on both quote-carrying concepts in the 2026-07-26 Dialed board dry run.
const sentences = spoken.match(/[^.!?]+[.!?]+['’"”]*/g)?.map(s => s.trim()) ?? [spoken];
const takes = [];
let cur = [], curWords = 0;
for (const s of sentences) {
  const w = s.split(/\s+/).length;
  if (curWords + w > 28 && cur.length) { takes.push(cur.join(" ")); cur = []; curWords = 0; }
  cur.push(s); curWords += w;
}
if (cur.length) takes.push(cur.join(" "));

const identityDesc = (avatarDoc.match(/## Identity[^\n]*\n([\s\S]*?)\n\n/) || [,""])[1].replace(/\n/g, " ").trim();
const voiceDesc = (avatarDoc.match(/## Voice[^\n]*\n([\s\S]*?)\n\n/) || [,""])[1].replace(/\n/g, " ").trim();
const setDesc = c.set || c.capture || "bright kitchen, phone front-camera look, vertical";
// Brand neutrality is load-bearing for a beverage client: asked for "a can on the passenger seat",
// the image model reached for the most photographed can on earth and put a Coca-Cola in a Dialed
// Moods ad (2026-07-27 render of dialed-v6-04). Frames chain take to take, so one wrong can rides
// the whole video. Any can must be plain until the real product art is composited in.
const firstFramePrompt = `Use ONLY the likeness of the person from the reference images. Same face, same hair. ${identityDesc} Scene: ${setDesc}. Chest-up framing, vertical 9:16, shot-on-phone front camera look, natural not cinematic. The person is mid-sentence, talking to camera, natural expression. No text anywhere in the image. Every drink can, bottle or package visible is a plain solid-colour blank with no logo, no lettering, no barcode and no recognizable brand livery — never a real-world beverage brand and never anything resembling one.`;

const plans = takes.map((dialogue, i) => ({
  n: i + 1,
  dialogue,
  dur: Math.min(12, Math.max(4, Math.round(dialogue.split(/\s+/).length / 2.5) + 1)),
  prompt: `${identityDesc} ${voiceDesc} He speaks directly to the phone front camera, natural conversational energy, slight natural head movement, same room and framing as the input image. He says: "${dialogue}" Only the face, jaw, eyes and slight head movements animate while speaking. Shot-on-phone look, not cinematic.`,
}));
const totalSec = plans.reduce((a, t) => a + t.dur, 0);
console.log(`PLAN takes=${plans.length} total_est_seconds=${totalSec} resolution=${RES}`);
plans.forEach(p => console.log(`  take ${p.n}: ${p.dur}s | ${p.dialogue.slice(0, 70)}...`));
if (!LIVE) { console.log("DRY RUN — nothing billed. Pass --live to generate."); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const outDir = path.join("generations", "numoon-bridge", `${stamp}_${path.basename(conceptPath, ".json")}`);
fs.mkdirSync(outDir, { recursive: true });

const b64 = f => ({ inline_data: { mime_type: /\.png$/i.test(f) ? "image/png" : "image/jpeg", data: fs.readFileSync(f).toString("base64") } });

console.log("STAGE1 nano-banana first frame...");
const nbBody = {
  contents: [{ parts: [...idRefs.map(b64), { text: firstFramePrompt }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "2K" } },
};
const nbRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`, {
  method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(nbBody),
});
if (!nbRes.ok) { console.error("FRAME_FAIL", nbRes.status, (await nbRes.text()).slice(0, 300)); process.exit(1); }
const nbJson = await nbRes.json();
const imgPart = (nbJson.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
if (!imgPart) { console.error("FRAME_FAIL no image part in response"); process.exit(1); }
const framePath = path.join(outDir, "frame_00.png");
fs.writeFileSync(framePath, Buffer.from(imgPart.inlineData.data, "base64"));
console.log(`STAGE1_OK ${framePath}`);

let currentFrame = framePath;
const clipPaths = [];
for (const p of plans) {
  console.log(`STAGE2 take ${p.n}/${plans.length} (${p.dur}s)...`);
  const dataUri = `data:image/png;base64,${fs.readFileSync(currentFrame).toString("base64")}`;
  // Retry around the whole take. A single transient 504 from Replicate once killed a run AFTER
  // the first frame had been generated and paid for; the identical retry succeeded. The frame is
  // reused, so a retry costs one take, never the run.
  let pred = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const create = await fetch(`https://api.replicate.com/v1/models/${VIDEO_MODEL}/predictions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
        body: JSON.stringify({ input: { image: dataUri, prompt: p.prompt, duration: p.dur, resolution: RES, aspect_ratio: "9:16", generate_audio: true } }),
      });
      if (!create.ok) throw new Error(`create ${create.status} ${(await create.text()).slice(0, 200)}`);
      pred = await create.json();
      while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
        await new Promise(r => setTimeout(r, 6000));
        pred = await (await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` } })).json();
        console.log(`  take ${p.n} status: ${pred.status}`);
      }
      if (pred.status !== "succeeded") throw new Error(`prediction ${pred.status}: ${pred.error}`);
      break;
    } catch (err) {
      console.error(`  take ${p.n} attempt ${attempt}/3 failed: ${err.message}`);
      pred = null;
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
  if (!pred || pred.status !== "succeeded") { console.error(`TAKE_FAIL ${p.n} after 3 attempts`); process.exit(1); }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const clip = path.join(outDir, `take_${p.n}.mp4`);
  fs.writeFileSync(clip, Buffer.from(await (await fetch(url)).arrayBuffer()));
  clipPaths.push(clip);
  console.log(`TAKE_OK ${p.n} ${clip}`);
  const nextFrame = path.join(outDir, `frame_${String(p.n).padStart(2, "0")}.png`);
  execSync(`ffmpeg -y -sseof -0.1 -i "${clip}" -update 1 -frames:v 1 "${nextFrame}" 2>/dev/null`);
  currentFrame = nextFrame;
}

console.log("STAGE3 stitch...");
const finalPath = path.join(outDir, "final.mp4");
const inputs = clipPaths.map(p => `-i "${p}"`).join(" ");
const n = clipPaths.length;
const filter = clipPaths.map((_, i) => `[${i}:v][${i}:a]`).join("") + `concat=n=${n}:v=1:a=1[v][a]`;
execSync(`ffmpeg -y ${inputs} -filter_complex "${filter}" -map "[v]" -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac "${finalPath}" 2>/dev/null`);
console.log(`FINAL_OK ${finalPath}`);
execSync(`open "${finalPath}"`);
console.log("BRIDGE_DONE");
