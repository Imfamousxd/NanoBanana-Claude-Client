// Search evaluation — runs eval-queries.json against the live index and scores hit@1 / hit@3 by the
// expectation each query carries, printing the misses with what came back instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchAssets } from "./search.mjs";

function matches(expect, row) {
  if (!row) return false;
  if (expect.class && row.class !== expect.class) return false;
  if (expect.anyClass && !expect.anyClass.includes(row.class)) return false;
  if (expect.subclass && row.subclass !== expect.subclass) return false;
  if (expect.brand && row.brand !== expect.brand) return false;
  if (expect.kind && row.kind !== expect.kind) return false;
  if (expect.realHuman && !row.is_real_human) return false;
  if (expect.generated && !(row.analysis?.style?.is_generated)) return false;
  if (expect.titleContains && !String(row.title || "").toLowerCase().includes(expect.titleContains.toLowerCase())) return false;
  if (expect.pathContains && !String(row.path || "").toLowerCase().includes(expect.pathContains.toLowerCase())) return false;
  return true;
}

export async function runEval(db, graph, { config, products, rerank = false, file = undefined } = {}) {
  const suite = JSON.parse(fs.readFileSync(file || path.join(path.dirname(fileURLToPath(import.meta.url)), "eval-queries.json"), "utf8"));
  const results = [];
  for (const item of suite.queries) {
    const result = await searchAssets(db, graph, item.query, { limit: 5, rerank, config, products });
    const rows = result.results;
    // searchAssets returns slim rows without `analysis`; fetch it only when an expectation needs it
    if (item.expect.generated) for (const row of rows) row.analysis = (await db.query("select analysis from dam.assets where id = $1", [row.id])).rows[0]?.analysis;
    const hit1 = matches(item.expect, rows[0]);
    const hit3 = rows.slice(0, 3).some((row) => matches(item.expect, row));
    results.push({ query: item.query, hit1, hit3, filters: result.parsed.filters, top: rows.slice(0, 3).map((row) => `${row.class || "?"}/${row.subclass || ""} ${row.brand || ""} | ${(row.title || row.path || "").slice(0, 60)}`) });
  }
  const n = results.length;
  return { queries: n, hit1: results.filter((r) => r.hit1).length, hit3: results.filter((r) => r.hit3).length, hit1Rate: Math.round((results.filter((r) => r.hit1).length / n) * 100), hit3Rate: Math.round((results.filter((r) => r.hit3).length / n) * 100), misses: results.filter((r) => !r.hit3), details: results };
}
