import assert from "node:assert";
import fs from "node:fs";
import { repoRoot } from "../lib-repo-root.mjs";

// Without REPO_DIR, the helper must resolve to a directory that actually holds .env — the shared
// config root. In a worktree that's the main checkout several levels up (where the gitignored .env
// lives); in a plain checkout / container it's the code dir itself. Either way: .env must be there.
delete process.env.REPO_DIR;
const root = repoRoot();
assert.ok(fs.existsSync(`${root}/.env`), `repoRoot (${root}) must contain .env`);

// REPO_DIR always wins (this is how the container pins it to /app).
process.env.REPO_DIR = "/tmp";
assert.equal(repoRoot(), "/tmp", "REPO_DIR env must win");
delete process.env.REPO_DIR;

console.log(`PASS test-repo-root (resolved ${root})`);
