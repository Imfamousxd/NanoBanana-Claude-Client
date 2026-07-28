import path from "node:path";
import { EngineError, serializeError } from "./core/errors.mjs";
import { recordInputs, recordOutputs, createManifest, saveManifest } from "./core/manifest.mjs";
import { loadJob, validateJob } from "./core/job.mjs";
import { loadGraph } from "./knowledge/graph.mjs";
import { loadKnowledgeIndex } from "./knowledge/indexer.mjs";
import { queryKnowledge } from "./knowledge/retrieval.mjs";
import { compilePrompt } from "./prompts/compiler.mjs";
import { inspectAssets } from "./quality/asset-inspector.mjs";
import { runPreflight } from "./quality/preflight.mjs";
import { runProvider } from "./providers/index.mjs";

function mergeChecks(validation, preflight) {
  const errors = [...validation.errors, ...preflight.errors];
  const warnings = [...validation.warnings, ...preflight.warnings];
  return { ok: errors.length === 0, errors, warnings };
}

export function planJob(root, requestedPath, { requireApproval = false } = {}) {
  const { path: jobPath, job } = loadJob(root, requestedPath);
  const graph = loadGraph(root);
  const validation = validateJob(job, root, { requireApproval });
  let compiled;
  try {
    compiled = compilePrompt(job, graph);
  } catch (error) {
    if (error instanceof EngineError) {
      validation.errors.push({ code: error.code, message: error.message, field: "brand" });
      return { jobPath: path.relative(root, jobPath), job, prompt: "", context: [], assets: [], checks: { ...validation, ok: false } };
    }
    throw error;
  }
  const scopedPaths = [
    compiled.brand.source,
    "knowledge/playbooks/UGC_REALISM.md",
    "knowledge/compliance/REGULATED_HEALTH_RUO.md",
    ...(compiled.brand.id === "brand.nulumin" ? ["NuLumin Influencer Personas/NULUMIN_INFLUENCER_PERSONA_SYSTEM.md"] : []),
    ...(compiled.brand.id === "brand.muha" ? ["AI Fruit VIdeos Muha/CHARACTERS.md"] : []),
  ].filter(Boolean);
  const index = loadKnowledgeIndex(root, { scopedPaths });
  const context = queryKnowledge(index, graph, compiled.retrievalQuery, { brand: job.brand, limit: 8 });
  const assets = inspectAssets(root, job.assets);
  const preflight = runPreflight({ root, job, prompt: compiled.prompt, assets, brand: compiled.brand });
  return {
    jobPath: path.relative(root, jobPath),
    job,
    prompt: compiled.prompt,
    context,
    assets,
    brand: compiled.brand,
    checks: mergeChecks(validation, preflight),
  };
}

export async function executeJob(root, requestedPath) {
  const plan = planJob(root, requestedPath, { requireApproval: true });
  if (!plan.checks.ok) {
    throw new EngineError("PREFLIGHT_FAILED", "Job cannot run until all preflight errors are fixed.", plan.checks);
  }

  const manifest = createManifest({
    job: plan.job,
    jobPath: plan.jobPath,
    prompt: plan.prompt,
    context: plan.context,
    preflight: plan.checks,
  });
  recordInputs(manifest, plan.assets);
  let manifestPath = saveManifest(root, plan.job, manifest);

  try {
    manifest.status = "running";
    manifest.startedAt = new Date().toISOString();
    saveManifest(root, plan.job, manifest);
    const result = await runProvider({ root, job: plan.job, prompt: plan.prompt, assets: plan.assets });
    manifest.provider = result.provider;
    manifest.usage = result.usage || null;
    recordOutputs(manifest, root, result.outputs);
    manifestPath = saveManifest(root, plan.job, manifest);
    return { outputs: result.outputs, manifestPath, manifest };
  } catch (error) {
    manifest.status = "failed";
    manifest.completedAt = new Date().toISOString();
    manifest.error = serializeError(error);
    manifestPath = saveManifest(root, plan.job, manifest);
    error.details = { ...(error.details || {}), manifestPath };
    throw error;
  }
}
