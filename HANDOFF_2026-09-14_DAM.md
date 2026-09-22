# Handoff — 2026-09-14/15 · Content-engine MCP, learning loop, and the DAM

Everything below is on disk and on branch `dam-worker` (pushed to GitHub; Railway deploys from it).
Paths are repo-relative. This file is the durable context for the next session; the memory files
`~/.claude/projects/.../memory/project_dam_content_intelligence.md` and
`project_content_engine_mcp.md` point here.

---

## 0. Where things stand (read this first)

**Priority as of 2026-09-15 (user's words):** the two things that work and matter are (1) the refactored
content-gen system and (2) the DAM's ability to pull **every product render / product asset for every
product of each brand** in the Dropbox, current and inbound. **All other categories are not a priority.**
The user is meeting the person who runs the Dropbox; until then, build the product-render
infrastructure generically. §8 is that work. §3 (category review) and §5 are parked.

| Piece | State |
|---|---|
| Content-engine MCP (`engine/mcp/`) | Live. stdio server, 20+ tools incl. every `dam_*` tool. `.mcp.json` / `.cursor/mcp.json` wired. |
| Learning loop | Live. Every run → prompt log; verdicts → `knowledge/learnings/<brand>.json` (laws / exemplars); approved images copied into `Brand Context/assets/<Brand>/approved/`. |
| Asset catalog + gallery | Live. `npm run assets:gallery`, `assets_search`, reference-coverage artifact published. |
| DAM (`engine/dam/`) | Live on Railway + local. 68,701 Dropbox files discovered, ~28k probed, ~475 analysed (paid samples only). Hybrid search proven on categories 1–3. **Product-render directory live (§8): 8,665 render candidates flagged across 4 brands, 152 Muha product groups, ≈ $16.45 to analyse them all.** |
| Railway service `dam-worker` | Deployed from GitHub. Was restart-looping with no log output until 2026-09-15 04:05 UTC; stable since (one worker id, probes flowing). Exit diagnostics now in place — see §4. |
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

## 4. The Railway restart loop (closed 2026-09-15 — worker stable; exact trigger unproven)

**Symptom.** Deployment `10885056` (commit `0345c59`) showed SUCCESS and answered `/healthz`, but
the container restarted every 2–110 s. Its 159 log lines were only mounts, "listening", and 120
`parked analyze …: Paid analysis is locked` lines — no stack trace, no signal. Memory peaked at
0.32 GB of 8 GB, CPU ≈ 0.1 vCPU (not OOM). Railway never finished a single probe; 158 probe jobs
were left `running` under six dead worker ids (`requeueStale(45)` frees them).

**What shipped (`af8925f`, then `7221a5a`, `9e1d315`):**
- `deploy/dam/start.sh` wraps node and prints `node exited with status N` or
  `killed by signal N` (137 = SIGKILL, 139 = SIGSEGV). `Dockerfile` CMD and `railway.toml`
  startCommand use it; node runs with `--unhandled-rejections=warn`.
- `installCrashReporting()` in `engine/dam/cli.mjs` (watch): logs uncaughtException,
  unhandledRejection, SIGTERM/SIGINT/SIGHUP, and rss/uptime on exit; warns when rss > 1.5 GB.
- An unapproved worker claims only `discover`/`probe` (it used to claim every paid job it saw and
  park it for an hour — see §5).
- `EXCLUDE_PATH_PATTERNS` skips stock 3D texture / HDRI libraries (`Archmodels`, `/textures/`).

**Result.** From the first deploy with these changes (04:05 UTC) the container has run
continuously: one worker id per deployment, 1,346 probes completed in its first 10 minutes, no
`[dam start]` exit line, no crash-handler output, through a further redeploy. The only behaviour
that changed for the hosted worker is that it no longer touches paid jobs, so that is the working
theory; it is not proven. **If it ever restarts again, the first log line to read is
`[dam start] node exited with status …` / `killed by signal …`** — signal 11 means a native
crash in sharp/libvips (move hashing off the hosted worker); signal 9 with low rss means the
platform (ticket with the deployment id).

Railway access notes: `railway logs -d <deploymentId> --json` (deployment ids from
`railway deployment list --json`); a push to `dam-worker` supersedes any build in progress
(the superseded one shows REMOVED — that is not a crash). Memory/CPU come from the GraphQL
`metrics` query (token in `~/.railway/config.json`, never print it). `railway ssh` is set up
(key registered, `Host dam-worker` block in `~/.ssh/config`) but the server still answers
"Permission denied" — unresolved, not needed.

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

## 8. Product renders first — the infrastructure built 2026-09-15 (`engine/dam/product-refs.mjs`)

**Idea.** The Dropbox already organises renders by folder ("Renders/<Category>/<Market>/<Line>/…",
"Approved Renders/Renders/CA/…", "Website Assets/…/Product Renders/…"). That structure is free and
available the moment a file is discovered, so the product directory is built from the path first and
enriched by the paid vision pass second.

| Piece | Where | State |
|---|---|---|
| Candidate rule | `isRenderCandidate`, `renderPathFacts` (root, approved, discontinued, market, category, line, version) | done, unit-tested |
| Flag + prioritise | `flagRenderCandidates` → `flags.candidate='product-ref'`, `flags.render`, `flags.brand_hint`; probe priority 1; analyze/embed priority 0 + `payload.auto` | done; **run 2026-09-15: 8,665 flagged** (muha 5,461 · dialed-moods 2,027 · dialed-labs 778 · dialed-health 399) |
| Discovery hook | worker `discover` flags candidates as they are found; `enqueuePaid` keeps them first | done, deployed |
| Auto-intake | `DAM_AUTO_PRODUCT_REFS=1` lets an unapproved worker run paid stages **only** for auto-tagged jobs under `DAM_AUTO_CAP_USD` (default 3/day); SQL `claim_jobs(..., p_auto_only)` | done; **not enabled on Railway** (spend needs the user's go) |
| Directory | `productDirectory` → brand → category/line: files, analysed, markets, vision product names, best files (id/thumb/alpha/roles), missing (transparent, canonical), registry gaps | done: CLI `dam products`, MCP `dam_product_directory`, `/api/directory`, UI **Products** button |
| Pricing | `dam candidates` / `dam_render_candidates` → per-brand toAnalyse + USD (`$0.0019` per image) | done |
| Content-gen tie-in | `context_pack` → `damContext` searches product-ref roles; `sync-kg` writes `damCandidates` into `knowledge/products/<brand>.json` | existing; run `sync-kg` after the paid pass |

**The paid pass — COMPLETE 2026-09-16 ~18:25 PT.** 8,657 of 8,671 render candidates analysed and 8,656
embedded (searchable); 9 failed (five 90–240 MB freezer-wrap print files over the 80 MB image cap, two
HEIC phone photos, two truncated-JSON retries); real cost **$16.42** for the pass. The total grew from
8,665 to 8,671 during the run: auto-intake on Railway picked up new NY disposable renders as they were
uploaded and analysed them. Library after the pass (analysed product-render files): Muha 5,357 · Dialed
Moods 2,059 · Dialed Labs 767 · NuLumin 322 · Dialed Health 81. Registries re-synced with a capped
best-per-product shortlist (150 per brand; `kg-bridge` no longer mirrors the whole library — a first
uncapped sync bloated `muha-meds.json` to 3.6 MB and was reverted).

**Storage bug found and fixed (`5acbeca`, `91fb58a`):** `ProxyStore.put` used to flip the whole worker
to local-disk mode after one failed upload, so ~22k thumbnails were kept on disk (Mac and the Railway
volume). Fixed (409 = object exists; other failures fall back per file only). `dam repair-proxies` ran
on the Mac: 3,062 rewritten to existing cloud objects, 16,134 uploaded, 33 failed; 4,097 remain on the
Railway volume → `POST /api/admin/repair-proxies` (password-protected) on the hosted server repairs
those; it was triggered after the deploy (check `dam.assets where proxies->>'thumb' not like 'https%'`
should be ~0).

*(Earlier text kept for history:)* APPROVED and RUNNING since 2026-09-15 ~16:00 PT. User: "lets get analysis going to
where we're processing all potential assets". Scope: every flagged render candidate, all four brands
(8,665 files). Runs on the Mac (`dam work --once --kinds analyze,embed --approve --auto-only`,
concurrency 12, `DAM_WORK_DIR=/tmp/dam-work`, cap 30, log in the session scratchpad
`render-pass.log`) **and** on Railway (`DAM_AUTO_PRODUCT_REFS=1`, `DAM_AUTO_CAP_USD=30` set
2026-09-15). Throughput ≈ 47 analyses/min after the sliding-pool fix (`bd629cf`); real cost
≈ $0.0015/file → ≈ $13 total. Progress: `select count(*) from dam.assets where flags->>'candidate'='product-ref' and status in ('analyzed','embedded')`.
Every analysis in this pass records **angle** and **composition** (device-only / packaging-only /
device-with-packaging / multi-pack / label-flat / lineup / in-hand / in-scene) — added to the schema
before launch (`75c5eaf`). The ~475 sample analyses from before lack them (folder-name hints cover most).

**Product reference kit (`engine/dam/product-context.mjs`, `a36eac3`).** The end goal: a user names a
product and the content they want, and the content-gen MCP retrieves the right references itself.
`resolveProductReferences(brand, product, intent)` → identity (canonical look: packaging + device for
Muha, the container for Dialed / NuLumin) · device (device / can / vial alone) · packaging · one best
file per angle · transparent cutout · flat label · lineup · avoid (discontinued / outdated / rejected),
plus `recommended` (2–4 picks driven by the intent words) and `coverage.missing`. Ranking: team
verdict > approved folder > not discontinued > quality > version > canonical role > resolution > alpha.
Product matching: vision product string > folder line/leaf > file name / title, with registry aliases.
Surfaces: `context_pack` (a "Product references (DAM)" block per product the brief names),
MCP `dam_product_refs`, CLI `dam refs "<product>" --brand <b> --intent "<what>"`.

**Estimates as presented before approval:** Estimated from the price table (real spend has run ≈ 40 % above
estimate on samples):

| Scope | Files | Est. USD |
|---|---|---|
| Muha "Approved Renders" folder only | 852 | ≈ 1.6 |
| All Muha render candidates | 5,455 | ≈ 10.4 |
| All four brands | 8,659 | ≈ 16.5 |

Commands are in `docs/DAM.md` → "Product renders first". After it runs: `dam products --brand muha`,
then `dam sync-kg --brand muha`, then judge in the UI (Products → click a line → its renders).

**Known limits.** The product *line* comes from folder names, so a flat folder of 400 files shows as
one group until analysis adds product names. Registry products are thin (Muha registry lists 3
products); the vision product string + folder line is the working product key. Duplicate renders
(2,622 exact dupes) are skipped automatically.

**Questions for the Dropbox owner (to refine the rule after the meeting).**
1. Is "DAM 2, Muha THC = Asset Receiving/Approved Renders" the canonical render set, and who approves into it?
2. Which folder holds the *current* render per product line when v1/v2/v3 coexist — is the highest version always current?
3. Are "Discontinued", "Old Versions", "CA catalog resized" to be shown (as history) or hidden?
4. Market folders (CA/MI/NY/NM/MO/NJ/OH): are packaging differences real per market, or just where the file was requested from?
5. Naming: is there a SKU or flavour naming convention we can parse from file names (e.g. "OG_Magnetic_Dispo_Front_b_<SKU>Front.png")?
6. Where do inbound renders land first (a drop folder?) so auto-intake watches the right place.

## 9. Image generation — presets, automatic references, learned rules (built 2026-09-16, commits `3c6d547`, `860f030`)

User's ask: "make sure image gen side is working really well and outputting all different styles of
content we would request at the highest quality; better than a personal ChatGPT account."

**Audit findings (engine/, before):** DAM references were never used at generation time; laws /
exemplars / context never entered the compiled prompt; no style presets; candidates were plain
re-rolls; gpt-image-2 quality:high unenforced against the 60 s cap; transparent errored instead of
routing to gpt-image-1; brand promptProfile empty for 4 of 7 brands.

**Built:** `engine/prompts/presets.mjs` (13 styles × 9 channels), `engine/learning/auto-refs.mjs`
(DAM kit → job assets, proxies cached in `.content-engine/refs/`), compiler enrichment (STYLE,
RULES LEARNED FROM PAST REJECTIONS, APPROVED BEFORE, REFERENCE COVERAGE), named variations (one
provider call per hypothesis), `content new` / `job_create` / `presets`, transparent → gpt-image-1,
gpt-image-2 → quality medium + socket retry. Tests green (61 pass; the 2 failures are pre-existing).

**Proven free:** six jobs created and planned OK with library references attached —
`jobs/test-dm-inhand.json`, `test-dm-ad.json` (with copy + logo-canon), `test-nul-packshot.json`,
`test-dh-cutout.json` (gpt-image-1 transparent), `test-muha-box.json`, `test-muha-hero.json`
(Muha kits are thin until the render pass reaches the Muha folders).

**Kits after the pass:** Blueberry Muffin → Magnetic device alone + 2G cart with box; Orange Tangie
disposable → NY Melted Diamonds device + CA boxed + group shot; Gush Mintz jar / live resin dispo resolve
to their lines (line words in the product name AND the intent count). Grape Sherbalato has no render in
the library (only a 2023 NicProof dieline) — a real gap for the Dropbox owner.

**Not yet run (billable, ≈ $2–3 for 17 images):** set `execution.approved: true` in each and
`npm run content -- run jobs/<id>.json`, then `review` and `learn record`. The user has not yet
said go.

**Still open on the image side:** brand promptProfile for muha / dialed-* (only nulumin has one);
deterministic QR / text plates are unwired (`engine/formats/meme-card.mjs` orphaned); no upscaling
(gpt-image-2 native sizes are enough for social).

## 10. Video-gen MCP (dialed-studio) — merge seam

Repo: `Hassoonie/NanoBanana-Client` branch `gen-image` (MCP 2.31 source; PR #9 merged; live hosted
MCP reports 2.31 at https://dialed-studio-mcp-production-7266.up.railway.app/mcp). GitHub access works
as Imfamousxd. Shallow clone in the session scratchpad `dialed-studio/`.

Findings: the studio has its own file-name-label asset index (`asset-library/render-index.json`,
8,713 records, labels "source_path_only", not visually confirmed) and pulls Dropbox bytes itself
(`studio_asset_pull`). Refs contract for briefs: `[{path, name, role, describe, contains_person,
third_party_marks}]`, local paths only for video briefs; `image_generate` accepts https URLs (≤ 6).
No plugin point. Release = PR to `release/mcp-2.31-mario`; `gen-image` auto-deploys; 76 suites +
104-file check + tool-catalog fingerprint parity.

**Decision: seam A — we hand the studio references in its own shape; zero studio changes; video
quality untouched.** `exportForStudio(kit)` in `engine/dam/product-context.mjs` emits that array.
Next: an MCP tool `dam_studio_refs` (kit → files materialised → studio refs JSON) and, when the
hosted studio gets Dropbox creds, pass Dropbox paths instead of local files.

## 11. SKU books → Dropbox render-folder plan (2026-09-16, commit `8127f05`)

User's ask: dedicated Renders folders per brand, organised identically, named by customer-facing names
and tied to SKU codes, so the MCP pulls a SKU's renders on request. Built: `engine/skus/sheets.mjs`
(parses both sheet layouts), `engine/skus/import.mjs` (`content skus import --brand <b> <csv…>` →
`knowledge/skus/<brand>.json`), `engine/skus/coverage.mjs` (`content skus coverage` → every SKU item ↔
renders, unmatched folders). Results: Muha 122 lines / 976 items / 243 codes / 8 markets, 722 items
have ≥1 render, 111 render folders match no SKU (Hemp line, Moods, Mavricks, Madness, MI pods…);
Dialed Moods 36 lines / 159 items / 84 codes, 124 covered. Plan: `docs/DROPBOX_RENDERS_PLAN.md` and the
artifact https://claude.ai/artifact/HJiQHosnhK9mydGJRh75bW (structure: Brand/Renders/Category/Market/
"Line [code]"/"Flavour [SKU]"/01 device·02 packaging·03 display·04 cutout·05 label·_old; _Inbox; _Discontinued).
Awaiting Mario: confirm names/codes for the unlisted lines (§4 of the doc), then phase 1 = generate the
move map (current path → target path) for review; nothing moves before sign-off.

## 12. SKU ↔ render review loop (2026-09-16 late; context exhausted here)

Pages the user reviews row by row: Muha https://claude.ai/artifact/VXkMCb125E5QQHD2L8HnAM · Dialed Moods
https://claude.ai/artifact/GBxYLbmqn5mSvo79LaHCzP (every assigned render as a thumbnail that opens the
file in Dropbox; "no SKU row" table per brand at the bottom). Plan page: https://claude.ai/artifact/HJiQHosnhK9mydGJRh75bW.
Builder: `engine/skus/render-map-page.mjs` (run from the repo root; reads the session's
`render-library.json` export — re-export with the query in this handoff §11 if the scratchpad is gone) →
writes `sku-render-map-<brand>.html` into the scratchpad; republish with the URLs above.
Matching rules live in `engine/skus/coverage.mjs` `scoreMatch` and were tightened from the user's
corrections: vape form / category walls, format (1G≠2G≠1.68G), market, device generation, extract type
(melted diamond / live resin / hash rosin / distillate / THCA / D8 / D10 / HHC / THCP), exact flavour words,
longer flavour wins (Strawberry Lemon ≠ Strawberry), lineups and generic files (badges, master case, website,
mockups matched to 3+ flavours) never attach to a flavour, line-specific folders (Moods, Mavricks, Cookies,
Madness, Magnetic, Dual) only serve their line. Coverage now: Muha 661/1,165 items, 3,065 renders attached;
Dialed 116/159, 899. Remaining known doubt: "GummiesTin_Mockup_V2/V3" attach to Strawberry gummies rows on
the model's read only. Decision from the user: NO codes in Dropbox names; codes as Dropbox tags + registry.
Waiting on the user: more row corrections; names/handling for the "no SKU row" folders; "run the six".

## 6. Remaining plan

1. Let the render pass finish (check progress; restart the local run if it died: same command as §8). Then `dam sync-kg` per brand.
2. Walk the user through the kit logic (they asked to clarify it after the pass) and judge `dam refs` on real products: Muha device-only vs packaging vs display box; Dialed angles.
3. Re-analyse the ~475 pre-pass sample assets so they carry angle/composition (`dam reanalyze`, ≈ $0.70).
4. Auto-intake is ON on Railway (cap $30/day) — inbound renders are analysed as they land.
4. (parked) finish the packaging sample (§5) and categories 3–9 (§3).
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

**Row corrections applied 2026-09-16 night (all in `engine/skus/coverage.mjs`, pages rebuilt, artifacts republished — Muha v8, Dialed v6):**
- Device iterations: a folder naming an older device (`…_All in One_Sept2024`, incl. its `oldVersion/`) is its own device category (`deviceIterationOf`). Its renders never attach to a current-device SKU row; they appear in the "no SKU row" table as `<Category / Line> / All in One (Sept 2024)` (77 files: CA Distillate 40, CA Live Resin 10, CA Melted Diamonds 10, MI Live Resin 9, MI Melted Diamond 8). User's words: Pineapple Express 1g distillate had "a different device … these will be in a separate category". Pineapple Express CA093 now = the 4 TechDesign June 2025 renders only. Side effect: Bubble Gum Burst CA026 has no current-device render (its 4 were the old AIO device).
- Folders marked `WRONG - …` (NY 2G Distillate 2026, NY 1G LR 2026, NY 1G MD 2026 — 68 files) are quarantined (`quarantined`): never attach to any row (they had leaked into 13 NY rows).
- `RedesignTest` folders (Pre-Rolls V1/V2 shots, Edibles Icons Variations) are generic mockups: never attach. This is the "Vanilla Cookies on the Classic Flavor Line are Muha Mates assets" fix (AZ004/NJ003 Vanilla Cookies → 0 renders; also removed the same shots from NM034 Vanilla Cookies and every Raspberry Pineapple gummies row).
- Pre-roll forms are walls (`PREROLL_FORMS`): a Mates/metal-can line never takes King & Queen joints, Muharillos, Donuts or Madness renders, and vice versa.
- Sour Apple (edibles): kept; no solid single (device-only) render exists — verify when more renders arrive.
- Coverage now: Muha 658/1,165 items, 2,949 renders attached; Dialed 116/159, 899. `unmatchedKey()` is shared by coverage and the page builder.

- Line folders are symmetric now (`LINE_FOLDERS`, Muha only): a line that names Cookies / Dual / Magnetic / Mavricks / Moods / Madness only takes renders from that folder or renders whose own text names it (user: "blue slushie cookie collab has some of the 1G Distillate Disposables assets in there"). Cookies-collab Blue Slushie/Habibi rows (CA027, MI020) are the 4 MMxCookies renders each; the Dual line only has Dual renders; plain MI 2G rows lost the Dual/Cookies/Magnetic strays. Folder test is on directory segments with `_` as a separator (the old `\b` test missed `Dual_Flavor`), and "Mango Madness" in a file name is not the Madness line.
- Side effect to ask the user about: `Renders/Disposables/MI/MI_Hash Rosin/MI_05G_Hash_Rosin_TechDesign_June2025` (20 renders + 2 group shots) is not branded Mavricks (vision reads "All-In-One Hash Rosin"), so it left the Mavricks rows (MI023) and sits in the "no SKU row" table as "Disposables / MI_Hash Rosin". Is it the Mavricks SKU or a separate 0.5G line?
- Dialed: the old Moods folder rule silently blocked every Dialed render under folders named "Dialed Moods …" (space) — 195 renders. Rule is Muha-only now; Dialed went 116 → 120 items, 899 → 1,094 renders (Kratom Gummies flavours went from 1 render to 13–17 each). Pages: Muha v9, Dialed v7.
- Coverage now: Muha 657/1,165, 2,903 renders; Dialed 120/159, 1,094.

- Packaging design iterations (user: "1G Distillate Carts … 2 different packaging designs for Cherry Grapefruit, the ones that don't have the tech design should be moved"): `designGroups()` groups sibling folders of one product (same format + strength words, same line directory), ranks them by the date in the folder name (Q1/Month/Year; "Tech" breaks ties; explicit old/archive folders always rank lowest; an undated folder is a previous design only when its name is the dated folder's name without the date); the newest is the current design. `selectHits()` keeps previous-design renders only when an item has no current render at all, and the page marks those with a dashed red "previous design" frame. Previous designs that serve nothing sit in the bottom table as "<group> / previous design: <folder>" → _old. Current-design picks the user may want to override: MI 2G Distillate → `MI_2G_Distillate_Jan2026` (over TechDesign June 2025), Hemp THCA carts → `THCA 2G - 2026` (over Oct 2024), Hemp 3.5g dispos → `3.5 Disposables - Aug 2025`, MO carts/dispos/concentrates → NOV 2025, MI/CA Mavricks → Aug 2024, Dialed Kava → March 2026, Energy Seltzer → March 2026.
- Pods vs kits (user: "pod flavors blue glacier … same asset used for pod battery combination kit … shouldn't be in pod flavors"): a line that says kit/combination only takes renders whose file name/title says battery kit / combo kit; Pod Flavors takes the `MI 2G Vape Pod` renders (which had never matched: the pods wall and the `\bpod`/`\blr\b`/`\bmd\b`/`\bhr\b`/`\bcan\b` line words were tested on glued text where `\b` cannot match — walls and line words are now tested on the word-split text too). Edibles wall no longer rejects gummy jars.
- `SKU_DEBUG=1` prints why a render was refused for an item (every wall has a reason).
- Coverage now: Muha 665/1,165, 2,774 renders; Dialed 119/159, 1,022 (seltzer-can "Shot4" camera shots no longer sit on Kava/Kratom Shots rows). Pages: Muha v10, Dialed v8.

- Mates (user: "mates metal cans good but don't name the single joint 'device', they're single joint assets; different packaging styles for Purple Punch need different categories, like glass jars"): `compositionLabel(composition, category)` names pre-roll compositions "single joint" / "joint with packaging" (edibles: "loose product" / "product with packaging") on the page; `PACK_STYLES` is a wall — a Metal Cans line never takes glass-jar, mylar or tube renders and vice versa (bare joints/gummies name no style and pass). Glass-jar renders now sit in the bottom table as "Pre-Rolls / Glass Jars" (91 + 18 old) = their own category. Designer working folders (`_BRAND PROJECTS`, `Graphic Designer General SOP`) are "working file: …" — used only when the Renders tree has nothing, flagged like a previous design. `designStem` splits letters/digits so "July2025" is a date (CA Mates June 2024 is now the previous can design).
- Rows emptied by the style wall, correctly: MO007 Mates Muha Reserve Metal Cans (Muha OG, Presidential OG — their renders are glass jars/tubes), MO011/MO010 mylar gummies (renders are tins or Strawberry Lemon). HEMP019 4ct mylar gummies keep 1 (the 15ct jar renders are jars).
- Coverage now: Muha 660/1,165, 2,742 renders; Dialed 119/159, 948. Pages: Muha v11, Dialed v9.

- Greenhouse / Dank Darts (user: "greenhouse 1g blue dream: the packaging has 3 flavours so it isn't Blue Dream; these look like Muha Madness pre-rolls"; "20ct dank darts: Skywalker OG assets are Muharillos, Blue Dream is the Madness Dialed Pack"): line-folder detection now splits camel-case directory names (`MuhaMadness` → Muha Madness; `MMxCookies` → cookies), so Madness renders only serve a Madness line (the CA book has none → bottom table "Pre-Rolls / MuhaMadness", 29 files, needs its own line/category). New pre-roll forms `greenhouse` and `dank darts` (a Dank Darts line never takes Muharillos / Madness / King & Queen). A render whose product string or printed text names ≥3 distinct book flavours is a multi-flavour pack and never one flavour (`multiFlavourPack`, cached per render — the uncached version made a Muha run take >10 min). `indexRegistry()` is shared with the page builder so the page applies the same "longer flavour wins" rule as the coverage file. Greenhouse Joint (CA) is now 0/8 and Dank Darts 0/6: no renders exist for them.
- Coverage now: Muha 657/1,165, 2,738 renders; Dialed 119/159, 940. Pages: Muha v12, Dialed v10. A Muha coverage run takes ~100 s.

- **NEW WORKFLOW (2026-09-16 evening) — review by folder, not by SKU row.** User: "going through this manually 1 by 1 is ridiculously inefficient … ensure we are only scoped within the renders folder in muha meds". Every correction so far was really about a folder, so `engine/skus/folder-map.mjs` (`npm run content -- skus folders --brand muha --library <render-library.json> --page <out.html>`) groups the library by design folder (328 folders / 5,308 files under `Renders/` only — the 54 files in `Edgar Gutierrez/_BRAND PROJECTS` and `Design/Graphic Designer General SOP` are out of scope now, `inScope()` in coverage.mjs), writes `knowledge/skus/folder-map.muha.json` (per folder: files, market, status, lines fed with flavours, plain-words proposal, decision) and builds the **folder review page** https://claude.ai/artifact/FH7q8j7yPvit5eQdfvAbdR (artifact with the `db` capability; one row per folder, 4 thumbnails, proposal, buttons Correct / Wrong line… / Old design / Not a product + note; each click is saved to the artifact database `decisions/<folderId>`; "All correct in this group" per parent folder; folders that feed SKU rows sort first). To apply the clicks: `Artifact read_db url=… db_op=list collection=decisions out_dir=<dir>` then `skus folders --brand muha --library … --decisions <dir> --page …` (merges into the map; `indexFolderMap()` makes decisions beat every heuristic: `line` locks a folder to one SKU line, `old`/`skip` take it off all rows, `ok` confirms), then `skus coverage` and `node engine/skus/render-map-page.mjs` and republish. New inbound folders appear as undecided rows on the next build. `computeCoverage` now also returns `assignments` (asset → lines/items) for this.

- Whole-folder checks on the folder review page (user: "you only show 4 files in each row … can we be certain … are you able to verify by actually looking at the image"): every file is compared with its folder-mates two ways — (1) label words the vision model read (families strength / device / size / packaging; a file that reads "1g" in a folder that reads "2g" is flagged), (2) visual embedding distance to the folder's centroid (pgvector `avg(embedding_visual)`, flag when > max(0.09, median + 0.05); typical distances p50 0.03 / p97 0.07). Exceptions are shown per row with a red dashed frame and the reason; folders with none say "Checked all N files". Honest limits: this proves files match their folder-mates, not that the folder is the right SKU (that is the click), and a subtle design change that reads the same and looks nearly the same can pass. A paid "same product?" vision pass (≈ $8–10 for 5,308 files) is the next step if the user wants certainty per file.

- Names (user, 2026-09-16 evening): (1) every book line's display name carries the state (`name` field in the registries, `lineName()` in coverage.mjs; import.mjs sets it): "CA 1G Distillate Disposables". (2) Same-titled lines in one state are told apart (`nameLines()` in folder-map.mjs, run by `skus folders`, writes the registry): the book's generation and the classification words of the folder that feeds the line ("NM 1G Distillate Carts (OLD)" / "(2026)", "NM 1G Distillate Disposables (Gen 3 · 2026)"), V2 codes → "V2", else book order "older"/"newer"; exact sheet duplicates (same flavours + codes) are dropped (OH 1G Distillate Carts, OH oh002). (3) User: "look at the dropbox folder names, some have classifications like june 2024 or tech design, we want to pass these names on as the name for as much context as possible" → `designTagOf(folderName, line)` keeps the folder's own words that the line name does not already say ("Tech Design June 2025", "All in One Sept 2024", "OLD", "New Device Nov 2024", "Gen 3 AIO"); stored per folder as `designTag` in folder-map.muha.json and shown as a green pill on the folder page. NEXT integration step: carry `designTag` + line `name` into the DAM product kit (engine/dam/product-context.mjs) so the content-gen MCP names products "CA 1G Distillate Disposables · Tech Design June 2025".

- 2026-09-16 late (folder review corrections, all applied): (1) **Device generations** for Muha disposables — Nov 2024 = Gen 2, June 2025 = Gen 3, earlier = Gen 1 (`deviceGenerationOf` in coverage.mjs: explicit "Gen N" in a folder wins, else the folder date; applies to distillate, hash rosin, live resin, melted diamond; Dual / Magnetic / Moods / Mavricks / pods never get one). Design groups for disposables span the whole tree per state + size + strength; every folder of the newest generation is current ("Tech Design June 2025" and "Jan 2026" are both Gen 3), older generations are "previous generation (Gen N)". The generation is prefixed to the folder's design tag ("Gen 3 · Tech Design June 2025"). (2) **Same-product merges** in the registry (folder-map.mjs `mergeProducts` + `nameLines`): lines whose titles differ only by generic words (MI "2G Distillate Disposables" + "2G Disposable Flavors" ×2 → one line, 30 flavours), and same-titled lines fed by the same folder or with no renders of their own (NJ 2G ×2, NM 2G nm006→nm001, HEMP THCA carts V2→base with `altSkus`, OH 2G ×2, MI Hash Rosin Mates ×2). Only lines fed by different folders keep old/new tags: NM 1G Carts (OLD)/(2026), NM 1G Disposables (Gen 2)/(Gen 3 · 2026), NY 2G Disposables (Gen 2 Device)/(Gen 3). (3) **Line ids are unique** (import.mjs suffixes a reused block code; CA ca024-2, three Dialed ids). (4) **Cannabinoid wall** judges the file's own words (file name, vision product/title, leaf folder) before the parent folder — the "D8 D10 HHC" parent no longer lets D8 files feed the Delta-10 and HHC lines; Hemp audit: 0 cross-cannabinoid leaks. (5) Design tags keep short codes whole ("D8 Display", not "D Display"). (6) Folder status is the majority of its files. Muha now 633/1,131 items, 2,750 renders. Pages: folder review v6, Muha map v15, Dialed map v13. The user has started clicking on the folder page (at least one "Not a product" with a note on the D8 Display row that was really feedback about the tag — re-check that row's verdict when applying decisions).

**2026-09-17 — the user reviewed ALL 328 folders on the folder page** (325 Yes, 2 Not a product, 1 Old design). Decisions were read back (`Artifact read_db … collection=decisions out_dir=…/decisions`) and merged (`skus folders --decisions`), so `folder-map.muha.json` now carries every decision; a `line` decision now bypasses the structural walls for that line (`locked` in scoreMatch) and un-demotes a previous-design folder. The page now shows **likely matches in the book** for the 96 product folders that feed no line (35 have candidates: same state + category, no strength contradiction, evidence = flavours found in the folder, same kind/size) with one-click "Assign to …" buttons. **User notes from the review (to act on):**
  - [skip] `Accessories/Product Displays/Mates Duo`: these arent acessporites these should be under the other mate duos.
  - [ok] `Ai Resources`: the one appears to be flavor badge, it can be classified as such, maybe even by flvor badge name.
  - [skip] `Apparel/MM`: im seeing multiple merch pieces here, they should seperated by their apparel, like one is the varsity jaked and the other is a woman romper
  - [ok] `CA catalog resized/Hash Rosin Concentrates 1G`: the file that looked different passes
  - [ok] `Catalyst`: should be classified as catalyst prerolls so they can be associated with pre rolls too if needed.
  - [ok] `Concentrates/CA/CA_HR_Concentrates_June2025_Tech`: these should be in a specific folder under CA as hash rosin
  - [ok] `Device/All Devices`: lets also get duo and magnetic device in here, copy them dont just move them.
  - [ok] `Device/Mock Up`: thiss mock up appear to be for the duo, should also be  in there.
  - [ok] `Disposables/MI/MI Magnetic_Dispo`: t
  - [ok] `Edibles/MI Gummies/HR_Gummies_Only`: the tag shouldnt be only it hshould be (Gummy Only)
  - [ok] `Edibles/RedesignTest`: the one u say is different is renders for specific icons
  - [ok] `HOTKNIFES/pen_box`: one of the ones that say device with packaging had just packaging, review the images here so they are named correctly
  - [ok] `Hemp/Cartridges/D8 D10 HHC`: these should also be classified as group or lineup under this category
  - [ok] `Hemp/Cartridges/D8 D10 HHC/DisplayBox/D10 Display`: shouldnt be D Display should be D10 Display
  - [ok] `Hemp/Cartridges/D8 D10 HHC/DisplayBox/D8 Display`: shouldnt be D Display should be D8 Display
  - [ok] `Hemp/Cartridges/THCA - Oct 2024`: the 2 files should be in a subfolder here called master case
  - [ok] `Hemp/Cartridges/THCP + HHC 2G - 2026`: move the 1g to  the correct spot, they are also specifc too orange creamsicle
  - [ok] `Hemp/Pre Rolls/Glass Jar`: these are kief infused and should be classified as such
  - [ok] `MMxCookies/MMxCookies MMlogo Reversed`: the images are of devices and should be classified as such.
  - [old] `Master Case Group Shots`: 
  - [ok] `Mavricks`: the 2 that look different are single device only renders
  - [ok] `Moods`: the one that looks different is a device only render of white walker
  - [ok] `Moods/Device2/Logo2`: these look like renders and should be classified as such
  - [ok] `Moods/Device2/Updated`: these look like renders and should be classified as such
  - [ok] `Motion/MI Mambas Flying Gummies Stills`: some of the shots say device with packaging but they are shots of gummies, review all content here and classify them correctly.
  - [ok] `Multi Product Group Shots/MI`: these shots are for specifcally the gummies, they should also be there as group shots. and honestly should only be there since these arent multi product.
  - [ok] `Pre-Rolls/Glass Jars`: these re of muh mtes and should be classified as such. the 2 that look different 1 is a single join shot, another is  a marketing graphic of muha og flavor
  - [ok] `Pre-Rolls/KiefJoint`: im only seeing single joint renders here and cant confirm if this is truly correct.
  - [ok] `Pre-Rolls/Metal Can/MI/MI_HashRosin Mates`: the one u see different is just the single joint render.

- 2026-09-18: the reviewer's notes are now a durable rules file `knowledge/skus/folder-rules.muha.json` (per folder: `kind` = what it is when the book has no line, `tag` override, `outliersOk`, per-file `compositions`/`angles` globs, `moveTo`/`copyTo`/`copyNote` for the Dropbox plan). The builder applies it (kind and plan lines on the folder page, accepted exceptions shown as confirmed). `scratchpad/apply-rules-db.mjs` (copy it into engine/skus if it is needed again) wrote the composition/angle overrides into `dam.assets.analysis` (24 assets: hot-knife "Box" files → packaging-only, Mambas OpenBag_Main → loose gummies, EndGummies/TopRotate → product with packaging, End0023 packaging only, End0122 lineup) with `analysis.review = {source, was}`; the render library export was refreshed (8,678 rows; 5,316 Muha in scope). Judgement calls made from the actual pictures: the "MMlogo Reversed" files are the gold coin logo with a bite mark, not devices (user's note said devices — flagged to them). Not yet done from the notes: the Dropbox moves/copies (recorded as plan lines), naming flavour badges per flavour, splitting Apparel/MM per garment.

- 2026-09-22 — **the reviewed Muha state is now what the MCPs resolve against.** `engine/skus/catalog.mjs` builds `knowledge/skus/catalog.muha.json` (139 lines, 633 flavours with renders, 2,758 renders on lines, 103 category groups) from the registry + folder map (decisions, rules, design tags, generations) + the matcher; `npm run content -- skus catalog --brand muha --library <render-library.json>`. `resolveProductReferences` (used by `dam_product_refs`, `dam_studio_refs`, `context_pack`, image-gen auto refs) consults the catalog first (`catalogLookup`: flavour + line words + state + gen), uses current-design renders (previous only when nothing current, flagged), and returns `result.catalog` {line, market, generation, flavour, sku, alternatives}; kit items carry `designTag`, `generation`, `current`. New MCP tool `dam_catalog` lists the catalog. Verified: "MI 2G Distillate Disposables Blue Slushie" → the MI line, Gen 3 Jan 2026 / Tech Design June 2025 renders; "Pineapple Express" + intent "CA gen 3" → CA 1G Distillate Disposables CA093; `dam studio-refs` exports the video MCP refs shape with the design tag in `describe`. Video side: Hassoonie/NanoBanana-Client default branch is `gen-image`; PR #9 merged 2026-09-15; latest commits add Higgsfield Seedance video generation (09-18) and editor releases (09-20) — nothing on that side reads this repo's files; the seam stays `dam_studio_refs` → `create_from_request.refs`. Rebuild order after any review change: `skus folders --decisions` → `skus coverage` → `skus catalog` → commit (Railway redeploys the DAM). Repo check: 62 pass, 2 pre-existing failures unrelated (nulumin/reference dir; nulumin_trust_card_v2.py).

**Still waiting on the user:** more row corrections; names/handling for the "no SKU row" folders (now also: what to call the Sept-2024 All-in-One device category, and whether the WRONG folders get deleted or moved to `_old`); "run the six".
