#!/usr/bin/env node
// Generic Seedance 2.0 (Replicate) clip runner. Reads a job JSON and saves the mp4.
// usage: node seedance-run.mjs <job.json>
// job: { prompt, out, image?(path), reference_images?[paths], duration?, aspect_ratio?, resolution?, generate_audio? }
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "bytedance/seedance-2.0";
const job = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));

const toDataUri = (p) => {
  const ext = path.extname(p).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${fs.readFileSync(p).toString("base64")}`;
};

const input = {
  prompt: job.prompt,
  duration: job.duration ?? 6,
  resolution: job.resolution ?? "1080p",
  aspect_ratio: job.aspect_ratio ?? "16:9",
  generate_audio: job.generate_audio ?? true,
};
if (job.image) input.image = toDataUri(job.image);
if (job.reference_images) input.reference_images = job.reference_images.map(toDataUri);
if (job.seed != null) input.seed = job.seed;

console.log(`→ Seedance 2.0: ${path.basename(job.out)} (${input.aspect_ratio}, ${input.resolution}, ${input.duration}s, audio:${input.generate_audio})`);
const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
  body: JSON.stringify({ input }),
});
if (!create.ok) { console.error("Create failed:", create.status, await create.text()); process.exit(1); }
let pred = await create.json();
console.log(`pred ${pred.id}: ${pred.status}`);
while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`  ${pred.status}${last ? ` (${last})` : ""}`);
}
if (pred.status !== "succeeded") { console.error("FAILED:", pred.error); process.exit(1); }
const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
fs.mkdirSync(path.dirname(job.out), { recursive: true });
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.writeFileSync(job.out, buf);
console.log(`✓ Saved ${job.out} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
