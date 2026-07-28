import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { writeJsonAtomic } from "../core/files.mjs";
import { downloadToBuffer, fetchWithRetry, sleep } from "../core/http.mjs";
import { retryLogger, saveOutput } from "./common.mjs";

function googleImage(asset) {
  return {
    inlineData: {
      mimeType: asset.mime,
      data: fs.readFileSync(asset.absolutePath).toString("base64"),
    },
  };
}

function operationPath(root, job, candidate) {
  return path.join(root, ".content-engine", "operations", `${job.id}_c${candidate + 1}.veo.json`);
}

function extractVideos(data) {
  return data.response?.generateVideoResponse?.generatedSamples
    || data.response?.generatedSamples
    || data.response?.generateVideoResponse?.generatedVideos
    || data.response?.generatedVideos
    || [];
}

async function pollOperation(baseUrl, operation, apiKey, root, job, candidate) {
  const deadline = Date.now() + (job.provider.maxWaitMinutes || 45) * 60_000;
  while (true) {
    if (Date.now() > deadline) throw new EngineError("PROVIDER_TIMEOUT", `Veo operation ${operation} exceeded the configured wait time.`);
    const response = await fetchWithRetry(`${baseUrl}/${operation}`, () => ({ headers: { "x-goog-api-key": apiKey } }), {
      timeoutMs: 60_000,
      attempts: 4,
      onRetry: retryLogger("Veo poll"),
    });
    const data = await response.json();
    writeJsonAtomic(operationPath(root, job, candidate), { operation, done: Boolean(data.done), updatedAt: new Date().toISOString() });
    if (data.error) throw new EngineError("PROVIDER_GENERATION_FAILED", `Veo failed: ${JSON.stringify(data.error)}`);
    if (data.done) return data;
    await sleep(job.provider.pollIntervalMs || 10_000);
  }
}

export async function runGoogleVeo({ root, job, prompt, assets }) {
  const apiKey = requireEnv("GEMINI_API_KEY", "Google Veo");
  const model = job.provider.model || process.env.VEO_MODEL || "veo-3.1-generate-preview";
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const outputs = [];
  const firstFrame = assets.find((asset) => asset.role === "first-frame");
  const lastFrame = assets.find((asset) => asset.role === "last-frame");
  const veoReferenceRoles = new Set(["reference-image", "product-canon", "creator-canon", "character-canon", "style-reference", "environment-reference"]);
  const references = assets.filter((asset) => veoReferenceRoles.has(asset.role)).slice(0, 3);

  for (let candidate = 0; candidate < job.deliverable.candidates; candidate += 1) {
    const instance = { prompt: `${prompt}\n\nCandidate ${candidate + 1}: preserve all declared continuity invariants.` };
    if (firstFrame) instance.image = googleImage(firstFrame);
    if (lastFrame) instance.lastFrame = googleImage(lastFrame);
    if (references.length) instance.referenceImages = references.map((asset) => ({ image: googleImage(asset), referenceType: "asset" }));
    const response = await fetchWithRetry(`${baseUrl}/models/${model}:predictLongRunning`, () => ({
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [instance],
        parameters: {
          aspectRatio: job.deliverable.aspectRatio,
          durationSeconds: job.deliverable.durationSeconds,
          resolution: job.deliverable.resolution || "1080p",
          sampleCount: 1,
          ...(job.provider.seed != null ? { seed: job.provider.seed } : {}),
        },
      }),
    }), {
      timeoutMs: 90_000,
      attempts: 4,
      retryableStatuses: new Set([429]),
      retryNetworkErrors: false,
      onRetry: retryLogger("Veo submit"),
    });
    const created = await response.json();
    if (!created.name) throw new EngineError("INVALID_PROVIDER_RESPONSE", "Veo did not return an operation name.");
    writeJsonAtomic(operationPath(root, job, candidate), { operation: created.name, done: false, createdAt: new Date().toISOString() });
    const result = await pollOperation(baseUrl, created.name, apiKey, root, job, candidate);
    const videos = extractVideos(result);
    const video = videos[0]?.video || videos[0];
    let buffer;
    if (video?.bytesBase64Encoded) buffer = Buffer.from(video.bytesBase64Encoded, "base64");
    else if (video?.uri) {
      buffer = await downloadToBuffer(video.uri, {
        headers: { "x-goog-api-key": apiKey },
        onRetry: retryLogger("Veo download"),
      });
    }
    if (!buffer) throw new EngineError("NO_PROVIDER_OUTPUT", "Veo completed without a downloadable video.");
    outputs.push(saveOutput(root, job, candidate, "mp4", buffer));
  }
  return { outputs, provider: { id: "google-veo", model } };
}
