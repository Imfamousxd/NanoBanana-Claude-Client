// Transcription — verbatim speech with segment timestamps. OpenAI whisper-1 (verbose_json) is the
// default because it returns timed segments, which the speech statistics need. Swappable by env.
import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../../core/env.mjs";
import { EngineError } from "../../core/errors.mjs";
import { fetchWithRetry } from "../../core/http.mjs";

export async function transcribeAudio(audioPath, { model = "whisper-1", language = undefined } = {}) {
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI transcription");
  const stat = fs.statSync(audioPath);
  if (stat.size > 25 * 1024 * 1024) throw new EngineError("TRANSCRIBE_TOO_LARGE", "Audio over the 25MB transcription cap; lower DAM_MAX_VIDEO_SECONDS or trim.");
  const response = await fetchWithRetry("https://api.openai.com/v1/audio/transcriptions", () => {
    const form = new FormData();
    form.append("model", model);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
    if (language) form.append("language", language);
    form.append("file", new Blob([fs.readFileSync(audioPath)], { type: "audio/mpeg" }), path.basename(audioPath));
    return { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form };
  }, { timeoutMs: 300_000, attempts: 3, retryNetworkErrors: false });
  const data = await response.json();
  const segments = (data.segments || []).map((segment) => ({ start: Math.round(segment.start * 100) / 100, end: Math.round(segment.end * 100) / 100, text: String(segment.text || "").trim() }));
  return { model, language: data.language || language || null, durationS: data.duration || null, text: String(data.text || "").trim(), segments };
}
