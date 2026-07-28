import fs from "node:fs";
import path from "node:path";
import { EngineError } from "./errors.mjs";

export function parseEnv(text) {
  const values = {};
  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value.replace(/\\n/g, "\n");
  }
  return values;
}

export function loadEnv(root, filename = ".env") {
  const envPath = path.join(root, filename);
  if (!fs.existsSync(envPath)) return { path: envPath, loaded: [] };
  const values = parseEnv(fs.readFileSync(envPath, "utf8"));
  const loaded = [];
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded.push(key);
    }
  }
  return { path: envPath, loaded };
}

export function requireEnv(name, provider) {
  const value = process.env[name];
  if (!value) {
    throw new EngineError(
      "MISSING_CREDENTIAL",
      `${name} is required for ${provider}. Add it to .env or export it in the shell.`,
      { name, provider },
    );
  }
  return value;
}

