# Handoff — 2026-09-14/15 · Content-engine MCP, learning loop, and the DAM

Everything below is on disk and on branch `dam-worker` (pushed to GitHub; Railway deploys from it).
Paths are repo-relative. This file is the durable context for the next session; the memory files
`~/.claude/projects/.../memory/project_dam_content_intelligence.md` and
`project_content_engine_mcp.md` point here.

---

## 0. Where things stand (read this first)

| Piece | State |
|---|---|
| Content-engine MCP (`engine/mcp/`) | Live. stdio server, 20+ tools incl. every `dam_*` tool. `.mcp.json` / `.cursor/mcp.json` wired. |
| Learning loop | Live. Every run → prompt log; verdicts → `knowledge/learnings/<brand>.json` (laws / exemplars); approved images copied into `Brand Context/assets/<Brand>/approved/`. |
| Asset catalog + gallery | Live. `npm run assets:gallery`, `assets_search`, reference-coverage artifact published. |
| DAM (`engine/dam/`) | Live on Railway + local. 68,701 Dropbox files discovered, 26k probed, ~330 analysed (paid samples only). Hybrid search proven on categories 1–2; review continues at category 3. |
| Railway service `dam-worker` | Deployed from GitHub. **Was crash-looping every ~30 s with no log output** — diagnostics shipped in commit `af8925f`; see §4. |
| Paid analysis of everything | NOT started. `DAM_APPROVED` is intentionally unset on Railway. Full Muha pass ≈ $120 est. — needs the user's explicit go. |
| Money spent so far | ≈ $0.73 across four samples (`muha-v1` 49, `cross-v2` 114, `pdf-v1` 14, `muha-packaging-v1` 100). `dam.spend` ledger is the truth: `npm run dam -- stats`. |

---

## 1. What the user asked for (verbatim intent, in order)

1. Turn the repo into an **active MCP with self-improving capabilities**: learn from positive and
   negative verdicts, save every approved image into the knowledge graph (always growing),
   differentiate by brand (Muha Meds, NuLumin, Noble Harbor, Dialed Health, Dialed Labs, Dialed
   Moods), and give everyone an easy way into each brand's reference assets.
2. A table view of reference assets per brand to pinpoint what's missing (artifact published).
3. A **live, externally hosted DAM** watching the team Dropbox (all current + inbound), reviewing every
   image/video, classifying (product refs, product labels, renders, marketing material, edited content,
   UGC, photoshoot, lifestyle, product shots…), using real human UGC to improve generated UGC, tied
   in with the content-gen MCP, to be merged later with the videogen MCP (dialed-studio), future-proof.
   **"the old dam functionality was very bad … you will need to build this from scratch."**
4. Credentials come from Railway (Railway CLI linked).
5. Host on Railway; **paid passes on a small sample first**, prove semantic search, then review **all
   Muha Meds org content**; effective search both for content-gen and for humans retrieving assets.
6. Verify digestion is live and consistent; verify search quality **category by category, one at a
   time**, the user judges each.
7. Review feedback so far: brand/product-name search support; **a brand in the query means only that
   brand's assets appear**; **if an asset isn't a perfect match, leave it out**; category 2 must show
   the **label PDFs**, not renders; expand the sample; a video must never be labelled as a still class.

Standing constraints: never print secrets; every billable call needs explicit approval (small samples
were approved; nothing else is); `DAM_APPROVED` stays unset on Railway until the user says go.

---

## 2. Architecture map (what lives where)

### Engine / MCP / learning
- `engine/mcp/server.mjs` — stdio server (console.log → stderr), resources `content://brands`,
  `content://learnings/{brand}`, prompt `content-task`. `engine/mcp/tools.mjs` — tool table
  (`brand_*`, `assets_*`, `knowledge_*`, `context_pack` (DAM-aware), `prompt_log*`, `feedback_record`,
  `laws_*`, `learning_stats`, `job_*`, `doctor`) + `createDamTools`.
- `engine/learning/` — `prompt-log.mjs` (JSONL under `.content-engine/prompt-log/<brand>/`),
  `store.mjs` (`upsertLaw`, Jaccard fold ≥ 0.5), `feedback.mjs` (approved → exemplar + tracked copy
  ≤ 2048 px + `approved-output` registry; rejected → law), `laws.mjs`, `context.mjs`
  (`buildContextPack`, `buildContextPackWithDam`, `renderPromptBlock`).
- `engine/assets/catalog.mjs` / `gallery.mjs`; `engine/knowledge/indexer.mjs` (per-record chunking,
  INDEXER_VERSION 2); `engine/pipeline.mjs` logs every run; `engine/cli.mjs` (mcp, context, learn,
  assets, dam).
- Docs: `docs/MCP.md`, `docs/SELF_IMPROVEMENT.md`, `docs/DAM.md`, `deploy/dam/README.md`.
- Tests: `test/learning.test.mjs`, `test/mcp.test.mjs`, `test/dam.test.mjs` (all green; the full
  suite has 2 pre-existing unrelated failures).

### DAM (`engine/dam/`)
| File | Role |
|---|---|
| `taxonomy.mjs` | Two-level taxonomy (class + subclass), reference roles, video forms, Gemini response schemas, `validateAnalysis` (subclass snapping, role gating, **video never a still class** via `stillToVideo`). |
| `schema.sql` | Postgres `dam.*` — sources, assets (pgvector 768-d, tsvector), video_analysis, shots, jobs (SKIP LOCKED `claim_jobs(worker, limit, kinds[], source_prefix)`), spend, ugc_profiles, kg_links, workers. |
| `config.mjs` | 21 Dropbox scopes, `EXCLUDE_PATH_PATTERNS`, `pickDatabaseUrl` (prefers pooler **6543**), `storageUrlFor`, `damConfig`, `estimateUsd`. |
| `dropbox.mjs` | Refresh-token client, 90 s longpoll, `Dropbox-API-Path-Root` / `Select-User`, `headerJson` \u-escaping, thumbnails, temp links. |
| `probe.mjs` / `measure.mjs` | sharp / ffprobe / ffmpeg measurement, perceptual hash, dominant colours, keyframes, contact sheets, PDF page-1 render (`pdftoppm` on Linux, `sips` on macOS). |
| `providers/{vision,transcribe,embed}.mjs` | Gemini 2.5 Flash vision (responseSchema), whisper-1, gemini-embedding-2 (text + visual). |
| `analyze.mjs` | Brand cards, image/video prompts, `composeSearchDoc`, `analyzeVideoLight` for oversize videos. |
| `db.mjs` | `DamDb` (pool `DAM_PG_POOL` ‖ 5), batched upserts, claims, saves, spend, heartbeat, stats. |
| `worker.mjs` | `DamWorker`: discover → `probeRemote` (Dropbox thumbnail + media_info) → analyze (paid) → embed (paid); `runQueue`, `watch` (longpoll per source). **Unapproved worker now claims only `discover`/`probe`.** |
| `search.mjs` | `parseQuery` (brand/product aliases, class words, forms, orientation, people…), `searchAssets` (lexical + vector RRF, relaxed pass never relaxes brand, precision cutoff: vector-only needs sim ≥ 0.45, score ≥ 25 % of top), `similarAssets`. |
| `ugc-profile.mjs` / `kg-bridge.mjs` | Real-creator profile (requires speech), DAM → knowledge-graph sync, `applyVerdictToDam`. |
| `serve.mjs` + `ui.html` | Password-protected search UI/API (`/healthz`, `/api/search`, `/api/products`, `/api/asset/:id`, `/proxy/*`). |
| `cli.mjs` | `init-db, sources, register-defaults, scan, work, watch, serve, search, asset, similar, stats, status, eval, profile, sync-kg, verdict, reanalyze, import-env`. |
| `mcp-tools.mjs` | `dam_search, dam_asset, dam_similar, dam_stats, dam_products, dam_status, dam_eval, dam_ugc_profile, dam_sync_knowledge, dam_verdict, dam_scan, dam_work`. |

### Infra
- **Supabase** project `hiqefhtlfmcpbyypensf` (same DB as the engine ledger / ERP). **Always the
  transaction pooler, port 6543** — the session pooler caps at 15 clients and the workers exhausted it.
  Storage bucket `dam-proxies` (no file-size limit).
- **Railway** project `content-engine-dam`, service `dam-worker`
  (id `9823cb57-a649-4c25-9e42-861ec688214e`), Hobby plan (8 GB RAM limit), GitHub source branch
  `dam-worker`, `RAILWAY_DOCKERFILE_PATH=deploy/dam/Dockerfile`, `PORT=8787`, volume `/data`,
  `DAM_CONCURRENCY=6`, `DAM_MAX_VIDEO_MB=1500`, `DAM_SPEND_CAP_USD=25`.
  URL: https://dam-worker-production.up.railway.app (UI password is in Railway var `DAM_UI_PASSWORD`).
  Railway CLI is linked; `railway logs -d <deploymentId> --json` gives structured logs;
  `railway variables --json` lists vars (never print the values). SSH key is registered but
  `railway ssh` still answers "Permission denied" — unresolved, not needed.
- Local: `.env` holds the same keys (`npm run dam -- import-env` pulls DROPBOX_* from Railway).
  Local search UI: `PORT=8790 node engine/cli.mjs dam serve` → http://localhost:8790/?q=…

---

## 3. Review progress (category by category, user judges each)

| # | Category | Query used | Verdict |
|---|---|---|---|
| 1 | Product refs / renders (Muha) | `muha <product> render` etc. | "much better, obv not seeing all but for sample size its good" — after brand lock + product names + precision cutoff. |
| 2 | Product labels / packaging PDFs (Muha) | `muha product label artwork or packaging design` | "much better" — returns Metallica bag, Cherry Grapefruit box, Grape Sherbalato dieline, Gush Mintz display box. Only 2 of 100 sample files were actually analysed (see §5) — finish the sample before calling this done. |
| 3 | Logos | — | **next** |
| 4 | Marketing stills | — | pending |
| 5 | Edited / marketing video | — | pending |
| 6 | UGC (real creators) | — | pending; needs MEDIA Team video analysis approved |
| 7 | Photoshoot / product photos | — | pending |
| 8 | Lifestyle | — | pending |
| 9 | Raw footage | — | pending |

Method per category: `npm run dam -- search "<brand> <words>" --vectors --limit 8`, open the same
query in the UI, show the user, act on the verdict. Eval set `engine/dam/eval-queries.json` scores
19/20 (`npm run dam -- eval`).

---

## 4. The Railway crash (open — diagnostics shipped, cause not yet confirmed)

**Symptom.** Deployment `10885056` (commit `0345c59`) is SUCCESS and `/healthz` answers, but the
container restarts every 2–110 s. Logs show only `Mounting volume … listening on :8787 …` and then
the next mount. No stack trace, no "Killed", nothing. Memory metrics: max 0.32 GB of an 8 GB limit;
CPU ≈ 0.1 vCPU — **not** OOM. Every Railway container died mid-probe (`dam.jobs` shows 158 probe
jobs stuck `running` under six dead worker ids; `requeueStale(45)` frees them after 45 min).

**Ruled out.** OOM (metrics), a JS exception (would print), a paid-stage error (parked jobs are
logged), the volume (0 GB used), the port (healthz OK).

**Suspects.** A native crash (SIGSEGV in `sharp`/libvips on linux-x64 inside the slim image) or a
platform signal. Both are silent under an exec-form `CMD`.

**Shipped in `af8925f`** (deploy in flight when this file was written):
- `deploy/dam/start.sh` wraps node and prints `node exited with status N` or `killed by signal N`
  (137 = SIGKILL, 139 = SIGSEGV). `Dockerfile` CMD and `railway.toml` startCommand use it.
- `installCrashReporting()` in `engine/dam/cli.mjs` (watch command): logs uncaughtException,
  unhandledRejection, SIGTERM/SIGINT/SIGHUP, and rss/uptime on `exit`; warns when rss > 1.5 GB.
- Unapproved worker claims only `discover`/`probe` (see §5).
- `EXCLUDE_PATH_PATTERNS` now skips stock 3D texture / HDRI libraries (`Archmodels`, `/textures/`),
  which is where the queue currently sits ("3D files/Gym/textures1/Archmodels v169/…").

**Next step.** `railway deployment list` → take the newest id → `railway logs -d <id> --json` and
read the `[dam start]` / `[dam] exit code` lines. If it says signal 11, pin sharp's platform package
or move perceptual-hash/colour work off the hosted worker (probe remotely without sharp, let the
Mac do hashes). If it says signal 9 with low rss, it's the platform — open a Railway ticket with the
deployment id.

---

## 5. The packaging sample (open — one command away)

100 Muha label/packaging files are flagged `flags.sample = 'muha-packaging-v1'` (82 PDF, 17 PNG).
All 100 probed; only 2 analysed. Cause: the **unapproved Railway worker claimed the sample's
priority-1 analyze jobs and parked them for an hour** ("Paid analysis is locked"), so the local
`--approve` run found nothing to do. Fixed in `af8925f`; the parked jobs still need un-parking.

Run (≈ $0.45 — 98 image analyses + embeds; the user asked for this sample to be expanded):

```bash
node --input-type=module -e "
import { loadEnv } from './engine/core/env.mjs'; import { DamDb } from './engine/dam/db.mjs'; import { damConfig } from './engine/dam/config.mjs';
loadEnv(process.cwd()); const db = new DamDb(damConfig(process.cwd()).databaseUrl);
await db.query(\"update dam.jobs j set priority=1, run_after=now(), attempts=0, error=null from dam.assets a where a.id=j.asset_id and a.flags->>'sample'='muha-packaging-v1' and j.status='pending'\"); await db.end();"
DAM_CONCURRENCY=3 node engine/cli.mjs dam work --once --kinds analyze --approve --max 120
DAM_CONCURRENCY=4 node engine/cli.mjs dam work --once --kinds embed --approve --max 120
npm run dam -- search "muha product label artwork or packaging design" --vectors --limit 20
```

Then re-show category 2 to the user and move to category 3 (logos).

---

## 6. Remaining plan

1. Confirm the crash cause from the new deploy's logs; fix; confirm the worker stays up ≥ 30 min
   (`/healthz` → one worker id, `dam.jobs` probe count rising).
2. Finish the packaging sample (§5); re-judge category 2.
3. Categories 3–9, per brand, one at a time (§3).
4. Real UGC coverage: approve analysis of the `dropbox:media:*` video sources
   (`node engine/cli.mjs dam work --once --approve --source dropbox:media --kinds analyze,embed`),
   then `npm run dam -- profile --compute` and `npm run dam -- sync-kg`.
5. Full Muha pass when the user says go: set `DAM_APPROVED=1` on Railway (or run locally with
   `--approve --source dropbox:muha`), raise `DAM_SPEND_CAP_USD`; ≈ $120 est.
6. Merge plan with the videogen MCP (dialed-studio) — not started; the DAM's `dam_search` /
   `dam_ugc_profile` are the intended shared surface.

---

## 7. Gotchas learned (so nobody re-learns them)

- Supabase session pooler (5432) = 15 clients max → use 6543. Pool size 5 per process.
- `String.replace` eats `$$` / `${…}` in SQL patches — use perl/sed or a function replacer.
- Dropbox paths with emoji break `fetch` headers unless \u-escaped (`headerJson`).
- Dropbox longpoll must be ≤ 90 s or Node's fetch times out first.
- Railway: `.dockerignore` must re-include `deploy/**`; `VOLUME` is unsupported in the Dockerfile;
  set `RAILWAY_DOCKERFILE_PATH` or Railpack builds instead; `.railwayignore` is gitignore-style with
  `/*` + re-includes; `deploy/` was gitignored until `!/deploy/` was added.
- A video labelled with a still class (product-ref / logo) is always wrong → `stillToVideo` snap.
- UGC profile must require speech, or shadowboxing B-roll pollutes it.
- Search: caller-supplied `undefined` filters must not erase parsed ones; brand is never relaxed;
  results below 25 % of the top score are dropped (user: "if it isn't a perfect match, leave it out").
