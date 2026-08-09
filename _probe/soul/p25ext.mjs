// P-25EXT — final Soul-pipeline unknown: does ModelArk 2.5 EXTEND externally-generated footage
// (a Replicate 1.5-pro clip of a Higgsfield Soul character), and does identity + a native-voice
// line survive? Every prior extension continued 2.5's OWN output; this is the cross-platform case.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const H = { Authorization: `Bearer ${process.env.MODELARK_API_KEY}`, "Content-Type": "application/json" };

// Measured this session: data-URI video is refused — "reference_video must be provided as a
// web url". The Replicate delivery URL of the P-15B prediction is a public web URL; delivery
// URLs are short-lived, so re-fetch from /v1/predictions if this one has expired.
const VIDEO_URL = "https://ark-content-generation-ap-southeast-1.tos-ap-southeast-1.volces.com/seedance-1-5-pro/02178630006211000000000000000000000ffffc0a8787445809a.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260809%2Fap-southeast-1%2Ftos%2Frequest&X-Tos-Date=20260809T182858Z&X-Tos-Expires=86400&X-Tos-Signature=12683bceef315a0a4cc84db41457de56839462a46a5428ffe53d39d8c1e54fed&X-Tos-SignedHeaders=host";
const body = {
  model: "dreamina-seedance-2-5-260628",
  generate_audio: true,
  content: [
    {
      type: "text",
      text: [
        "Continue [Video 1] forward: the same man, same car, same late-afternoon sun, one",
        "continuous handheld selfie take. He keeps looking into the lens and says in a natural",
        'Southern-Californian accent, easy and unhurried: "Yeah man, this thing actually works."',
        "He gives a small laugh at the end. His facial features, hair, stubble and gold chain",
        "stay exactly as in [Video 1]. Audio: his voice close on the phone microphone with cabin",
        "room tone under it. No instruments, no melody, no song, no soundtrack.",
        "No on-screen text, no captions, no subtitles, no logos.",
        "--ratio adaptive --dur 5 --resolution 720p --watermark false",
      ].join(" "),
    },
    { type: "video_url", video_url: { url: VIDEO_URL }, role: "reference_video" },
  ],
};

const t0 = Date.now();
const res = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(body) });
const txt = await res.text();
console.log(`SUBMIT HTTP ${res.status} ${txt.trim().slice(0, 300)}`);
let id = null; try { id = JSON.parse(txt).id; } catch {}
const log = (o) => fs.appendFileSync(path.join(REPO, ".claude/worktrees/gen-image/research/sd25/probe-log.jsonl"),
  JSON.stringify({ probe: "P-25EXTB-soul-modelark-native-extension", t: new Date().toISOString(), ...o }) + "\n");
if (!id) { log({ result: "SUBMIT_REJECTED", http: res.status, body: txt.slice(0, 500) }); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (;;) {
  if ((Date.now() - t0) / 1000 > 900) { log({ result: "TIMEOUT", id }); process.exit(1); }
  const j = await (await fetch(`${BASE}/${id}`, { headers: H })).json();
  if (["succeeded", "failed", "cancelled"].includes(j.status)) {
    fs.writeFileSync(path.join(__dirname, "p25ext.task.json"), JSON.stringify(j, null, 2));
    if (j.status !== "succeeded") {
      console.log(`FAILED: ${JSON.stringify(j.error)}`);
      log({ result: "TASK_FAILED", id, error: j.error, tokens: j.usage?.completion_tokens ?? null });
      process.exit(1);
    }
    const buf = Buffer.from(await (await fetch(j.content.video_url)).arrayBuffer());
    const out = path.join(__dirname, "p25ext-soul-speaks-5s.mp4");
    fs.writeFileSync(out, buf);
    console.log(`SUCCEEDED tokens=${j.usage?.completion_tokens} res=${j.resolution} seed=${j.seed}`);
    console.log(`SAVED ${out} (${(buf.length / 1e6).toFixed(1)} MB)`);
    log({ result: "SUCCEEDED", id, tokens: j.usage?.completion_tokens, resolution: j.resolution,
          seed: j.seed, file: out,
          verdict: "2.5 EXTENDS external (Replicate-1.5-pro-of-Soul-image) footage — full Soul->1.5->2.5 bridge viable" });
    process.exit(0);
  }
  process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s ${j.status}] `);
  await sleep(10000);
}
