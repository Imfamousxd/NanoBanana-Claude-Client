const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\br8_[A-Za-z0-9_-]{12,}\b/g,
  /(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi,
  /([?&](?:key|api_key|token)=)[^&\s]+/gi,
];

export class EngineError extends Error {
  constructor(code, message, details = undefined, cause = undefined) {
    super(message, cause ? { cause } : undefined);
    this.name = "EngineError";
    this.code = code;
    this.details = details;
  }
}

export function redact(value) {
  let text = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (_match, prefix = "") => `${prefix}[REDACTED]`);
  }
  return text;
}

export function serializeError(error) {
  return {
    name: error?.name || "Error",
    code: error?.code || "UNEXPECTED_ERROR",
    message: redact(error?.message || String(error)),
    details: error?.details,
  };
}

