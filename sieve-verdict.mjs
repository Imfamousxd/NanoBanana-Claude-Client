#!/usr/bin/env node
/**
 * sieve-verdict.mjs — record the operator's ruling on a watcher flag, and re-tune from the record.
 *
 *   node sieve-verdict.mjs log <clip> --check <slug> --ruling overrule|confirm \
 *        --because "why" [--value "what the check measured"] [--scene "car-interior, window"]
 *   node sieve-verdict.mjs list [--check <slug>]
 *   node sieve-verdict.mjs calibrate [--min 5]
 *   node sieve-verdict.mjs checks
 *
 * WHY THIS EXISTS
 * The operator's eye is the ground truth this whole stack is calibrated against — the 29s morphing
 * piece was caught by eye while every instrument read clean, and the flicker/drift checks were
 * built afterward to imitate that catch. But the watcher's thresholds are generic, so it misfires
 * on scenes it does not understand: on 2026-08-09 it flagged an excited voice at the prize beat as
 * a timbre defect, and a car window as background morphing (its static-patch check assumes a rigid
 * wall). Each such call the operator makes is calibration data. Today those calls evaporate as
 * conversation; this file makes them a ledger the thresholds can be re-tuned against.
 *
 * Storage is append-only JSONL at sieve/verdicts/watch-verdicts.jsonl — one ruling per line,
 * never rewritten, so the history of WHY a threshold moved survives the move. Records carry a
 * graph-ready id (watchv:...) so a future merge into graph.json operator_verdicts is mechanical.
 *
 * `calibrate` does not change any threshold itself. It REPORTS when a check has earned a re-tune
 * (n >= --min and overrule-rate >= 60%) and names the scene contexts that recur in the overrules.
 * Changing sieve-watch.py stays a deliberate human-reviewed edit — a gate that silently re-tunes
 * itself is a gate nobody can trust.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER = path.join(__dirname, "sieve", "verdicts", "watch-verdicts.jsonl");

// Slugs for every check sieve-watch.py can raise, so `log` can validate and `checks` can teach.
// Descriptions paraphrase sieve-watch.py's own output lines.
const CHECKS = {
  "dimensions": "delivered WxH vs --expect-w/-h",
  "duration": "delivered length vs --expect-dur",
  "audio-missing": "no audio stream where one was expected",
  "loudness": "EBU R128 integrated / true peak out of range",
  "voice-timbre": "spectral centroid shift across windows (>35% FAIL, >22% WARN)",
  "luma-trend": "monotonic brightness drift across the clip",
  "static-patch-flicker": "flattest patch in frame 1 wobbles over time (assumes a RIGID surface)",
  "scene-change": "unintended cut detected (FAILs for ugc, WARNs for ad/cinema)",
  "frozen-frames": "stretch of identical frames",
  "composition-drift": "layout correlation vs the opening frame decays",
};

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];

const readLedger = () => {
  if (!fs.existsSync(LEDGER)) return [];
  return fs.readFileSync(LEDGER, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
};

if (cmd === "log") {
  const clip = process.argv[3];
  const check = arg("check");
  const ruling = arg("ruling");
  const because = arg("because");
  const errs = [];
  if (!clip || clip.startsWith("--")) errs.push("first positional must be the clip path");
  else if (!fs.existsSync(clip)) errs.push(`clip not found: ${clip} — log against the real file so the record can be re-measured later`);
  if (!check) errs.push("--check is required (see `checks` for slugs)");
  else if (!CHECKS[check]) errs.push(`unknown check '${check}' — known: ${Object.keys(CHECKS).join(", ")}`);
  if (!["overrule", "confirm"].includes(ruling)) errs.push("--ruling must be overrule (flag was wrong) or confirm (flag was right)");
  if (!because) errs.push("--because is required — a ruling without a reason cannot calibrate anything");
  if (errs.length) { errs.forEach((e) => console.error("  ✗ " + e)); process.exit(2); }

  const t = new Date().toISOString();
  const rec = {
    id: `watchv:${t.slice(0, 10)}-${check}-${path.basename(clip).replace(/\.[^.]+$/, "").slice(0, 40)}`,
    t, clip: path.resolve(clip), check, ruling, because,
    value: arg("value", null),
    scene: arg("scene", null),
    by: "operator",
  };
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.appendFileSync(LEDGER, JSON.stringify(rec) + "\n");
  console.log(`logged ${rec.id}`);
  const n = readLedger().filter((r) => r.check === check).length;
  console.log(`  ${check}: ${n} ruling(s) on record` + (n >= 5 ? " — run `calibrate`" : ""));
  process.exit(0);
}

if (cmd === "list") {
  const want = arg("check", null);
  const rows = readLedger().filter((r) => !want || r.check === want);
  if (!rows.length) { console.log("no verdicts on record" + (want ? ` for ${want}` : "")); process.exit(0); }
  for (const r of rows) {
    console.log(`\n${r.t.slice(0, 16)}  ${r.check}  ${r.ruling.toUpperCase()}`);
    console.log(`  clip   : ${path.basename(r.clip)}`);
    if (r.value) console.log(`  value  : ${r.value}`);
    if (r.scene) console.log(`  scene  : ${r.scene}`);
    console.log(`  because: ${r.because}`);
  }
  console.log();
  process.exit(0);
}

if (cmd === "calibrate") {
  const min = Number(arg("min", 5));
  const rows = readLedger();
  if (!rows.length) { console.log("no verdicts on record — nothing to calibrate from"); process.exit(0); }
  const by = {};
  for (const r of rows) (by[r.check] ??= []).push(r);
  console.log(`\n${"check".padEnd(24)} ${"n".padStart(3)} ${"overruled".padStart(10)}  verdict`);
  console.log("-".repeat(78));
  for (const [check, rs] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
    const over = rs.filter((r) => r.ruling === "overrule");
    const rate = over.length / rs.length;
    let verdict;
    if (rs.length < min) verdict = `collecting (needs ${min})`;
    else if (rate >= 0.6) verdict = "RE-TUNE — misfiring more often than not";
    else if (rate <= 0.2) verdict = "trusted — keep as is";
    else verdict = "mixed — read the reasons";
    console.log(`${check.padEnd(24)} ${String(rs.length).padStart(3)} ${`${over.length}/${rs.length}`.padStart(10)}  ${verdict}`);
    if (rs.length >= min && rate >= 0.6) {
      const scenes = over.map((r) => r.scene).filter(Boolean);
      if (scenes.length) console.log(`${"".padEnd(24)} recurring contexts in the overrules: ${[...new Set(scenes)].join(" · ")}`);
      console.log(`${"".padEnd(24)} -> propose a scoped threshold in sieve-watch.py, reviewed by hand — do not auto-apply`);
    }
  }
  console.log();
  process.exit(0);
}

if (cmd === "checks") {
  for (const [k, v] of Object.entries(CHECKS)) console.log(`  ${k.padEnd(24)} ${v}`);
  process.exit(0);
}

console.log("usage: sieve-verdict.mjs log <clip> --check <slug> --ruling overrule|confirm --because \"...\" [--value \"...\"] [--scene \"...\"]");
console.log("       sieve-verdict.mjs list [--check <slug>]   |   calibrate [--min 5]   |   checks");
