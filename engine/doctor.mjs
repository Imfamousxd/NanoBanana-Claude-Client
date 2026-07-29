import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadGraph } from "./knowledge/graph.mjs";
import { findChrome } from "./brandkit/chrome.mjs";
import { listPacks } from "./brandkit/kit.mjs";
import { validateAllPacks } from "./brandkit/validate.mjs";

function commandAvailable(command) {
  return spawnSync("which", [command], { encoding: "utf8" }).status === 0;
}

export function runDoctor(root) {
  const major = Number(process.versions.node.split(".")[0]);
  const rootEntries = fs.readdirSync(root).length;
  const graph = loadGraph(root);
  const ffmpegAvailable = commandAvailable("ffmpeg");
  const chrome = findChrome();
  const packs = listPacks(root);
  const packChecks = validateAllPacks(root);
  const brokenPacks = packChecks.filter((result) => !result.ok);
  const checks = [
    { name: "Node 20+", ok: major >= 20, detail: process.version },
    { name: "Knowledge graph", ok: graph.nodes.length > 0, detail: `${graph.nodes.length} nodes / ${graph.edges.length} edges` },
    { name: "OpenAI key", ok: Boolean(process.env.OPENAI_API_KEY), optional: true, detail: process.env.OPENAI_API_KEY ? "configured" : "not configured" },
    { name: "Gemini key", ok: Boolean(process.env.GEMINI_API_KEY), optional: true, detail: process.env.GEMINI_API_KEY ? "configured" : "not configured" },
    { name: "Replicate token", ok: Boolean(process.env.REPLICATE_API_TOKEN), optional: true, detail: process.env.REPLICATE_API_TOKEN ? "configured" : "not configured" },
    { name: "ffmpeg", ok: ffmpegAvailable, optional: true, detail: ffmpegAvailable ? "available" : "not found (needed for video post)" },
    { name: "Headless Chrome", ok: Boolean(chrome), optional: true, detail: chrome || "not found (needed for deterministic layout renders; set CHROME_PATH to override)" },
    { name: "Brand packs", ok: packs.length > 0, warning: true, detail: packs.length ? packs.join(", ") : "none in knowledge/brands/" },
    {
      name: "Brand pack integrity",
      ok: brokenPacks.length === 0,
      detail: brokenPacks.length
        ? `${brokenPacks.map((result) => `${result.pack} (${result.errors.length})`).join(", ")} — run: npm run content -- brandkit validate`
        : `${packChecks.length} pack(s) structurally valid`,
    },
    { name: "Repository root surface", ok: rootEntries < 500, warning: true, detail: `${rootEntries} entries; historical archive should be migrated separately` },
    { name: "Schema", ok: fs.existsSync(path.join(root, "schemas", "content-job.schema.json")), detail: "schemas/content-job.schema.json" },
  ];
  return {
    ok: checks.every((check) => check.ok || check.optional || check.warning),
    root,
    checks,
    providerDefaults: graph.nodes.filter((node) => node.type === "provider").map((node) => ({ id: node.id, model: node.model, verifiedAt: node.verifiedAt })),
  };
}
