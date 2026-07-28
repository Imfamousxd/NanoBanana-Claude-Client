import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { EngineError } from "./errors.mjs";

export function resolveInside(root, requested, label = "path") {
  if (!requested || typeof requested !== "string") {
    throw new EngineError("INVALID_PATH", `${label} must be a non-empty path string.`);
  }
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, requested);
  if (resolved !== rootPath && !resolved.startsWith(`${rootPath}${path.sep}`)) {
    throw new EngineError("PATH_OUTSIDE_WORKSPACE", `${label} must stay inside the repository.`, {
      requested,
    });
  }
  return resolved;
}

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new EngineError("INVALID_JSON", `Invalid JSON in ${filePath}: ${error.message}`, undefined, error);
    }
    throw error;
  }
}

export function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, filePath);
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

export function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function slugify(value, fallback = "content") {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

export function mimeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
  }[extension] || "application/octet-stream";
}

export function dataUriForFile(filePath) {
  return `data:${mimeForPath(filePath)};base64,${fs.readFileSync(filePath).toString("base64")}`;
}
