// Digestion health — one report that answers "is ingestion live and keeping up?": source cursors and
// their age, throughput per stage over the last hour, queue depth, worker heartbeats, dead jobs by
// error, spend, and the latency from a file's Dropbox modification to its index row and its probe.
export async function digestionStatus(db) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const [sources, stages, throughput, queue, workers, dead, spend, latency, recent] = await Promise.all([
    q(`select s.id, s.kind, s.enabled, s.cursor is not null as has_cursor, round(extract(epoch from (now() - s.last_sync_at))/60)::int as sync_age_min, left(s.last_error, 80) as last_error,
         count(a.id)::int as files, count(a.id) filter (where a.status = 'discovered')::int as awaiting_probe, count(a.id) filter (where a.status in ('probed'))::int as awaiting_analysis,
         count(a.id) filter (where a.status in ('analyzed','embedded'))::int as understood, count(a.id) filter (where a.status = 'failed')::int as failed
       from dam.sources s left join dam.assets a on a.source_id = s.id and a.deleted_at is null group by s.id order by files desc`),
    q(`select status, count(*)::int as n from dam.assets where deleted_at is null group by 1 order by 1`),
    q(`select
         count(*) filter (where created_at > now() - interval '1 hour')::int as discovered_1h,
         count(*) filter (where status <> 'discovered' and updated_at > now() - interval '1 hour')::int as probed_1h,
         count(*) filter (where analyzed_at > now() - interval '1 hour')::int as analyzed_1h,
         count(*) filter (where status = 'embedded' and updated_at > now() - interval '1 hour')::int as embedded_1h,
         count(*) filter (where status <> 'discovered' and updated_at > now() - interval '10 minutes')::int as probed_10m
       from dam.assets where deleted_at is null`),
    q(`select kind, status, count(*)::int as n, min(run_after) > now() as all_deferred from dam.jobs group by 1,2 order by 1,2`),
    q(`select id, activity, round(extract(epoch from (now() - last_seen_at)))::int as seen_s_ago from dam.workers order by last_seen_at desc limit 8`),
    q(`select kind, left(error, 110) as error, count(*)::int as n from dam.jobs where status = 'dead' group by 1,2 order by 3 desc limit 6`),
    q(`select coalesce(sum(usd) filter (where created_at > now() - interval '24 hours'),0)::float as usd_24h, coalesce(sum(usd),0)::float as usd_total, count(*) filter (where created_at > now() - interval '24 hours')::int as calls_24h from dam.spend`),
    q(`select round(percentile_cont(0.5) within group (order by extract(epoch from (created_at - modified_at)))/60)::int as p50_modified_to_indexed_min,
              round(percentile_cont(0.5) within group (order by extract(epoch from (updated_at - created_at)))/60)::int as p50_indexed_to_probed_min, count(*)::int as n
       from dam.assets where deleted_at is null and modified_at > now() - interval '7 days' and created_at > now() - interval '7 days' and status <> 'discovered'`),
    q(`select source_id, right(path, 60) as path, modified_at, created_at as indexed_at, status from dam.assets where deleted_at is null order by created_at desc limit 6`),
  ]);
  const workersLive = workers.filter((worker) => worker.seen_s_ago < 120).length;
  const verdict = [];
  if (!workersLive) verdict.push("NO LIVE WORKER (no heartbeat in 2 minutes)");
  if (sources.some((source) => source.kind === "dropbox" && source.enabled && !source.has_cursor)) verdict.push("a Dropbox source has no cursor yet (initial discover pending)");
  if (sources.some((source) => source.last_error)) verdict.push("a source reports an error");
  if (dead.length) verdict.push(`${dead.reduce((sum, row) => sum + row.n, 0)} dead jobs`);
  if (throughput[0].probed_10m === 0 && stages.some((row) => row.status === "discovered" && row.n > 0)) verdict.push("probe backlog exists but nothing probed in the last 10 minutes");
  return { ok: verdict.length === 0, verdict: verdict.length ? verdict : ["digestion live: workers heartbeating, sources cursored, queue moving"], workersLive, sources, stages, throughput: throughput[0], queue, workers, deadJobs: dead, spend: spend[0], latency: latency[0], newest: recent };
}
