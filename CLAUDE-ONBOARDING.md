# CLAUDE-ONBOARDING — read this first, new instance

You are the operator of a measured content-generation engine. This document exists because you
are on a NEW machine with NEW API keys and none of the session history that built this system.
Everything you need survives in three places: **this repo** (code, registries, laws),
**the docs** (reading order below), and **the regression suite** (which will tell you, in
minutes, whether this install is real or broken). Trust the suite over any prose — including
this file.

Work through this top to bottom. Do not generate anything for a user until Section 5 passes.

---

## 0. FOR THE HUMAN: the prompt to paste

Operator — hand a brand-new Claude exactly this block (fill in the GitHub URL). It routes the
instance into this document and stops it from spending before the install is proven:

```
You are joining the NanoBanana content-generation engine as its operator on this machine.

1. Pull the newest work: from the NanoBanana-Client repo run
   `git fetch origin && git checkout gen-image && git pull origin gen-image`.
   (Fresh machine? `git clone <GITHUB_URL> NanoBanana-Client` first. No remote or no URL?
   Stop and ask me — do not improvise.)

2. Open CLAUDE-ONBOARDING.md at the repo root of that branch and follow it top to bottom.
   It covers the .env keys I will hand you separately (never through git or chat), the
   Supabase migration if we're on a fresh project, and a 7-command install proof that
   costs nothing.

3. Report back: the kg-vault-test.py score (expect 55/55), the dry-run output of
   briefs/gh-ugc-car.video.json, and anything that failed. Generate NOTHING until I've
   seen that report and given you a brief.

4. Standing rules that survive onto your machine: dry-run before money, claims verbatim
   from sieve/brands/ or refused, no people in reference images, the R&D wall MCP stays
   disconnected, and `node sd25-cost.mjs drain` before you end any session that generated.
```

---

## 1. What this is (60 seconds)

Brief in → validated → routed → gated → generated → post-processed → ledgered video out.

- **`video-engine.mjs`** is the ONE entry point for video. Users never get hand-rolled
  generation scripts; they get a brief (`briefs/<id>.video.json`) filled via the 16 intake
  questions, then the engine runs it.
- Every rule in this repo was **measured, and most cost real money to learn**. When a comment
  cites a date and a dollar figure, it is not decoration — it is the receipt. Do not "clean up"
  behavior you don't understand; the cleanup usually re-buys the lesson.
- Three brands are registered (Muha Meds, Dialed Moods, Dialed Health) with claim registries.
  **A claim not SOURCED in `sieve/brands/` may not be spoken. Ever.** The engine enforces this;
  your job is to not route around it.

## 2. Get the code

```bash
git clone <GITHUB_URL> NanoBanana-Client && cd NanoBanana-Client
git checkout gen-image          # ← the engine branch. main alone is NOT enough.
```

Check what you actually received — clones of this repo have failed partially before:

```bash
ls video-engine.mjs ENGINE-INTAKE.md ENGINE-HANDOVER.md SYSTEM-README.md \
   sieve/brands/Muha_Meds/brand.json graph-fragments/house_laws.json migrations/
```

All present → continue. Anything missing → stop and tell the operator the pull is incomplete;
do not improvise around a partial checkout.

## 3. Keys — what each one is, what breaks without it

Create `.env` at the repo root (it is gitignored; the operator hands you values through a
secure channel, never through git or chat logs):

```
MODELARK_API_KEY=...           # REQUIRED. Seedance 2.5/2.0 (BytePlus ModelArk) — the video engine.
DIRECT_URL=...                 # Supabase session-mode pooler (port 5432) — ledger DDL + project ref
SUPABASE_SERVICE_ROLE_KEY=...  # ledger writes. RLS is on; the anon key is useless here.
GEMINI_API_KEY=...             # optional — Veo 3.1 / Nano Banana image tools
OPENAI_API_KEY=...             # optional — gpt-image-2 tools
REPLICATE_API_TOKEN=...        # optional — legacy Seedance 1.5-pro lane (Pattern D)
```

Facts about keys that will save you from subtle failures:

- **A NEW ModelArk key = a new ModelArk account = an EMPTY server-side task ledger.**
  `node sd25-cost.mjs spent` will show ~$0 — that is CORRECT on this machine, not a bug.
  The original account's $313.66 history lives in the Supabase table, not in your key.
- **New Supabase project?** Create the ledger table first:
  `psql "$DIRECT_URL" -f migrations/engine_generations.sql` — then `node ledger-backfill.mjs`
  any time; it is idempotent and rebuilds from disk sidecars + your ModelArk ledger.
  (No psql? macOS: `brew install libpq`, binary lands at `/opt/homebrew/opt/libpq/bin/psql`.)
- **Same Supabase project as the original machine?** Then the 148-row history is already there.
  Do NOT run the migration destructively (it's `IF NOT EXISTS`, so it's safe anyway).
- **`engine-ledger.mjs` derives the project from `DIRECT_URL`'s username** (`postgres.<ref>`),
  never from `NEXT_PUBLIC_SUPABASE_URL` — on the original machine that var appeared twice
  pointing at two different projects. Keep that discipline in anything new you write.

## 4. Runtime dependencies

```bash
node -v         # need 20+
ffmpeg -version # post chain (loudnorm, 1080 conform)
python3 -m pip install faster-whisper   # transcript gate; ~500MB model auto-downloads on first use
```

## 5. Prove the install — DO NOT SKIP, all free

```bash
python3 kg-vault-test.py
#   expect: "55/55 passed". This also rebuilds ~/Obsidian/video_engine_kg (the browsable
#   knowledge graph). Any FAIL names exactly what is broken — fix before proceeding.

node video-engine.mjs --brief briefs/gh-ugc-car.video.json
#   expect: full plan — route dreamina-seedance-2-5-260628, 69 words at 2.30 w/s, two claims
#   with [SOURCED_BY_OPERATOR], a disclosure slot, "$6.98", ending in "DRY RUN — nothing
#   submitted". This brief is the regression twin of a real shipped piece.

node video-engine.mjs --brief briefs/gen2x2-hero-4k.video.json           # 2.0 product route
node video-engine.mjs --brief briefs/gen2x2-hero-4k.video.json --draft   # 2.0-mini route
#   expect: cost line reads "UNMEASURED — first run is the measurement" (honest, not broken)

node ledger-backfill.mjs        # syncs disk + YOUR ModelArk ledger into Supabase; idempotent
node gen-verdict.mjs pending    # rows awaiting a human verdict (may be empty — fine)
node sd25-cost.mjs spent        # YOUR account's spend (near-zero on a fresh key — see §3)
```

All seven behave → the structure is good to go. Tell the operator the install is verified and
quote the suite score.

## 6. Reading order (before your first real job)

1. **`CLAUDE.md`** (repo root) — the operating manual and golden rules. It is law.
2. **`SYSTEM-README.md`** — system layout, what's external state, what's deliberately not wired.
3. **`ENGINE-HANDOVER.md`** — models, costs, refusal triage. The on-set card.
4. **`ENGINE-INTAKE.md`** — the 16 questions. You ASK these; you never fill a slot silently.
5. The **brand playbook** in `Brand Context/<Brand>.md` + `sieve/brands/<Brand>/` for whichever
   brand the job names.

## 7. The rules you personally must not break (each has a receipt)

- **Dry-run first, always.** The engine defaults to it. A 30s take is ~$7; a frame is free.
- **Never guess a model slug.** A guessed suffix (`-260628` for `-260128`) produces a bare
  InvalidParameter after you've already paid attention to it. Check `arkcli` or the registry.
- **Never put a person in a reference image.** Categorical refusal (privacy guard), any role.
  People are cast from TEXT; products/cards ride as `reference_image`.
- **2.5 is 720p-only; people = 2.5, no-humans = 2.0.** 2.0 refuses photoreal human frames
  outright (E005) — that's the image, not your phrasing; rephrasing does not fix it.
- **Talking heads keep `generate_audio: true` + a music-only exclusion.** "No audio" on a
  talking head ships a mute clip at full price; "no voices" summons silence.
- **Negatives summon.** To remove a thing, delete every mention and make it impossible in-scene.
- **Claims come from the registry verbatim or become `{{SLOT}}`s.** The invented-$35k-Rolex
  incident is why. If the registry says UNRESOLVED, the answer is `brand-asks.mjs`, not memory.
- **The Dialed Moods R&D wall MCP is OUT OF ENGINE SCOPE** (operator directive 2026-08-09).
  Never connect to it, never quote it. Formulation claims arrive as SOURCED_BY_BRAND entries.
- **Watcher FAIL = candidate rejected; operator disagreement = `sieve-verdict.mjs log`,** which
  recalibrates the check at n≥5. You do not get to overrule a gate silently in either direction.
- **Before ending any session that generated: `node sd25-cost.mjs drain`.** Paid outputs live
  ~24h at signed URLs; drain catches paid-but-not-downloaded tasks while they're recoverable.
- **Money moves only with the operator awake and explicit.** `--go` needs
  `--claims-initialed "<name>"` when claims are spoken; that name is a real person, not you.

## 8. What does NOT exist on your machine (and what to do about it)

| Missing | Impact | Action |
|---|---|---|
| `~/Desktop/MUHA-ALL-VIDEOS` corpus | none for generation — `house_laws` (the measured bands) are committed | only needed to RE-measure; ask the operator for the corpus if a brand re-calibration comes up |
| `~/Obsidian/video_engine_kg` vault | none — regenerated by the suite in §5 | open in Obsidian, start at `_HOME` |
| Original ModelArk task history | `sd25-cost spent` reads near-zero | correct behavior; history is in Supabase |
| Avatars beyond committed assets | check `Avatars/` after clone | casting-status avatars are refused by design |
| The original `.env` | everything in §3 | operator supplies NEW keys; never reuse leaked ones |

## 9. Your first real job, in one line

Intake (16 questions, ask them properly) → write `briefs/<id>.video.json` → dry-run → show the
operator the plan and price → `--proof` if hands touch props → `--go --claims-initialed "<name>"
[--n 2]` → present survivors with your measured opinion → `gen-verdict` their call → `drain`.

Welcome aboard. The engine is honest — stay worthy of it.
