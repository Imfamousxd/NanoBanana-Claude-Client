// Repair proxies recorded as local file paths: point them at the cloud object when it exists, upload it
// when the file is on this machine, and report what is still only on another machine.
import fs from "node:fs";
import path from "node:path";

const KINDS = ["thumb", "model", "contact", "preview"];

export async function repairProxies(db, store, { limit = 50000, concurrency = 8, log = console.error } = {}) {
  if (store.mode === "local" || !store.url) throw new Error("cloud storage is not configured; nothing to repair against");
  const { rows } = await db.query(`select id, proxies from dam.assets where deleted_at is null and (${KINDS.map((kind) => `(proxies->>'${kind}' is not null and proxies->>'${kind}' not like 'https%')`).join(" or ")}) limit $1`, [limit]);
  const counts = { assets: rows.length, rewrittenRemote: 0, uploaded: 0, elsewhere: 0, failed: 0 };
  const queue = [...rows];
  const worker = async () => {
    while (queue.length) {
      const row = queue.shift();
      const proxies = { ...row.proxies };
      let changed = false;
      for (const kind of KINDS) {
        const value = proxies[kind];
        if (!value || /^https?:/.test(value)) continue;
        const key = value.replace(/^.*\/proxies\//, "");
        if (key === value) continue;
        const url = store.publicUrl(key);
        try {
          const head = await fetch(url, { method: "HEAD" });
          if (head.ok) { proxies[kind] = url; changed = true; counts.rewrittenRemote += 1; continue; }
          if (fs.existsSync(value)) {
            const uploaded = await store.put(value, key, key.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
            if (/^https?:/.test(uploaded)) { proxies[kind] = uploaded; changed = true; counts.uploaded += 1; } else counts.failed += 1;
          } else counts.elsewhere += 1;
        } catch (error) { counts.failed += 1; log(`[dam] repair ${row.id} ${kind}: ${String(error.message).slice(0, 100)}`); }
      }
      if (changed) await db.query("update dam.assets set proxies = $2::jsonb where id = $1", [row.id, JSON.stringify(proxies)]);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return counts;
}
