# Hosted MCP — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Per the operator, backend/server/container tasks are authored by **Codex (GPT-5.x) via the `hivemind` skill**; Claude reviews adversarially and does integration. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the local stdio MCP into one hosted, token-authenticated Streamable-HTTP server on Railway that auto-deploys from GitHub, exposing the compute-light tools across all brands.

**Architecture:** Extract the tool registry into a shared module so the existing stdio server and a new HTTP server run the *exact same* tools. The HTTP server uses the official MCP SDK's `StreamableHTTPServerTransport`, gated by a bearer token. A Dockerfile (node + python) runs it on Railway; the entrypoint materializes `.env` from platform env vars. A repo-root helper removes the hardcoded macOS paths that would break in a container.

**Tech Stack:** Node 22 (ESM), `@modelcontextprotocol/sdk`, Node `http`, Docker, Railway, Supabase (existing ledger), python3 (existing KG suite).

## Global Constraints

- Runtime: **Node 22**, ESM (`"type": "module"`).
- **No secret ever committed.** `.env` is gitignored; all keys come from Railway env vars at runtime.
- **Bearer token mandatory** on every HTTP request (`Authorization: Bearer <MCP_AUTH_TOKEN>`); missing/wrong → 401, no tool exposure.
- **One tool definition, two transports** — stdio and HTTP both import `mcp-tools.mjs`; never duplicate a handler.
- Phase-1 tools only over HTTP: `engine_plan, engine_brands, engine_avatars, examples_find, kg_list, kg_search, kg_get, kg_add_law, engine_status, engine_verdict, create_from_request`. `engine_generate, scene_frame, engine_cost` are Phase-2 (tagged, not exposed over HTTP).
- Repo path resolves via `REPO_DIR` env var, else the repo root derived from the module location — **never** a hardcoded `/Users/...` path.
- Commit after every green task.

---

## File Structure

- **Create** `lib-repo-root.mjs` — single source of truth for the repo root.
- **Modify** `engine-ledger.mjs`, `video-engine.mjs`, `sd25-cost.mjs`, `scene-frame.mjs` — use the helper instead of hardcoded `REPO`.
- **Create** `mcp-tools.mjs` — shared tool registry (`TOOLS`, each tagged `phase: 1|2`), extracted from `mcp-server.mjs`.
- **Modify** `mcp-server.mjs` — import `TOOLS` from `mcp-tools.mjs`; behavior unchanged.
- **Create** `mcp-auth.mjs` — constant-time bearer-token check.
- **Create** `mcp-http.mjs` — Streamable-HTTP MCP server (SDK) + auth + phase-1 tools.
- **Create** `scripts/smoke-brands.mjs` — dry-run a minimal brief per registered brand.
- **Modify** `package.json` — add `@modelcontextprotocol/sdk`; add `start:http`, `smoke` scripts.
- **Create** `Dockerfile`, `.dockerignore`, `docker-entrypoint.sh`, `railway.json`.
- **Create** `docs/HOSTED-MCP.md` — env vars + Railway runbook + client config.

---

### Task 1: Repo-root helper + remove hardcoded macOS paths

**Files:**
- Create: `lib-repo-root.mjs`
- Modify: `engine-ledger.mjs:15`, `video-engine.mjs:40`, `sd25-cost.mjs`, `scene-frame.mjs`
- Test: `scripts/test-repo-root.mjs`

**Interfaces:**
- Produces: `export function repoRoot(): string` — returns `process.env.REPO_DIR` if set, else the directory containing this module (the repo root, since these scripts live at repo root).

- [ ] **Step 1: Write the failing test** — `scripts/test-repo-root.mjs`:

```js
import assert from "node:assert";
import { repoRoot } from "../lib-repo-root.mjs";
import fs from "node:fs";
// default: resolves to a real dir that contains this repo's package.json
const root = repoRoot();
assert.ok(fs.existsSync(`${root}/package.json`), "repoRoot must contain package.json");
assert.ok(!root.includes("/Users/Hassoonie"), "must not hardcode a personal path");
// override via env
process.env.REPO_DIR = "/tmp";
const mod = await import("../lib-repo-root.mjs?bust=" + Date.now());
assert.equal(mod.repoRoot(), "/tmp", "REPO_DIR env must win");
console.log("PASS test-repo-root");
```

- [ ] **Step 2: Run it, verify it fails** — `node scripts/test-repo-root.mjs` → FAIL (`Cannot find module lib-repo-root.mjs`).

- [ ] **Step 3: Implement** — `lib-repo-root.mjs`:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
export function repoRoot() { return process.env.REPO_DIR || HERE; }
```

- [ ] **Step 4: Verify pass** — `node scripts/test-repo-root.mjs` → `PASS test-repo-root`.

- [ ] **Step 5: Swap the four scripts.** In each, replace `const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";` with:

```js
import { repoRoot } from "./lib-repo-root.mjs";
const REPO = repoRoot();
```

- [ ] **Step 6: Regression** — the ledger still resolves its project ref locally:
Run: `node -e "import('./engine-ledger.mjs').then(m=>m.listRecent(1)).then(r=>console.log('ledger ok', Array.isArray(r)))"`
Expected: `ledger ok true` (reads `.env` at repo root as before).

- [ ] **Step 7: Commit** — `git add lib-repo-root.mjs scripts/test-repo-root.mjs engine-ledger.mjs video-engine.mjs sd25-cost.mjs scene-frame.mjs && git commit -m "Derive repo root instead of hardcoding a macOS path (container-ready)"`

---

### Task 2: Extract the shared tool registry

**Files:**
- Create: `mcp-tools.mjs`
- Modify: `mcp-server.mjs` (replace inline `TOOLS` with an import; keep the JSON-RPC loop)
- Test: `scripts/test-tools-parity.mjs`

**Interfaces:**
- Produces: `export const TOOLS` — the same object literal currently in `mcp-server.mjs`, with **one added field per tool: `phase: 1` or `phase: 2`**. Phase-2 tools: `engine_generate`, `scene_frame`, `engine_cost`. All others `phase: 1`.
- Produces: `export function toolsForPhase(maxPhase)` → `{ [name]: tool }` filtered to `tool.phase <= maxPhase`.
- Consumes (unchanged): the helper fns `run`, `okText`, `errText`, `tempBrief` move into `mcp-tools.mjs` (they are only used by handlers).

- [ ] **Step 1: Write the failing test** — `scripts/test-tools-parity.mjs`:

```js
import assert from "node:assert";
import { TOOLS, toolsForPhase } from "../mcp-tools.mjs";
const names = Object.keys(TOOLS);
assert.ok(names.includes("engine_plan") && names.includes("engine_verdict"), "core tools present");
for (const [n, t] of Object.entries(TOOLS)) {
  assert.ok(t.phase === 1 || t.phase === 2, `${n} must be tagged phase 1|2`);
  assert.ok(t.description && t.inputSchema && t.handler, `${n} shape intact`);
}
const p1 = Object.keys(toolsForPhase(1));
assert.ok(!p1.includes("engine_generate"), "generate is phase 2, excluded from p1");
assert.ok(p1.includes("engine_status"), "status is phase 1");
console.log(`PASS parity (${names.length} tools, ${p1.length} in phase 1)`);
```

- [ ] **Step 2: Run, verify fail** — `node scripts/test-tools-parity.mjs` → FAIL (module missing).

- [ ] **Step 3: Implement** — cut the `const TOOLS = {…}` object and the `run/okText/errText/tempBrief` helpers out of `mcp-server.mjs` into `mcp-tools.mjs`; add `phase:` to each tool; add `toolsForPhase`. Export both. `mcp-tools.mjs` keeps `import { spawn } …`, `DIR = repoRoot()` (via `lib-repo-root.mjs`).

- [ ] **Step 4: Rewire stdio server** — in `mcp-server.mjs` replace the removed block with `import { TOOLS } from "./mcp-tools.mjs";` (keep the JSON-RPC loop and `tools/list`/`tools/call` handlers, which already read `TOOLS`).

- [ ] **Step 5: Verify parity passes** — `node scripts/test-tools-parity.mjs` → PASS.

- [ ] **Step 6: Verify stdio server unchanged** — reuse the JSON-RPC harness:
Run: `node scripts/mcp-toolcheck.mjs` (the initialize+tools/list harness from this session; if absent, recreate it) → prints 14 tools.

- [ ] **Step 7: Commit** — `git add mcp-tools.mjs mcp-server.mjs scripts/test-tools-parity.mjs && git commit -m "Extract shared MCP tool registry (phase-tagged); stdio server imports it"`

---

### Task 3: Bearer-token auth

**Files:**
- Create: `mcp-auth.mjs`
- Test: `scripts/test-auth.mjs`

**Interfaces:**
- Produces: `export function checkAuth(req): boolean` — true iff `req.headers.authorization === "Bearer " + process.env.MCP_AUTH_TOKEN` compared in constant time. If `MCP_AUTH_TOKEN` is unset, returns `false` (fail closed).

- [ ] **Step 1: Failing test** — `scripts/test-auth.mjs`:

```js
import assert from "node:assert";
process.env.MCP_AUTH_TOKEN = "sekret-123";
const { checkAuth } = await import("../mcp-auth.mjs");
assert.equal(checkAuth({ headers: { authorization: "Bearer sekret-123" } }), true);
assert.equal(checkAuth({ headers: { authorization: "Bearer wrong" } }), false);
assert.equal(checkAuth({ headers: {} }), false);
delete process.env.MCP_AUTH_TOKEN;
const { checkAuth: c2 } = await import("../mcp-auth.mjs?b=" + Date.now());
assert.equal(c2({ headers: { authorization: "Bearer anything" } }), false, "fail closed w/o token set");
console.log("PASS auth");
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — `mcp-auth.mjs`:

```js
import crypto from "node:crypto";
export function checkAuth(req) {
  const want = process.env.MCP_AUTH_TOKEN;
  if (!want) return false; // fail closed
  const got = (req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Verify pass.**

- [ ] **Step 5: Commit** — `git add mcp-auth.mjs scripts/test-auth.mjs && git commit -m "MCP bearer-token auth (constant-time, fail-closed)"`

---

### Task 4: Streamable-HTTP MCP server

**Files:**
- Create: `mcp-http.mjs`
- Modify: `package.json` (add `@modelcontextprotocol/sdk`, `start:http` script)
- Test: `scripts/test-http.mjs`

**Interfaces:**
- Consumes: `toolsForPhase` (Task 2), `checkAuth` (Task 3).
- Produces: an HTTP server on `PORT` (default 8080) with `POST /mcp` (JSON-RPC over Streamable HTTP) and `GET /healthz` (→ 200 `ok`, no auth).

- [ ] **Step 1: Add the dependency** — `npm install @modelcontextprotocol/sdk` (pins into `package.json`/`package-lock.json`). Confirm the transport path:
Run: `node -e "import('@modelcontextprotocol/sdk/server/streamableHttp.js').then(m=>console.log(Object.keys(m)))"`
Expected: includes `StreamableHTTPServerTransport`. **If the export path differs in the installed version, use the path this prints** and adjust Step 3.

- [ ] **Step 2: Failing integration test** — `scripts/test-http.mjs` (starts the server in-process on a random port, exercises auth + tools/list + a tool call):

```js
import assert from "node:assert";
process.env.MCP_AUTH_TOKEN = "t0ken"; process.env.PORT = "0";
const { startServer } = await import("../mcp-http.mjs");
const { url, close } = await startServer();        // returns bound URL
const rpc = (body, token) => fetch(url + "/mcp", { method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream",
             ...(token ? { authorization: "Bearer " + token } : {}) },
  body: JSON.stringify(body) });
// 401 without token
assert.equal((await rpc({ jsonrpc:"2.0", id:1, method:"tools/list" })).status, 401);
// health, no auth
assert.equal((await fetch(url + "/healthz")).status, 200);
// initialize + list with token
await rpc({ jsonrpc:"2.0", id:1, method:"initialize", params:{ protocolVersion:"2025-06-18", capabilities:{}, clientInfo:{name:"t",version:"0"} } }, "t0ken");
const list = await (await rpc({ jsonrpc:"2.0", id:2, method:"tools/list" }, "t0ken")).text();
assert.ok(list.includes("engine_brands"), "phase-1 tool listed");
assert.ok(!list.includes("engine_generate"), "phase-2 tool NOT listed over http");
await close(); console.log("PASS http");
```

- [ ] **Step 3: Implement** — `mcp-http.mjs`. Intended shape (confirm exact SDK API from Step 1):

```js
import http from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolsForPhase } from "./mcp-tools.mjs";
import { checkAuth } from "./mcp-auth.mjs";

const TOOLS = toolsForPhase(1);

function buildServer() {
  const server = new Server({ name: "nanobanana-engine", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const t = TOOLS[req.params.name];
    if (!t) return { content: [{ type: "text", text: `unknown tool: ${req.params.name}` }], isError: true };
    try { return await t.handler(req.params.arguments || {}); }
    catch (e) { return { content: [{ type: "text", text: `tool error: ${e?.message || e}` }], isError: true }; }
  });
  return server;
}

export async function startServer() {
  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/healthz") { res.writeHead(200).end("ok"); return; }
    if (!checkAuth(req)) { res.writeHead(401, { "content-type": "application/json" })
      .end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "unauthorized" }, id: null })); return; }
    // stateless: fresh transport+server per request (no session store needed for our tools)
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined;
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = buildServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  });
  await new Promise((r) => httpServer.listen(Number(process.env.PORT) || 8080, r));
  const { port } = httpServer.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => httpServer.close(r)) };
}

if (import.meta.url === `file://${process.argv[1]}`) startServer().then(({ url }) => console.error(`[mcp-http] listening ${url}`));
```

- [ ] **Step 4: Verify pass** — `node scripts/test-http.mjs` → `PASS http`. (If the SDK's `handleRequest` needs the body left unconsumed, pass `body` as the 3rd arg as shown and do NOT pre-read — follow whichever the SDK version requires; the test is the oracle.)

- [ ] **Step 5: package.json scripts** — add `"start:http": "node mcp-http.mjs"`, `"smoke": "node scripts/smoke-brands.mjs"`.

- [ ] **Step 6: Commit** — `git add mcp-http.mjs package.json package-lock.json scripts/test-http.mjs && git commit -m "Streamable-HTTP MCP server (SDK) with auth; phase-1 tools only"`

---

### Task 5: Brand smoke test

**Files:**
- Create: `scripts/smoke-brands.mjs`
- Test: itself (it IS the test — exit non-zero on any brand failure)

**Interfaces:**
- Consumes: `sieve/brands/*/brand.json` (list of brands), `video-engine.mjs` (dry-run).
- Produces: exit 0 if every brand dry-runs without a crash/path error; non-zero + the failing brand otherwise.

- [ ] **Step 1: Implement** — `scripts/smoke-brands.mjs`:

```js
import fs from "node:fs"; import path from "node:path";
import { spawnSync } from "node:child_process";
import { repoRoot } from "../lib-repo-root.mjs";
const ROOT = repoRoot();
const brands = fs.readdirSync(path.join(ROOT, "sieve", "brands"))
  .filter((b) => fs.existsSync(path.join(ROOT, "sieve", "brands", b, "brand.json")));
let failed = 0;
for (const brand of brands) {
  const brief = { id: `smoke-${brand}`, brand, campaign: "none", lane: "campaign", duration: 5,
    ratio: "9:16", subject: { type: "artwork" }, refs: { images: [] },
    scene: { look: "flat stylised illustration, morning window light", camera: "locked-off" },
    script: { beats: [{ t: "0-5s", action: "clouds drift" }] }, audio: { generate: false } };
  const f = path.join(ROOT, `.smoke-${brand}.json`); fs.writeFileSync(f, JSON.stringify(brief));
  const r = spawnSync("node", [path.join(ROOT, "video-engine.mjs"), "--brief", f], { encoding: "utf-8" });
  fs.rmSync(f, { force: true });
  const ok = r.status === 0 && !/ENOENT|cannot find|Cannot read/i.test((r.stdout || "") + (r.stderr || ""));
  console.log(`${ok ? "✓" : "✗"} ${brand}`); if (!ok) { failed++; console.log((r.stdout||r.stderr||"").slice(-300)); }
}
console.log(`\n${brands.length - failed}/${brands.length} brands dry-run clean`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run** — `node scripts/smoke-brands.mjs` → all brands `✓`, exit 0. Fix any brand that errors (usually a missing asset path or a campaign default) before proceeding.

- [ ] **Step 3: Commit** — `git add scripts/smoke-brands.mjs && git commit -m "Brand smoke test: every registered brand dry-runs clean"`

---

### Task 6: Container + Railway

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `docker-entrypoint.sh`, `railway.json`

**Interfaces:**
- Produces: an image that boots `mcp-http.mjs` on `$PORT`, `.env` materialized from env vars, fail-fast on missing required vars.

- [ ] **Step 1: `.dockerignore`** — exclude weight: `node_modules`, `generations`, `research`, `_probe`, `.git`, `*.mp4`, `NuLumin Generated`, `Nulumin lifestyle shots`, `.env`.

- [ ] **Step 2: `docker-entrypoint.sh`** — materialize `.env` + fail fast:

```sh
#!/bin/sh
set -e
REQUIRED="MODELARK_API_KEY NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY DIRECT_URL MCP_AUTH_TOKEN"
missing=""
for v in $REQUIRED; do eval "val=\$$v"; [ -z "$val" ] && missing="$missing $v"; done
if [ -n "$missing" ]; then echo "FATAL: missing env vars:$missing" >&2; exit 1; fi
: > .env
for v in MODELARK_API_KEY NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY DIRECT_URL DATABASE_URL GEMINI_API_KEY OPENAI_API_KEY REPLICATE_API_TOKEN MCP_AUTH_TOKEN; do
  eval "val=\$$v"; [ -n "$val" ] && printf '%s=%s\n' "$v" "$val" >> .env
done
exec node mcp-http.mjs
```

- [ ] **Step 3: `Dockerfile`**:

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN chmod +x docker-entrypoint.sh
ENV PORT=8080 REPO_DIR=/app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
```

- [ ] **Step 4: `railway.json`**:

```json
{ "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": { "healthcheckPath": "/healthz", "restartPolicyType": "ON_FAILURE", "restartPolicyMaxRetries": 3 } }
```

- [ ] **Step 5: Local container test** (if Docker available):
Run: `docker build -t nb-mcp . && docker run --rm -e MCP_AUTH_TOKEN=t -e MODELARK_API_KEY=x -e NEXT_PUBLIC_SUPABASE_URL=x -e SUPABASE_SERVICE_ROLE_KEY=x -e DIRECT_URL=x -p 8080:8080 nb-mcp &`
Then: `curl -s localhost:8080/healthz` → `ok`; `curl -s -o /dev/null -w "%{http_code}" -XPOST localhost:8080/mcp` → `401`.
If Docker is unavailable locally, this task's verification happens on the first Railway deploy (Step 6 of Task 7).

- [ ] **Step 6: Commit** — `git add Dockerfile .dockerignore docker-entrypoint.sh railway.json && git commit -m "Containerize the hosted MCP for Railway (fail-fast env, healthcheck)"`

---

### Task 7: Deploy docs + client config + go-live

**Files:**
- Create: `docs/HOSTED-MCP.md`

- [ ] **Step 1: Write `docs/HOSTED-MCP.md`** — the operator runbook (from the spec's setup section): Railway New Project → Deploy from GitHub → this repo/branch; the exact env-var list to paste; set `MCP_AUTH_TOKEN`; where to copy the public URL. Include the **client config block**:

```json
{ "mcpServers": { "nanobanana": {
  "type": "http", "url": "https://<your>.up.railway.app/mcp",
  "headers": { "Authorization": "Bearer <MCP_AUTH_TOKEN>" } } } }
```

- [ ] **Step 2: Commit + push** — `git add docs/HOSTED-MCP.md && git commit -m "Hosted MCP: operator runbook + client config" && git push origin gen-image`

- [ ] **Step 3: OPERATOR (dashboard, ~10 min):** connect Railway to the repo, paste env vars, set `MCP_AUTH_TOKEN`, deploy, send back the public URL.

- [ ] **Step 4: Go-live verification** (after URL is known):
Run: `curl -s https://<url>/healthz` → `ok`; then `initialize` + `tools/list` over `POST /mcp` with the bearer token → phase-1 tools listed. Add the client config to a real client and confirm the tools appear.

- [ ] **Step 5: Prove the sync win** — make a trivial edit (e.g., a tool description in `mcp-tools.mjs`), push, watch Railway redeploy, re-list tools over the URL → the change is live with no local pull.

---

## Self-Review

**Spec coverage:** Streamable HTTP (T4) ✓; bearer auth (T3) ✓; client-connect (T7) ✓; all-brands (T5) ✓; push→auto-deploy (T6/T7) ✓; stdio still works (T2) ✓; repo-path fix (T1) ✓; fail-fast env (T6) ✓; out-of-scope generation correctly deferred via `phase` tag (T2/T4) ✓.

**Placeholder scan:** every step has concrete code or an exact command; the only deliberate "confirm the exact API" is Task 4 Step 1, which is a *verification* step with a printed oracle, not a placeholder.

**Type consistency:** `repoRoot()` (T1) used in T2/T5; `toolsForPhase(1)` (T2) used in T4; `checkAuth(req)` (T3) used in T4; `startServer()` returns `{url, close}` used by T4 test. Consistent.

**Risk flagged:** the SDK's exact `StreamableHTTPServerTransport` signature/stateless usage may differ by version — Task 4 Step 1 pins it before coding, and the integration test (Step 2) is the oracle.
