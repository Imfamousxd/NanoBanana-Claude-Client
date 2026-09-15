# Deploying the DAM worker

One long-running service. It longpolls every registered Dropbox folder, and drains the job queue
(probe → analyze → embed) with the spend guard on.

## Railway

1. Project `content-engine-dam`, service `dam-worker` (created 2026-09-14 with the CLI). Set `RAILWAY_DOCKERFILE_PATH=deploy/dam/Dockerfile` on the service — without it Railway's Railpack ignores the Dockerfile. `railway up --detach --ci` from the repo root deploys; `.railwayignore` limits the upload to what the Dockerfile copies.
2. Attach a volume at `/data` (fetched originals and proxies are staged there; nothing needs to survive a redeploy).
3. Environment variables:

| Variable | Purpose |
| --- | --- |
| `DAM_DATABASE_URL` | Postgres with pgvector. Use the Supabase **transaction-mode pooler (port 6543)**: session mode caps at 15 clients shared by every worker, the UI and the MCP. Defaults to `DATABASE_URL` when it is the 6543 URL |
| `DAM_PG_POOL` | Connections per process (default 5) |
| `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN` | Dropbox app with `files.metadata.read` + `files.content.read`; refresh-token flow so it never expires |
| `DROPBOX_PATH_ROOT_NAMESPACE_ID` | Only for team spaces (the legacy DAM needed it) |
| `GEMINI_API_KEY` | Vision + embeddings (default provider) |
| `OPENAI_API_KEY` | Transcription (whisper-1); optional vision alternative |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Proxy storage bucket `dam-proxies` (thumbs, contact sheets, previews) |
| `DAM_APPROVED=1` | Unlocks the paid stages. Leave unset to index for free and park analysis |
| `DAM_SPEND_CAP_USD` | Rolling 24h cap on paid calls (default 25) |
| `DAM_CONCURRENCY` | Parallel jobs (default 2; each video job holds one ffmpeg + one model call) |
| `DAM_VISION_MODEL`, `DAM_EMBED_MODEL`, `DAM_TRANSCRIBE_MODEL` | Model overrides; changing one is followed by `dam reanalyze` |

4. First boot: `npm run content -- dam init-db` once from a laptop (creates `dam.*`), then the service
   registers the default brand folders and does a full discover of each.

## Cost shape (estimates used by the spend ledger)

| Stage | Per asset |
| --- | --- |
| probe, proxies, dedupe | free |
| image analysis (Gemini 2.5 Flash) | ~$0.0015 |
| video analysis (contact sheet read) | ~$0.006 + transcription ~$0.006/min |
| embeddings (text + visual) | ~$0.0004 |

Ten thousand images and one thousand five-minute videos land near $60. The cap parks jobs instead
of dropping them, so a low cap simply makes the backlog drain over more days.
