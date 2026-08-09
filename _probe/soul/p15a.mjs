// P-15A — THE gating question for the Soul pipeline: does ModelArk accept a photoreal HUMAN
// image as a first frame on seedance-1-5-pro-251215? (The dreamina-2.x endpoints refuse human
// images in any role — measured, billed. If the guard is platform-wide, this fails the same
// way and the Soul bridge needs Replicate; if it's model-family-scoped, one key runs it all.)
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

const img = fs.readFileSync(path.join(__dirname, "soul-cast-c1.png")).toString("base64");
const body = {
  model: "seedance-1-5-pro-251215",
  content: [
    {
      type: "text",
      text: [
        "Casual handheld selfie video, one continuous take. The man from the first frame sits in",
        "his parked car in late-afternoon sun. He glances out the windshield, looks back into the",
        "lens with an easy half-smile, shifts slightly in his seat. The phone bobs and drifts",
        "naturally in his hand; the hard sun shadow moves subtly across his face. His facial",
        "features, hair, stubble and gold chain stay exactly as in the first frame throughout.",
        "No speech. Natural ambience only: light traffic outside, cabin room tone.",
        "--resolution 1080p --duration 5 --camerafixed false --watermark false",
      ].join(" "),
    },
    { type: "image_url", image_url: { url: `data:image/png;base64,${img}` }, role: "first_frame" },
  ],
};

const t0 = Date.now();
const res = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(body) });
const txt = await res.text();
console.log(`SUBMIT HTTP ${res.status} ${txt.trim().slice(0, 400)}`);
let id = null; try { id = JSON.parse(txt).id; } catch {}
const log = (o) => fs.appendFileSync(path.join(REPO, ".claude/worktrees/gen-image/research/sd25/probe-log.jsonl"),
  JSON.stringify({ probe: "P-15A-soul-human-frame-15pro-modelark", t: new Date().toISOString(), ...o }) + "\n");
if (!id) { log({ result: "SUBMIT_REJECTED", http: res.status, body: txt.slice(0, 500) }); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (;;) {
  if ((Date.now() - t0) / 1000 > 900) { log({ result: "TIMEOUT", id }); process.exit(1); }
  const j = await (await fetch(`${BASE}/${id}`, { headers: H })).json();
  if (["succeeded", "failed", "cancelled"].includes(j.status)) {
    fs.writeFileSync(path.join(__dirname, "p15a.task.json"), JSON.stringify(j, null, 2));
    if (j.status !== "succeeded") {
      console.log(`FAILED: ${JSON.stringify(j.error)}`);
      log({ result: "TASK_FAILED", id, error: j.error, tokens: j.usage?.completion_tokens ?? null });
      process.exit(1);
    }
    const buf = Buffer.from(await (await fetch(j.content.video_url)).arrayBuffer());
    const out = path.join(__dirname, "p15a-soul-15pro-5s.mp4");
    fs.writeFileSync(out, buf);
    console.log(`SUCCEEDED tokens=${j.usage?.completion_tokens} res=${j.resolution} seed=${j.seed}`);
    console.log(`SAVED ${out} (${(buf.length / 1e6).toFixed(1)} MB)`);
    log({ result: "SUCCEEDED", id, tokens: j.usage?.completion_tokens, resolution: j.resolution,
          seed: j.seed, file: out, verdict: "ModelArk 1.5-pro ACCEPTS human first frames — guard is scoped to dreamina-2.x, not platform-wide" });
    process.exit(0);
  }
  process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s ${j.status}] `);
  await sleep(10000);
}
