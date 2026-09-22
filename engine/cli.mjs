#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./core/env.mjs";
import { serializeError } from "./core/errors.mjs";
import { runDoctor } from "./doctor.mjs";
import { loadGraph, resolveBrand } from "./knowledge/graph.mjs";
import { buildKnowledgeIndex, listCategories, loadKnowledgeIndex } from "./knowledge/indexer.mjs";
import { queryKnowledge } from "./knowledge/retrieval.mjs";
import { executeJob, planJob } from "./pipeline.mjs";
import { reviewImage } from "./quality/openai-judge.mjs";
import { auditAssetDirectory } from "./quality/asset-audit.mjs";
import { commandAd, commandFonts, commandJob, commandKit, commandNew, commandValidate, listPacks } from "./brandkit/index.mjs";
import { buildAssetCatalog, listProducts, searchAssets } from "./assets/catalog.mjs";
import { buildGallery } from "./assets/gallery.mjs";
import { buildContextPackWithDam } from "./learning/context.mjs";
import { recordFeedback } from "./learning/feedback.mjs";
import { searchLaws } from "./learning/laws.mjs";
import { appendPromptLog, readPromptLog } from "./learning/prompt-log.mjs";
import { listLearningStores, loadLearnings, saveLearnings, upsertLaw } from "./learning/store.mjs";
import { spawn } from "node:child_process";
import { runDamCommand, DAM_HELP } from "./dam/cli.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function help() {
  console.log(`Content Engine

Usage:
  npm run content -- doctor
  npm run content -- knowledge build
  npm run content -- knowledge categories
  npm run content -- knowledge query "terms" [--brand brand-id] [--category memes] [--limit 8]
  npm run content -- plan <job.json>
  npm run content -- run <job.json>
  npm run content -- review <job.json> <candidate-image>
  npm run content -- assets audit <directory> [--limit 1000]
  npm run content -- assets search "terms" [--brand b] [--product p] [--role canonical] [--all] [--banned]
  npm run content -- assets products [--brand b]
  npm run content -- assets gallery [--brand b] [--open] [--no-thumbs]     browsable HTML of every asset
  npm run content -- models
  npm run content -- mcp                                                 start the MCP server (stdio)

Self-improvement loop (knowledge/learnings/<brand>.json + .content-engine/prompt-log/):
  npm run content -- context <brand> "brief" [--category c] [--mode m] [--product a,b]
  npm run content -- learn log --brand b --prompt "…" --provider p [--model m] [--ref path]... [--output path]...
  npm run content -- learn record --verdict approved|rejected|revise --reason "…" [--target pl_id|output-path]
                                  [--brand b] [--product p] [--category c] [--tags a,b] [--law "claim"]
                                  [--prompt "…" --provider p --model m --output path] [--no-copy]
  npm run content -- learn laws "terms" [--brand b] [--category c]
  npm run content -- learn add-law --brand b --claim "…" --evidence "…" [--applies-to x] [--confidence weak]
  npm run content -- learn history [--brand b] [--query "…"] [--verdict approved] [--limit 25]
  npm run content -- learn stats [--brand b]

Brand packs (knowledge/brands/<brand>/ — tokens, catalog, copy, prompt blocks):
  npm run content -- brandkit list
  npm run content -- brandkit new <brand> [--name "Display Name"] [--compliance profile-id]
  npm run content -- brandkit validate [<brand>]
  npm run content -- brandkit kit <brand>
  npm run content -- brandkit fonts <brand>
  npm run content -- brandkit ad <brand> <single|panel|streak> [--compound ghkcu] [--panel cellular]
                                  [--hook proof] [--variant base] [--style cryo]
                                  [--ratio 9:16,4:5] [--out dir] [--basename name]
  npm run content -- brandkit job <brand> hero [--compound ghkcu] [--style cryo] [--ratio 9:16]
                                  [--label-crop path] [--empty] [--candidates 2]

${DAM_HELP}

Adding a brand: read CONTRIBUTING.md, then run brandkit new and fill in the pack.
Planning, knowledge queries and brandkit ad renders are offline. Run/review call paid providers.`);
}

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ["help", "--help", "-h"].includes(command)) return help();

  if (command === "doctor") return print(runDoctor(root));
  if (command === "models") {
    const graph = loadGraph(root);
    return print(graph.nodes.filter((node) => node.type === "provider"));
  }
  if (command === "knowledge") {
    const [subcommand, ...rest] = args;
    if (subcommand === "build") {
      const index = buildKnowledgeIndex(root, { write: true });
      return print({ ok: true, chunks: index.chunks.length, sources: index.sourceStats.length, fingerprint: index.fingerprint });
    }
    if (subcommand === "query") {
      const flagIndex = rest.findIndex((item) => item.startsWith("--"));
      const queryParts = flagIndex === -1 ? rest : rest.slice(0, flagIndex);
      const query = queryParts.join(" ").trim();
      if (!query) throw new Error("knowledge query requires search terms.");
      const graph = loadGraph(root);
      const index = loadKnowledgeIndex(root);
      const category = option(rest, "--category");
      const results = queryKnowledge(index, graph, query, {
        brand: option(rest, "--brand"),
        limit: Number(option(rest, "--limit", 8)),
        category,
      });
      if (category && !results.length) {
        const known = listCategories(index, graph).map((item) => item.category);
        console.error(`No chunks matched in category "${category}". Known categories: ${known.join(", ") || "(none)"}.`);
      }
      return print(results);
    }
    if (subcommand === "categories") {
      const graph = loadGraph(root);
      const index = loadKnowledgeIndex(root);
      return print(listCategories(index, graph));
    }
    throw new Error("knowledge requires build, categories or query.");
  }
  if (command === "brandkit") {
    const [subcommand, brand, target, ...rest] = args;
    const flag = (name) => option(rest, name);
    if (subcommand === "list") return print({ packs: listPacks(root) });
    if (subcommand === "validate" && !brand) return print(commandValidate(root));
    if (!brand) throw new Error("brandkit requires a brand: list | new | validate | kit | fonts | ad | job.");
    if (subcommand === "new") return print(commandNew(root, brand, { name: flag("--name"), compliance: flag("--compliance") || "general" }));
    if (subcommand === "validate") return print(commandValidate(root, brand));
    if (subcommand === "kit") return print(await commandKit(root, brand));
    if (subcommand === "fonts") return print(await commandFonts(root, brand));
    if (subcommand === "ad") {
      if (!target) throw new Error("brandkit ad requires a format, e.g. single | panel | streak.");
      return print(await commandAd(root, brand, target, {
        compound: flag("--compound") || "ghkcu",
        panel: flag("--panel"),
        hook: flag("--hook"),
        variant: flag("--variant") || "base",
        style: flag("--style"),
        ratio: flag("--ratio"),
        out: flag("--out"),
        basename: flag("--basename"),
        offlineFonts: rest.includes("--offline-fonts"),
      }));
    }
    if (subcommand === "job") {
      return print(await commandJob(root, brand, target, {
        compound: flag("--compound") || "ghkcu",
        style: flag("--style") || "cryo",
        ratio: flag("--ratio") || "9:16",
        labelCrop: flag("--label-crop"),
        candidates: flag("--candidates"),
        empty: rest.includes("--empty"),
      }));
    }
    throw new Error("brandkit requires: list | new | validate | kit | fonts | ad | job.");
  }
  if (command === "assets") {
    const [subcommand, ...rest] = args;
    if (subcommand === "audit") {
      if (!rest[0]) throw new Error("assets audit requires a directory.");
      return print(auditAssetDirectory(root, rest[0], { limit: Number(option(rest, "--limit", 1_000)) }));
    }
    const graph = loadGraph(root);
    if (subcommand === "search") {
      const flagIndex = rest.findIndex((item) => item.startsWith("--"));
      const query = (flagIndex === -1 ? rest : rest.slice(0, flagIndex)).join(" ").trim();
      const brand = option(rest, "--brand");
      const brandNode = brand ? resolveBrand(graph, brand) : undefined;
      if (brand && !brandNode) throw new Error(`Unknown brand ${brand}.`);
      const catalog = buildAssetCatalog(root, graph, { brand: brandNode?.id });
      return print(searchAssets(catalog, { brand: brandNode?.id, product: option(rest, "--product"), role: option(rest, "--role"), query, existingOnly: !rest.includes("--all"), includeBanned: rest.includes("--banned"), withDimensions: rest.includes("--dimensions"), limit: Number(option(rest, "--limit", 40)) }).map(({ absolutePath: _a, ...item }) => item));
    }
    if (subcommand === "products") {
      const brand = option(rest, "--brand");
      const brandNode = brand ? resolveBrand(graph, brand) : undefined;
      return print(listProducts(buildAssetCatalog(root, graph, { brand: brandNode?.id }), brandNode?.id));
    }
    if (subcommand === "gallery") {
      const brand = option(rest, "--brand");
      const brandNode = brand ? resolveBrand(graph, brand) : undefined;
      if (brand && !brandNode) throw new Error(`Unknown brand ${brand}.`);
      const result = await buildGallery(root, graph, { brand: brandNode?.id, thumbs: !rest.includes("--no-thumbs"), onProgress: (done, left) => { if (done % 50 === 0) console.error(`  thumbnails: ${done} done, ${left} left`); } });
      if (rest.includes("--open") && process.platform === "darwin") spawn("open", [result.indexPath], { stdio: "ignore", detached: true }).unref();
      return print({ ...result, indexPath: path.relative(root, result.indexPath) });
    }
    throw new Error("assets requires: audit <directory> | search \"terms\" | products | gallery.");
  }
  if (command === "dam") return runDamCommand(root, args, print);
  if (command === "mcp") {
    const { startServer } = await import("./mcp/server.mjs");
    await startServer(root);
    return undefined;
  }
  if (command === "context") {
    const [brand, ...rest] = args;
    const flagIndex = rest.findIndex((item) => item.startsWith("--"));
    const brief = (flagIndex === -1 ? rest : rest.slice(0, flagIndex)).join(" ").trim();
    if (!brand || !brief) throw new Error("context requires a brand and a brief.");
    const result = await buildContextPackWithDam(root, loadGraph(root), { brand, brief, category: option(rest, "--category"), mode: option(rest, "--mode"), products: option(rest, "--product") ? option(rest, "--product").split(",").map((item) => item.trim()) : [], limit: Number(option(rest, "--limit", 6)) });
    if (rest.includes("--json")) return print(result.pack);
    console.log(result.promptBlock);
    return undefined;
  }
  if (command === "learn") {
    const [subcommand, ...rest] = args;
    const graph = loadGraph(root);
    const list = (name) => option(rest, name) ? option(rest, name).split(",").map((item) => item.trim()).filter(Boolean) : undefined;
    const multi = (name) => rest.flatMap((item, index) => (item === name && rest[index + 1] ? [rest[index + 1]] : []));
    if (subcommand === "log") {
      const entry = appendPromptLog(root, graph, { brand: option(rest, "--brand"), prompt: option(rest, "--prompt"), provider: option(rest, "--provider"), model: option(rest, "--model"), category: option(rest, "--category"), product: option(rest, "--product"), refs: multi("--ref"), outputs: multi("--output"), notes: option(rest, "--notes"), source: "cli" });
      if (!entry) throw new Error("prompt log write failed.");
      return print({ id: entry.id, brand: entry.brand, outputs: entry.outputs.length });
    }
    if (subcommand === "record") {
      const law = option(rest, "--law") ? { claim: option(rest, "--law"), appliesTo: option(rest, "--applies-to"), confidence: option(rest, "--confidence") } : undefined;
      return print(await recordFeedback(root, graph, { verdict: option(rest, "--verdict"), reason: option(rest, "--reason"), target: option(rest, "--target"), brand: option(rest, "--brand"), product: option(rest, "--product"), category: option(rest, "--category"), tags: list("--tags"), law, prompt: option(rest, "--prompt"), provider: option(rest, "--provider"), model: option(rest, "--model"), refs: multi("--ref"), output: option(rest, "--output"), copy: !rest.includes("--no-copy"), notes: option(rest, "--notes") }));
    }
    if (subcommand === "laws") {
      const flagIndex = rest.findIndex((item) => item.startsWith("--"));
      const query = (flagIndex === -1 ? rest : rest.slice(0, flagIndex)).join(" ").trim();
      return print(searchLaws(root, graph, query, { brand: option(rest, "--brand"), category: option(rest, "--category"), limit: Number(option(rest, "--limit", 12)) }));
    }
    if (subcommand === "add-law") {
      const { store, path: storePath, brandNode } = loadLearnings(root, graph, option(rest, "--brand"));
      const result = upsertLaw(store, brandNode, { id: option(rest, "--id"), claim: option(rest, "--claim"), evidence: option(rest, "--evidence"), counterexamples: option(rest, "--counterexamples"), appliesTo: option(rest, "--applies-to"), confidence: option(rest, "--confidence"), source: option(rest, "--source") || "cli add-law", category: option(rest, "--category"), tags: list("--tags") });
      saveLearnings(storePath, store);
      return print({ ...result, store: path.relative(root, storePath) });
    }
    if (subcommand === "history") {
      return print(readPromptLog(root, graph, { brand: option(rest, "--brand"), query: option(rest, "--query"), verdict: option(rest, "--verdict"), limit: Number(option(rest, "--limit", 25)) }).map((row) => ({ ...row, prompt: String(row.prompt || "").slice(0, 400) })));
    }
    if (subcommand === "stats") {
      const brand = option(rest, "--brand");
      const brandNode = brand ? resolveBrand(graph, brand) : undefined;
      return print(listLearningStores(root, graph).filter((item) => !brandNode || item.brand === brandNode.id).map((item) => ({ ...item, stats: loadLearnings(root, graph, item.brand).store.stats })));
    }
    throw new Error("learn requires: log | record | laws | add-law | history | stats.");
  }
  if (command === "skus") {
    const sub = args[0];
    const opt = (flag, fallback) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : fallback; };
    if (sub === "import") {
      const { importSkuSheets } = await import("./skus/import.mjs");
      const files = args.slice(1).filter((value, index, all) => !value.startsWith("--") && all[index - 1] !== "--brand");
      return print(importSkuSheets(root, { brand: opt("--brand"), files }));
    }
    if (sub === "coverage") {
      const { runCoverage, coverageText } = await import("./skus/coverage.mjs");
      const { file, coverage } = runCoverage(root, { brand: opt("--brand"), libraryFile: opt("--library") });
      if (args.includes("--json")) return print({ file, totals: coverage.totals });
      console.log(coverageText(coverage));
      return;
    }
    if (sub === "catalog") {
      const { buildCatalog } = await import("./skus/catalog.mjs");
      return print(buildCatalog(root, { brand: opt("--brand"), libraryFile: opt("--library") }));
    }
    if (sub === "folders") {
      const { buildFolderMap } = await import("./skus/folder-map.mjs");
      const result = await buildFolderMap(root, { brand: opt("--brand"), libraryFile: opt("--library"), page: opt("--page"), decisions: opt("--decisions") });
      return print(result);
    }
    throw new Error("skus requires: import --brand <id> <csv…> | coverage --brand <id> --library <render-library.json> | folders --brand <id> --library <file> [--page <out.html>] [--decisions <json>]");
  }
  if (command === "presets") {
    const { STYLE_PRESETS, CHANNELS } = await import("./prompts/presets.mjs");
    return print({ styles: Object.fromEntries(Object.entries(STYLE_PRESETS).map(([id, preset]) => [id, { title: preset.title, mode: preset.mode, provider: preset.provider.id, model: preset.provider.model, channel: preset.channel, candidates: preset.candidates, refs: preset.refs.wants }])), channels: CHANNELS });
  }
  if (command === "new") {
    const { createJobFile } = await import("./core/job-create.mjs");
    const opt = (flag, fallback) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : fallback; };
    const result = createJobFile(root, { brand: opt("--brand"), style: opt("--style"), products: (opt("--product", "") || "").split("|").map((value) => value.trim()).filter(Boolean), objective: opt("--objective"), concept: opt("--concept"), channel: opt("--channel"), copy: (opt("--copy", "") || "").split("|").map((value) => value.trim()).filter(Boolean), candidates: opt("--candidates") ? Number(opt("--candidates")) : undefined, id: opt("--id") });
    return print(result);
  }
  if (command === "plan") {
    if (!args[0]) throw new Error("plan requires a job JSON path.");
    const plan = await planJob(root, args[0]);
    return print({
      jobPath: plan.jobPath,
      checks: plan.checks,
      provider: plan.job.provider,
      deliverable: plan.job.deliverable,
      autoReferences: plan.autoReferences,
      learned: plan.learned,
      variants: plan.variants.length,
      context: plan.context.map((item) => ({ id: item.id, source: item.source, heading: item.heading, score: item.score, text: item.text })),
      assets: plan.assets.map(({ absolutePath: _absolutePath, ...asset }) => asset),
      compiledPrompt: plan.prompt,
    });
  }
  if (command === "run") {
    if (!args[0]) throw new Error("run requires a job JSON path.");
    const result = await executeJob(root, args[0]);
    return print({ ok: true, outputs: result.outputs.map((file) => path.relative(root, file)), manifest: path.relative(root, result.manifestPath) });
  }
  if (command === "review") {
    if (!args[0] || !args[1]) throw new Error("review requires a job JSON path and candidate image path.");
    const result = await reviewImage(root, args[0], args[1]);
    return print({ ...result, reviewPath: path.relative(root, result.reviewPath) });
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(JSON.stringify(serializeError(error), null, 2));
  process.exitCode = 1;
});
