// engine-ledger.mjs — never-throw Supabase ledger for public.engine_generations.
//
// CONTRACT: a ledger outage must never cost a paid generation. Every export catches
// everything, console.warns, and returns { ok, error } — it NEVER throws into a caller.
//
// PROJECT SAFETY: this repo's .env carries credentials for MORE THAN ONE Supabase project
// (an app project igsfcvgdrxwucauyvtkt on line 8, the engine project hiqefhtlfmcpbyypensf
// on lines 29-33). NEXT_PUBLIC_SUPABASE_URL appears TWICE, so "first match wins" picks the
// WRONG project. This module derives the project ref from DIRECT_URL/DATABASE_URL
// (postgres.<ref>) and only talks to that ref's REST endpoint.

import fs from "fs";
import path from "path";

const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
const TABLE = "engine_generations";
const TIMEOUT_MS = 20000;

let _cfg = null;
function config() {
  if (_cfg) return _cfg;
  const text = fs.readFileSync(path.join(REPO, ".env"), "utf-8");
  const vals = {}, multi = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
    if (m) { vals[m[1]] = m[2]; (multi[m[1]] ||= []).push(m[2]); }
  }
  const pg = vals.DIRECT_URL || vals.DATABASE_URL || "";
  const ref = (pg.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/) || [])[1];
  if (!ref) throw new Error("cannot derive Supabase project ref from DIRECT_URL/DATABASE_URL in .env");
  const url = (multi.NEXT_PUBLIC_SUPABASE_URL || []).find((u) => u.includes(`//${ref}.`))
    || `https://${ref}.supabase.co`;
  const key = vals.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from .env");
  _cfg = { rest: `${url.replace(/\/+$/, "")}/rest/v1/${TABLE}`, key, ref };
  return _cfg;
}

async function req(method, qs, body, prefer) {
  const { rest, key } = config();
  const res = await fetch(rest + qs, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

/** Upsert one row (or an array of rows) keyed on task_id. Never throws. */
export async function recordGeneration(row) {
  try {
    if (!row || (Array.isArray(row) && row.length === 0)) return { ok: true, count: 0 };
    await req("POST", "?on_conflict=task_id", row, "resolution=merge-duplicates,return=minimal");
    return { ok: true, count: Array.isArray(row) ? row.length : 1 };
  } catch (e) {
    console.warn(`[engine-ledger] recordGeneration failed (generation unaffected): ${e?.message || e}`);
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Attach gate results (jsonb) to an existing row; optionally set rejected_by. Never throws. */
export async function updateGates(task_id, gates, rejected_by) {
  try {
    if (!task_id) throw new Error("updateGates: no task_id");
    const patch = { gates };
    if (rejected_by !== undefined) patch.rejected_by = rejected_by;
    await req("PATCH", `?task_id=eq.${encodeURIComponent(task_id)}`, patch, "return=minimal");
    return { ok: true };
  } catch (e) {
    console.warn(`[engine-ledger] updateGates failed (generation unaffected): ${e?.message || e}`);
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Record the human call: operator_verdict e.g. 'approved' | 'rejected'. Never throws. */
export async function updateVerdict(task_id, verdict) {
  try {
    if (!task_id) throw new Error("updateVerdict: no task_id");
    await req("PATCH", `?task_id=eq.${encodeURIComponent(task_id)}`, { operator_verdict: verdict }, "return=minimal");
    return { ok: true };
  } catch (e) {
    console.warn(`[engine-ledger] updateVerdict failed: ${e?.message || e}`);
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Rows awaiting the operator's call. Never throws; [] on failure. */
export async function listPending() {
  try {
    const { rest, key } = config();
    const res = await fetch(
      `${rest}?operator_verdict=eq.pending&status=eq.succeeded` +
      `&select=task_id,brand,brief_id,status,cost_usd,file_path&order=created_at.desc&limit=50`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return await res.json();
  } catch (e) {
    console.warn(`[engine-ledger] listPending failed: ${e?.message || e}`);
    return [];
  }
}

/** Recent rows with the diagnostic columns a human/MCP needs to see WHAT happened and WHY —
 *  status, the operator verdict, who rejected it, the gate outcomes, and the cost. This is the
 *  "did it reach the final goal?" read the ledger was missing a surface for. Never throws; [] on failure. */
export async function listRecent(limit = 20) {
  try {
    const { rest, key } = config();
    const n = Math.max(1, Math.min(200, Number(limit) || 20));
    const sel = "task_id,created_at,generated_at,brand,brief_id,lane,model,duration_s," +
                "status,error_code,gates,operator_verdict,rejected_by,cost_usd,file_path";
    const res = await fetch(`${rest}?select=${sel}&order=created_at.desc&limit=${n}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return await res.json();
  } catch (e) {
    console.warn(`[engine-ledger] listRecent failed: ${e?.message || e}`);
    return [];
  }
}

/** Read helper for tooling (backfill dedupe/summary). Never throws; [] on failure. */
export async function listTaskIds() {
  try {
    const { rest, key } = config();
    const res = await fetch(`${rest}?select=task_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: "0-99999" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return (await res.json()).map((r) => r.task_id).filter(Boolean);
  } catch (e) {
    console.warn(`[engine-ledger] listTaskIds failed: ${e?.message || e}`);
    return [];
  }
}
