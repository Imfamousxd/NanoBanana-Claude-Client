import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { writeJsonAtomic } from "../core/files.mjs";
import { downloadToBuffer, fetchWithRetry, sleep } from "../core/http.mjs";
import { retryLogger, saveOutput } from "./common.mjs";

const IMAGE_ROLES = new Set([
  "first-frame",
  "reference-image",
  "product-canon",
  "creator-canon",
  "character-canon",
  "logo-canon",
  "style-reference",
  "environment-reference",
]);

function operationPath(root, job, candidate) {
  return path.join(root, ".content-engine", "operations", `${job.id}_c${candidate + 1}.omni.json`);
}

function mediaPart(asset) {
  return {
    type: "image",
    mime_type: asset.mime,
    data: fs.readFileSync(asset.absolutePath).toString("base64"),
  };
}

function taggedPrompt(prompt, orderedImages) {
  const declarations = [];
  let referenceIndex = 0;
  for (let index = 0; index < orderedImages.length; index += 1) {
    const asset = orderedImages[index];
    const imageNumber = index + 1;
    if (asset.role === "first-frame") declarations.push(`<FIRST_FRAME>@Image${imageNumber}`);
    else {
      declarations.push(`<IMAGE_REF_${referenceIndex}>@Image${imageNumber}`);
      referenceIndex += 1;
    }
  }
  if (!declarations.length) return prompt;
  return `[# Media roles ${declarations.join(" ")}]\n${prompt}\nUse <FIRST_FRAME> only as the starting frame. Use <IMAGE_REF_N> media as references rather than literal initial frames.`;
}

export function buildOmniInput(prompt, assets) {
  const firstFrame = assets.find((asset) => asset.role === "first-frame");
  const references = assets.filter((asset) => IMAGE_ROLES.has(asset.role) && asset.role !== "first-frame");
  const orderedImages = [...(firstFrame ? [firstFrame] : []), ...references];
  const finalPrompt = taggedPrompt(prompt, orderedImages);
  if (!orderedImages.length) return finalPrompt;
  return [...orderedImages.map(mediaPart), { type: "text", text: finalPrompt }];
}

export function extractOmniVideo(data) {
  if (data.output_video?.data || data.output_video?.uri) return data.output_video;
  for (const step of data.steps || []) {
    for (const content of step.content || []) {
      if (content.type === "video" && (content.data || content.uri)) return content;
    }
  }
  return null;
}

function googleFileId(uri) {
  const match = String(uri || "").match(/\/files\/([^/:?]+)/);
  return match?.[1] || null;
}

async function waitForGoogleFile(baseUrl, fileId, interactionId, apiKey, root, job, candidate) {
  const deadline = Date.now() + (job.provider.maxWaitMinutes || 30) * 60_000;
  while (true) {
    if (Date.now() > deadline) throw new EngineError("PROVIDER_TIMEOUT", `Gemini Omni file ${fileId} exceeded the configured wait time.`);
    const response = await fetchWithRetry(`${baseUrl}/files/${fileId}`, () => ({ headers: { "x-goog-api-key": apiKey } }), {
      timeoutMs: 60_000,
      attempts: 4,
      onRetry: retryLogger("Gemini Omni file poll"),
    });
    const data = await response.json();
    const state = String(data.state?.name || data.state || "").toUpperCase();
    writeJsonAtomic(operationPath(root, job, candidate), {
      interactionId,
      fileId,
      state,
      updatedAt: new Date().toISOString(),
    });
    if (["ACTIVE", "SUCCEEDED"].includes(state)) return;
    if (["FAILED", "ERROR", "CANCELLED", "CANCELED"].includes(state)) {
      throw new EngineError("PROVIDER_GENERATION_FAILED", `Gemini Omni file ${fileId} entered state ${state}.`);
    }
    await sleep(job.provider.pollIntervalMs || 5_000);
  }
}

export async function runGoogleOmniVideo({ root, job, prompt, assets }) {
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini Omni Flash");
  const model = job.provider.model || process.env.GEMINI_OMNI_MODEL || "gemini-omni-flash-preview";
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const outputs = [];

  for (let candidate = 0; candidate < job.deliverable.candidates; candidate += 1) {
    const candidatePrompt = `${prompt}\n\nCandidate ${candidate + 1}: preserve every declared identity, product, text, and continuity invariant.`;
    const response = await fetchWithRetry(`${baseUrl}/interactions`, () => ({
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: buildOmniInput(candidatePrompt, assets),
        response_format: { type: "video", aspect_ratio: job.deliverable.aspectRatio, delivery: "uri" },
        background: false,
        store: false,
        stream: false,
      }),
    }), {
      timeoutMs: job.provider.timeoutMs || 1_200_000,
      attempts: 2,
      baseDelayMs: 5_000,
      retryableStatuses: new Set([429]),
      retryNetworkErrors: false,
      onRetry: retryLogger("Gemini Omni"),
    });
    const data = await response.json();
    const video = extractOmniVideo(data);
    if (!video) throw new EngineError("NO_PROVIDER_OUTPUT", `Gemini Omni returned no video for candidate ${candidate + 1}.`);

    writeJsonAtomic(operationPath(root, job, candidate), {
      interactionId: data.id || null,
      status: data.status || null,
      fileUri: video.uri || null,
      createdAt: new Date().toISOString(),
    });

    let buffer;
    if (video.data) buffer = Buffer.from(video.data, "base64");
    else if (video.uri) {
      const fileId = googleFileId(video.uri);
      if (fileId) {
        await waitForGoogleFile(baseUrl, fileId, data.id || null, apiKey, root, job, candidate);
        buffer = await downloadToBuffer(`${baseUrl}/files/${fileId}:download?alt=media`, {
          timeoutMs: 300_000,
          headers: { "x-goog-api-key": apiKey },
          onRetry: retryLogger("Gemini Omni download"),
        });
      } else {
        buffer = await downloadToBuffer(video.uri, {
          timeoutMs: 300_000,
          headers: { "x-goog-api-key": apiKey },
          onRetry: retryLogger("Gemini Omni download"),
        });
      }
    }
    if (!buffer?.length) throw new EngineError("NO_PROVIDER_OUTPUT", "Gemini Omni completed without downloadable video bytes.");
    outputs.push(saveOutput(root, job, candidate, "mp4", buffer));
  }

  return { outputs, provider: { id: "google-omni-video", model } };
}
