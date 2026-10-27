# DAM — the content-intelligence layer

The DAM watches the team's Dropbox, understands every image and video in it, and turns that
understanding into three things the content engine uses: **references** (what a product, logo or
approved look actually is), **real-creator UGC intelligence** (what human content for this brand
measurably does), and **search that finds what a person means**. It is built in this repository,
shares the content-engine MCP server, and writes into the same Supabase project as the generation
ledger so the two systems tie in directly.

## Why the previous DAM did not work

The legacy DAM (`Dialed DAM`, Python) embedded a single 80–400 character Gemini caption per file
from one image or four keyframes, then searched that caption. It had no taxonomy, no product
identification against the brand's known products, no visual embedding, no OCR, no video
measurement, and a per-brand table split. A query like "vertical UGC of someone actually opening the
box" had nothing to land on, because nothing recorded framing, capture, structure or whether the
person was real. This build fixes the input side first: the index is only as good as what it knows.

## What the DAM knows per asset

| Layer | Source | Examples |
| --- | --- | --- |
| Technical | sharp / ffprobe, free | dimensions, orientation, alpha, duration, fps, audio, perceptual hash, dominant colours |
| Measured (video) | ffmpeg arithmetic, free | scene cuts, shot rhythm, EBU R128 loudness, motion energy and jitter, camera read |
| Transcript | whisper-1 | verbatim text with timed segments → words, articulation rate, hook end, pauses |
| Read | vision model, structured JSON | class, brand, product (against the registry list), scene, people, on-screen text verbatim, style, capture behaviour, structure (hook, beats, CTA, reveal), performance, audio, usability flags, reference roles, tags |
| Retrieval document | composed | everything above in plain words — what the embeddings index and what a person reads |
| Embeddings | Gemini Embedding 2 | one for the document (text) and one for the picture (visual, multimodal) |
| Proxies | Supabase Storage | thumbnail, model image, contact sheet, keyframes, 720p preview |

The vocabulary is in `engine/dam/taxonomy.mjs` and is two-level, in the studio's own words:

| Class | Subclasses |
| --- | --- |
| `product-ref` | render-3d, device-render, packaging-render, packshot-photo, cutout-transparent, label-art, dieline, product-mockup, swatch-or-badge |
| `logo` | primary-logo, wordmark, lockup, icon, seal-or-badge, co-brand-lockup |
| `marketing-still` | social-post, story-or-reel-cover, ad-static, flyer-or-poster, banner-or-web-hero, email-graphic, carousel-slide, menu-or-price-sheet, infographic, presentation-slide, signage-or-tradeshow |
| `marketing-video` (edited content) | promo-edit, product-clip, montage, motion-graphics, launch-film, ad-cut, animated-post, tutorial-or-explainer, event-recap |
| `ugc-video` | talking-head, unboxing, testimonial, review, street-interview, podcast-clip, grwm-or-routine, vlog, challenge-or-trend, reaction |
| `ugc-still` | selfie-with-product, hand-held-product, mirror-shot, casual-lifestyle |
| `lifestyle-photo` (photoshoots) | photoshoot-product, photoshoot-model, photoshoot-flat-lay, lifestyle-scene, event-photo, team-or-bts, location-or-venue |
| `raw-footage` | b-roll, interview-raw, event-raw, drone, screen-recording, takes-or-outtakes |
| `packaging-collateral` | print-ready, label-print, insert-or-card, box-art, sticker-or-decal, merch-art |
| `document`, `screenshot`, `meme`, `other` | … |

Plus reference roles (`canonical`, `shape`, `style`, `logo`, `ugc-exemplar`, `layout-exemplar`,
`approved-output`, `avoid`) and, on every record, whether it is a render or a photograph. Every class
answers "what can this file do for a brief?"; every subclass is a word someone on the team would type.

## Pipeline

```
Dropbox longpoll ──► discover ──► probe ──► analyze ──► embed ──► (ugc-profile, link-kg)
      free            free        free      paid        paid           free
```

- `discover` walks a source (full, or from its cursor) and upserts `dam.assets`; new or changed
  files queue a probe. Deletions are tombstoned.
- `probe` is free and download-free for Dropbox: dimensions and duration come from Dropbox's own
  media metadata, the perceptual hash, colours and thumbnail from Dropbox's 1024px preview, and
  Dropbox's content hash stands in for sha256. Exact duplicates are skipped and near-duplicates
  flagged. Local sources are probed from the file itself. The original is fetched once, at analyze
  time, measured fully then, and deleted after embedding.
- `analyze` builds the prompt with the brand roster and the folder brand's product list, sends the
  model image (stills) or the contact sheet + measurements + transcript (video), validates the record
  against the taxonomy, composes the retrieval document, and stores the full record. Videos over the
  download cap take the **light** path: keyframes are pulled from the Dropbox temporary link with
  ranged seeks (megabytes, not gigabytes), the model reads the contact sheet, and the record is marked
  `analysis_depth: light` so a higher cap can upgrade it later.
- `embed` writes the document and visual embeddings.
- `ugc-profile` aggregates every real-human `ugc-video` per brand into bands and counted patterns,
  and distills six-field laws (`engine/dam/ugc-profile.mjs`).
- `link-kg` pushes confident product hits into `knowledge/products/<brand>.json` as `damCandidates`
  and the UGC profile into `knowledge/learnings/<brand>.json` as laws and real-creator exemplars.

Jobs live in `dam.jobs` (Postgres, `SKIP LOCKED`). Paid stages run only with `DAM_APPROVED=1` /
`--approve` and under the rolling 24h cap (`DAM_SPEND_CAP_USD`); otherwise they are parked, not lost.
Every paid call is a row in `dam.spend`.

## The library as discovered on 2026-09-14

| Brand | Files | Videos | Size |
| --- | --- | --- | --- |
| Muha Meds | 33,587 | 1,373 | 1.7 TB |
| Dialed Moods | 17,673 | 3,822 | 1.3 TB |
| Dialed Health | 10,516 | 5,249 | 2.6 TB |
| Dialed Labs | 6,882 | 2,257 | 2.6 TB |

Sources: the `/2025 Full Ops` brand trees, `/MEDIA Team/<Brand>` (the live upload library),
`/2026 FINAL CONTENT` (finished creator video) and `/Dialed Health Event Content`. No NuLumin or
Noble Harbor folders exist in this Dropbox yet. Files over the video cap (`DAM_MAX_VIDEO_MB`, default
600) keep their remote probe (thumbnail, hash, dimensions) but are skipped by analysis.

## Search

`dam_search` / `npm run content -- dam search "…"` runs three retrievers and fuses them:

1. **Query understanding** (deterministic, free): brand and product aliases from the knowledge graph,
   class words, orientation, people, transparency, duration, "real human".
2. **Lexical** over a weighted tsvector: title and product first, OCR text and tags second, summary,
   then the full document and the path.
3. **Vector**: the query embedding against the document embedding and, because the embedding model
   is multimodal, against the visual embedding too.

Reciprocal-rank fusion, then optional LLM rerank over the retrieval documents (`--rerank`). Every hit
carries `why` (which retriever, rank, similarity, rerank note). `dam_similar` finds visual siblings.

## Search UI

`npm run content -- dam serve` (and the hosted worker on `$PORT`) serves a search page: plain-language
query, brand/type/shape/real-people filters, optional AI rerank, thumbnails and previews, an asset
drawer with the full read, transcript, on-image text and visually similar files, and approve/reject
buttons that feed the same verdict path as `dam_verdict`. Protect it with `DAM_UI_PASSWORD`.

**Service keys (2026-10-27).** Another service — the hosted dialed-studio MCP (`studio_library_search` /
`studio_library_pull`) — gets its OWN credential instead of the people's password: set `DAM_MCP_KEYS`
on dam-worker to one or more comma-separated random keys (≥ 24 chars; `openssl rand -hex 32`) and give
that value to the other service as `DAM_KEY`. A service key is read-only: GET on the read API only,
never `/api/admin`, never a verdict POST. Rotate by adding the new key, switching the client, then
removing the old one.

## Tie-in with generation

- `context_pack` (MCP and CLI) now appends a **DAM section**: canonical-grade references from the
  library for the products in the brief, real creator videos to imitate, and the measured UGC profile
  with its laws. When the database is unreachable the section is simply absent.
- `dam_ugc_profile` is the read a UGC brief starts from: bands (duration, articulation, hook, shots,
  loudness), dominant framing, hook type, setting, camera behaviour and recurring reality cues.
- `dam_verdict` / `feedback_record` flow human calls back into the index (`verdict`, roles,
  `do_not_use`), so approved truth ranks first and rejected files never get passed as references.
- The videogen MCP (`dialed-studio`) reads the same six-field law shape; `dam.ugc_profiles.laws`
  can be merged into its `house_laws` bank, and its `reference_breakdown` and this DAM's `measured`
  block describe a clip with the same numbers.

## Future-proofing

- Every model output is stored raw (`analysis`, `video_analysis.read`) with `analyzer` provenance
  (`schema_version`, provider, model). A better model is `dam reanalyze --older-than-version N`, a
  queue of jobs, not a migration.
- Providers sit behind three functions (`analyzeImages`, `transcribeAudio`, `embed`); Gemini and
  OpenAI are implemented, a third is a file.
- The taxonomy is data. Adding a class or a role bumps `ANALYSIS_SCHEMA_VERSION`.
- Sources are pluggable: `local` folders run the identical pipeline on a laptop or an external drive,
  which is how the backfill and the tests work without cloud credentials.

## Commands

```
npm run content -- dam init-db
npm run content -- dam register-defaults                # the known Dropbox brand roots
npm run content -- dam add-source local:refs --local "Brand Context/assets" --brand nulumin
npm run content -- dam scan                              # discover + queue probes (free)
npm run content -- dam work --once --kinds probe         # free stages
npm run content -- dam work --once --approve             # paid stages, under the cap
npm run content -- dam work --once --approve --source dropbox:final-2026   # paid stages for one source family first
npm run content -- dam search "real muha creator opening the box, vertical"
npm run content -- dam profile --brand muha --compute
npm run content -- dam sync-kg --brand muha
npm run content -- dam stats
```

Hosting: `deploy/dam/README.md`.

## Product renders first (2026-09-15)

Product renders and product assets — every product of every brand, current and inbound — are the DAM's
first job. Everything else in the taxonomy still gets classified when a file is analysed, but nothing
else is prioritised or paid for by default.

**How it works** (`engine/dam/product-refs.mjs`)

- A file inside a render tree — a folder segment named `Renders`, `Approved Renders`, `Product Renders`,
  `Product Photos`, `Packshots`, `Cutouts`, `Transparent`, `SKU Images`, `White BG …` — is a
  *product-ref candidate* (`flags.candidate = "product-ref"`), unless it sits under textures, 3D scene
  files, thumbnails, icons, logos or lifestyle/UGC folders. The path is parsed into facts
  (`flags.render`): category, market (CA/MI/NY/…), product line, approved / discontinued, version.
- Candidates are flagged at discovery, probed first (priority 1), and their analyze / embed jobs carry
  priority 0 and the tag `payload.auto = "product-ref"`.
- **Auto-intake.** With `DAM_AUTO_PRODUCT_REFS=1` a worker that is *not* globally approved still runs
  the paid stages for auto-tagged jobs, under its own daily cap `DAM_AUTO_CAP_USD` (default 3). That is
  how new renders dropped into the Dropbox get understood within minutes without unlocking the
  whole library. Leave it unset until the user approves the spend.
- **Directory.** `npm run dam -- products [--brand muha] [--since 2026-09-01] [--json]` /
  `dam_product_directory` / `/api/directory` / the **Products** button in the UI: for each brand and
  product line, files, analysed, markets, the product names the vision model saw, the best files to
  pass as references (id, thumb, alpha, roles), what is missing (no transparent cutout, no canonical),
  and registry products with no render at all. It works from the folder names before any paid pass.
- **Candidates and cost.** `npm run dam -- candidates [--brand muha] [--dry]` / `dam_render_candidates`
  flags (idempotently, free) and prices the unanalysed remainder per brand.

**Running the paid pass for one brand** (needs the user's approval; ≈ $0.002 per image):

```bash
DAM_CONCURRENCY=4 node engine/cli.mjs dam work --once --kinds analyze --approve --source dropbox:muha --max 6000
DAM_CONCURRENCY=4 node engine/cli.mjs dam work --once --kinds embed   --approve --source dropbox:muha --max 6000
npm run dam -- products --brand muha
npm run dam -- sync-kg --brand muha          # product-ref hits → damCandidates on the product registries
```

Candidates are always claimed before other pending jobs, so `--max` bounds the spend to the render set.

## Live polling that survives (2026-10-27)

**What broke.** The hosted worker's last heartbeat was 2026-09-27 21:07 UTC (`discover:dropbox:media:muha-members`):
the loop hung on a call with no deadline and nothing was indexed for a month. Meanwhile the team moved two
roots (`/MEDIA Team/Dialed-and-Defend` → inside `/MEDIA Team/Dialed-Health/`, `/2025 Full Ops/DIALED HEALTH: Master`
→ `/CM Headquarters/DIALED HEALTH: Master`), and the watcher kept queueing discovers for the missing one: 1,706 dead
`list_folder/continue 409 path/not_found` jobs.

**How it behaves now.**

| Failure | Behaviour |
| --- | --- |
| A Dropbox call hangs | Every request (rpc, token, longpoll, thumbnail, download, temp link) has an `AbortController` deadline covering headers and body: rpc 60 s, content 90 s, download 30 min, longpoll = its timeout + 120 s. Timeouts and network errors are retried like a 5xx. |
| The database hangs | pg pool: 30 s to get a client, 150 s per query, TCP keep-alive; queue-loop errors are logged and retried, not fatal. |
| The loop wedges anyway | `dam watch` arms a watchdog: one `[dam] heartbeat …` log line per minute; a `WATCHDOG: stalled` line at half the limit; at `DAM_WATCHDOG_MINUTES` (15) without a heartbeat it logs and exits 1, `start.sh` prints the status, Railway restarts (`restartPolicyType = "ALWAYS"`). **Railway logs that go silent for > 1 minute mean a problem.** |
| Cursor invalid (`reset`) or its root vanished (`path/not_found` on `continue`) | discover drops the cursor and lists the root from scratch; a complete full listing tombstones every asset it did not see (deletion reconciliation without the cursor's delete entries). |
| The root itself is gone | discover re-resolves it: a folder in the same parent with the same name ignoring case/punctuation (renamed), else Dropbox search by name (moved). A unique match outside every other source becomes the new root (`last_error = "root moved: …"`). A match inside another source (or none, or several) disables the source with `last_error = "root missing: …"` and tombstones its files so the live copies are not skipped as duplicates. Disabled sources are never watched or discovered; re-point one with `dam add-source <id> --dropbox "<root>"`. |
| Longpoll 409/400 | The watcher drops the cursor and queues one full discover. |
| Discover pile-up | Never a second discover for a source with one pending/running (`enqueueDiscover`, plus the open-job unique index). |
| Longpoll silently missing changes | Safety net: every 10 min, any enabled Dropbox source whose last sync is older than `DAM_RESCAN_HOURS` (6) gets an incremental discover. |
| Restart reverting a fix | `register-defaults` / hosted start uses `ensureSource`: it adds missing sources and never reverts a re-resolved root, re-enables a disabled source or drops a cursor. |

`dam check-roots` (read-only) reports which roots exist and where a missing one went.

## Brand basis

Brand is written at discovery, free: `assets.brand = coalesce(assets.brand, folder brand)` with
`flags.brand_basis = 'folder'`. The folder brand is `BRAND_PATH_RULES` (config.mjs: a `Dialed-and-Defend` /
`Dialed & Defend` sub-tree → Dialed Labs; a `NuLumin` folder inside another brand's tree → NuLumin), else the
source's `brand_hint`. Analysis may override it from the picture (`brand_basis = 'vision'`; when it disagrees with
the folder, `flags.brand_folder` keeps the folder's call — the misfiled signal). A vision read with no brand keeps
the folder brand. `dam backfill-brands` applies the same rule to rows indexed before this existed.

Search: the hard brand filter now reaches un-analysed files. A path pass matches every query word as a substring of
the file name or path (the tsvector cannot: Postgres parses a whole path as one token) for `discovered`/`probed`
rows whenever the query has no analysis-only filter (class, product, people, roles…); hits carry `why.path` and
rank after analysed hits.

## Per-brand dissection and catalogs

`dam brands [--brand b] [--json]` / MCP `dam_brands`: per brand, files by kind and class, discovered / probed /
analysed / embedded, product-render candidates, catalog coverage (items with ≥ 1 reviewed render and with any
render), newest additions, the brand's sources (sync age, errors, disabled), pending paid work in USD, and the
next action.

The product-catalog pipeline is configured per brand in `engine/skus/brand-config.mjs` (sources, render scope,
SKU book, not-a-product folders, previous-design folders, Muha's device-generation dating and line folders, and
for book-less brands the folder → product rules). `dam catalog --brand <b> [--write]` builds
`knowledge/skus/catalog.<b>.json` from the database's render library:

| Brand | Basis | Catalog (2026-10-27) |
| --- | --- | --- |
| Muha Meds | SKU book + reviewed folder map (328/328 decided) | `catalog.muha.json`, unchanged: 633/1,131 items with a reviewed render. Rebuilding needs `--force`. |
| Dialed Moods | SKU book `dialed-moods.json` + automatic matcher, **unreviewed** | 111/159 items with a render. Scope: `Renders/DialedMoods`, `Renders/Assets for Amazon`, and (once discovered) `/CM Headquarters/DIALED MOODS: Master/Product Renders`. |
| Dialed Health | `knowledge/products/dialed-health.json` + render folders, **unreviewed**, no SKU codes | 4/4 (vial, capsule, oral drop, blood-test kit). `Renders/Syringe Bottle/NuLumin` is NuLumin's. |
| Dialed Labs | `knowledge/products/dialed-labs.json` + render folders, **unreviewed**, folder model codes kept as `folderCode` | 9/14 products; vplunge wood/black, red-light beds and HB horizontal need a person (folders `Vertical Plunge (CT_06)`, `Red Light Therapy/M6N|M11`, `Hyperbaric Capsule Chamber` are left unassigned, not guessed). 26 folders under `00 Old Dialed Labs Renders` are previous designs. |

`resolveProductReferences` reads a reviewed catalog first (Muha, unchanged); an unreviewed catalog is used only
when the fuzzy library search finds nothing. Before this change every Dialed brand was cut to `catalog.dialed.json`
and never reached a catalog.

## Operator runbook (2026-10-27)

Run from a checkout of `feat/dam-live-per-brand` with the operator's `.env` loaded. Steps 1 and 6 are read-only.

```bash
# 1. Read-only checks
npm run content -- dam check-roots
npm run content -- dam recover --dry-run            # 1,706 dead discover jobs, all dropbox:media:dialed-and-defend
npm run content -- dam backfill-brands --dry-run     # ≈ 62,955 rows without a brand, 62,946 assignable from the folder

# 2. Deploy this branch (Railway deploys the dam-worker branch from GitHub)
git push origin feat/dam-live-per-brand
git push origin feat/dam-live-per-brand:dam-worker  # fast-forward; or: railway up --detach --ci --service dam-worker
#    On start the worker registers the new default sources (dialed-moods:master, dialed-labs:defend-2025,
#    final-2026:dialed-health) and arms the watchdog. Check: railway logs  → "[dam] heartbeat …" every minute.

# 3. Clear the dead discover jobs, reset those cursors, queue one full discover each
npm run content -- dam recover
#    → dropbox:media:dialed-and-defend is then disabled ("root missing … covered by dropbox:media:dialed-health")
#      and its 267 old rows tombstoned; dropbox:dialed-health:master re-resolves to /CM Headquarters on its next
#      discover (safety net within 6 h, or now: npm run content -- dam scan dropbox:dialed-health:master).

# 4. Brand every existing row from its folder (free, idempotent)
npm run content -- dam backfill-brands

# 5. After the new Dialed Moods master source is discovered, rebuild the book-less/unreviewed catalogs
npm run content -- dam catalog --brand dialed-moods --write
npm run content -- dam catalog --brand dialed-health --write
npm run content -- dam catalog --brand dialed-labs --write

# 6. Verify
npm run content -- dam status
npm run content -- dam brands
```

**Analyze backlog (needs the user's yes).** 41,911 analyze jobs pending on 2026-10-27, priced with the repo's
`estimateUsd` (gemini-2.5-flash, gemini-embedding-2): 27,967 image/PDF × $0.0015 = $41.95, 13,944 video ×
$0.006 = $83.66 → **$125.61 for analysis, $142.38 with the embeds** (41,911 × $0.0004), plus whisper at
$0.006/minute of video speech (durations are unknown until download; ≈ $66 if the 11,073 videos under the
download cap average one minute). 1,333 of those jobs belong to files since deleted. With a cap the queue drains
over days instead of being dropped:

```bash
# hosted: Railway variables
railway variables --service dam-worker --set DAM_APPROVED=1 --set DAM_SPEND_CAP_USD=40   # ≈ 4–6 days to drain
# or locally, one brand at a time, bounded
DAM_CONCURRENCY=4 node engine/cli.mjs dam work --once --kinds analyze,embed --approve --source dropbox:muha --max 5000
```
