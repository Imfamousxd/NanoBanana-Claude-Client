#!/usr/bin/env node
// Create a Supabase storage bucket and upload all Noble Harbor Wholesale assets.
// Uses DATABASE_URL for admin (create bucket + RLS) and the publishable key for uploads.

import pg from "pg";
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
const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET = process.env.NH_BUCKET || "noble-harbor-wholesale";
const ROOT_DIR = "Noble Harbor Wholesale";

if (!SUPABASE_URL || !ANON_KEY || !DATABASE_URL) {
  console.error("Missing env: SUPABASE_URL / PUBLISHABLE_KEY / DATABASE_URL");
  process.exit(1);
}

// ─── 1. Set up bucket + RLS via direct Postgres ──────────────────────────────
console.log(`[1/3] Setting up bucket "${BUCKET}" via Postgres...`);
const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

await client.query(
  `INSERT INTO storage.buckets (id, name, public, file_size_limit)
   VALUES ($1, $1, true, 52428800)
   ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit`,
  [BUCKET]
);

const policies = [
  { name: `${BUCKET}_anon_read`,   action: "SELECT", clause: "USING" },
  { name: `${BUCKET}_anon_insert`, action: "INSERT", clause: "WITH CHECK" },
  { name: `${BUCKET}_anon_update`, action: "UPDATE", clause: "USING" },
];
for (const p of policies) {
  await client.query(`DROP POLICY IF EXISTS "${p.name}" ON storage.objects`);
  await client.query(
    `CREATE POLICY "${p.name}" ON storage.objects FOR ${p.action} TO anon, authenticated ${p.clause} (bucket_id = '${BUCKET}')`
  );
}
await client.end();
console.log("    ✓ bucket + policies ready");

// ─── 2. Walk Noble Harbor Wholesale/ tree ────────────────────────────────────
console.log(`[2/3] Scanning ${ROOT_DIR}/...`);
function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/\.(jpe?g|png)$/i.test(f.name)) yield p;
  }
}
const files = [...walk(ROOT_DIR)];
console.log(`    ${files.length} files queued`);

// ─── 3. Upload via direct REST (publishable key + RLS) ──────────────────────
console.log(`[3/3] Uploading to ${SUPABASE_URL}/storage/v1/object/${BUCKET}/...`);

const CONCURRENCY = 8;
let done = 0;
let failed = 0;
const errors = [];
const queue = [...files];

async function uploadOne(localPath) {
  const relPath = path.relative(ROOT_DIR, localPath).split(path.sep).join("/");
  const ext = path.extname(localPath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";
  const buf = fs.readFileSync(localPath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000",
    },
    body: buf,
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `${res.status} ${text}` };
  }
  return { ok: true };
}

async function worker() {
  while (queue.length) {
    const file = queue.shift();
    if (!file) break;
    const relPath = path.relative(ROOT_DIR, file).split(path.sep).join("/");
    const result = await uploadOne(file);
    if (!result.ok) {
      failed++;
      errors.push({ file: relPath, error: result.error });
    } else {
      done++;
      if (done % 25 === 0 || done === files.length) {
        console.log(`    ${done}/${files.length} uploaded`);
      }
    }
  }
}

await Promise.all(Array(CONCURRENCY).fill(0).map(() => worker()));

console.log(`\n=== Done: ${done} uploaded, ${failed} failed ===`);
if (errors.length) {
  console.log("\nFirst 10 errors:");
  for (const e of errors.slice(0, 10)) console.log(`  ${e.file}: ${e.error}`);
}
console.log(`\nPublic URL pattern:`);
console.log(`  ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/<path>`);
console.log(`Example:`);
console.log(`  ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/BPC-157/5mg/BPC-157_5mg_3ml_navy.jpg`);
