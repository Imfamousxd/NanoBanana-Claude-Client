// "Make X about <product>" → a job file. The preset and channel fill routing and size; the library fills references at plan time.
import fs from "node:fs";
import path from "node:path";
import { slugify } from "./files.mjs";
import { getPreset, CHANNELS } from "../prompts/presets.mjs";

export function createJobFile(root, { brand, style, products = [], objective, concept, channel, copy = [], candidates, id, mustAvoid = [] } = {}) {
  if (!brand) throw new Error("brand is required");
  const preset = getPreset(style);
  if (!preset) throw new Error(`unknown style ${style}`);
  if (!products.length) throw new Error("at least one product name is required");
  if (channel && !CHANNELS[channel]) throw new Error(`unknown channel ${channel}`);
  const jobId = id || slugify(`${brand}-${style}-${products[0]}-${new Date().toISOString().slice(0, 10)}`);
  const job = {
    version: 1,
    id: jobId,
    brand,
    mode: preset.mode,
    objective: objective || `${preset.title.split(" — ")[0]} of ${products.join(", ")}`,
    products,
    references: { auto: true, products, intent: `${preset.refs.intent}; ${objective || ""}`.trim() },
    audience: {},
    deliverable: { channel: channel || preset.channel, candidates: candidates || preset.candidates },
    provider: {},
    assets: [],
    creative: { style, concept: concept || objective || preset.title, onImageText: copy, mustAvoid },
    compliance: { profile: "general" },
    execution: { approved: false },
    output: { directory: `generations/${jobId}`, basename: jobId },
  };
  const dir = path.join(root, "jobs");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${jobId}.json`);
  fs.writeFileSync(file, JSON.stringify(job, null, 2) + "\n");
  return { jobPath: path.relative(root, file), job };
}
