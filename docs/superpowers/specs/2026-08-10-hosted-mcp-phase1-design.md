# Hosted MCP — Phase 1 (Streamable HTTP on Railway) — Design

**Status:** approved design, pre-implementation
**Date:** 2026-08-10
**Author:** Claude (with operator)

## Problem

The engine's MCP is a local **stdio** server (`mcp-server.mjs`) that each machine runs and each
person keeps in sync by hand: `git commit → push → pull`. That manual sync is the pain — we just
lived it doing a two-machine handoff. Editing a tool or a rule means everyone re-pulls.

## Goal

**One always-on hosted MCP server that every Claude client connects to by URL**, auto-deployed from
GitHub. Editing it (push to the deploy branch) updates everyone at once — no local pull. **Phase 1**
hosts the compute-light tools that carry the shared rules/knowledge/review across **all brands**.
Generation (heavy: ffmpeg/whisper/spend/large files) is **Phase 2**, deliberately deferred.

## Success criteria

1. A Railway service exposes an MCP endpoint over **Streamable HTTP** at a stable HTTPS URL.
2. A **bearer token** gates it; unauthenticated requests get 401 and see no tools.
3. Any MCP client (Claude Desktop/Code) adds `{url, Authorization header}` and sees the Phase-1 tools.
4. The Phase-1 tools (11, listed below) work against **real shared data for every registered brand**:
   `engine_plan` validates a brief for Muha / NuLumin / etc.; `engine_brands` lists them all;
   `engine_status` / `engine_verdict` read+write the shared Supabase ledger; `kg_*` and
   `examples_find` serve the knowledge and reference library.
5. **Push → auto-redeploy → all clients updated**, with no local pull.
6. The local **stdio server still works** for dev (imports the same tool code — no drift).

## Phase-1 tool set (light, no ffmpeg/whisper)

`engine_plan`, `engine_brands`, `engine_avatars`, `examples_find`, `kg_list`, `kg_search`,
`kg_get`, `kg_add_law`, `engine_status`, `engine_verdict`, `create_from_request`.

Deferred to Phase 2: `engine_generate`, `scene_frame`, `engine_cost` (drain touches paid tasks).

## Architecture / components

1. **`mcp-tools.mjs` (NEW)** — extract the tool registry (definitions + handlers) out of
   `mcp-server.mjs` into a shared module. It exports `TOOLS`. A `PHASE` filter lets the HTTP server
   expose only the light subset while the stdio server can expose everything locally. **This is the
   no-drift guarantee: one definition, two transports.**
2. **`mcp-server.mjs` (stdio, existing)** — refactored to `import { TOOLS } from "./mcp-tools.mjs"`.
   Behavior unchanged locally.
3. **`mcp-http.mjs` (NEW)** — the hosted server. Official MCP SDK `StreamableHTTPServerTransport`
   over Node `http`. Bearer-token auth in front. Registers the Phase-1 `TOOLS`.
4. **`mcp-auth.mjs` (NEW, small)** — reads `MCP_AUTH_TOKEN`, constant-time compares the
   `Authorization: Bearer …` header. Reject → 401.
5. **`Dockerfile` (NEW)** — `node:22-slim` + `python3` (for `kg-vault-test.py`) + `npm ci`. Copies
   the repo (incl. `sieve/`, `graph-fragments/`, `examples/`, `Brand Context/assets/`). Entrypoint
   materializes `.env` from platform env vars, then `node mcp-http.mjs`.
6. **`railway.json` (NEW)** — build from Dockerfile, start command, healthcheck path, restart policy.
7. **Repo-path fix** — `video-engine.mjs`, `engine-ledger.mjs`, `sd25-cost.mjs`, `scene-frame.mjs`:
   replace the hardcoded `const REPO = "/Users/Hassoonie/…"` with
   `process.env.REPO_DIR || <derive from import.meta.url>`. Strictly Phase-1 needs only
   `engine-ledger.mjs` + the plan-path reads, but fixing all four removes the "works on my machine"
   landmine for good.

## Data flow (one tool call)

```
Client (URL + Bearer token)
  → Railway HTTPS
    → mcp-http.mjs → mcp-auth (401 on bad token)
      → MCP SDK routes tools/call
        → handler in mcp-tools.mjs
          → spawns a validated engine script (e.g. video-engine.mjs --brief <tmp> for engine_plan)
            OR reads/writes Supabase (engine_status / engine_verdict)
        → returns text result over the HTTP/SSE response
```

## "Works across all brands proficiently" (explicit requirement)

- `engine_plan` / `create_from_request` read `sieve/brands/<B>/…` and `sieve/products/<B>/…`; these
  are **bundled into the image**, so all brands are available server-side.
- Add **`scripts/smoke-brands.mjs`**: iterate every registered brand, dry-run a minimal valid brief
  per brand, assert it routes + validates with **no path error and no crash**. Run it in the Docker
  build (fail the build if any brand breaks) and expose it as a local `npm run smoke`.
- Verify `Brand Context/assets/<Brand>/` is **not gitignored** and lands in the image (asset paths
  are resolved by `resolveAsset`); if any brand asset is ignored, add it or document the gap.

## Security

- The endpoint writes to the shared ledger now and will spend money in Phase 2 → **bearer token is
  mandatory**. Token lives in `MCP_AUTH_TOKEN` (Railway env), never in the repo.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `MODELARK_API_KEY`, `GEMINI_API_KEY`, DB URLs) are Railway
  env vars; entrypoint writes `.env` at container start (ephemeral, not baked into image layers).
- Require the token regardless of Origin; do not rely on CORS as the gate.

## Error handling

- Auth fail → **401**, no tool exposure.
- Tool handler error → returned as MCP `isError` content (existing pattern); server never crashes.
- Supabase offline → existing never-throw helpers return `[]`/warn; tools degrade gracefully.
- **Fail fast at boot**: entrypoint checks the required env vars are present; if any are missing it
  logs exactly which and exits non-zero rather than serving broken tools.

## Testing

- **Local HTTP**: run `mcp-http.mjs` on localhost; a small JSON-RPC harness does `initialize`,
  `tools/list`, and `tools/call engine_brands` with the token (mirrors the `mcp-toolcheck` harness
  already used this session). Assert 401 without the token.
- **Brand smoke**: `scripts/smoke-brands.mjs` green across all brands.
- **Deploy**: after Railway is connected, `tools/list` over the public URL with the token; confirm a
  push to the deploy branch redeploys and the change is live with no local pull.

## Out of scope (Phase 2, separate spec)

Hosted generation (`engine_generate`, `scene_frame`), ffmpeg/whisper in the image, Supabase Storage
upload of generated clips + returned URLs, long-running-job handling over HTTP.

## Operator setup runbook (one-time, ~10 min, dashboard clicks)

1. Railway → **New Project → Deploy from GitHub repo** → select this repo + deploy branch.
2. **Variables** — paste (same values as `.env`): `MODELARK_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DIRECT_URL`, `DATABASE_URL`, `GEMINI_API_KEY`, and a new
   `MCP_AUTH_TOKEN=<long random string>`. (`OPENAI_API_KEY`, `REPLICATE_API_TOKEN` optional in P1.)
3. Deploy → copy the public HTTPS URL Railway assigns.
4. Send the URL back → you get the exact client-config block to paste (URL + Authorization header).

## Development approach (per operator)

Build with a **Claude + Codex hive mind** (`hivemind` skill): Codex (GPT-5.x CLI) authors the
backend server/transport/Docker/Railway pieces, Claude reviews adversarially and authors the
integration + synthesis. A **parallel Codex feature-debate thread** analyzes/debates new
video+image-gen features (its own track, not part of this spec) and feeds proposals back for triage.
