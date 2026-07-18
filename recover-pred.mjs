#!/usr/bin/env node
// Recover a Replicate prediction by ID and download its output if succeeded.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const TOKEN = process.env.REPLICATE_API_TOKEN;
const PRED_ID = process.argv[2];
const OUT = process.argv[3];
if (!PRED_ID || !OUT) { console.error("Usage: recover-pred.mjs <pred_id> <out_path>"); process.exit(1); }

let pred;
while (true) {
  const r = await fetch(`https://api.replicate.com/v1/predictions/${PRED_ID}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  pred = await r.json();
  const last = pred.logs ? pred.logs.split("\n").filter(Boolean).pop() : "";
  console.log(`status: ${pred.status}${last ? ` (${last})` : ""}`);
  if (pred.status === "succeeded" || pred.status === "failed" || pred.status === "canceled") break;
  await new Promise(r => setTimeout(r, 5000));
}

if (pred.status !== "succeeded") { console.error("Not succeeded:", pred.error); process.exit(1); }
const videoUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
console.log("video url:", videoUrl);
const vr = await fetch(videoUrl);
const buf = Buffer.from(await vr.arrayBuffer());
fs.writeFileSync(OUT, buf);
console.log(`✓ Saved: ${OUT} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
