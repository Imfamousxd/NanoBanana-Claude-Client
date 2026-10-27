// Operator recovery steps, each with a --dry-run that only SELECTs:
//   recoverDiscover  — clear dead discover jobs, drop the cursors of the sources they belong to, queue one
//                      full discover per source (discover then re-resolves a moved root or disables it)
//   backfillBrands   — brand at discovery for rows indexed before it existed: assets.brand = the folder's brand
//                      (BRAND_PATH_RULES, else the source's brand_hint), flags.brand_basis = 'folder'; analysed
//                      rows that already carry the picture's brand get brand_basis = 'vision'
// Both are idempotent and print the SQL they run.
import { BRAND_PATH_RULES } from "./config.mjs";

const lit = (value) => (value === null || value === undefined ? "null" : `'${String(value).replace(/'/g, "''")}'`);

export async function recoverDiscover(db, { dryRun = true, sources = null } = {}) {
  const only = sources?.length ? sources : null;
  const { rows: dead } = await db.query(`select source_id, count(*)::int as n, min(created_at) as first, max(created_at) as last, left(max(error), 200) as error
    from dam.jobs where kind = 'discover' and status = 'dead' ${only ? "and source_id = any($1::text[])" : ""} group by 1 order by 2 desc`, only ? [only] : []);
  const affected = dead.map((row) => row.source_id);
  const { rows: state } = affected.length ? await db.query("select id, root, enabled, cursor is not null as has_cursor, left(last_error, 200) as last_error from dam.sources where id = any($1::text[]) order by id", [affected]) : { rows: [] };
  const sql = affected.length ? [
    `delete from dam.jobs where kind = 'discover' and status = 'dead' and source_id in (${affected.map(lit).join(", ")});`,
    `update dam.sources set cursor = null, last_error = 'cursor reset by dam recover' where id in (${affected.map(lit).join(", ")});`,
    ...affected.map((id) => `insert into dam.jobs (kind, source_id, payload, priority) select 'discover', ${lit(id)}, '{"full":true,"reason":"dam recover"}'::jsonb, 10 where not exists (select 1 from dam.jobs where kind = 'discover' and source_id = ${lit(id)} and status in ('pending','running'));`),
  ] : [];
  const summary = { dryRun, deadDiscoverJobs: dead.reduce((n, row) => n + row.n, 0), perSource: dead, sources: state, sql };
  if (dryRun || !affected.length) return summary;
  const client = await db.pool.connect();
  try {
    await client.query("begin");
    const removed = await client.query(sql[0]);
    await client.query(sql[1]);
    let queued = 0;
    for (const statement of sql.slice(2)) queued += (await client.query(statement)).rowCount;
    await client.query("commit");
    return { ...summary, removed: removed.rowCount, cursorsReset: affected.length, queued };
  } catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); }
}

/** The CASE expression giving a row's folder brand (BRAND_PATH_RULES first, then the source's hint). */
export function folderBrandSql(pathColumn = "a.path", hintColumn = "s.brand_hint") {
  return `case ${BRAND_PATH_RULES.map((rule) => `when ${pathColumn} ~* ${lit(rule.pattern.source)} then ${lit(rule.brand)}`).join(" ")} else ${hintColumn} end`;
}

export async function backfillBrands(db, { dryRun = true } = {}) {
  const brandExpr = folderBrandSql();
  const { rows: perSource } = await db.query(`select a.source_id, ${brandExpr} as folder_brand, count(*)::int as n
    from dam.assets a join dam.sources s on s.id = a.source_id where a.brand is null and a.deleted_at is null group by 1,2 order by 1,2`);
  const { rows: visionRows } = await db.query("select count(*)::int as n from dam.assets where brand is not null and analysis is not null and not (flags ? 'brand_basis')");
  const sources = [...new Set(perSource.map((row) => row.source_id))];
  const statementFor = (id) => `update dam.assets a set brand = ${brandExpr}, flags = a.flags || '{"brand_basis":"folder"}'::jsonb from dam.sources s where s.id = a.source_id and a.source_id = ${lit(id)} and a.brand is null and (${brandExpr}) is not null;`;
  const visionSql = `update dam.assets set flags = flags || '{"brand_basis":"vision"}'::jsonb where brand is not null and analysis is not null and not (flags ? 'brand_basis');`;
  const sql = [...sources.map(statementFor), visionSql];
  const summary = { dryRun, unbranded: perSource.reduce((n, row) => n + row.n, 0), assignable: perSource.filter((row) => row.folder_brand).reduce((n, row) => n + row.n, 0), perSource, visionBasis: visionRows[0].n, sql };
  if (dryRun) return summary;
  let updated = 0;
  // One statement per source keeps each under the statement timeout; re-running is a no-op.
  for (const id of sources) updated += (await db.query(statementFor(id))).rowCount;
  const vision = (await db.query(visionSql)).rowCount;
  return { ...summary, updated, visionMarked: vision };
}
