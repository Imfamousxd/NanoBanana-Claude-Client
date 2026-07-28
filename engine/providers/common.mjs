import fs from "node:fs";
import path from "node:path";
import { resolveInside, slugify, timestamp } from "../core/files.mjs";

export function outputPath(root, job, index, extension) {
  const directory = resolveInside(root, job.output.directory, "output.directory");
  fs.mkdirSync(directory, { recursive: true });
  const base = slugify(job.output.basename || job.id);
  return path.join(directory, `${timestamp()}_${base}_c${index + 1}.${extension}`);
}

export function saveOutput(root, job, index, extension, buffer) {
  const filePath = outputPath(root, job, index, extension);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function retryLogger(provider) {
  return ({ attempt, status, error, delayMs }) => {
    const reason = status ? `HTTP ${status}` : error;
    console.warn(`  ${provider}: retry ${attempt} after ${reason}; waiting ${Math.ceil(delayMs / 1000)}s`);
  };
}

export function publicProviderResult(value) {
  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (/token|key|authorization/i.test(key)) return undefined;
    if (typeof item === "string" && item.length > 2_000) return `${item.slice(0, 2_000)}…`;
    return item;
  }));
}

