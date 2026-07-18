#!/usr/bin/env node
// Upload ONLY the 666 new size-token files to the existing noble-harbor-wholesale bucket.
// Same bucket + relPath convention as nh-upload.mjs, but scoped to nh-sizes-all.json outputs
// (canonical folders only — avoids the stale " 2" duplicate dirs and the .pre-fix backups).
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = process.env.NH_BUCKET || "noble-harbor-wholesale";
const ROOT_DIR = "Noble Harbor Wholesale";
if (!SUPABASE_URL || !ANON_KEY) { console.error("Missing SUPABASE_URL / PUBLISHABLE_KEY"); process.exit(1); }

const jobs = JSON.parse(fs.readFileSync("nh-sizes-all.json","utf-8"));
const files = [...new Set(jobs.map(j => j.out))].filter(f => fs.existsSync(f));
console.log(`Uploading ${files.length} new size-token files -> ${SUPABASE_URL}/storage/v1/object/${BUCKET}/`);

const CONC = parseInt(process.env.CONC || "8", 10);
let done=0, failed=0; const errors=[]; const queue=[...files];

async function uploadOne(localPath, tries=4) {
  const relPath = path.relative(ROOT_DIR, localPath).split(path.sep).join("/");
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`;
  const buf = fs.readFileSync(localPath);
  for (let a=1; a<=tries; a++) {
    try {
      const res = await fetch(url, { method:"POST", headers:{
        Authorization:`Bearer ${ANON_KEY}`, apikey:ANON_KEY, "Content-Type":"image/jpeg",
        "x-upsert":"true", "Cache-Control":"public, max-age=31536000" }, body: buf });
      if (res.ok) return { ok:true };
      const text = (await res.text()).slice(0,160);
      if ((res.status===429||res.status>=500) && a<tries) { await new Promise(r=>setTimeout(r,1000*a)); continue; }
      return { ok:false, error:`${res.status} ${text}` };
    } catch (e) { if (a<tries){ await new Promise(r=>setTimeout(r,1000*a)); continue; } return { ok:false, error:String(e).slice(0,160) }; }
  }
  return { ok:false, error:"exhausted retries" };
}
async function worker(){
  while (queue.length){
    const f=queue.shift(); if(!f) break;
    const rel=path.relative(ROOT_DIR,f).split(path.sep).join("/");
    const r=await uploadOne(f);
    if(!r.ok){ failed++; errors.push({file:rel,error:r.error}); }
    else { done++; if(done%50===0||done+failed===files.length) console.log(`  ${done}/${files.length} uploaded (${failed} failed)`); }
  }
}
await Promise.all(Array(CONC).fill(0).map(()=>worker()));
console.log(`\n=== Done: ${done} uploaded, ${failed} failed of ${files.length} ===`);
if (errors.length){ fs.writeFileSync("nh-upload-sizes-errors.json", JSON.stringify(errors,null,2)); console.log("First 8 errors:"); errors.slice(0,8).forEach(e=>console.log(`  ${e.file}: ${e.error}`)); }
console.log(`Public URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/NAD+/NAD+_5ml-dark_navy.jpg`);
