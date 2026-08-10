#!/usr/bin/env node
/**
 * sd25-cost.mjs — know what a batch costs BEFORE you spend it, and what you have spent since.
 *
 *   node sd25-cost.mjs estimate --dur 30 --n 3         # what would this cost?
 *   node sd25-cost.mjs spent                            # audit the task ledger to date
 *   node sd25-cost.mjs spent --since 20260808           # only today
 *
 * WHY THIS EXISTS
 * A 30s take is ~$7 and a 5s take is ~$1.16, and until the invoice arrived nobody knew that. Real
 * money was spent PROVING PROMPTS at 30s that could have been proven at 5s, and on generations
 * that were refused for moderation after consuming full compute. This makes the number visible
 * before the spend rather than after.
 *
 * RATES — from the actual BytePlus invoice, not from documentation:
 *   inference (t2v / i2v)      $0.0107 per 1K tokens
 *   video-to-video (extension) $0.0064 per 1K tokens   <- 40% CHEAPER
 * MEASURED: one 5s 720p generation = 108,633 completion tokens, and token count scales with
 * duration, so tokens/second ~= 21,727.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot } from "./lib-repo-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = repoRoot();
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.MODELARK_API_KEY;
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";

const RATE_GEN = 0.0107 / 1000;   // invoice line 1
const RATE_V2V = 0.0064 / 1000;   // invoice line 2 — extension / video-to-video
const TOKENS_PER_SEC = 108633 / 5;

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2] || "estimate";
const usd = (n) => `$${n.toFixed(2)}`;

if (cmd === "estimate") {
  const dur = Number(arg("dur", 5));
  const n = Number(arg("n", 1));
  const tok = dur * TOKENS_PER_SEC * n;
  const gen = tok * RATE_GEN, v2v = tok * RATE_V2V;
  console.log(`\n${n} x ${dur}s  =  ${Math.round(tok).toLocaleString()} tokens`);
  console.log(`  as fresh generation : ${usd(gen)}   (${usd(gen / n)} each)`);
  console.log(`  as extension / v2v  : ${usd(v2v)}   (${usd(v2v / n)} each)  — 40% cheaper`);
  console.log(`\nreference points:`);
  for (const d of [5, 10, 15, 30]) {
    console.log(`  ${String(d).padStart(2)}s  ${usd(d * TOKENS_PER_SEC * RATE_GEN).padStart(7)} generated   ${usd(d * TOKENS_PER_SEC * RATE_V2V).padStart(7)} extended`);
  }
  console.log(`\nRULE: prove the prompt at 5s (${usd(5 * TOKENS_PER_SEC * RATE_GEN)}), commit at length.`);
  console.log(`A 30s test roll costs the same as SIX 5s tests.\n`);
  process.exit(0);
}

if (cmd === "spent") {
  const since = arg("since", "");
  let all = [], page = 1;
  while (page <= 20) {
    const r = await fetch(`${BASE}?page_size=100&page_num=${page}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) break;
    const j = await r.json();
    const items = j.items || [];
    all.push(...items);
    if (items.length < 100) break;
    page++;
  }
  if (since) all = all.filter((t) => (t.id?.match(/cgt-(\d{8})/)?.[1] || "") >= since);

  const by = {};
  let wasted = 0, wastedN = 0, wastedEstimated = false;
  for (const t of all) {
    const m = (t.model || "?").replace(/-\d{6}$/, "");
    by[m] ??= { ok: 0, fail: 0, tok: 0 };
    if (t.status === "succeeded") {
      by[m].ok++;
      by[m].tok += t?.usage?.completion_tokens || 0;
    } else if (t.status === "failed") {
      by[m].fail++;
      // A moderation refusal ran to completion before being withheld, so it consumed compute.
      // An InvalidParameter fails at submit and is effectively free.
      // A moderation refusal is ASSUMED to have consumed compute. Measured 2026-08-08: failed
      // tasks report NO usage object at all — including Output* refusals — so this figure is an
      // estimate the tool invents, not a measurement. When usage IS present, use it.
      const code = t?.error?.code || "";
      if (code.startsWith("Output")) {
        wastedN++;
        const tok = t?.usage?.completion_tokens;
        wasted += tok ? tok * RATE_GEN : 5 * TOKENS_PER_SEC * RATE_GEN;
        if (!tok) wastedEstimated = true;
      }
    }
  }
  let total = 0;
  console.log(`\n${"model".padEnd(26)} ${"ok".padStart(4)} ${"fail".padStart(5)} ${"tokens".padStart(12)} ${"cost".padStart(9)}`);
  for (const [m, v] of Object.entries(by).sort((a, b) => b[1].tok - a[1].tok)) {
    const c = v.tok * RATE_GEN; total += c;
    console.log(`${m.padEnd(26)} ${String(v.ok).padStart(4)} ${String(v.fail).padStart(5)} ${String(v.tok).padStart(12)} ${usd(c).padStart(9)}`);
  }
  console.log(`${"".padEnd(26)} ${"".padStart(4)} ${"".padStart(5)} ${"TOTAL".padStart(12)} ${usd(total).padStart(9)}`);
  if (wastedN) {
    console.log(`\n  ${wastedN} moderation refusal(s) — compute assumed consumed then withheld, ~${usd(wasted)}`);
    if (wastedEstimated) console.log(`  ^ ESTIMATED, not measured: failed tasks report no usage object. Reconcile on the invoice.`);
  }
  console.log(`\n  (tasks on record: ${all.length}${since ? `, since ${since}` : ""})\n`);
  console.log(`  run \`sd25-cost.mjs drain\` to check every paid task actually reached disk.\n`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// drain — the ledger says you paid for it; does it exist on your disk?
//
// 28 generations were once paid for and never downloaded, because stopping a run does NOT stop
// the spend: submitted tasks keep running server-side and their delivery URLs expire in 24h.
// It happened again on 2026-08-09 (cgt-20260809083708-6hdmc, a $4.63 20s clip with no log entry
// and no file). Eyeballing a folder cannot catch this; reconciling the ledger against the disk can.
// ---------------------------------------------------------------------------
if (cmd === "drain") {
  // Scan EVERY place output lands, not one folder. The first cut scanned only gen-image/generations
  // and reported all 124 succeeded tasks as orphans — $283.54, i.e. the entire account history —
  // because the outputs live in other worktrees, in research folders and on the Desktop. A drain
  // check that cries wolf on everything gets ignored, which is worse than not having one.
  const roots = arg("dir")
    ? [arg("dir")]
    : [
        path.join(REPO, "generations"),
        path.join(REPO, ".claude/worktrees"),   // every worktree's generations/ and research/
        path.join(process.env.HOME, "Desktop/MUHA-ALL-VIDEOS"),
      ].filter((p) => fs.existsSync(p));
  const recover = process.argv.includes("--recover");

  // Every task id we can prove reached disk: any *.task.json sidecar, plus ids in filenames.
  const seen = new Set();
  const walk = (d) => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const idInName = e.name.match(/cgt-[\w-]+/);
      if (idInName) seen.add(idInName[0]);
      if (!e.name.endsWith(".task.json")) continue;
      try {
        const j = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (j.id) seen.add(j.id);
      } catch { /* a half-written sidecar is not proof of delivery */ }
    }
  };
  for (const r of roots) walk(r);

  let all = [], page = 1;
  while (page <= 20) {
    const r = await fetch(`${BASE}?page_size=100&page_num=${page}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) break;
    const j = await r.json();
    const items = j.items || [];
    all.push(...items);
    if (items.length < 100) break;
    page++;
  }
  const since = arg("since", "");
  if (since) all = all.filter((t) => (t.id?.match(/cgt-(\d{8})/)?.[1] || "") >= since);

  const paid = all.filter((t) => t.status === "succeeded");
  const unmatched = paid.filter((t) => !seen.has(t.id));

  // AGE IS THE CONFIDENCE SPLIT. A delivery URL lives ~24h, and sidecar-writing only became
  // standard recently — so an unmatched task older than that is usually a file saved under a
  // human name with no id recorded, NOT a lost generation. Only the fresh ones are actionable,
  // and only they are counted as money at risk.
  const ageH = (t) => (Date.now() / 1000 - (t.created_at || 0)) / 3600;
  const orphans = unmatched.filter((t) => ageH(t) <= 24);
  const unverifiable = unmatched.filter((t) => ageH(t) > 24);

  console.log(`\nscanned ${roots.length} root(s):`);
  for (const r of roots) console.log(`    ${r}`);
  console.log(`  accounted task ids on disk : ${seen.size}`);
  console.log(`  succeeded tasks in ledger  : ${paid.length}`);
  console.log(`  ORPHANS  (<24h, RECOVERABLE): ${orphans.length}`);
  console.log(`  unverifiable (>24h, URL expired, likely saved under a human filename): ${unverifiable.length}\n`);

  if (!orphans.length) {
    console.log("  clean — every task inside the recovery window reached disk.");
    if (unverifiable.length) {
      console.log(`  ${unverifiable.length} older task(s) cannot be matched: their ids were never`);
      console.log(`  recorded on disk. Not necessarily lost — just unprovable. Sidecars fix this`);
      console.log(`  going forward; nothing can fix it retroactively.`);
    }
    console.log();
    process.exit(0);
  }

  const outDir = path.join(root, "_recovered");
  let lost = 0, got = 0, sum = 0;
  for (const t of orphans) {
    const tok = t?.usage?.completion_tokens || 0;
    const cost = tok * RATE_GEN; sum += cost;
    const age = ((Date.now() / 1000 - (t.created_at || 0)) / 3600).toFixed(1);
    process.stdout.write(`  ${t.id}  ${String(t.duration ?? "?").padStart(3)}s  ${usd(cost).padStart(7)}  ${age}h old  `);
    // The delivery URL is only valid ~24h. Re-fetch the task to get a fresh one.
    let url = null;
    try {
      const d = await (await fetch(`${BASE}/${t.id}`, { headers: { Authorization: `Bearer ${KEY}` } })).json();
      url = d?.content?.video_url || null;
    } catch { /* fall through to LOST */ }
    if (!url) { console.log("URL GONE — unrecoverable"); lost++; continue; }
    if (!recover) { console.log("recoverable (--recover to download)"); continue; }
    try {
      fs.mkdirSync(outDir, { recursive: true });
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      const dest = path.join(outDir, `${t.id}.mp4`);
      fs.writeFileSync(dest, buf);
      fs.writeFileSync(path.join(outDir, `${t.id}.task.json`), JSON.stringify(t, null, 2));
      console.log(`RECOVERED ${(buf.length / 1e6).toFixed(1)} MB`);
      got++;
    } catch (e) { console.log("download failed:", String(e).slice(0, 60)); lost++; }
  }
  console.log(`\n  ${usd(sum)} of generations were paid for and not on disk.`);
  if (recover) console.log(`  recovered ${got}, unrecoverable ${lost} -> ${outDir}`);
  else console.log(`  re-run with --recover to pull them down. URLs expire ~24h after creation.`);
  console.log();
  process.exit(orphans.length ? 1 : 0);
}

console.log("usage: sd25-cost.mjs estimate --dur 30 --n 3");
console.log("       sd25-cost.mjs spent [--since YYYYMMDD]");
console.log("       sd25-cost.mjs drain [--dir <generations>] [--since YYYYMMDD] [--recover]");
