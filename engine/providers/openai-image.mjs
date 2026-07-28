import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { mimeForPath } from "../core/files.mjs";
import { downloadToBuffer, fetchWithRetry } from "../core/http.mjs";
import { retryLogger, saveOutput } from "./common.mjs";

const SIZE_MAP = {
  "1:1": "2880x2880",
  "2:3": "2048x3072",
  "3:2": "3072x2048",
  "3:4": "2160x2880",
  "4:3": "2880x2160",
  "4:5": "2560x3200",
  "5:4": "3200x2560",
  "9:16": "2160x3840",
  "16:9": "3840x2160",
  "21:9": "3360x1440",
};

function imageAssets(assets) {
  return assets.filter((asset) => asset.media.kind === "image" && asset.role !== "mask");
}

export async function runOpenAIImage({ root, job, prompt, assets }) {
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI Image API");
  const model = job.provider.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const references = imageAssets(assets);
  const mask = assets.find((asset) => asset.role === "mask");
  const useEdits = references.length > 0 || mask;
  const endpoint = useEdits ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations";
  const size = job.provider.size || SIZE_MAP[job.deliverable.aspectRatio] || "auto";
  const quality = job.deliverable.quality || "high";
  const outputFormat = job.provider.outputFormat || "png";

  const response = await fetchWithRetry(endpoint, () => {
    if (useEdits) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("quality", quality);
      form.append("n", String(job.deliverable.candidates));
      form.append("output_format", outputFormat);
      if (job.provider.background) form.append("background", job.provider.background);
      for (const reference of references) {
        form.append(
          "image[]",
          new Blob([fs.readFileSync(reference.absolutePath)], { type: reference.mime }),
          path.basename(reference.absolutePath),
        );
      }
      if (mask) {
        form.append("mask", new Blob([fs.readFileSync(mask.absolutePath)], { type: mimeForPath(mask.absolutePath) }), path.basename(mask.absolutePath));
      }
      return { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form };
    }
    return {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
        n: job.deliverable.candidates,
        output_format: outputFormat,
        ...(job.provider.background ? { background: job.provider.background } : {}),
      }),
    };
  }, { timeoutMs: job.provider.timeoutMs || 300_000, attempts: 4, retryNetworkErrors: false, onRetry: retryLogger("OpenAI Image") });

  const data = await response.json();
  const items = data.data || [];
  if (!items.length) throw new EngineError("NO_PROVIDER_OUTPUT", "OpenAI returned no image outputs.");
  const outputs = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    let buffer;
    if (item.b64_json) buffer = Buffer.from(item.b64_json, "base64");
    else if (item.url) buffer = await downloadToBuffer(item.url, { onRetry: retryLogger("OpenAI download") });
    else continue;
    outputs.push(saveOutput(root, job, index, outputFormat === "jpeg" ? "jpg" : outputFormat, buffer));
  }
  if (!outputs.length) throw new EngineError("NO_PROVIDER_OUTPUT", "OpenAI response did not contain saveable image data.");
  return { outputs, provider: { id: "openai-image", model }, usage: data.usage || null };
}
