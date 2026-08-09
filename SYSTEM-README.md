# SYSTEM-README — install, pick up, or hand off this engine

This is the content-generation engine for Muha / Dialed work: brief in → validated, routed,
gated, generated, post-processed, ledgered video out. Everything measured, nothing vibes.
Read `ENGINE-HANDOVER.md` for the on-set operating card and `ENGINE-INTAKE.md` for the 16
questions that fill a brief. This file is about getting the SYSTEM running somewhere.

## 0. Where the code lives (read this first — it's unusual)

The engine lives on the **`gen-image` branch**, developed inside a git worktree at
`.claude/worktrees/gen-image/` of the main repo. As of 2026-08-09, commit `7ea6cbc` holds the
whole engine (45 files).

**There is NO git remote configured.** "Pushing" is currently local. To make this pullable:

```bash
# from .claude/worktrees/gen-image (or anywhere in the repo)
git remote add origin <your-git-host-url>
git push -u origin gen-image
```

**On a new machine:**
```bash
git clone <url> NanoBanana-Client && cd NanoBanana-Client
git checkout gen-image        # the engine branch — or keep main and add a worktree:
# git worktree add .claude/worktrees/gen-image gen-image
```

⚠️ **Two things git does NOT carry, by design:**
1. **`.env`** (gitignored — it holds every API key). Copy it to the new machine through a secure
   channel, never through git. Required keys below.
2. **Root-of-main uncommitted state**: on the original machine, `graph/graph.json` (395-node
   rules graph), `graph/lineage.json`, `sieve-graph.mjs` and the expanded root `CLAUDE.md` are
   **untracked on `main`** — they predate this work and this session could not commit outside
   its worktree. `kg-vault.py` reads `graph/graph.json`. **Before relying on a fresh clone,
   commit those on main from the original machine:**
   ```bash
   cd <repo-root> && git add graph/ sieve-graph.mjs CLAUDE.md && git commit -m "graph + rulebook"
   ```

## 1. Requirements

| Thing | Why | Check |
|---|---|---|
| Node 20+ | every `.mjs` tool | `node -v` |
| ffmpeg + ffprobe | post chain, corpus measurement | `ffmpeg -version` |
| Python 3.9+ | suite, corpus, watcher | `python3 -V` |
| `faster-whisper` (pip) | transcript gate | `python3 -c "import faster_whisper"` (model auto-downloads ~500MB on first use) |
| psql (optional) | only for Supabase DDL/migrations | `/opt/homebrew/opt/libpq/bin/psql` on macOS/brew |

## 2. `.env` keys (at the REPO ROOT, not the worktree)

```
MODELARK_API_KEY=...            # Seedance 2.5/2.0 — the generation engine. REQUIRED.
DIRECT_URL=postgres://postgres.<ref>:...   # Supabase engine project — ledger DDL + ref source
SUPABASE_SERVICE_ROLE_KEY=...   # ledger writes (RLS is on; anon key sees nothing)
GEMINI_API_KEY=...              # optional: Veo / Nano Banana tools
OPENAI_API_KEY=...              # optional: gpt-image tools
REPLICATE_API_TOKEN=...         # optional: legacy Seedance 1.5/2.0 Replicate lanes
FISH_AUDIO_API_KEY=...          # optional: future voice lane
```

**Trap 1:** `.env` defines `NEXT_PUBLIC_SUPABASE_URL` **twice** (two different projects — an app
project and the engine project). Naive first-match loaders pick the WRONG one. The ledger
(`engine-ledger.mjs`) derives the project from `DIRECT_URL`'s username (`postgres.<ref>`) —
anything new that touches Supabase must do the same.

**Trap 2 (original Mac only):** `~/.secrets` exports a stale `OPENAI_API_KEY` into every shell.
Run image tools as `env -u OPENAI_API_KEY node <tool>.mjs`.

## 3. Prove the install (all free, ~3 minutes)

```bash
cd .claude/worktrees/gen-image

python3 kg-vault-test.py                                   # expect: 55/55 passed
node video-engine.mjs --brief briefs/gh-ugc-car.video.json # expect: full plan, "DRY RUN"
node video-engine.mjs --brief briefs/gen2x2-hero-4k.video.json         # 2.0 route
node video-engine.mjs --brief briefs/gen2x2-hero-4k.video.json --draft # 2.0-mini route
node sd25-cost.mjs spent                                   # ledger audit (read-only network)
node ledger-backfill.mjs                                   # Supabase sync — idempotent, safe
node gen-verdict.mjs pending                               # rows awaiting a human verdict
```

If all seven behave, the engine is healthy. The suite (`kg-vault-test.py`) also REBUILDS the
Obsidian vault at `~/Obsidian/video_engine_kg` — open it in Obsidian for the browsable knowledge
graph (start at `_HOME`).

## 4. The pieces (what's what)

```
video-engine.mjs        THE entry point: brief -> validate -> route -> proof-gate -> generate
                        (--n candidates) -> transcript+watcher gates -> post chain -> ledger
ENGINE-INTAKE.md        the 16 questions that fill a brief; nothing is ever inherited
ENGINE-HANDOVER.md      on-set card: models, costs, refusal triage
briefs/*.video.json     one brief per asset; the two committed ones double as regression tests
sieve/brands/<B>/       brand registry: what may be CLAIMED (sourced fields only) + campaigns
brand-asks.mjs          registry gaps -> client ask sheet; answers -> SOURCED_BY_BRAND
engine-ledger.mjs       Supabase writes (never-throw); gen-verdict.mjs records the human call
ledger-backfill.mjs     disk sidecars + ModelArk ledger -> engine_generations table
sd25-cost.mjs           estimate | spent | drain (paid-but-not-on-disk recovery, 24h window)
graph-fragments/        law banks: seedance25 (23) · house (12, measured off OUR approved work)
                        · post (4, scaler shootout) · podcast/street/launch (in agent worktrees)
kg-vault.py (+test)     knowledge graph -> Obsidian vault + 55-check regression suite
sieve-corpus.py         measure any folder of finished video -> house-style bands
sieve-verdict.mjs       operator rulings on watcher flags -> recalibration ledger
```

## 5. The daily flow

```
intake (16 Qs) -> briefs/<id>.video.json -> dry run (free) -> --proof if props ($1.16)
-> --go --claims-initialed "<name>" [--n 2|3] -> survivors presented, rejects ledgered
-> node gen-verdict.mjs <task_id> approved|rejected -> node sd25-cost.mjs drain
```

Hard rules the engine enforces (each cost real money to learn): campaign claims verbatim from
the registry or blocked · person in any ref image = refused · 2.5 is 720p-only · talking heads
keep `generate_audio: true` with music-only exclusion · durations on the 5/10/30 ladder ·
scripts inside the measured house band · no submit while disclosures are unresolved slots.

## 6. External state this system owns

| Where | What | Regenerable? |
|---|---|---|
| Supabase `engine_generations` (project ref in DIRECT_URL) | every generation: prompt, cost, gates, verdict — 148 rows / $313.66 at handoff | yes — `ledger-backfill.mjs` rebuilds from sidecars + ModelArk ledger |
| `~/Obsidian/video_engine_kg` | browsable KG (627 files) | yes — `kg-vault.py` |
| `~/Desktop/MUHA-ALL-VIDEOS/01_FINISHED` | the corpus behind `house_laws` | no — source footage; keep it backed up |
| ModelArk server-side tasks | paid outputs live ~24h at signed URLs | `sd25-cost.mjs drain --recover` |

## 7. What is deliberately NOT wired

- **The Dialed Moods R&D wall MCP** — operator directive 2026-08-09: out of engine scope.
  Formulation claims enter only as brand-approved written copy via `brand-asks.mjs record`.
- Disclosures (No Purchase Necessary / 21+ etc.) — recorded as `{{SLOT}}`s; a human resolves
  and initials before any paid submit. The engine refuses, it does not improvise.
- 2.0-mini / 2.0-fast rates — unprobed; the engine says "UNMEASURED" instead of guessing.
```
