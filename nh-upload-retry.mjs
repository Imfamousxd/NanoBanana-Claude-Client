#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = "noble-harbor-wholesale";
const ROOT_DIR = "Noble Harbor Wholesale";

const FAILED = [
  "BPC-157 - TB500/10-10mg/BPC-157_-_TB500_10-10mg_5ml_pink.jpg",
  "Ipamorelin/5mg/Ipamorelin_5mg_3ml_white.jpg",
  "N-Acetyl Selank Amidate/20mg/N-Acetyl_Selank_Amidate_20mg_5ml_pink.jpg",
  "N-Acetyl Semax Amidate/20mg/N-Acetyl_Semax_Amidate_20mg_3ml_white.jpg",
  "N-Acetyl Semax Amidate/20mg/N-Acetyl_Semax_Amidate_20mg_5ml_babyblue.jpg",
];

async function uploadOne(relPath, attempt = 1) {
  const localPath = path.join(ROOT_DIR, relPath);
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
      console.log(`  ${relPath}: ${res.status}, retry ${attempt}/3 in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
      return uploadOne(relPath, attempt + 1);
    }
    return { ok: false, error: `${res.status}` };
  }
  return { ok: true };
}

let ok = 0, fail = 0;
for (const f of FAILED) {
  const r = await uploadOne(f);
  if (r.ok) { ok++; console.log(`  ✓ ${f}`); }
  else { fail++; console.log(`  ✗ ${f} (${r.error})`); }
}
console.log(`\nRetry done: ${ok} ok, ${fail} failed`);
