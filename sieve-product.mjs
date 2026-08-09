#!/usr/bin/env node
// sieve-product.mjs — the SKU registry and the hard refusal.
//
//   node sieve-product.mjs list
//   node sieve-product.mjs resolve DH-vial              # canonical ref path, exit 2 if unresolvable
//   node sieve-product.mjs check batches/dh-recovery.batch.json   # THE GUARD — exit 2 on violation
//
// THE BUG THIS EXISTS TO MAKE IMPOSSIBLE
// `dh-bloodwork-ads.mjs` declares `const VIAL_ANCHOR = "Brand Context/assets/Dialed_Health/
// 2026-04-17T21-19-49_...jpg"` on line 18 and then ships `refs:[]` on all five jobs. The
// canonical vial sat on disk while the model invented it five times. Nothing caught it,
// because nothing was checking — the prompt said "vial" and the model happily drew *a* vial.
//
// Product fidelity is the one axis with genuine ground truth: there is a right answer sitting
// in `Brand Context/assets/`. So this refuses rather than guesses. A shot whose prompt names a
// known SKU but attaches no reference to it is a compile error, not a render.
//
// ESCAPE HATCH, deliberately awkward: set `"_skip_product_check": "<reason>"` on the job. It
// must be a non-empty string, so opting out is a written decision that survives in the batch
// file, not a silent flag. A guard you cannot get past on a deadline is a guard you delete.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REG = path.join(ROOT, "sieve/products");

function loadProducts() {
  if (!fs.existsSync(REG)) return [];
  const out = [];
  for (const brand of fs.readdirSync(REG)) {
    const dir = path.join(REG, brand);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
        p.__file = path.relative(ROOT, path.join(dir, f));
        out.push(p);
      } catch (e) {
        console.error(`  ! malformed registry entry ${brand}/${f}: ${e.message}`);
      }
    }
  }
  return out;
}

const products = loadProducts();
const cmd = process.argv[2];

// Every path a job might attach a reference through, across the runners' differing contracts.
const REF_KEYS = ["refImages", "refs", "reference_images", "image", "refImage", "identity"];
function jobRefs(job) {
  const out = [];
  for (const k of REF_KEYS) {
    const v = job[k];
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) out.push(...v.filter((x) => typeof x === "string"));
  }
  return out;
}

function jobText(job) {
  return [job.prompt, job.id, job._id].filter(Boolean).join(" ");
}

// Word-boundary alias match. "vial" must not fire on "convivial"; the matched alias is always
// reported so a false positive is visible rather than mysterious.
function matchedAliases(text, product) {
  const hay = text.toLowerCase();
  return (product.aliases || []).filter((a) => {
    const esc = a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(hay);
  });
}

if (cmd === "list" || !cmd) {
  if (!products.length) { console.log(`No products registered. Add JSON files under ${path.relative(ROOT, REG)}/<Brand>/`); process.exit(0); }
  console.log(`\n${products.length} SKU(s) registered:\n`);
  for (const p of products) {
    const abs = path.join(ROOT, p.canonical || "");
    const ok = p.canonical && fs.existsSync(abs);
    console.log(`  ${ok ? "✓" : "✗"} ${p.sku.padEnd(22)} ${p.brand}`);
    console.log(`     aliases : ${(p.aliases || []).join(", ")}`);
    console.log(`     canonical: ${p.canonical || "(none)"}${ok ? "" : "   <-- MISSING ON DISK"}`);
  }
  const broken = products.filter((p) => !p.canonical || !fs.existsSync(path.join(ROOT, p.canonical)));
  if (broken.length) { console.error(`\n${broken.length} entr(y/ies) point at a file that does not exist.`); process.exit(2); }
  console.log();
  process.exit(0);
}

if (cmd === "resolve") {
  const want = (process.argv[3] || "").toLowerCase();
  if (!want) { console.error("usage: sieve-product.mjs resolve <sku|alias>"); process.exit(2); }
  const hit = products.find((p) => p.sku.toLowerCase() === want || (p.aliases || []).some((a) => a.toLowerCase() === want));
  if (!hit) {
    console.error(`REFUSED: no registered SKU matches "${want}".`);
    console.error(`Known: ${products.map((p) => p.sku).join(", ") || "(registry empty)"}`);
    process.exit(2);
  }
  const abs = path.join(ROOT, hit.canonical);
  if (!fs.existsSync(abs)) { console.error(`REFUSED: ${hit.sku} canonical missing on disk: ${hit.canonical}`); process.exit(2); }
  console.log(hit.canonical);
  if (hit.geometry) console.error(`  geometry: ${hit.geometry}`);
  for (const l of hit.locked || []) console.error(`  locked  : ${l}`);
  process.exit(0);
}

if (cmd === "check") {
  const file = process.argv[3];
  if (!file) { console.error("usage: sieve-product.mjs check <batch.json>"); process.exit(2); }
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!fs.existsSync(abs)) { console.error(`Batch not found: ${file}`); process.exit(2); }

  let jobs;
  try { jobs = JSON.parse(fs.readFileSync(abs, "utf-8")); }
  catch (e) { console.error(`Batch is not valid JSON: ${e.message}`); process.exit(2); }
  if (!Array.isArray(jobs)) jobs = [jobs];

  console.log(`\nsieve-product check — ${path.basename(file)} · ${jobs.length} job(s) · ${products.length} SKU(s) registered\n`);

  const violations = [];
  jobs.forEach((job, i) => {
    const label = job._id || job.id || `job ${i + 1}`;
    const text = jobText(job);
    const refs = jobRefs(job).map((r) => path.basename(r).toLowerCase());

    for (const p of products) {
      const hits = matchedAliases(text, p);
      if (!hits.length) continue;

      if (typeof job._skip_product_check === "string" && job._skip_product_check.trim()) {
        console.log(`  SKIP  ${label} names ${p.sku} — waived: "${job._skip_product_check}"`);
        continue;
      }
      const want = path.basename(p.canonical).toLowerCase();
      const alt = (p.also_accept || []).map((x) => path.basename(x).toLowerCase());
      const attached = refs.includes(want) || alt.some((a) => refs.includes(a));
      if (attached) {
        console.log(`  OK    ${label} names ${p.sku} (via "${hits[0]}") and attaches it`);
      } else {
        violations.push({ label, sku: p.sku, alias: hits[0], canonical: p.canonical, refs });
        console.log(`  FAIL  ${label} names ${p.sku} (via "${hits[0]}") but attaches NO reference to it`);
        console.log(`          attach: ${p.canonical}`);
        console.log(`          has   : ${refs.length ? refs.join(", ") : "(no references at all)"}`);
      }
    }
  });

  if (!violations.length) { console.log(`\nAll product references resolve. Safe to render.\n`); process.exit(0); }

  console.error(`\nREFUSED — ${violations.length} job(s) name a real SKU with no reference attached.`);
  console.error(`Without the canonical asset the model does not fail; it invents a plausible variant,`);
  console.error(`which is worse, because it looks fine until it sits next to the real product.`);
  console.error(`\nFix by attaching the canonical path, or waive deliberately with:`);
  console.error(`  "_skip_product_check": "<why this shot legitimately needs no product reference>"\n`);
  process.exit(2);
}

console.error(`unknown command "${cmd}"\nusage: sieve-product.mjs list | resolve <sku> | check <batch.json>`);
process.exit(2);
