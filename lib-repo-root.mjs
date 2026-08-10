// lib-repo-root.mjs — single source of truth for the config/repo root (where .env lives).
//
// The engine scripts used to hardcode `const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/…"`,
// which only exists on one Mac — it broke every other checkout and makes containerizing impossible.
// Derive it instead, honouring three cases in order:
//   1. REPO_DIR env var — the container sets it to /app (where the entrypoint materialises .env).
//   2. Walk up from this module's location to the nearest ancestor that CONTAINS a `.env`. This is
//      what makes a git worktree work: .env is gitignored so it lives only at the MAIN checkout,
//      several levels above a worktree — the old hardcode pointed there on purpose.
//   3. Fall back to this module's own directory (a fresh clone before .env exists).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function findEnvRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, ".env"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

export function repoRoot() {
  return process.env.REPO_DIR || findEnvRoot(HERE) || HERE;
}
