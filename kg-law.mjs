#!/usr/bin/env node
/**
 * kg-law.mjs — read and EVOLVE the knowledge graph fast (graph-fragments/*.json law banks).
 * The point: enhancing the KG should be a one-command habit, not a hand-edit-JSON chore.
 *
 *   node kg-law.mjs list                         # banks + law counts
 *   node kg-law.mjs list <bank>                  # law ids in a bank
 *   node kg-law.mjs search "<query>"             # find laws across all banks
 *   node kg-law.mjs get <bank> <id>              # print one law
 *   node kg-law.mjs add <bank> <id> --json '<{claim,evidence,counterexamples,applies_to,confidence,source}>'
 *        # add OR update a law; validates the 6-field schema before writing (add is upsert)
 *
 * Every law is the uniform 6-field shape the regression suite enforces:
 *   claim · evidence · counterexamples · applies_to · confidence · source
 * confidence ∈ {measured, strong, moderate, documented, weak}. Mark DOCUMENTED (not measured)
 * anything from external docs until an A/B on our own endpoint promotes it — that honesty is
 * the whole value of the graph.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FRAG = path.join(DIR, "graph-fragments");
const REQUIRED = ["claim", "evidence", "counterexamples", "applies_to", "confidence", "source"];
const CONF = ["measured", "strong", "moderate", "documented", "weak"];

// map bank name -> {file, key} by reading each fragment's top-level non-underscore key
function banks() {
  const map = {};
  for (const f of fs.readdirSync(FRAG).filter((x) => x.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(FRAG, f), "utf-8"));
    const key = Object.keys(j).find((k) => !k.startsWith("_"));
    if (key) map[key] = { file: path.join(FRAG, f), key, data: j };
  }
  return map;
}
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };
const [cmd, a, b] = process.argv.slice(2);
const B = banks();

if (cmd === "list" && !a) {
  for (const [name, { data, key }] of Object.entries(B))
    console.log(`${name}  (${Object.keys(data[key]).length} laws)`);
} else if (cmd === "list") {
  if (!B[a]) { console.error(`no bank '${a}' — have: ${Object.keys(B).join(", ")}`); process.exit(2); }
  for (const id of Object.keys(B[a].data[B[a].key])) console.log(id);
} else if (cmd === "search") {
  const q = (a || "").toLowerCase();
  let n = 0;
  for (const [name, { data, key }] of Object.entries(B))
    for (const [id, law] of Object.entries(data[key])) {
      const hay = (id + " " + JSON.stringify(law)).toLowerCase();
      if (hay.includes(q)) { console.log(`[${name}] ${id}\n   ${(law.claim || "").slice(0, 160)}`); n++; }
    }
  console.log(`\n${n} match(es) for "${a}"`);
} else if (cmd === "get") {
  if (!B[a]?.data[B[a].key]?.[b]) { console.error(`not found: ${a} / ${b}`); process.exit(2); }
  console.log(JSON.stringify(B[a].data[B[a].key][b], null, 2));
} else if (cmd === "add") {
  if (!B[a]) { console.error(`no bank '${a}' — have: ${Object.keys(B).join(", ")}`); process.exit(2); }
  let law; try { law = JSON.parse(arg("json") || "{}"); } catch (e) { console.error(`bad --json: ${e.message}`); process.exit(2); }
  const missing = REQUIRED.filter((f) => !law[f] || typeof law[f] !== "string" || !law[f].trim());
  if (missing.length) { console.error(`schema error — missing/empty: ${missing.join(", ")}. Required: ${REQUIRED.join(", ")}`); process.exit(2); }
  if (!CONF.includes(law.confidence)) { console.error(`confidence must be one of: ${CONF.join(", ")}`); process.exit(2); }
  const clean = {}; for (const f of REQUIRED) clean[f] = law[f];   // drop stray fields -> uniform schema
  const { file, key, data } = B[a];
  const existed = Boolean(data[key][b]);
  data[key][b] = clean;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`${existed ? "UPDATED" : "ADDED"} [${a}] ${b}  (bank now ${Object.keys(data[key]).length} laws)`);
  console.log(`→ run: python3 kg-vault-test.py   (validates schema + rebuilds the vault)`);
} else if (cmd === "rm") {
  if (!B[a]?.data[B[a].key]?.[b]) { console.error(`not found: ${a} / ${b}`); process.exit(2); }
  const { file, key, data } = B[a];
  delete data[key][b];
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`REMOVED [${a}] ${b}  (bank now ${Object.keys(data[key]).length} laws) — run: python3 kg-vault-test.py`);
} else {
  console.error("usage: kg-law.mjs list [bank] | search <q> | get <bank> <id> | add <bank> <id> --json '<6-field json>' | rm <bank> <id>");
  process.exit(1);
}
