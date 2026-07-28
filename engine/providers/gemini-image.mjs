import fs from "node:fs";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { fetchWithRetry } from "../core/http.mjs";
import { retryLogger, saveOutput } from "./common.mjs";

function partForAsset(asset) {
  return {
    inline_data: {
      mime_type: asset.mime,
      data: fs.readFileSync(asset.absolutePath).toString("base64"),
    },
  };
}

function responseImages(data) {
  const images = [];
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) images.push({ mime: inline.mimeType || inline.mime_type || "image/png", data: inline.data });
    }
  }
  return images;
}

export async function runGeminiImage({ root, job, prompt, assets }) {
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini Image API");
  const model = job.provider.model || process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const references = assets.filter((asset) => asset.media.kind === "image" && asset.role !== "mask");
  const outputs = [];
  const usage = [];

  for (let index = 0; index < job.deliverable.candidates; index += 1) {
    const parts = references.map(partForAsset);
    parts.push({ text: `${prompt}\n\nCandidate ${index + 1} of ${job.deliverable.candidates}. Keep all invariants fixed; vary only natural performance/framing within the brief.` });
    const response = await fetchWithRetry(endpoint, () => ({
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: job.deliverable.aspectRatio,
            imageSize: job.deliverable.imageSize || "2K",
          },
        },
      }),
    }), { timeoutMs: job.provider.timeoutMs || 300_000, attempts: 4, retryNetworkErrors: false, onRetry: retryLogger("Gemini Image") });
    const data = await response.json();
    const images = responseImages(data);
    if (!images.length) {
      const reason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "unknown";
      throw new EngineError("NO_PROVIDER_OUTPUT", `Gemini returned no image for candidate ${index + 1}; finish reason: ${reason}.`);
    }
    const image = images.at(-1);
    const extension = image.mime === "image/jpeg" ? "jpg" : image.mime === "image/webp" ? "webp" : "png";
    outputs.push(saveOutput(root, job, index, extension, Buffer.from(image.data, "base64")));
    usage.push(data.usageMetadata || null);
  }
  return { outputs, provider: { id: "gemini-image", model }, usage };
}
