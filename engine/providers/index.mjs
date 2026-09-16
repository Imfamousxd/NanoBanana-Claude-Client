import { EngineError } from "../core/errors.mjs";
import { runGeminiImage } from "./gemini-image.mjs";
import { runHiggsfieldImage } from "./higgsfield-image.mjs";
import { runGoogleOmniVideo } from "./google-omni-video.mjs";
import { runGoogleVeo } from "./google-veo.mjs";
import { runOpenAIImage } from "./openai-image.mjs";
import { runReplicateSeedance } from "./replicate-seedance.mjs";

const adapters = {
  "openai-image": runOpenAIImage,
  "gemini-image": runGeminiImage,
  "higgsfield-image": runHiggsfieldImage,
  "google-omni-video": runGoogleOmniVideo,
  "google-veo": runGoogleVeo,
  "replicate-seedance": runReplicateSeedance,
};

export async function runProvider(context) {
  const adapter = adapters[context.job.provider.id];
  if (!adapter) throw new EngineError("UNKNOWN_PROVIDER", `No provider adapter for ${context.job.provider.id}.`);
  const variants = context.variants || [];
  const isImage = !String(context.job.mode || "").includes("video");
  if (!isImage || variants.length < 2 || context.job.provider.id === "higgsfield-image") return adapter(context);
  // Named variations: each candidate is its own call with its own hypothesis and its own file name.
  const outputs = [];
  const usage = [];
  let provider = null;
  for (let index = 0; index < variants.length; index += 1) {
    const job = structuredClone(context.job);
    job.deliverable.candidates = 1;
    job.output.basename = `${context.job.output.basename}-v${index + 1}`;
    const result = await adapter({ ...context, job, prompt: variants[index] });
    outputs.push(...result.outputs);
    if (result.usage) usage.push(result.usage);
    provider = result.provider;
  }
  return { outputs, provider, usage: usage.length ? usage : null, variants: variants.length };
}
