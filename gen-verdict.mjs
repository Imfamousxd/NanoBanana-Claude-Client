#!/usr/bin/env node
/**
 * gen-verdict.mjs — record the operator's call on a generation. The flywheel's human input.
 *
 *   node gen-verdict.mjs <task_id | path/to/clip.mp4> approved|rejected [--why "..."]
 *   node gen-verdict.mjs pending                       # list rows still awaiting a verdict
 *   node gen-verdict.mjs recent [N]                    # last N generations + status/gate/verdict/cost
 *
 * Every generation lands in the Supabase ledger as operator_verdict='pending'. This flips it.
 * 'rejected' also sets rejected_by='operator' — distinct from 'watcher'/'transcript-gate', so
 * queries can separate "the machine caught it" from "the machine missed it and the human caught
 * it". That second set is the enhancement backlog: every row in it is a gate that needs a rule.
 */
import fs from "fs";
import path from "path";
import { updateVerdict, updateGates } from "./engine-ledger.mjs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const why = (() => { const i = process.argv.indexOf("--why"); return i > -1 ? process.argv[i + 1] : null; })();

if (args[0] === "pending") {
  // read via the same service-role config engine-ledger uses
  const { listPending } = await import("./engine-ledger.mjs").then((m) => ({
    listPending: m.listPending,
  })).catch(() => ({}));
  if (listPending) {
    const rows = await listPending();
    if (!rows.length) { console.log("no pending rows — every generation has a verdict"); process.exit(0); }
    for (const r of rows) console.log(`${r.task_id}  ${r.brand ?? "?"}/${r.brief_id ?? "?"}  ${r.status}  $${r.cost_usd ?? "?"}  ${r.file_path ?? ""}`);
  } else console.log("listPending not available in engine-ledger.mjs");
  process.exit(0);
}

if (args[0] === "recent") {
  // Diagnostic view: the last N generations and what became of each — succeeded/failed, the gate
  // outcome (and WHY it was rejected), the operator verdict, and cost. Answers "is anything reaching
  // the final goal, or is it dying in the gates?" at a glance.
  const { listRecent } = await import("./engine-ledger.mjs").catch(() => ({}));
  const n = Number(args[1]) || 20;
  const rows = listRecent ? await listRecent(n) : [];
  if (!rows.length) { console.log("no rows (or ledger offline)"); process.exit(0); }
  const gateOf = (g) => {
    if (!g || !Object.keys(g).length) return "-";
    const parts = [];
    if (g.watcher) parts.push(`watcher:${g.watcher.verdict}`);
    if (g.transcript) parts.push(`transcript:${g.transcript.pass ? "PASS" : "FAIL"}`);
    return parts.join(" ") || "-";
  };
  let succeeded = 0, delivered = 0, killed = 0, spend = 0;
  console.log(`created(UTC)          brief_id              status     verdict   rejected_by   gate                 cost`);
  for (const r of rows) {
    spend += Number(r.cost_usd) || 0;
    if (r.status === "succeeded") succeeded++;
    if (r.operator_verdict === "approved") delivered++;
    if (r.rejected_by) killed++;
    console.log(
      `${(r.created_at||"").replace("T"," ").slice(0,19)}  ${String(r.brief_id||"∅").padEnd(20).slice(0,20)}  ${String(r.status||"").padEnd(9).slice(0,9)}  ${String(r.operator_verdict||"").padEnd(8).slice(0,8)}  ${String(r.rejected_by||"").padEnd(12).slice(0,12)}  ${gateOf(r.gates).padEnd(19).slice(0,19)}  $${(Number(r.cost_usd)||0).toFixed(2)}`);
  }
  console.log(`\n${rows.length} rows · ${succeeded} succeeded · ${delivered} operator-approved (DELIVERED) · ${killed} gate/operator-rejected · $${spend.toFixed(2)} spent`);
  if (delivered === 0) console.log(`⚠ nothing has an 'approved' verdict — run: node gen-verdict.mjs <task_id> approved  (the flywheel's human step)`);
  process.exit(0);
}

let [target, verdict] = args;
if (!target || !["approved", "rejected"].includes(verdict)) {
  console.error("usage: gen-verdict.mjs <task_id|clip.mp4> approved|rejected [--why \"...\"]");
  process.exit(2);
}

// a path resolves to its task_id via the sidecar written at generation time
if (target.endsWith(".mp4") || target.includes("/")) {
  const side = target.replace(/\.mp4$/, ".task.json");
  if (!fs.existsSync(side)) { console.error(`no sidecar at ${side} — pass the cgt-* task id directly`); process.exit(2); }
  target = JSON.parse(fs.readFileSync(side, "utf-8")).id;
}

const r1 = await updateVerdict(target, verdict);
let r2 = { ok: true };
if (verdict === "rejected") {
  // Sets ONLY rejected_by: JSON.stringify drops the undefined `gates` key, so the existing gates
  // jsonb (transcript + watcher results) survives the PATCH untouched. Verified against
  // engine-ledger.updateGates's patch construction.
  r2 = await updateGates(target, undefined, "operator");
}
if (why) console.log(`why (not persisted — say it to Claude so it lands in the verdict ledger): ${why}`);
console.log(`${target} -> ${verdict}  ledger:${r1.ok && r2.ok ? "ok" : "WRITE FAILED — re-run when online"}`);
