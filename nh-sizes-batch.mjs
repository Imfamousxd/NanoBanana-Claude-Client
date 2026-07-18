#!/usr/bin/env node
// Noble Harbor size-expansion batch driver.
// Reproduces each source vial EXACTLY (nh-canary reproduce prompt) changing ONLY the volume text,
// hardened to render LOWERCASE "ml". Concurrency pool, skip-existing, retry w/ backoff, jsonl log.
//
//   node nh-sizes-batch.mjs <jobs.json> [--force] [--limit N] [--only <token>]
//   env: CONC (default 6), RETRIES (default 4), LOG (default nh-sizes-run.jsonl)
import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const KEY = process.env.GEMINI_API_KEY, MODEL = "gemini-3-pro-image-preview";
const CONC = parseInt(process.env.CONC || "4", 10);
const RETRIES = parseInt(process.env.RETRIES || "4", 10);
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "150000", 10);
const LOG = process.env.LOG || "nh-sizes-run.jsonl";
const RATIO = "3:4"; // matches the approved canary output framing
const IMG_SIZE = process.env.IMG_SIZE || "4K"; // 4K matches the line; 2K ~2x faster (softer)

const args = process.argv.slice(2);
const jobsFile = args.find(a => !a.startsWith("--")) || "nh-sizes-all.json";
const FORCE = args.includes("--force");
const limIdx = args.indexOf("--limit"); const LIMIT = limIdx >= 0 ? parseInt(args[limIdx+1],10) : Infinity;
const onlyIdx = args.indexOf("--only"); const ONLY = onlyIdx >= 0 ? args[onlyIdx+1] : null;

let jobs = JSON.parse(fs.readFileSync(jobsFile, "utf-8"));
if (ONLY) jobs = jobs.filter(j => j.token === ONLY);
if (!FORCE) jobs = jobs.filter(j => !fs.existsSync(j.out));
jobs = jobs.slice(0, LIMIT);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = obj => { try { fs.appendFileSync(LOG, JSON.stringify(obj) + "\n"); } catch {} };
process.on("unhandledRejection", e => log({ event:"unhandledRejection", err:String(e).slice(0,140) }));
process.on("uncaughtException",  e => log({ event:"uncaughtException",  err:String(e).slice(0,140) }));

function prompt(from, to) {
  return `The reference image is an APPROVED Noble Harbor Wholesale product vial shot. Reproduce it EXACTLY as a photo retouch — the SAME glass vial and glass tint, the same crimped cap and its exact color, the same white label design and layout, the same product name and charcoal-grey text, the same solid bottom accent bar and its color, the same pure #FFFFFF seamless background, and the SAME camera framing, zoom, crop, and vial scale. Change ONLY the volume marking on the label from "${from}" to "${to}".
CRITICAL — spell the new volume in LOWERCASE exactly as "${to}": lowercase letter m, lowercase letter l, one space before it, matching the existing lowercase "ml" style on the label. Do NOT capitalize the L (never "mL" or "ML" or "Ml"). Keep the same font, size, weight, position, and color as the original volume text.
Everything else must be pixel-for-pixel identical.
Negative: do NOT change the vial, glass tint, cap, label design, product name, colors, framing, zoom, or crop; do NOT add any background marks, smudges, shadows, or texture — keep the background pure clean #FFFFFF; change no text other than the volume; no uppercase "mL".`;
}

// Robust FS helpers: the refs/outputs live on a cloud-synced volume, so reads/writes can
// transiently ETIMEDOUT/EBUSY while the sync client is uploading. Retry with backoff.
function readRetry(path, tries = 5) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return fs.readFileSync(path); }
    catch (e) { last = e; const end = Date.now() + 800*i; while (Date.now() < end) {} }
  }
  throw last;
}
function writeRetry(path, buf, tries = 5) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { fs.writeFileSync(path, buf); return; }
    catch (e) { last = e; const end = Date.now() + 800*i; while (Date.now() < end) {} }
  }
  throw last;
}

async function gen(job) {
  let b64;
  try { b64 = readRetry(job.ref).toString("base64"); }
  catch (e) { return { ok:false, err:"ref-read: " + String(e).slice(0,140) }; }
  const body = { contents:[{parts:[{inline_data:{mime_type:"image/jpeg",data:b64}},{text:prompt(job.from, job.to)}]}],
                 generationConfig:{ responseModalities:["TEXT","IMAGE"], imageConfig:{ aspectRatio:RATIO, imageSize:IMG_SIZE } } };
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        { method:"POST", headers:{ "x-goog-api-key":KEY, "Content-Type":"application/json" }, body: JSON.stringify(body), signal: ac.signal });
      if (!r.ok) {
        const txt = (await r.text()).slice(0,180);
        if ((r.status === 429 || r.status >= 500) && attempt < RETRIES) { await sleep(2000*attempt + 1000*Math.random()); continue; }
        return { ok:false, err:`HTTP ${r.status}: ${txt}` };
      }
      const d = await r.json();
      for (const p of d?.candidates?.[0]?.content?.parts || []) if (p.inlineData) {
        writeRetry(job.out, Buffer.from(p.inlineData.data, "base64"));
        return { ok:true };
      }
      if (attempt < RETRIES) { await sleep(1500*attempt); continue; }
      return { ok:false, err:"no image returned" };
    } catch (e) {
      const msg = ac.signal.aborted ? `timeout>${TIMEOUT_MS}ms` : String(e).slice(0,180);
      if (attempt < RETRIES) { await sleep(1500*attempt); continue; }
      return { ok:false, err:msg };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok:false, err:"exhausted retries" };
}

let done = 0, okN = 0, failN = 0;
const fails = [];
const total = jobs.length;
console.log(`[nh-sizes] ${total} jobs  conc=${CONC}  size=${IMG_SIZE}  retries=${RETRIES}  log=${LOG}`);
log({ event:"start", total, conc:CONC, size:IMG_SIZE, jobsFile, only:ONLY, force:FORCE });

let idx = 0;
async function worker(wid) {
  while (idx < jobs.length) {
    const job = jobs[idx++];
    let res;
    try { res = await gen(job); }
    catch (e) { res = { ok:false, err:"uncaught: " + String(e).slice(0,140) }; }
    done++;
    if (res.ok) { okN++; }
    else { failN++; fails.push({ ...job, err:res.err }); }
    log({ event:"job", out:job.out, token:job.token, product:job.product, color:job.color, to:job.to, ok:res.ok, err:res.err });
    const tag = res.ok ? "✓" : "✗";
    console.log(`${tag} [${done}/${total}] ${job.product} ${job.token} ${job.color}${res.ok?"":"  ERR: "+res.err}`);
  }
}
await Promise.all(Array.from({length: Math.min(CONC, jobs.length)}, (_, i) => worker(i)));

log({ event:"end", ok:okN, fail:failN });
console.log(`\n[nh-sizes] DONE  ok=${okN}  fail=${failN}`);
if (fails.length) {
  fs.writeFileSync("nh-sizes-failures.json", JSON.stringify(fails, null, 2));
  console.log(`Wrote ${fails.length} failures -> nh-sizes-failures.json (re-run driver to retry; skip-existing resumes)`);
}
