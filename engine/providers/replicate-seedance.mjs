import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { writeJsonAtomic } from "../core/files.mjs";
import { downloadToBuffer, fetchWithRetry, sleep } from "../core/http.mjs";
import { retryLogger, saveOutput } from "./common.mjs";

function operationPath(root, job, candidate) {
  return path.join(root, ".content-engine", "operations", `${job.id}_c${candidate + 1}.replicate.json`);
}

function dataUri(asset) {
  return `data:${asset.mime};base64,${fs.readFileSync(asset.absolutePath).toString("base64")}`;
}

function collectInput(job, assets, prompt) {
  const firstFrame = assets.find((asset) => asset.role === "first-frame");
  const lastFrame = assets.find((asset) => asset.role === "last-frame");
  const referenceImages = assets.filter((asset) => ["reference-image", "creator-canon", "character-canon", "product-canon", "style-reference", "environment-reference"].includes(asset.role));
  const referenceVideos = assets.filter((asset) => asset.role === "reference-video");
  const referenceAudios = assets.filter((asset) => asset.role === "reference-audio");
  return {
    prompt,
    duration: job.deliverable.durationSeconds ?? 5,
    resolution: job.deliverable.resolution || "1080p",
    aspect_ratio: job.deliverable.aspectRatio,
    generate_audio: job.provider.generateAudio ?? true,
    ...(job.provider.seed != null ? { seed: job.provider.seed } : {}),
    ...(firstFrame ? { image: dataUri(firstFrame) } : {}),
    ...(lastFrame ? { last_frame_image: dataUri(lastFrame) } : {}),
    ...(!firstFrame && referenceImages.length ? { reference_images: referenceImages.map(dataUri) } : {}),
    ...(referenceVideos.length ? { reference_videos: referenceVideos.map(dataUri) } : {}),
    ...(referenceAudios.length ? { reference_audios: referenceAudios.map(dataUri) } : {}),
  };
}

async function pollPrediction(url, token, root, job, candidate, initial) {
  let prediction = initial;
  const deadline = Date.now() + (job.provider.maxWaitMinutes || 60) * 60_000;
  while (!["succeeded", "failed", "canceled"].includes(prediction.status)) {
    if (Date.now() > deadline) throw new EngineError("PROVIDER_TIMEOUT", `Seedance prediction ${prediction.id} exceeded the configured wait time.`);
    await sleep(job.provider.pollIntervalMs || 7_500);
    const response = await fetchWithRetry(url, () => ({ headers: { Authorization: `Bearer ${token}` } }), {
      timeoutMs: 60_000,
      attempts: 4,
      onRetry: retryLogger("Replicate poll"),
    });
    prediction = await response.json();
    writeJsonAtomic(operationPath(root, job, candidate), {
      id: prediction.id,
      status: prediction.status,
      get: prediction.urls?.get,
      updatedAt: new Date().toISOString(),
    });
    console.log(`  Seedance ${prediction.id}: ${prediction.status}`);
  }
  return prediction;
}

export async function runReplicateSeedance({ root, job, prompt, assets }) {
  const token = requireEnv("REPLICATE_API_TOKEN", "Replicate Seedance");
  const model = job.provider.model || process.env.SEEDANCE_MODEL || "bytedance/seedance-2.0";
  const endpoint = `https://api.replicate.com/v1/models/${model}/predictions`;
  const outputs = [];

  for (let candidate = 0; candidate < job.deliverable.candidates; candidate += 1) {
    const candidatePrompt = `${prompt}\n\nCandidate ${candidate + 1}: preserve every identity, product, text, and continuity invariant.`;
    const input = collectInput(job, assets, candidatePrompt);
    const create = await fetchWithRetry(endpoint, () => ({
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=5" },
      body: JSON.stringify({ input }),
    }), {
      timeoutMs: 90_000,
      attempts: 5,
      baseDelayMs: 2_000,
      retryableStatuses: new Set([429]),
      retryNetworkErrors: false,
      onRetry: retryLogger("Replicate create"),
    });
    let prediction = await create.json();
    if (!prediction.id || !prediction.urls?.get) throw new EngineError("INVALID_PROVIDER_RESPONSE", "Replicate did not return a prediction ID and poll URL.");
    writeJsonAtomic(operationPath(root, job, candidate), {
      id: prediction.id,
      status: prediction.status,
      get: prediction.urls.get,
      createdAt: new Date().toISOString(),
    });
    prediction = await pollPrediction(prediction.urls.get, token, root, job, candidate, prediction);
    if (prediction.status !== "succeeded") throw new EngineError("PROVIDER_GENERATION_FAILED", `Seedance ${prediction.status}: ${prediction.error || "no error detail"}`);
    const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!url) throw new EngineError("NO_PROVIDER_OUTPUT", "Seedance succeeded without an output URL.");
    outputs.push(saveOutput(root, job, candidate, "mp4", await downloadToBuffer(url, { onRetry: retryLogger("Seedance download") })));
  }
  return { outputs, provider: { id: "replicate-seedance", model } };
}
