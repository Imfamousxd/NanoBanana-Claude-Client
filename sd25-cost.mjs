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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
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
  let wasted = 0, wastedN = 0;
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
      const code = t?.error?.code || "";
      if (code.startsWith("Output")) { wastedN++; wasted += 5 * TOKENS_PER_SEC * RATE_GEN; }
    }
  }
  let total = 0;
  console.log(`\n${"model".padEnd(26)} ${"ok".padStart(4)} ${"fail".padStart(5)} ${"tokens".padStart(12)} ${"cost".padStart(9)}`);
  for (const [m, v] of Object.entries(by).sort((a, b) => b[1].tok - a[1].tok)) {
    const c = v.tok * RATE_GEN; total += c;
    console.log(`${m.padEnd(26)} ${String(v.ok).padStart(4)} ${String(v.fail).padStart(5)} ${String(v.tok).padStart(12)} ${usd(c).padStart(9)}`);
  }
  console.log(`${"".padEnd(26)} ${"".padStart(4)} ${"".padStart(5)} ${"TOTAL".padStart(12)} ${usd(total).padStart(9)}`);
  if (wastedN) console.log(`\n  ${wastedN} moderation refusal(s) — compute consumed then withheld, ~${usd(wasted)} wasted`);
  console.log(`\n  (tasks on record: ${all.length}${since ? `, since ${since}` : ""})\n`);
  process.exit(0);
}

console.log("usage: sd25-cost.mjs estimate --dur 30 --n 3   |   sd25-cost.mjs spent [--since YYYYMMDD]");
