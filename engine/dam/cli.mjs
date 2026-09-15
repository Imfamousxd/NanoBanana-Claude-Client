// DAM CLI — `npm run content -- dam <command>`. Same engine as the MCP tools and the hosted worker.
import path from "node:path";
import { loadGraph, resolveBrand } from "../knowledge/graph.mjs";
import { damConfig } from "./config.mjs";
import { DamDb } from "./db.mjs";
import { DamWorker } from "./worker.mjs";
import { searchAssets, similarAssets, productIndexFromCards } from "./search.mjs";
import { brandCards } from "./analyze.mjs";
import { computeUgcProfiles, getUgcProfile } from "./ugc-profile.mjs";
import { applyVerdictToDam, syncDamToKnowledge } from "./kg-bridge.mjs";
import { importRailwayEnv } from "./import-env.mjs";
import { digestionStatus } from "./status.mjs";
import { runEval } from "./eval.mjs";

export const DAM_HELP = `Digital asset intelligence (Dropbox → understanding → search → knowledge graph):
  npm run content -- dam init-db                                  create/upgrade the dam.* schema (pgvector)
  npm run content -- dam sources                                  list registered sources + cursors
  npm run content -- dam add-source <id> --local <dir> [--brand b]      register a local folder
  npm run content -- dam add-source <id> --dropbox "/path" [--brand b]  register a Dropbox folder
  npm run content -- dam register-defaults                        register the known Dropbox brand folders
  npm run content -- dam scan [<source-id>] [--full]              discover files, queue probes (free)
  npm run content -- dam work [--once] [--kinds probe,analyze,embed] [--max N] [--approve] [--source dropbox:final-2026]
                                                                  run the queue; paid stages need --approve
  npm run content -- dam watch                                    longpoll Dropbox forever + search UI on $PORT (hosted worker)
  npm run content -- dam serve [--port 8787]                      search UI + JSON API only (DAM_UI_PASSWORD protects it)
  npm run content -- dam search "query" [--brand b] [--class c] [--limit 20] [--rerank] [--vectors]
  npm run content -- dam asset <id> | dam similar <id>
  npm run content -- dam stats | dam status                      counts | digestion health (cursors, throughput, workers, latency)
  npm run content -- dam eval [--rerank] [--file queries.json]       search evaluation suite (hit@1 / hit@3 + misses)
  npm run content -- dam profile [--brand b] [--compute]          real-human UGC profile per brand
  npm run content -- dam sync-kg [--brand b]                      push candidates + UGC laws/exemplars into knowledge/
  npm run content -- dam verdict <asset-id> approved|rejected --reason "…" [--roles canonical,style]
  npm run content -- dam reanalyze [--brand b] [--class c] [--older-than-version N]   queue re-analysis
  npm run content -- dam import-env [--cwd <linked railway dir>] [--service s] [--environment e] [--overwrite]
                                                                  copy Dropbox secrets from Railway into .env (values never printed)`;

function option(args, name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback; }
function positional(args) { return args.filter((item, index) => !item.startsWith("--") && !(index > 0 && args[index - 1].startsWith("--") && !["--once", "--full", "--approve", "--rerank", "--vectors", "--compute"].includes(args[index - 1]))); }

export async function runDamCommand(root, args, print) {
  const [command, ...rest] = args;
  const config = damConfig(root);
  if (rest.includes("--approve")) config.approved = true;
  const graph = loadGraph(root);
  const brandOf = (value) => (value ? (resolveBrand(graph, value)?.id || value) : undefined);

  if (!command || command === "help") { console.log(DAM_HELP); return; }
  if (command === "import-env") {
    return print(importRailwayEnv(root, { cwd: option(rest, "--cwd", root), service: option(rest, "--service"), environment: option(rest, "--environment"), project: option(rest, "--project"), overwrite: rest.includes("--overwrite") }));
  }
  if (command === "init-db") { const db = new DamDb(config.databaseUrl); try { return print(await db.initSchema()); } finally { await db.end(); } }

  const worker = new DamWorker(root, { config });
  try {
    switch (command) {
      case "sources": return print(await worker.db.listSources());
      case "register-defaults": return print(await worker.registerDefaultScopes());
      case "add-source": {
        const id = positional(rest)[0];
        if (!id) throw new Error("add-source needs an id.");
        if (option(rest, "--local")) return print(await worker.addLocalSource(id, option(rest, "--local"), option(rest, "--brand")));
        if (option(rest, "--dropbox")) return print(await worker.addDropboxSource(id, option(rest, "--dropbox"), option(rest, "--brand")));
        throw new Error("add-source needs --local <dir> or --dropbox <path>.");
      }
      case "scan": {
        const ids = positional(rest);
        const sources = ids.length ? ids : (await worker.db.listSources()).filter((source) => source.enabled).map((source) => source.id);
        const out = {};
        for (const id of sources) out[id] = await worker.discover(id, { full: rest.includes("--full") });
        return print(out);
      }
      case "work": {
        const kinds = option(rest, "--kinds") ? option(rest, "--kinds").split(",") : undefined;
        const result = await worker.runQueue({ once: rest.includes("--once") || !rest.includes("--forever"), kinds, maxJobs: Number(option(rest, "--max", Infinity)), sourcePrefix: option(rest, "--source") });
        return print({ ...result, queue: await worker.db.jobCounts(), spend24hUsd: await worker.db.spendSince(24) });
      }
      case "watch": {
        await worker.registerDefaultScopes();
        const { startDamServer } = await import("./serve.mjs");
        startDamServer(root);
        console.error("[dam] watching Dropbox sources + serving the search UI; Ctrl-C to stop");
        await Promise.all([worker.watch(), worker.runQueue({ once: false })]);
        return;
      }
      case "serve": {
        const { startDamServer } = await import("./serve.mjs");
        startDamServer(root, { port: Number(option(rest, "--port", process.env.PORT || 8787)) });
        await new Promise(() => {});
        return;
      }
      case "search": {
        const query = positional(rest).join(" ");
        if (!query) throw new Error("search needs a query.");
        config.searchEmbeddingsAllowed = rest.includes("--vectors") || config.approved;
        const result = await searchAssets(worker.db, graph, query, { filters: { brand: brandOf(option(rest, "--brand")), class: option(rest, "--class") }, limit: Number(option(rest, "--limit", 20)), rerank: rest.includes("--rerank"), config, products: productIndexFromCards(worker.cards) });
        return print({ ...result, results: result.results.map((row) => ({ id: row.id, path: row.path, brand: row.brand, class: row.class, product: row.product, title: row.title, quality: row.quality, thumb: row.proxies?.thumb, preview: row.proxies?.preview, score: row.score, why: row.why })) });
      }
      case "asset": return print(await worker.db.getAsset(positional(rest)[0]));
      case "similar": return print(await similarAssets(worker.db, positional(rest)[0], { limit: Number(option(rest, "--limit", 12)) }));
      case "stats": return print(await worker.db.stats());
      case "status": return print(await digestionStatus(worker.db));
      case "eval": {
        config.searchEmbeddingsAllowed = true;
        return print(await runEval(worker.db, graph, { config, products: productIndexFromCards(worker.cards), rerank: rest.includes("--rerank"), file: option(rest, "--file") }));
      }
      case "profile": {
        if (rest.includes("--compute")) await computeUgcProfiles(worker.db, graph, { brand: brandOf(option(rest, "--brand")) });
        const brands = option(rest, "--brand") ? [brandOf(option(rest, "--brand"))] : graph.nodes.filter((node) => node.type === "brand").map((node) => node.id);
        const out = {};
        for (const brand of brands) { const profile = await getUgcProfile(worker.db, brand); if (profile) out[brand] = { sampleSize: profile.sample_size, bands: profile.bands, patterns: profile.patterns, laws: profile.laws, exemplars: profile.exemplarAssets.map((asset) => ({ id: asset.id, path: asset.path, quality: asset.quality, preview: asset.proxies?.preview })) }; }
        return print(out);
      }
      case "sync-kg": return print(await syncDamToKnowledge(root, worker.db, graph, { brand: brandOf(option(rest, "--brand")) }));
      case "verdict": {
        const [assetId, verdict] = positional(rest);
        if (!assetId || !verdict) throw new Error("verdict needs <asset-id> approved|rejected.");
        return print(await applyVerdictToDam(worker.db, { assetId, verdict, reason: option(rest, "--reason"), roles: option(rest, "--roles") ? option(rest, "--roles").split(",") : [] }));
      }
      case "reanalyze": {
        const params = [];
        const clauses = ["deleted_at is null", "kind in ('image','video')"];
        if (option(rest, "--brand")) { params.push(brandOf(option(rest, "--brand"))); clauses.push(`brand = $${params.length}`); }
        if (option(rest, "--class")) { params.push(option(rest, "--class")); clauses.push(`class = $${params.length}`); }
        if (option(rest, "--older-than-version")) { params.push(Number(option(rest, "--older-than-version"))); clauses.push(`coalesce((analyzer->>'schema_version')::int, 0) < $${params.length}`); }
        const { rows } = await worker.db.query(`select id, source_id from dam.assets where ${clauses.join(" and ")}`, params);
        let queued = 0;
        for (const row of rows) if (await worker.db.enqueue("analyze", { assetId: row.id, sourceId: row.source_id, priority: 120 })) queued += 1;
        return print({ matched: rows.length, queued });
      }
      default: throw new Error(`Unknown dam command: ${command}\n${DAM_HELP}`);
    }
  } finally {
    await worker.close();
  }
}

export { brandCards, path };
