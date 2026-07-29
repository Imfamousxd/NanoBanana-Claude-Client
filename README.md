# NanoBanana Client — image & video generation engine

> **New here and not technical?** Start with **`ONBOARDING.md`** — plain-English, from
> "open Terminal" to your first generated image.
>
> **Using Claude Code?** Read **`CLAUDE.md`** first. It is the operating manual and it
> encodes a lot of expensive lessons; `Brand Context/00_ENGINE.md` wins on any conflict.

Dependency-light Node + Python tools wrapping three providers, plus the selection,
avatar and long-form machinery built on top of them.

## The back-ends

| Capability | Tool | Model | Key |
|---|---|---|---|
| Image gen / edit | `gpt-image.mjs` | OpenAI **gpt-image-2** | `OPENAI_API_KEY` |
| Image gen / edit | `nanobanana.mjs` | Google **Nano Banana Pro** (`gemini-3-pro-image-preview`) | `GEMINI_API_KEY` |
| Video, identity-locked | `nanobanana-video.mjs` | Google **Veo 3.1** (fast tier) | `GEMINI_API_KEY` |
| Video, batch | `seedance-batch.mjs`, `seedance-run.mjs` | **Seedance** 1.5-pro / 2.0 on Replicate | `REPLICATE_API_TOKEN` |

Which video model to use is **decided by subject, not preference** — people vs. objects
take different models with different input schemas. See `CLAUDE.md` Pattern D.

## Built on top

| Layer | Tool | What it does |
|---|---|---|
| Selection | `sieve-judge.mjs` | Scores candidates against a rubric, runs a pairwise bracket, repoints `HERO` |
| Avatars | `sieve-avatar.mjs` | Create / lock / resolve / verify reusable people; adversarial likeness gate |
| Long-form | `sieve-longform.mjs` | 30–60s stitched pieces with a pinned seed and per-hop face verification |
| Finishing | `film-grain.py` | The luminance-weighted grain + cast neutralisation that cannot be prompted |
| Utility | `bg-remove*.py`, `lib-make-mask.mjs`, `sieve-sheet.py` | Cutouts, inpaint masks, contact sheets |

## Knowledge, not code — and the most valuable thing here

- **`CLAUDE.md`** — the rulebook. Ten golden rules and nine patterns, each one paid for.
- **`Brand Context/`** — 10 brand playbooks + `assets/`. Read the brand's file *and* its
  asset folder before generating anything branded.
- **`Avatars/`** — 8 avatar kits (Marcus, Tasha, Mack, Renee, Brooke, Dialed_Ava, Diego, Priya).
  Identity anchors, `AVATAR.md` prose, `identity.json` machine twin. **Four are
  `status:"casting"`** — Brooke, Dialed_Ava, Diego, Priya — and are **refused** (exit 2) until
  the founder approves the face, because approving locks every downstream artifact.
- **`sieve/`** — `rubrics/` for the judge, and `golden/experiments/` — the controlled
  experiments the rulebook's claims cite. When a claim looks wrong, the evidence is there.

## Setup

```bash
npm install                 # sharp, qrcode, pg, supabase-js
cp .env.example .env        # paste your keys
```

Node 20+ (native `fetch`/`FormData`). macOS assumed for `open -a Preview`.

### ⚠️ On this Mac, always strip the shell's OpenAI key

`~/.secrets` (sourced by `~/.zshrc`) exports an **older** `OPENAI_API_KEY` into every shell.
Every script's `.env` loader only sets variables that are *not already set*, so the stale
shell key silently wins and bills the wrong account.

```bash
env -u OPENAI_API_KEY node <script>.mjs
```

Project key ends `rpQA`; the stale shell key ends `o71YYA`. Verified still true 2026-07-29.

## Quick start

```bash
# Images — interactive
env -u OPENAI_API_KEY node gpt-image.mjs
node nanobanana.mjs

# Images — batch, with 3 candidates and a stable id
node nanobanana.mjs --batch batches/_smoketest.batch.json
#   → generations/_smoketest/SMOKE-ugc-01/{c1,c2,c3,HERO}.jpg

# Pick the winner mechanically instead of eyeballing it
node sieve-judge.mjs --rubric realism-ugc --candidates 'generations/_smoketest/SMOKE-ugc-01' --rank

# Video — ALWAYS dry-run first; a 12s clip is ~$1.50
node seedance-batch.mjs --batch batches/ugc-recovery.video.json --dry-run
node nanobanana-video.mjs --prompt "…" --identity Avatars/Marcus/identity/a.jpg
```

`batches/_smoketest.batch.json` is the end-to-end smoke test. `examples/` holds ten files
covering eight real jobs, kept as templates — one per pattern (gpt-image creatives, UGC,
video ads with `--frame-only`, multi-avatar scenes, Veo extension, Nano Banana inpaint,
batch schema, ref prep).

## `inputs/` — tracked source frames

Six first-frames and one source clip that carried specs depend on. They were rescued out of
the predecessor's `generations/` folder and are **tracked**, because a gitignored dependency
is invisible and that is how the last engine lost 349 MB of work. `batches/*.video.json`,
`sieve/longform/*.json` and `examples/ldoba-si-ferrari-extend.mjs` point here.

## Output

Everything lands in `./generations/`, gitignored.

**`OUTPUT_DIR` only works for `nanobanana.mjs`.** `gpt-image.mjs`, `nanobanana-video.mjs`,
`seedance-batch.mjs` and `sieve-longform.mjs` hardcode `path.join(__dirname, "generations")`.
Don't rely on the env var globally — verified 2026-07-29.

## Aspect ratios (gpt-image-2)

`gpt-image.mjs` maps friendly ratios to max-res sizes (≤3840px edge, multiples of 16, ≤8.29 MP):
`1:1`→2880×2880, `9:16`→2160×3840, `16:9`→3840×2160, `2:3`→2048×3072.

A **direct `/images/edits`** call is limited to `1024x1024`, `1024x1536`, `1536x1024`.

## Provenance

Extracted from `~/Desktop/NanoBanana-Claude-Client`, which is still on the Desktop and holds
what did not come along: 883 one-off job files, ~600 MB of delivered brand asset folders, and
the old git repo. Nothing there is needed to run this.

## Security

`.env` is gitignored. No secrets in tracked files. The `.gitignore` here is deliberately a
*deny-a-little* list — see the comment at its top for why the predecessor's approach lost
349 MB of work to invisibility.
