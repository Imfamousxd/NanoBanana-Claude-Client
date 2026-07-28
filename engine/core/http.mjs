import { EngineError, redact } from "./errors.mjs";

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function retryDelay(response, attempt, baseDelayMs) {
  const retryAfter = response?.headers?.get?.("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 120_000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 120_000));
  }
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * Math.max(100, baseDelayMs / 2));
  return Math.min(exponential + jitter, 60_000);
}

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchWithRetry(url, makeOptions, options = {}) {
  const {
    attempts = 4,
    timeoutMs = 120_000,
    baseDelayMs = 1_000,
    fetchImpl = fetch,
    onRetry = () => {},
    retryableStatuses = RETRYABLE_STATUS,
    retryNetworkErrors = true,
  } = options;

  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    try {
      const requestOptions = typeof makeOptions === "function" ? makeOptions() : { ...makeOptions };
      const response = await fetchImpl(url, { ...requestOptions, signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) return response;

      const retryable = retryableStatuses.has(response.status);
      if (!retryable || attempt === attempts - 1) {
        const body = redact((await response.text()).slice(0, 4_000));
        throw new EngineError("PROVIDER_HTTP_ERROR", `Provider returned HTTP ${response.status}.`, {
          status: response.status,
          body,
        });
      }

      const delayMs = retryDelay(response, attempt, baseDelayMs);
      onRetry({ attempt: attempt + 1, status: response.status, delayMs });
      await sleep(delayMs);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof EngineError) throw error;
      lastError = error;
      if (!retryNetworkErrors || attempt === attempts - 1) break;
      const delayMs = retryDelay(undefined, attempt, baseDelayMs);
      onRetry({ attempt: attempt + 1, error: error.message, delayMs });
      await sleep(delayMs);
    }
  }

  throw new EngineError("PROVIDER_NETWORK_ERROR", `Provider request failed: ${lastError?.message || "unknown error"}`, undefined, lastError);
}

export async function downloadToBuffer(url, options = {}) {
  const response = await fetchWithRetry(url, () => ({ redirect: "follow", headers: options.headers }), {
    timeoutMs: options.timeoutMs || 180_000,
    attempts: options.attempts || 4,
    onRetry: options.onRetry,
  });
  return Buffer.from(await response.arrayBuffer());
}
