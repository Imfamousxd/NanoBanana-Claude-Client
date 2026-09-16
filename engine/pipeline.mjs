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
import { appendPromptLog } from "./learning/prompt-log.mjs";
import { resolveAutoReferences } from "./learning/auto-refs.mjs";
import { searchLaws } from "./learning/laws.mjs";
import { loadLearnings } from "./learning/store.mjs";
import { getPreset } from "./prompts/presets.mjs";
import { tokenize } from "./knowledge/retrieval.mjs";

/** Laws and exemplars relevant to this job, for the prompt. Never throws. */
function learnedContext(root, graph, job, compiledQuery) {
  try {
    const laws = searchLaws(root, graph, compiledQuery, { brand: job.brand, category: job.mode, limit: 8 })
      .filter((law) => ["moderate", "strong", "measured"].includes(law.confidence) || !law.confidence)
      .slice(0, 6);
    const { store } = loadLearnings(root, graph, job.brand);
    const terms = new Set(tokenize(compiledQuery));
    const exemplars = (store.exemplars || [])
      .map((exemplar) => ({ exemplar, score: tokenize(`${exemplar.prompt} ${(exemplar.tags || []).join(" ")} ${exemplar.product || ""} ${exemplar.category || ""}`).filter((term) => terms.has(term)).length }))
      .filter((item) => item.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(({ exemplar }) => ({ id: exemplar.id, excerpt: String(exemplar.prompt || "").replace(/\s+/g, " ").slice(0, 280) }));
    return { laws: laws.map((law) => ({ id: law.id, claim: law.claim, confidence: law.confidence })), exemplars };
  } catch (error) {
    return { laws: [], exemplars: [], unavailable: String(error.message).slice(0, 120) };
  }
}

function mergeChecks(validation, preflight) {
  const errors = [...validation.errors, ...preflight.errors];
  const warnings = [...validation.warnings, ...preflight.warnings];
  return { ok: errors.length === 0, errors, warnings };
}

export async function planJob(root, requestedPath, { requireApproval = false } = {}) {
  const { path: jobPath, job } = loadJob(root, requestedPath);
  const graph = loadGraph(root);
  // Automatic references: the library supplies the product's canonical, device, cutout, label… before validation.
  const preset = getPreset(job.creative?.style);
  let autoRefs = { assets: [], kits: [], notes: [] };
  if (job.references?.auto) {
    autoRefs = await resolveAutoReferences(root, graph, job, preset);
    for (const asset of autoRefs.assets) if (!job.assets.some((existing) => existing.path === asset.path)) job.assets.push(asset);
  }
  const validation = validateJob(job, root, { requireApproval });
  let compiled;
  try {
    const query = [job.brand, job.mode, job.objective, job.creative?.concept, ...(job.products || job.references?.products || [])].filter(Boolean).join(" ");
    const learned = learnedContext(root, graph, job, query);
    compiled = compilePrompt(job, graph, { ...learned, referenceNotes: autoRefs.notes });
    compiled.learned = learned;
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
    variants: compiled.variants || [],
    learned: compiled.learned || null,
    autoReferences: { kits: autoRefs.kits, notes: autoRefs.notes, attached: autoRefs.assets.map((asset) => ({ path: asset.path, role: asset.role, ...asset.auto })) },
    context,
    assets,
    brand: compiled.brand,
    checks: mergeChecks(validation, preflight),
  };
}

export async function executeJob(root, requestedPath) {
  const plan = await planJob(root, requestedPath, { requireApproval: true });
  const graph = loadGraph(root);
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
    const result = await runProvider({ root, job: plan.job, prompt: plan.prompt, variants: plan.variants, assets: plan.assets });
    manifest.provider = result.provider;
    manifest.usage = result.usage || null;
    recordOutputs(manifest, root, result.outputs);
    manifestPath = saveManifest(root, plan.job, manifest);
    // Every paid prompt is logged so a verdict can later turn it into an exemplar or a law. Never throws.
    const logEntry = appendPromptLog(root, graph, {
      brand: plan.job.brand,
      category: plan.job.mode,
      mode: plan.job.mode,
      provider: result.provider?.id || plan.job.provider.id,
      model: result.provider?.model || plan.job.provider.model || null,
      params: { aspectRatio: plan.job.deliverable.aspectRatio, candidates: plan.job.deliverable.candidates, quality: plan.job.deliverable.quality || null, imageSize: plan.job.deliverable.imageSize || null, durationSeconds: plan.job.deliverable.durationSeconds || null },
      prompt: plan.prompt,
      refs: plan.assets.map((asset) => ({ path: asset.path, role: asset.role, sha256: asset.sha256 })),
      outputs: result.outputs.map((file) => path.relative(root, file)),
      jobId: plan.job.id,
      manifestPath: path.relative(root, manifestPath),
      source: "engine-run",
    });
    if (logEntry) {
      manifest.promptLogId = logEntry.id;
      manifestPath = saveManifest(root, plan.job, manifest);
    }
    return { outputs: result.outputs, manifestPath, manifest, promptLogId: logEntry?.id || null };
  } catch (error) {
    manifest.status = "failed";
    manifest.completedAt = new Date().toISOString();
    manifest.error = serializeError(error);
    manifestPath = saveManifest(root, plan.job, manifest);
    error.details = { ...(error.details || {}), manifestPath };
    throw error;
  }
}
