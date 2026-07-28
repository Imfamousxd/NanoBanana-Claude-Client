import path from "node:path";
import { sha256File, timestamp, writeJsonAtomic } from "./files.mjs";

export function createManifest({ job, jobPath, prompt, context, preflight }) {
  return {
    schemaVersion: 1,
    runId: `${timestamp()}_${job.id}`,
    status: "planned",
    createdAt: new Date().toISOString(),
    completedAt: null,
    jobPath,
    job,
    compiledPrompt: prompt,
    knowledge: context.map((item) => ({ id: item.id, source: item.source, heading: item.heading, score: item.score })),
    preflight,
    provider: { id: job.provider.id, model: job.provider.model || null },
    inputs: [],
    outputs: [],
    review: null,
    error: null,
  };
}

export function recordInputs(manifest, assets) {
  manifest.inputs = assets.map((asset) => ({
    path: asset.path,
    role: asset.role,
    sha256: asset.sha256,
    bytes: asset.bytes,
    media: asset.media,
  }));
}

export function recordOutputs(manifest, root, outputPaths) {
  manifest.outputs = outputPaths.map((filePath) => ({
    path: path.relative(root, filePath),
    sha256: sha256File(filePath),
  }));
  manifest.status = "completed";
  manifest.completedAt = new Date().toISOString();
}

export function saveManifest(root, job, manifest) {
  const manifestPath = path.resolve(root, job.output.directory, `${manifest.runId}.manifest.json`);
  writeJsonAtomic(manifestPath, manifest);
  return manifestPath;
}
