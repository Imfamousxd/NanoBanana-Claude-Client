#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./core/env.mjs";
import { serializeError } from "./core/errors.mjs";
import { runDoctor } from "./doctor.mjs";
import { loadGraph } from "./knowledge/graph.mjs";
import { buildKnowledgeIndex, loadKnowledgeIndex } from "./knowledge/indexer.mjs";
import { queryKnowledge } from "./knowledge/retrieval.mjs";
import { executeJob, planJob } from "./pipeline.mjs";
import { reviewImage } from "./quality/openai-judge.mjs";
import { auditAssetDirectory } from "./quality/asset-audit.mjs";
import { commandAd, commandFonts, commandJob, commandKit, commandNew, commandValidate, listPacks } from "./brandkit/index.mjs";

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
  npm run content -- knowledge query "terms" [--brand brand-id] [--limit 8]
  npm run content -- plan <job.json>
  npm run content -- run <job.json>
  npm run content -- review <job.json> <candidate-image>
  npm run content -- assets audit <directory> [--limit 1000]
  npm run content -- models

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
      return print(queryKnowledge(index, graph, query, {
        brand: option(rest, "--brand"),
        limit: Number(option(rest, "--limit", 8)),
      }));
    }
    throw new Error("knowledge requires build or query.");
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
    const [subcommand, requestedDirectory, ...rest] = args;
    if (subcommand !== "audit" || !requestedDirectory) throw new Error("assets requires: audit <directory> [--limit 1000].");
    return print(auditAssetDirectory(root, requestedDirectory, { limit: Number(option(rest, "--limit", 1_000)) }));
  }
  if (command === "plan") {
    if (!args[0]) throw new Error("plan requires a job JSON path.");
    const plan = planJob(root, args[0]);
    return print({
      jobPath: plan.jobPath,
      checks: plan.checks,
      provider: plan.job.provider,
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
