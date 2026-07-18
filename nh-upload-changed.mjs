#!/usr/bin/env node
// Re-upload to Supabase only the files modified after the original upload.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = "noble-harbor-wholesale";
const ROOT = "Noble Harbor Wholesale";

// Find files newer than nh-upload.log
const out = execSync(
  `find "${ROOT}" -name "*.jpg" ! -name "*.pre-fix" -newer nh-upload.log`,
  { encoding: "utf-8" }
);
const files = out.split("\n").map(l => l.trim()).filter(Boolean);
console.log(`Re-uploading ${files.length} changed files...`);

async function uploadOne(localPath, attempt = 1) {
  const relPath = path.relative(ROOT, localPath).split(path.sep).join("/");
  const buf = fs.readFileSync(localPath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000",
    },
    body: buf,
  });
  if (!res.ok) {
    if (attempt < 4) {
      await new Promise(r => setTimeout(r, 3000 * attempt));
      return uploadOne(localPath, attempt + 1);
    }
    return { ok: false, error: `${res.status}` };
  }
  return { ok: true };
}

const CONCURRENCY = 8;
let done = 0, ok = 0, fail = 0;
const errors = [];
const queue = [...files];

async function worker() {
  while (queue.length) {
    const f = queue.shift();
    if (!f) break;
    const r = await uploadOne(f);
    done++;
    if (r.ok) ok++;
    else { fail++; errors.push({ file: f, error: r.error }); }
    if (done % 25 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length}  ok=${ok} fail=${fail}`);
    }
  }
}
await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));

console.log(`\n=== Re-upload done ===  ok=${ok}  fail=${fail}`);
if (errors.length) {
  for (const e of errors.slice(0, 10)) console.log(`  ${e.file}: ${e.error}`);
}
