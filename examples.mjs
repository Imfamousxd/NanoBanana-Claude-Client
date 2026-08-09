#!/usr/bin/env node
/**
 * examples.mjs — the "what we want" library. Pull past reference creatives by TYPE, so a new
 * generation has real targets and @Image references instead of starting from a blank prompt.
 *
 *   node examples.mjs types                                  # the taxonomy + how many examples each has
 *   node examples.mjs find --type photo --subtype meta-ad    # real example files of that kind
 *        [--brand <B>] [--limit N] [--json]
 *
 * Sources live in examples/sources.json (folder -> type/subtype/brand). Files are resolved live,
 * so the library stays accurate as assets grow — add a source when new good work lands, not a
 * hand-listed file. Returns actual paths you can pass to scene-frame.mjs / @Image references.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CAT = JSON.parse(fs.readFileSync(path.join(DIR, "examples", "sources.json"), "utf-8"));
const IMG = /\.(png|jpe?g|webp)$/i, VID = /\.(mp4|mov|webm)$/i;
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);

// list example files under a source dir (recursive, shallow-capped), matching the source's type
function filesFor(src, limit) {
  const base = path.join(DIR, src.dir);
  if (!fs.existsSync(base)) return [];
  const want = src.type === "video" ? VID : IMG;
  const out = [];
  const walk = (d, depth) => {
    if (out.length >= limit || depth > 3) return;
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= limit) break;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (want.test(e.name) && !e.name.startsWith("_")) out.push(path.relative(DIR, p));
    }
  };
  walk(base, 0);
  return out;
}

const [cmd] = process.argv.slice(2);
if (cmd === "types") {
  for (const [type, subs] of Object.entries(CAT.taxonomy)) {
    for (const sub of subs) {
      const srcs = CAT.sources.filter((s) => s.type === type && s.subtype === sub);
      const n = srcs.reduce((a, s) => a + filesFor(s, 9999).length, 0);
      const brands = [...new Set(srcs.map((s) => s.brand).filter(Boolean))];
      console.log(`${type}/${sub}`.padEnd(24) + `${n} example(s)` + (brands.length ? `  [${brands.join(", ")}]` : n ? "" : "  (none yet)"));
    }
  }
} else if (cmd === "find") {
  const type = arg("type"), subtype = arg("subtype"), brand = arg("brand"), limit = Number(arg("limit", 8));
  const matches = CAT.sources.filter((s) =>
    (!type || s.type === type) && (!subtype || s.subtype === subtype) && (!brand || s.brand === brand));
  if (!matches.length) { console.error(`no sources for type=${type} subtype=${subtype} brand=${brand || "any"}`); process.exit(2); }
  const result = matches.map((s) => ({ ...s, files: filesFor(s, limit) })).filter((s) => s.files.length);
  if (flag("json")) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
  for (const s of result) {
    console.log(`\n▸ ${s.type}/${s.subtype}${s.brand ? ` · ${s.brand}` : ""} — ${s.note}`);
    console.log(`  (${s.dir})`);
    for (const f of s.files) console.log(`   ${f}`);
  }
  if (!result.length) console.log("(sources matched but no files on disk yet)");
} else {
  console.error("usage: examples.mjs types | find --type <photo|video> [--subtype <s>] [--brand <B>] [--limit N] [--json]");
  process.exit(1);
}
