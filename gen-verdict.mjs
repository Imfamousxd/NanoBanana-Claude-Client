#!/usr/bin/env node
/**
 * gen-verdict.mjs — record the operator's call on a generation. The flywheel's human input.
 *
 *   node gen-verdict.mjs <task_id | path/to/clip.mp4> approved|rejected [--why "..."]
 *   node gen-verdict.mjs pending                       # list rows still awaiting a verdict
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
