# Onboarding a collaborator — image gen, video gen, DAM and Higgsfield as MCP tools

This gives a second person the same toolset Mario uses: the **content-engine MCP** (image generation,
the Dropbox DAM, the reviewed Muha catalog), the **dialed-studio MCP** (video generation, hosted), and
**Higgsfield** (CLI + MCP connector). Nothing in this file is a secret; every value below is a placeholder
that the owner sends separately through a password manager or a one-time link, never chat or email.

## 1. content-engine MCP (this repo) — image gen + DAM

1. Install Node 20+ and clone the repo, branch `dam-worker`:
   `git clone https://github.com/Imfamousxd/NanoBanana-Claude-Client.git && cd NanoBanana-Claude-Client && git checkout dam-worker && npm install`
2. Copy `.env.example` to `.env` and fill in (owner provides what is marked *owner*):
   - `DATABASE_URL` — Supabase Postgres, **transaction pooler on port 6543** (*owner*; read/write to `dam.*`).
   - `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_PATH_ROOT_NAMESPACE_ID`, `DROPBOX_SELECT_USER`, `DROPBOX_ROOT_PATH` (*owner*)
     and `DROPBOX_REFRESH_TOKEN` — **the collaborator's own** (run the app's OAuth flow once with their Dropbox login; the owner's token is never shared).
   - `OPENAI_API_KEY` (gpt-image-2 / gpt-image-1), `GEMINI_API_KEY` (Nano Banana + the vision pass), `REPLICATE_API_TOKEN` and `MODELARK_API_KEY` (Seedance) — their own keys or the team's, owner's call.
3. `npm run doctor` must pass, then `npm run check`.
4. Register the MCP. Claude Code picks up the repo's `.mcp.json` automatically when the repo is the working directory; to add it globally:
   `claude mcp add content-engine -- node /path/to/NanoBanana-Claude-Client/engine/mcp/server.mjs`
   Cursor: `.cursor/mcp.json` in the repo does the same.
5. Smoke test in the client: `brand_list`, `dam_stats`, `dam_catalog {brand: "muha", line: "MI 2G Distillate"}`,
   `dam_product_refs {brand: "muha", product: "MI 2G Distillate Disposables Blue Slushie", intent: "packaging hero"}`.

Workflow (see `AGENTS.md` and `docs/MCP.md`): `brand_get` → `context_pack` → `job_create` (style preset + product; the
catalog supplies the references) → `job_plan` → a human sets `execution.approved: true` → `job_run` → `feedback_record`.
Product names come from `dam_catalog` (state-prefixed: "CA 1G Distillate Disposables"); a generation or design tag can be
named in the intent ("gen 3", "Tech Design June 2025").

## 2. dialed-studio MCP — video gen (hosted on Railway, no install)

- URL: `https://dialed-studio-mcp-production-7266.up.railway.app/mcp` (Streamable HTTP, bearer token — *owner* issues a token per person).
- Claude Code: `claude mcp add --transport http dialed-studio https://dialed-studio-mcp-production-7266.up.railway.app/mcp --header "Authorization: Bearer <TOKEN>"`
- Tools worth knowing: `create_from_request` (brief in → validated plan), `engine_plan`, `engine_verdict` (record approved/rejected),
  `reference_breakdown` (a reference video → measured cut list), `studio_references`, `studio_asset_pull`, `higgsfield_connection`,
  `studio_review` / `studio_visual_review`. Generation runs through Higgsfield (Seedance, Kling, Veo) from inside the studio.
- Product references for a video: call `dam_studio_refs` on the content-engine MCP first; it returns
  `[{path, name, role, describe, contains_person, third_party_marks}]` ready for `create_from_request.refs`.
- Source: `Hassoonie/NanoBanana-Client`, default branch `gen-image` (contributor notes in its `CONTRIBUTING.md`).

## 3. Higgsfield — CLI and MCP connector

- **Seat:** the owner adds the collaborator to the Higgsfield workspace (or they use their own account and credits).
- **CLI:** install the `higgsfield` CLI (Node 20), then `higgsfield login`; `higgsfield model list --json` lists models.
  Models that earned their place: `nano_banana_pro` (stills, 2 cr), `gpt_image_2` (type/lockups, 6.5 cr),
  `seedance_2_0` (9:16 1080p 5 s = 45 cr; start + end + identity refs), `kling3_0` (`--mode pro`, 10 cr), `veo3_1`.
  **Cap: 4 concurrent jobs** — queue, do not fan out (`Muha Magnetic Reveal/queue.py` is a working runner). Download `result_url`, not `min_result_url`.
- **MCP connector:** in Claude (claude.ai → Settings → Connectors) add **Higgsfield** and authenticate; the tools appear as
  `higgsfield.generate_image`, `generate_video`, `generate_audio`, `jobs_wait`, `show_generation_by_ids`, presets and workflows.
  Follow the connector's instructions: `get_preset_instructions` before a named recipe, `get_workflow_instructions` before multi-step videos.

## 4. Rules that travel with the tools

- Every billable call needs a human's `execution.approved: true` (engine jobs) or an explicit go (studio / Higgsfield credits).
- Never invent product facts or claims; exact copy is composed deterministically, never generated.
- Product references come from the DAM catalog, never from browsing folders by hand; a polished render can still fail for label drift.
- Secrets never go into prompts, manifests, logs, chat or git. `.env` is git-ignored.

## 5. What the owner sends the collaborator (separately, never in chat)

| Item | Where it lives for the owner |
|---|---|
| Supabase `DATABASE_URL` (pooler 6543) | Railway `dam-worker` variables / owner's `.env` |
| Dropbox app key + secret, namespace id, select-user id, root path | Railway `dam-worker` variables / owner's `.env` |
| dialed-studio bearer token (issue one per person) | Railway `dialed-studio` service variables |
| Higgsfield workspace invite | Higgsfield workspace settings |
| Provider keys if not their own (OpenAI, Gemini, Replicate, ModelArk) | owner's `.env` |
