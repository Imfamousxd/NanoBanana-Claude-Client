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

**Row corrections queued (2026-09-16, not yet applied):**
- Sour Apple (edibles): assets fine but no solid single (device-only) render exists — verify in the future when more renders arrive.
- AZ004 / NJ003 "Classic Flavor Line, infused" (Mates Metal Cans): the Vanilla Cookies renders assigned there are Muha Mates assets, not the Classic line → add a wall between the Classic line and Mates renders (Classic ≠ Mates), then rebuild the pages with `engine/skus/render-map-page.mjs` and republish both URLs.
