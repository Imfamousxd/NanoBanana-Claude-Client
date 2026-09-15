// Embeddings — a text document embedding and a visual embedding per asset. Gemini Embedding 2 is
// multimodal (text and image into one space), which is what lets a text query land on a picture and
// a picture find its siblings. OpenAI text-embedding-3-large is the text-only fallback.
import fs from "node:fs";
import { requireEnv } from "../../core/env.mjs";
import { EngineError } from "../../core/errors.mjs";
import { fetchWithRetry } from "../../core/http.mjs";

export async function embedGemini({ model = "gemini-embedding-2", dimensions = 768, text = undefined, imagePath = undefined, taskType = "RETRIEVAL_DOCUMENT" }) {
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini embeddings");
  const parts = [];
  if (imagePath) parts.push({ inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(imagePath).toString("base64") } });
  if (text) parts.push({ text: String(text).slice(0, 8_000) });
  if (!parts.length) throw new EngineError("EMBED_EMPTY", "Nothing to embed.");
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, () => ({
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts }, taskType, outputDimensionality: dimensions }),
  }), { timeoutMs: 60_000, attempts: 3 });
  const data = await response.json();
  const values = data.embedding?.values;
  if (!Array.isArray(values)) throw new EngineError("EMBED_INVALID", "Gemini embedding response had no values.");
  return { model, dimensions: values.length, vector: normalize(values), kind: imagePath ? (text ? "multimodal" : "image") : "text" };
}

export async function embedOpenAI({ model = "text-embedding-3-large", dimensions = 768, text }) {
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI embeddings");
  const response = await fetchWithRetry("https://api.openai.com/v1/embeddings", () => ({
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: String(text).slice(0, 8_000), dimensions }),
  }), { timeoutMs: 60_000, attempts: 3 });
  const data = await response.json();
  const values = data.data?.[0]?.embedding;
  if (!Array.isArray(values)) throw new EngineError("EMBED_INVALID", "OpenAI embedding response had no values.");
  return { model, dimensions: values.length, vector: normalize(values), kind: "text" };
}

export async function embed({ provider = "gemini", model, dimensions = 768, text, imagePath, taskType }) {
  if (provider === "openai") return embedOpenAI({ model: model || "text-embedding-3-large", dimensions, text: text || "" });
  try {
    return await embedGemini({ model: model || "gemini-embedding-2", dimensions, text, imagePath, taskType });
  } catch (error) {
    // A model that rejects image parts still gives us the text half; record which half we got.
    if (imagePath && text && /image|inline|mime|unsupported/i.test(error.message)) {
      console.error(`[dam] embedding model rejected the image part, falling back to text: ${error.message}`);
      return embedGemini({ model: model || "gemini-embedding-2", dimensions, text, taskType });
    }
    throw error;
  }
}

export function normalize(values) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / norm);
}

export function toPgVector(vector) {
  return `[${vector.map((value) => Number(value).toFixed(7)).join(",")}]`;
}
