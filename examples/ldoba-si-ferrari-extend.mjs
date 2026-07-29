import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "veo-3.1-generate-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const FILE_URI = "https://generativelanguage.googleapis.com/v1beta/files/ta5hbe5jjs2v:download?alt=media";
const LOCAL_V1 = "generations/LDOBA-SI-ferrari-daytrader-2026-07-22T04-19-30.mp4";
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const PROMPT = `Continue this exact scene without any cut — same shot, same people, same handheld vertical
UGC street-interview framing. The driver keeps holding the Dialed Moods Blue Glacier can; its label must
stay EXACTLY as it appears — do not redraw it.

The conversation continues, fast street-interview pacing, same two voices as before, same city ambience:
The interviewer (off-camera) asks: "Is that your company?"
The driver chuckles, shakes his head and says: "No — but this is what keeps me fueled up for day trading."
The interviewer says, impressed: "No way — that's super dope."
The driver grins and nods, raising the can slightly as an end beat.

Real skin texture, natural daylight, looks filmed not generated. No captions, no subtitles, no on-screen text.`;

const shapes = [
  { name: "file-uri-full",   video: { uri: FILE_URI } },
  { name: "file-uri-clean",  video: { uri: "https://generativelanguage.googleapis.com/v1beta/files/ta5hbe5jjs2v" } },
  { name: "local-bytes",     video: { bytesBase64Encoded: null, mimeType: "video/mp4" } }, // filled lazily
];

async function submit(shape) {
  const video = { ...shape.video };
  if (shape.name === "local-bytes") video.bytesBase64Encoded = fs.readFileSync(LOCAL_V1).toString("base64");
  const body = {
    instances: [{ prompt: PROMPT, video }],
    parameters: { aspectRatio: "9:16", durationSeconds: 8 },
  };
  const res = await fetch(`${BASE_URL}/models/${MODEL}:predictLongRunning`, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) { console.log(`shape=${shape.name} REJECTED ${res.status}: ${text.slice(0,300)}`); return null; }
  const op = JSON.parse(text).name;
  console.log(`shape=${shape.name} ACCEPTED, operation: ${op}`);
  return op;
}

let op = null;
for (const s of shapes) { op = await submit(s); if (op) break; }
if (!op) { console.error("ALL SHAPES REJECTED — extension not supported this way"); process.exit(2); }
fs.writeFileSync("veo_operation.txt", op);

let result;
while (true) {
  await new Promise(r => setTimeout(r, 10000));
  const p = await fetch(`${BASE_URL}/${op}`, { headers: { "x-goog-api-key": API_KEY } });
  if (!p.ok) { console.error("POLL ERROR", p.status, await p.text()); process.exit(1); }
  const d = await p.json();
  if (d.error) { console.error("OPERATION FAILED:", JSON.stringify(d.error).slice(0,400)); process.exit(1); }
  if (d.done) { result = d; break; }
  process.stdout.write(".");
}
console.log("\nGeneration complete.");

const videos = result.response?.generateVideoResponse?.generatedSamples
  || result.response?.generatedSamples || result.response?.generateVideoResponse?.generatedVideos
  || result.response?.generatedVideos || [];
let saved = null;
for (const v of videos) {
  if (v.video?.uri) {
    const dl = await fetch(v.video.uri + `&key=${API_KEY}`, { redirect: "follow" });
    if (!dl.ok) { console.error("DOWNLOAD FAILED", dl.status); continue; }
    saved = `generations/LDOBA-SI-ferrari-daytrader-EXTENDED-${stamp}.mp4`;
    fs.writeFileSync(saved, Buffer.from(await dl.arrayBuffer()));
  } else if (v.video?.bytesBase64Encoded) {
    saved = `generations/LDOBA-SI-ferrari-daytrader-EXTENDED-${stamp}.mp4`;
    fs.writeFileSync(saved, Buffer.from(v.video.bytesBase64Encoded, "base64"));
  }
}
if (!saved) { console.error("NO VIDEO IN RESPONSE:", JSON.stringify(result).slice(0,800)); process.exit(1); }
console.log("SAVED", saved);
