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
  return adapter(context);
}
