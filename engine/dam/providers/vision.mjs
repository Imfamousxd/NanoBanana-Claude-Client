// Vision provider — one interface, two implementations (Gemini, OpenAI Responses). The caller passes
// images + a prompt + a JSON schema and gets a parsed object back plus usage. Swapping the model is a
// config change and a re-analysis job, never a code path.
import fs from "node:fs";
import { requireEnv } from "../../core/env.mjs";
import { EngineError } from "../../core/errors.mjs";
import { fetchWithRetry } from "../../core/http.mjs";

function inlineImage(filePath) {
  return { mime: "image/jpeg", data: fs.readFileSync(filePath).toString("base64") };
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new EngineError("VISION_EMPTY", "The vision model returned no text.");
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) throw new EngineError("VISION_NOT_JSON", `No JSON object in vision response: ${trimmed.slice(0, 200)}`);
  return JSON.parse(trimmed.slice(start, end + 1));
}

/** Gemini strict-JSON schemas cannot use union types; collapse ["string","null"] to nullable strings. */
export function geminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties" || key === "$schema") continue;
    if (key === "type" && Array.isArray(value)) {
      const nonNull = value.filter((item) => item !== "null");
      out.type = nonNull[0] || "string";
      if (value.includes("null")) out.nullable = true;
      continue;
    }
    out[key] = geminiSchema(value);
  }
  return out;
}

async function callGemini({ model, prompt, images, schema, maxOutputTokens = 8192, timeoutMs = 180_000 }) {
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini vision");
  const parts = images.map((filePath) => ({ inline_data: { mime_type: "image/jpeg", data: inlineImage(filePath).data } }));
  parts.push({ text: prompt });
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, () => ({
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens, responseMimeType: "application/json", ...(schema ? { responseSchema: geminiSchema(schema) } : {}) },
    }),
  }), { timeoutMs, attempts: 3, retryNetworkErrors: true });
  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n");
  if (!text) throw new EngineError("VISION_EMPTY", `Gemini returned no text (finish: ${data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "unknown"}).`);
  return { record: extractJson(text), usage: { tokensIn: data.usageMetadata?.promptTokenCount || null, tokensOut: data.usageMetadata?.candidatesTokenCount || null }, raw: text };
}

async function callOpenAI({ model, prompt, images, schema, name = "dam_analysis", timeoutMs = 240_000 }) {
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI vision");
  const content = [{ type: "input_text", text: prompt }];
  for (const filePath of images) content.push({ type: "input_image", image_url: `data:image/jpeg;base64,${inlineImage(filePath).data}`, detail: "high" });
  const response = await fetchWithRetry("https://api.openai.com/v1/responses", () => ({
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: [{ role: "user", content }], ...(schema ? { text: { format: { type: "json_schema", name, strict: true, schema } } } : {}) }),
  }), { timeoutMs, attempts: 3, retryNetworkErrors: false });
  const data = await response.json();
  let text = data.output_text || "";
  if (!text) for (const item of data.output || []) for (const part of item.content || []) if (part.type === "output_text") text += part.text;
  return { record: extractJson(text), usage: { tokensIn: data.usage?.input_tokens || null, tokensOut: data.usage?.output_tokens || null }, raw: text };
}

/**
 * Analyse `images` (JPEG paths) with `prompt` and return an object matching `schema`.
 * options.provider: gemini | openai (default from config).
 */
export async function analyzeImages({ provider = "gemini", model, prompt, images, schema, name }) {
  if (!images?.length) throw new EngineError("VISION_NO_IMAGES", "analyzeImages needs at least one image.");
  if (provider === "openai") return { provider, model, ...(await callOpenAI({ model, prompt, images, schema, name })) };
  return { provider, model, ...(await callGemini({ model, prompt, images, schema })) };
}

/** Text-only structured call (query understanding, reranking). */
export async function analyzeText({ provider = "gemini", model, prompt, schema, name }) {
  if (provider === "openai") return { provider, model, ...(await callOpenAI({ model, prompt, images: [], schema, name })) };
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini text");
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, () => ({
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: "application/json", ...(schema ? { responseSchema: geminiSchema(schema) } : {}) } }),
  }), { timeoutMs: 60_000, attempts: 3 });
  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n");
  return { provider, model, record: extractJson(text), usage: { tokensIn: data.usageMetadata?.promptTokenCount || null, tokensOut: data.usageMetadata?.candidatesTokenCount || null } };
}
