#!/usr/bin/env node
// ledger-backfill.mjs — one-shot backfill of public.engine_generations.
//
//   node ledger-backfill.mjs
//
// Two sources, in order of trust:
//   1. generations/**/*.task.json sidecars on disk (paired with .request.json for the prompt)
//   2. the ModelArk task LIST (read-only GET, bills nothing) for the historical tasks that
//      have NO sidecar — those get prompt_text null and request_json {backfilled_from:'modelark-ledger'}
//
// Upserts via engine-ledger.mjs (merge-duplicates on task_id), so re-running is safe.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recordGeneration, listTaskIds } from "./engine-ledger.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const ARK = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const ARK_KEY = process.env.MODELARK_API_KEY;
const RATE = 0.0107 / 1000; // $ per completion token

// folder name -> brief metadata (spec: muha-* => Muha_Meds; unknown => null)
const FOLDER_META = {
  "muha-goldenhour-house": { brand: "Muha_Meds", campaign: "golden-hour-rolex", lane: "ugc" },
  "muha-eurosummer":       { brand: "Muha_Meds", campaign: "euro-summer-25k-trip", lane: "ugc" },
  "muha-gen2x2":           { brand: "Muha_Meds", campaign: null, lane: null },
};

const walk = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".task.json")) out.push(p);
  }
  return out;
};

const elide = (req) => !req ? null : ({
  ...req,
  content: Array.isArray(req.content)
    ? req.content.map((c) => c?.image_url?.url?.startsWith?.("data:")
        ? { ...c, image_url: { url: "<base64 elided>" } } : c)
    : req.content,
});

const iso = (unix) => unix ? new Date(unix * 1000).toISOString() : null;
const cost = (tokens) => tokens != null ? tokens * RATE : null;

// ---------------------------------------------------------------- 1. sidecars on disk
const genDir = path.join(__dirname, "generations");
const sidecarRows = [];
const sidecarIds = new Set();
for (const taskPath of walk(genDir)) {
  const j = JSON.parse(fs.readFileSync(taskPath, "utf-8"));
  if (!j.id) { console.warn(`skip (no task id): ${taskPath}`); continue; }
  const folder = path.basename(path.dirname(taskPath));
  const meta = FOLDER_META[folder] || { brand: null, campaign: null, lane: null };
  const reqPath = taskPath.replace(/\.task\.json$/, ".request.json");
  const req = fs.existsSync(reqPath) ? JSON.parse(fs.readFileSync(reqPath, "utf-8")) : null;
  const mp4 = taskPath.replace(/\.task\.json$/, ".mp4");
  const tokens = j.usage?.completion_tokens ?? null;
  sidecarIds.add(j.id);
  sidecarRows.push({
    task_id: j.id,
    generated_at: iso(j.created_at),
    brand: meta.brand, campaign: meta.campaign,
    brief_id: folder.startsWith("_") ? null : folder,
    lane: meta.lane,
    model: j.model ?? req?.model ?? null,
    duration_s: j.duration ?? null,
    resolution: j.resolution ?? null,
    ratio: j.ratio ?? null,
    prompt_text: req?.content?.find?.((c) => c.type === "text")?.text ?? null,
    request_json: elide(req),
    response_json: j,
    seed: j.seed ?? null,
    tokens,
    cost_usd: cost(tokens),
    status: j.status ?? null,
    error_code: j.error?.code ?? null,
    file_path: fs.existsSync(mp4) ? mp4 : null,
  });
}

// ---------------------------------------------------------------- 2. ModelArk ledger (read-only)
const arkItems = [];
let total = Infinity;
for (let page = 1; arkItems.length < total && page <= 50; page++) {
  const res = await fetch(`${ARK}?page_num=${page}&page_size=100`, {
    headers: { Authorization: `Bearer ${ARK_KEY}` },
  });
  if (!res.ok) { console.error(`ModelArk LIST HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); break; }
  const j = await res.json();
  total = j.total ?? 0;
  const items = j.items || [];
  arkItems.push(...items);
  if (!items.length) break;
}
console.log(`ModelArk ledger: ${arkItems.length} of ${total} tasks fetched; ${sidecarRows.length} sidecars on disk`);

const arkRows = arkItems
  .filter((it) => it.id && !sidecarIds.has(it.id))
  .map((it) => {
    const tokens = it.usage?.completion_tokens ?? null;
    return {
      task_id: it.id,
      generated_at: iso(it.created_at),
      brand: null, campaign: null, brief_id: null, lane: null,
      model: it.model ?? null,
      duration_s: it.duration ?? null,
      resolution: it.resolution ?? null,
      ratio: it.ratio ?? null,
      prompt_text: null,
      request_json: { backfilled_from: "modelark-ledger" },
      response_json: it,
      seed: it.seed ?? null,
      tokens,
      cost_usd: cost(tokens),
      status: it.status ?? null,
      error_code: it.error?.code ?? null,
      file_path: null,
    };
  });

// ---------------------------------------------------------------- 3. upsert + summary
const existing = new Set(await listTaskIds());
const classify = (rows) => ({
  inserted: rows.filter((r) => !existing.has(r.task_id)).length,
  updated: rows.filter((r) => existing.has(r.task_id)).length,
  cost: rows.reduce((s, r) => s + (r.cost_usd || 0), 0),
});

let failed = 0;
for (const [name, rows] of [["sidecars", sidecarRows], ["modelark", arkRows]]) {
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const r = await recordGeneration(chunk);
    if (!r.ok) { failed += chunk.length; console.error(`upsert failed (${name} rows ${i}-${i + chunk.length - 1}): ${r.error}`); }
  }
}

const s1 = classify(sidecarRows), s2 = classify(arkRows);
const pad = (v, n) => String(v).padStart(n);
console.log(`\nsource               rows  inserted  updated       cost`);
console.log(`sidecars on disk    ${pad(sidecarRows.length, 5)}  ${pad(s1.inserted, 8)}  ${pad(s1.updated, 7)}  ${pad("$" + s1.cost.toFixed(2), 9)}`);
console.log(`modelark ledger     ${pad(arkRows.length, 5)}  ${pad(s2.inserted, 8)}  ${pad(s2.updated, 7)}  ${pad("$" + s2.cost.toFixed(2), 9)}`);
console.log(`TOTAL               ${pad(sidecarRows.length + arkRows.length, 5)}  ${pad(s1.inserted + s2.inserted, 8)}  ${pad(s1.updated + s2.updated, 7)}  ${pad("$" + (s1.cost + s2.cost).toFixed(2), 9)}`);
if (failed) { console.error(`\n${failed} row(s) FAILED to upsert — re-run after fixing.`); process.exit(1); }
