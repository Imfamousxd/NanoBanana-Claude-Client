// Pull the DAM's secrets out of Railway into this checkout's .env without printing a single value.
// Requires the Railway CLI, logged in (`railway login`) and linked to the legacy DAM backend service
// (`railway link` inside the Dialed-DAM-Backend folder, or --service/--project flags).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const WANTED_KEYS = [
  "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN", "DROPBOX_ACCESS_TOKEN",
  "DROPBOX_PATH_ROOT_NAMESPACE_ID", "DROPBOX_SELECT_USER", "DROPBOX_ROOT_PATH",
];

export function readRailwayVariables({ cwd, service, environment, project }) {
  const args = ["variables", "--json"];
  if (service) args.push("--service", service);
  if (environment) args.push("--environment", environment);
  if (project) args.push("--project", project);
  const out = execFileSync("railway", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const parsed = JSON.parse(out);
  // The CLI has emitted either {KEY: value} or [{name, value}] depending on version; accept both.
  if (Array.isArray(parsed)) return Object.fromEntries(parsed.map((item) => [item.name || item.key, item.value]));
  return parsed;
}

export function mergeIntoEnv(envPath, values, { keys = WANTED_KEYS, overwrite = false } = {}) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = existing.split(/\r?\n/);
  const written = [];
  const skipped = [];
  for (const key of keys) {
    const value = values[key];
    if (value === undefined || value === "") { skipped.push(`${key} (not set in Railway)`); continue; }
    const index = lines.findIndex((line) => new RegExp(`^\\s*(export\\s+)?${key}\\s*=`).test(line));
    const entry = `${key}=${/[\s#"']/.test(value) ? JSON.stringify(value) : value}`;
    if (index >= 0) {
      if (!overwrite) { skipped.push(`${key} (already in .env; pass --overwrite)`); continue; }
      lines[index] = entry;
    } else {
      if (!written.length && lines.length && lines.at(-1) !== "") lines.push("");
      lines.push(entry);
    }
    written.push(key);
  }
  fs.writeFileSync(envPath, `${lines.join("\n").replace(/\n*$/, "\n")}`, { mode: 0o600 });
  return { written, skipped, envPath };
}

export function importRailwayEnv(root, { cwd = root, service, environment, project, overwrite = false, keys = WANTED_KEYS } = {}) {
  const values = readRailwayVariables({ cwd, service, environment, project });
  const result = mergeIntoEnv(path.join(root, ".env"), values, { keys, overwrite });
  return { ...result, available: Object.keys(values).filter((key) => keys.includes(key)), railwayKeyCount: Object.keys(values).length };
}
