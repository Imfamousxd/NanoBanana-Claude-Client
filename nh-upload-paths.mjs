#!/usr/bin/env node
// Upload a specific list of local files to the noble-harbor-wholesale Supabase bucket.
// Usage: node nh-upload-paths.mjs <paths-file>   (one local path per line, relative or absolute)
// Bucket path mirrors the path relative to "Noble Harbor Wholesale/" root.
// Uses x-upsert: true so existing bucket objects get overwritten.

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET = process.env.NH_BUCKET || "noble-harbor-wholesale";
const ROOT = "Noble Harbor Wholesale";

const pathsFile = process.argv[2];
if (!pathsFile) { console.error("Usage: node nh-upload-paths.mjs <paths-file>"); process.exit(1); }
const files = fs.readFileSync(pathsFile, "utf-8").split("\n").map(l => l.trim()).filter(Boolean);

// Ensure bucket exists + anon read/insert/update policies are in place. The Supabase
// dashboard occasionally drops policies during security audits; re-applying here makes
// the upload idempotent.
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env — required to (re-)apply RLS policies before upload.");
  process.exit(1);
}
console.log(`Setting up bucket "${BUCKET}" + RLS policies via Postgres...`);
const pgClient = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pgClient.connect();
await pgClient.query(
  `INSERT INTO storage.buckets (id, name, public, file_size_limit)
   VALUES ($1, $1, true, 52428800)
   ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit`,
  [BUCKET]
);
for (const p of [
  { name: `${BUCKET}_anon_read`,   action: "SELECT", clause: "USING" },
  { name: `${BUCKET}_anon_insert`, action: "INSERT", clause: "WITH CHECK" },
  { name: `${BUCKET}_anon_update`, action: "UPDATE", clause: "USING" },
]) {
  await pgClient.query(`DROP POLICY IF EXISTS "${p.name}" ON storage.objects`);
  await pgClient.query(
    `CREATE POLICY "${p.name}" ON storage.objects FOR ${p.action} TO anon, authenticated ${p.clause} (bucket_id = '${BUCKET}')`
  );
}
await pgClient.end();
console.log("  ✓ bucket + RLS policies ready");

console.log(`Uploading ${files.length} files to bucket "${BUCKET}" (concurrency 8)...`);

async function uploadOne(localPath, attempt = 1) {
  const relPath = path.relative(ROOT, localPath).split(path.sep).join("/");
  const buf = fs.readFileSync(localPath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`;
  let res;
  try {
    res = await fetch(url, {
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
  } catch (e) {
    // Network error (EPIPE, ECONNRESET, fetch failed) — retry up to 5 times with backoff
    if (attempt < 6) {
      await new Promise(r => setTimeout(r, 3000 * attempt));
      return uploadOne(localPath, attempt + 1);
    }
    return { ok: false, error: `Network: ${e.message}` };
  }
  if (!res.ok) {
    if (attempt < 6) {
      await new Promise(r => setTimeout(r, 3000 * attempt));
      return uploadOne(localPath, attempt + 1);
    }
    const text = await res.text();
    return { ok: false, error: `${res.status}: ${text.slice(0, 100)}` };
  }
  return { ok: true };
}

const CONCURRENCY = 8;
const queue = [...files];
const results = [];
let done = 0;

async function worker() {
  while (queue.length) {
    const f = queue.shift();
    if (!f) break;
    const r = await uploadOne(f);
    results.push({ file: f, ...r });
    done++;
    if (done % 50 === 0 || done === files.length) console.log(`  ${done}/${files.length}`);
  }
}

await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));

const ok = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
console.log(`\nDone: ${ok} uploaded, ${failed.length} failed.`);
if (failed.length) {
  console.log("First failures:");
  for (const f of failed.slice(0, 10)) console.log(`  ${f.file} — ${f.error}`);
}
