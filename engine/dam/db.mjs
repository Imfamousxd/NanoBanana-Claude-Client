// DAM database layer — one pg pool, the schema initialiser, asset/job/spend helpers. Every write is
// idempotent on (source_id, path) so a re-scan is a no-op and a re-analysis overwrites in place.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { EngineError } from "../core/errors.mjs";
import { toPgVector } from "./providers/embed.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export class DamDb {
  constructor(connectionString) {
    if (!connectionString) throw new EngineError("DAM_NO_DATABASE", "Set DAM_DATABASE_URL (or DIRECT_URL/DATABASE_URL) to a Postgres with pgvector.");
    this.pool = new pg.Pool({ connectionString, ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false }, max: Number(process.env.DAM_PG_POOL || 5), idleTimeoutMillis: 20_000, statement_timeout: 120_000 });
  }

  query(text, params) { return this.pool.query(text, params); }
  async end() { await this.pool.end(); }

  async initSchema() {
    const sql = fs.readFileSync(path.join(here, "schema.sql"), "utf8");
    await this.pool.query(sql);
    const { rows } = await this.pool.query("select count(*)::int as tables from information_schema.tables where table_schema = 'dam'");
    return { ok: true, tables: rows[0].tables };
  }

  async dropSchema() {
    await this.pool.query("drop schema if exists dam cascade");
    return { ok: true };
  }

  // ---- sources ----
  async upsertSource({ id, kind, root, brandHint = null, enabled = true }) {
    await this.pool.query(`insert into dam.sources (id, kind, root, brand_hint, enabled) values ($1,$2,$3,$4,$5)
      on conflict (id) do update set kind = excluded.kind, root = excluded.root, brand_hint = coalesce(excluded.brand_hint, dam.sources.brand_hint), enabled = excluded.enabled`, [id, kind, root, brandHint, enabled]);
    return this.getSource(id);
  }
  async getSource(id) { return (await this.pool.query("select * from dam.sources where id = $1", [id])).rows[0] || null; }
  async listSources() { return (await this.pool.query("select * from dam.sources order by id")).rows; }
  async setSourceCursor(id, cursor) { await this.pool.query("update dam.sources set cursor = $2, last_sync_at = now(), last_error = null where id = $1", [id, cursor]); }
  async setSourceError(id, error) { await this.pool.query("update dam.sources set last_error = $2 where id = $1", [id, String(error).slice(0, 2000)]); }

  // ---- assets ----
  /** Upsert the discovery record. Returns {id, changed} where changed means the file is new or modified. */
  async upsertDiscovered({ sourceId, externalId = null, relativePath, name, extension, kind, bytes, modifiedAt = null, contentHashHint = null }) {
    const { rows } = await this.pool.query(`
      insert into dam.assets (source_id, external_id, path, name, extension, kind, bytes, modified_at, deleted_at, flags)
      values ($1,$2,$3,$4,$5,$6,$7,$8,null, jsonb_build_object('source_hash', $9::text))
      on conflict (source_id, path) do update set
        external_id = coalesce(excluded.external_id, dam.assets.external_id),
        name = excluded.name, extension = excluded.extension, kind = excluded.kind, bytes = excluded.bytes,
        modified_at = excluded.modified_at, deleted_at = null,
        flags = dam.assets.flags || jsonb_build_object('source_hash', $9::text),
        status = case when dam.assets.bytes is distinct from excluded.bytes or dam.assets.modified_at is distinct from excluded.modified_at
                        or (dam.assets.flags->>'source_hash') is distinct from $9::text then 'discovered' else dam.assets.status end
      returning id, status, (xmax = 0) as inserted`, [sourceId, externalId, relativePath, name, extension, kind, bytes, modifiedAt, contentHashHint]);
    return { id: rows[0].id, inserted: rows[0].inserted, status: rows[0].status };
  }

  /** Batched discovery upsert: one statement per chunk. Returns [{id, path, inserted, status}] in input order. */
  async upsertDiscoveredBatch(sourceId, items) {
    if (!items.length) return [];
    const cols = { external_id: [], path: [], name: [], extension: [], kind: [], bytes: [], modified_at: [], hint: [] };
    for (const item of items) {
      cols.external_id.push(item.externalId || null); cols.path.push(item.relativePath); cols.name.push(item.name); cols.extension.push(item.extension);
      cols.kind.push(item.kind); cols.bytes.push(item.bytes ?? null); cols.modified_at.push(item.modifiedAt || null); cols.hint.push(item.contentHashHint || null);
      (cols.media ??= []).push(item.media ? JSON.stringify(item.media) : null);
    }
    const { rows } = await this.pool.query(`
      insert into dam.assets (source_id, external_id, path, name, extension, kind, bytes, modified_at, deleted_at, flags)
      select $1, e, p, n, x, k, b, m, null, jsonb_build_object('source_hash', h) || coalesce(jsonb_build_object('media', md::jsonb), '{}'::jsonb)
      from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::bigint[], $8::timestamptz[], $9::text[], $10::text[]) as t(e, p, n, x, k, b, m, h, md)
      on conflict (source_id, path) do update set
        external_id = coalesce(excluded.external_id, dam.assets.external_id),
        name = excluded.name, extension = excluded.extension, kind = excluded.kind, bytes = excluded.bytes,
        modified_at = excluded.modified_at, deleted_at = null,
        flags = dam.assets.flags || jsonb_build_object('source_hash', excluded.flags->>'source_hash') || coalesce(jsonb_build_object('media', excluded.flags->'media'), '{}'::jsonb),
        status = case when dam.assets.bytes is distinct from excluded.bytes or dam.assets.modified_at is distinct from excluded.modified_at
                        or (dam.assets.flags->>'source_hash') is distinct from (excluded.flags->>'source_hash') then 'discovered' else dam.assets.status end
      returning id, path, kind, status, (xmax = 0) as inserted`,
      [sourceId, cols.external_id, cols.path, cols.name, cols.extension, cols.kind, cols.bytes, cols.modified_at, cols.hint, cols.media || items.map(() => null)]);
    return rows;
  }

  async enqueueBatch(kind, sourceId, assetIds, priority = 100) {
    if (!assetIds.length) return 0;
    const { rowCount } = await this.pool.query(`insert into dam.jobs (kind, source_id, asset_id, priority)
      select $1, $2, id, $4 from unnest($3::uuid[]) as t(id) on conflict do nothing`, [kind, sourceId, assetIds, priority]);
    return rowCount;
  }

  async markDeletedBatch(sourceId, paths) {
    if (!paths.length) return;
    await this.pool.query("update dam.assets set deleted_at = now() where source_id = $1 and path = any($2::text[])", [sourceId, paths]);
  }

  async markDeleted(sourceId, relativePath) { await this.pool.query("update dam.assets set deleted_at = now() where source_id = $1 and path = $2", [sourceId, relativePath]); }

  async saveProbe(id, probe) {
    await this.pool.query(`update dam.assets set content_hash = $2, phash = $3, width = $4, height = $5, orientation = $6, duration_s = $7, fps = $8,
      has_audio = $9, has_alpha = $10, dominant_colors = $11, mime = $12, status = case when $13::text is null then 'probed' else 'failed' end, error = $13
      where id = $1`, [id, probe.contentHash || null, probe.phash || null, probe.width || null, probe.height || null, probe.orientation || null, probe.durationS || null, probe.fps || null,
      probe.hasAudio ?? null, probe.hasAlpha ?? null, probe.dominantColors ? JSON.stringify(probe.dominantColors) : null, probe.mime || null, probe.error || null]);
  }

  async saveProxies(id, proxies) {
    await this.pool.query("update dam.assets set proxies = proxies || $2::jsonb where id = $1", [id, JSON.stringify(proxies)]);
  }

  async saveAnalysis(id, { record, analyzer, searchDoc, ocrText, subclass = null }) {
    const flags = { watermarked: Boolean(record.usability?.watermarked), low_resolution: Boolean(record.usability?.low_resolution), outdated_or_wrong: Boolean(record.usability?.outdated_or_wrong) };
    await this.pool.query(`update dam.assets set
        brand = $2, brand_confidence = $3, class = $4, subclass = $5, product = $6, product_confidence = $7,
        people_count = $8, is_real_human = $9, ocr_text = $10, title = $11, summary = $12, search_doc = $13,
        tags = $14, reference_roles = $15, quality = $16, flags = flags || $17::jsonb, analysis = $18, analyzer = $19,
        status = 'analyzed', analyzed_at = now(), error = null
      where id = $1`, [id, record.brand || null, record.brand_confidence ?? null, record.class, subclass, record.product || null, record.product_confidence ?? null,
      record.people?.count ?? record.creator?.count ?? null, record.is_real_human_creator ?? null, ocrText || null, record.title, record.summary, searchDoc,
      record.tags || [], record.reference_roles || [], record.usability?.quality ?? null, JSON.stringify(flags), JSON.stringify(record), JSON.stringify(analyzer)]);
  }

  async saveVideoAnalysis(id, { schemaVersion, measured, transcript, read, keyframes }) {
    await this.pool.query(`insert into dam.video_analysis (asset_id, schema_version, measured, transcript, read, keyframes) values ($1,$2,$3,$4,$5,$6)
      on conflict (asset_id) do update set schema_version = excluded.schema_version, measured = excluded.measured, transcript = excluded.transcript, read = excluded.read, keyframes = excluded.keyframes, created_at = now()`,
      [id, schemaVersion, JSON.stringify(measured), transcript ? JSON.stringify(transcript) : null, read ? JSON.stringify(read) : null, keyframes ? JSON.stringify(keyframes) : null]);
  }

  async saveShots(id, shots) {
    await this.pool.query("delete from dam.shots where asset_id = $1", [id]);
    for (const [index, shot] of shots.entries()) {
      await this.pool.query("insert into dam.shots (asset_id, idx, start_s, end_s, keyframe, description, embedding_visual) values ($1,$2,$3,$4,$5,$6,$7)",
        [id, index, shot.start, shot.end, shot.keyframe || null, shot.description || null, shot.embedding ? toPgVector(shot.embedding) : null]);
    }
  }

  async saveEmbeddings(id, { text = null, visual = null, analyzer = null }) {
    await this.pool.query(`update dam.assets set embedding_text = coalesce($2::vector, embedding_text), embedding_visual = coalesce($3::vector, embedding_visual),
      analyzer = coalesce(analyzer, '{}'::jsonb) || coalesce($4::jsonb, '{}'::jsonb), status = 'embedded' where id = $1`,
      [id, text ? toPgVector(text) : null, visual ? toPgVector(visual) : null, analyzer ? JSON.stringify(analyzer) : null]);
  }

  async setStatus(id, status, error = null) { await this.pool.query("update dam.assets set status = $2, error = $3 where id = $1", [id, status, error ? String(error).slice(0, 2000) : null]); }
  async setDuplicate(id, ofId) { await this.pool.query("update dam.assets set duplicate_of = $2, flags = flags || '{\"duplicate\": true}'::jsonb where id = $1", [id, ofId]); }
  async getAsset(id) { return (await this.pool.query("select * from dam.assets where id = $1", [id])).rows[0] || null; }
  async findByHash(contentHash, excludeId) { return (await this.pool.query("select id, path, source_id from dam.assets where content_hash = $1 and id <> $2 and deleted_at is null order by created_at limit 1", [contentHash, excludeId])).rows[0] || null; }
  async findNearPhash(phash, excludeId, maxDistance = 6) {
    // bit_count on the xor of the two 64-bit hashes, done in SQL so it scales past a few thousand rows
    const { rows } = await this.pool.query(`select id, path, source_id, phash, length(replace(((('x' || $1::text)::bit(64) # ('x' || phash)::bit(64))::text), '0', '')) as distance
      from dam.assets where phash is not null and id <> $2 and deleted_at is null
      and length(replace(((('x' || $1::text)::bit(64) # ('x' || phash)::bit(64))::text), '0', '')) <= $3 order by 5 asc limit 5`, [phash, excludeId, maxDistance]);
    return rows;
  }

  // ---- jobs ----
  async enqueue(kind, { sourceId = null, assetId = null, payload = {}, priority = 100, runAfter = null } = {}) {
    try {
      const { rows } = await this.pool.query("insert into dam.jobs (kind, source_id, asset_id, payload, priority, run_after) values ($1,$2,$3,$4,$5, coalesce($6, now())) returning id", [kind, sourceId, assetId, JSON.stringify(payload), priority, runAfter]);
      return rows[0].id;
    } catch (error) {
      if (error.code === "23505") return null; // an open job of this kind for this target already exists
      throw error;
    }
  }
  async claimJobs(workerId, limit, kinds = null, sourcePrefix = null, autoOnly = false) { return (await this.pool.query("select * from dam.claim_jobs($1, $2, $3, $4, $5)", [workerId, limit, kinds, sourcePrefix, autoOnly])).rows; }
  async finishJob(id, { status = "done", error = null } = {}) {
    await this.pool.query("update dam.jobs set status = $2, error = $3, finished_at = now(), locked_by = null where id = $1", [id, status, error ? String(error).slice(0, 2000) : null]);
  }
  async retryOrFail(job, error) {
    const dead = job.attempts >= job.max_attempts;
    await this.pool.query("update dam.jobs set status = $2, error = $3, locked_by = null, run_after = now() + ($4::int * interval '1 minute') where id = $1",
      [job.id, dead ? "dead" : "pending", String(error?.message || error).slice(0, 2000), Math.min(60, 2 ** job.attempts)]);
    return dead;
  }
  async jobCounts() { return (await this.pool.query("select kind, status, count(*)::int as n from dam.jobs group by 1,2 order by 1,2")).rows; }
  async requeueStale(minutes = 30) { const { rowCount } = await this.pool.query("update dam.jobs set status = 'pending', locked_by = null where status = 'running' and locked_at < now() - ($1::int * interval '1 minute')", [minutes]); return rowCount; }

  // ---- spend ----
  async recordSpend({ assetId = null, provider, model, kind, usd, tokensIn = null, tokensOut = null }) {
    await this.pool.query("insert into dam.spend (asset_id, provider, model, kind, usd, tokens_in, tokens_out) values ($1,$2,$3,$4,$5,$6,$7)", [assetId, provider, model, kind, usd, tokensIn, tokensOut]);
  }
  async spendSince(hours = 24) { return Number((await this.pool.query("select coalesce(sum(usd),0)::float as usd from dam.spend where created_at > now() - ($1::int * interval '1 hour')", [hours])).rows[0].usd); }

  // ---- workers ----
  async heartbeat(workerId, activity) { await this.pool.query("insert into dam.workers (id, activity, last_seen_at) values ($1,$2,now()) on conflict (id) do update set activity = excluded.activity, last_seen_at = now()", [workerId, activity]); }

  // ---- stats ----
  async stats() {
    const [byStatus, byBrandClass, sources, spend, jobs] = await Promise.all([
      this.pool.query("select status, count(*)::int as n from dam.assets where deleted_at is null group by 1 order by 1"),
      this.pool.query("select coalesce(brand,'(unassigned)') as brand, coalesce(class,'(unclassified)') as class, count(*)::int as n from dam.assets where deleted_at is null group by 1,2 order by 1,3 desc"),
      this.listSources(),
      this.pool.query("select coalesce(sum(usd),0)::float as total, coalesce(sum(usd) filter (where created_at > now() - interval '24 hours'),0)::float as last24h from dam.spend"),
      this.jobCounts(),
    ]);
    return { assets: byStatus.rows, byBrandClass: byBrandClass.rows, sources: sources.map(({ cursor: _c, ...source }) => source), spendUsd: spend.rows[0], jobs };
  }
}
