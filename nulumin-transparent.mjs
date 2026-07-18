#!/usr/bin/env node
// NuLumin transparent product shots: reproduce each approved white-BG vial EXACTLY on a fully
// transparent background via gpt-image-2 (native alpha, renders the clear glass correctly — no
// cutout holes/halos). One PNG per SKU.
//   node nulumin-transparent.mjs [--only <substr>] [--limit N] [--force]
//   env: CONC (default 3), RETRIES (default 4), SIZE (default 2160x2880 = 3:4), QUALITY (high)
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
// NOTE: transparent background is only supported by gpt-image-1 (gpt-image-2 rejects it), and
// gpt-image-1 only accepts 1024x1024 / 1024x1536 / 1536x1024. Portrait vials -> 1024x1536.
const KEY = process.env.OPENAI_API_KEY, MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const CONC = parseInt(process.env.CONC || "3", 10);
const RETRIES = parseInt(process.env.RETRIES || "4", 10);
const SIZE = process.env.SIZE || "1024x1536";     // portrait; gpt-image-1 max for transparent
const QUALITY = process.env.QUALITY || "high";
const SRC = "NuLumin Generated/White BG Finals";
const OUTDIR = "NuLumin Generated/Transparent";
const LOG = process.env.LOG || "nulumin-transparent.jsonl";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyIdx = args.indexOf("--only"); const ONLY = onlyIdx>=0 ? args[onlyIdx+1] : null;
const limIdx = args.indexOf("--limit"); const LIMIT = limIdx>=0 ? parseInt(args[limIdx+1],10) : Infinity;

fs.mkdirSync(OUTDIR, { recursive: true });
let refs = fs.readdirSync(SRC).filter(f => /^NuL_.*_white\.png$/i.test(f));
if (ONLY) refs = refs.filter(f => f.toLowerCase().includes(ONLY.toLowerCase()));
let jobs = refs.map(f => ({
  ref: path.join(SRC, f),
  out: path.join(OUTDIR, f.replace(/_white\.png$/i, "_transparent.png")),
  sku: f.replace(/^NuL_|_white\.png$/gi, ""),
}));
if (!FORCE) jobs = jobs.filter(j => !fs.existsSync(j.out));
jobs = jobs.slice(0, LIMIT);

const PROMPT = `An authentic, high-end commercial product PHOTOGRAPH of the exact NuLumin peptide vial in the reference — a real photo shot on set, absolutely NOT a 3D render, NOT CGI, not an illustration. Reproduce the vial identically: the clear glass vial, soft-purple cap, brushed-silver crimp band, the clear contents, exact proportions, and the full white label with every line of text pixel-faithful (copy the text exactly; never re-type or misspell).
Light and photograph the glass exactly like real pharmaceutical/beverage product photography: a large softbox produces a soft-edged vertical STRIP HIGHLIGHT running down the curved glass, while black flags/gobos on both sides create subtle DARK EDGE reflections that define the glass rim and give it real roundness and depth. Show true glass optics — refraction and slight magnification of the label seen through the far wall of the glass, the liquid meniscus, small caustic bright spots, realistic glass thickness at the shoulder and base, and gentle environment reflections curving around the body. The metal crimp band shows real brushed-metal anisotropic highlights; the cap has a soft matte sheen with one natural specular highlight. Neutral-white studio lighting with soft gradient falloff, genuine photographic micro-contrast, tack-sharp label with a faint natural depth-of-field falloff at the glass edges, and a whisper of fine film grain. It must look tactile and truly photographic — real glass under real studio lights — with NONE of the flat, waxy, uniform 'computer render' look.
Isolate on a FULLY TRANSPARENT background: no backdrop, no surface, no shadow, no ground reflection — clean, crisp, naturally anti-aliased edges only.`;

const sleep = ms => new Promise(r=>setTimeout(r,ms));
const log = o => { try { fs.appendFileSync(LOG, JSON.stringify(o)+"\n"); } catch {} };

async function gen(job) {
  for (let a=1; a<=RETRIES; a++) {
    try {
      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", PROMPT);
      form.append("size", SIZE);
      form.append("quality", QUALITY);
      form.append("n", "1");
      form.append("background", "transparent");
      const buf = fs.readFileSync(job.ref);
      form.append("image[]", new Blob([buf], {type:"image/png"}), path.basename(job.ref));
      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method:"POST", headers:{ Authorization:`Bearer ${KEY}` }, body: form });
      if (!res.ok) {
        const t = (await res.text()).slice(0,220);
        if (/billing_hard_limit/.test(t)) return { ok:false, err:"BILLING_LIMIT", fatal:true };
        if ((res.status===429||res.status>=500) && a<RETRIES) { await sleep(3000*a); continue; }
        return { ok:false, err:`HTTP ${res.status}: ${t}` };
      }
      const d = await res.json();
      const b64 = d?.data?.[0]?.b64_json;
      if (!b64) { if (a<RETRIES){ await sleep(2000*a); continue; } return { ok:false, err:"no image" }; }
      fs.writeFileSync(job.out, Buffer.from(b64, "base64"));
      return { ok:true };
    } catch (e) { if (a<RETRIES){ await sleep(2000*a); continue; } return { ok:false, err:String(e).slice(0,180) }; }
  }
  return { ok:false, err:"exhausted" };
}

const total = jobs.length;
console.log(`[nulumin-transparent] ${total} jobs  model=${MODEL}  size=${SIZE}  q=${QUALITY}  conc=${CONC}`);
log({ event:"start", total, size:SIZE });
let done=0, okN=0, failN=0, idx=0, fatal=false; const fails=[];
async function worker(){
  while (idx<jobs.length && !fatal) {
    const job = jobs[idx++];
    const r = await gen(job);
    done++;
    if (r.fatal) { fatal=true; console.error(`\n✗ FATAL: ${r.err} — OpenAI billing limit still in place. Stopping.`); log({event:"fatal",err:r.err}); break; }
    if (r.ok) okN++; else { failN++; fails.push({...job, err:r.err}); }
    log({ event:"job", out:job.out, sku:job.sku, ok:r.ok, err:r.err });
    console.log(`${r.ok?"✓":"✗"} [${done}/${total}] ${job.sku}${r.ok?"":"  ERR: "+r.err}`);
  }
}
await Promise.all(Array.from({length:Math.min(CONC,jobs.length)}, ()=>worker()));
log({ event:"end", ok:okN, fail:failN });
console.log(`\n[nulumin-transparent] DONE ok=${okN} fail=${failN}${fatal?"  (stopped on billing limit)":""}`);
if (fails.length) fs.writeFileSync("nulumin-transparent-fails.json", JSON.stringify(fails,null,2));
