# Handoff — content-gen engine execution (2026-08-10)

Paste everything below the line into a fresh Claude Code instance in this repo to continue with full
context. It carries the current state, the audit findings, and the execution order.

---

You are picking up an in-flight effort on a **content-generation engine** (images + video) in this
repo. Read this whole prompt, then **read `CLAUDE.md` first** — it is the authoritative operating
manual (model slugs, the "write a small .mjs per generation" loop, the golden rules). `Brand
Context/00_ENGINE.md` wins on any back-end conflict.

## Environment facts you need
- **Working dir:** `/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client/.claude/worktrees/gen-image` (a git worktree). Run everything from here. Branch: **`gen-image`**, remote `origin` (github Imfamousxd/NanoBanana-Claude-Client). Push here.
- **`.env`** lives at the main repo root and is symlinked into the worktree; it's gitignored. Scripts now derive the repo root via `lib-repo-root.mjs` (do NOT hardcode paths).
- **OpenAI key gotcha:** this Mac's shell exports a stale `OPENAI_API_KEY`; for gpt-image scripts run `env -u OPENAI_API_KEY node <script>` (the project key ends `rpQA`). `video-engine.mjs` uses `MODELARK_API_KEY`, not OpenAI.
- **Codex CLI is installed and authenticated** (`codex exec --skip-git-repo-check "<prompt>"`, runs GPT-5.4). Use it for backend authoring and adversarial review — the operator explicitly wants multiple GPT-5.x agents in the loop. The `hivemind` skill (Claude+Codex) is available.
- **Supabase ledger** `engine_generations` (project ref `hiqefhtlfmcpbyypensf`) records every generation; `engine-ledger.mjs` is the never-throw client.

## Operator preferences (load-bearing)
- Plain language, point first, numbers after. No pre-work questionnaires; build the named thing.
- Never fake fidelity by pasting; iterate the prompt. Generate 2–3 candidates for subjective work.
- Confirm scope before firing paid video (a 12s clip ≈ $1.50; generation is minutes).

## What is already DONE (committed on `gen-image`, newest first)
- `f4d2394` — **Engine + KG audit** → `docs/audits/2026-08-10-engine-kg-audit.md` (22 engine gaps, 13 KG gaps, 20-step roadmap; Claude research + GPT-5.4 debate).
- `2c8df9b` — **Feature debate** (2 Codex agents) → `docs/feature-debate/*` (concluded: build a pre-spend preflight gate first; persist `--why`).
- `271cf6f` / `6562e3b` — **Hosted-MCP Phase-1 plan + spec** → `docs/superpowers/plans/2026-08-10-hosted-mcp-phase1.md`, `docs/superpowers/specs/2026-08-10-hosted-mcp-phase1-design.md`.
- `0bac064` — **Task 1 of the MCP plan**: `lib-repo-root.mjs` replaces the hardcoded macOS path in `video-engine.mjs`, `engine-ledger.mjs`, `sd25-cost.mjs`, `scene-frame.mjs` (container-ready).
- `c3965f7` — **Gate fixes + MCP ledger tools**: watcher lane→modality map; crash(exit2)≠fail; `--silent-ok` for scored-in-post clips; parallel candidates; new `engine_status` + `engine_verdict` MCP tools + `gen-verdict.mjs recent` (MCP now 14 tools).

## Read these before executing
1. `docs/audits/2026-08-10-engine-kg-audit.md` — the gap list + roadmap (below is the summary).
2. `docs/superpowers/plans/2026-08-10-hosted-mcp-phase1.md` — the 7-task MCP build (Task 1 done).
3. `docs/feature-debate/2026-08-10-round2-critic-and-synthesis.md` — why preflight + `--why` first.

## The engine gaps (summary — full detail + file:line in the audit doc)
Four themes:
1. **Pays before it inspects.** All `--n` candidates generate+pay before any gate, and submit *identical* bodies (`video-engine.mjs:439-441,340`); the proof gate unlocks the paid run on API success, not content (`:201-203`); NaN-cost lanes still spend (`:251,283`); 30s avatar briefs pay then get truncated (`:77,119` vs 1.5-pro's ~12s cap).
2. **Video barely judged.** No semantic VLM judge for video — only the arithmetic watcher + an image-only `sieve-judge` (`sieve-judge.mjs:60`); identity is gated on the INPUT frame, never the delivered clip (`:184`, gate never calls verify); finishing grade is image-only; transcript gate is dormant unless `required_tokens` is set (`:379`).
3. **KG is decorative.** `video-engine.mjs` claims to read the law banks but imports none — `HOUSE`/`MODELS`/ladder are hardcoded and already drift (engine `campaign.wps=[2.8,3.3]` vs law `3.0–3.14`, `house_laws.json:33`).
4. **Learning loop never closes.** `--why` is discarded (`gen-verdict.mjs:85`, no ledger column); verdict/gate PATCH uses `return=minimal` so a zero-row (bad task_id) write still reports `ledger:ok` (`engine-ledger.mjs:75,87`); "delivered" is a display alias, not a real state.
   Plus: gates trust author-declared booleans (privacy/marks/claims) instead of detecting from the artifact; the watcher's 1080p→720p halving check is disabled on every 1080p lane (`:417`); modality maps from `subject.type` before lane so campaign-product clips false-FAIL their cuts (`:413-414`).

## The knowledge-graph gaps (summary)
- **Not connected:** the 4 law banks were never merged into `graph.json`; lint SKIPS (not fails) missing sections so it reports "clean" over a partial graph; `kg-vault.py` ingests only Seedance, dropping 42 house/post/creative laws.
- **Not honest:** confidence conflates *provenance* (measured-on-our-API vs documented-external) with *strength* (sample size); `seedance25_laws` header claims "all measured" but 10/35 are documented; the two banks the engine trusts most rest on the thinnest evidence.
- **Not enforced sensibly:** weak (n≤3) bands hard-refuse (exit 2) while stronger laws aren't enforced; cross-bank conflicts (e.g. UGC forbids captions, campaign requires them) exist only as prose with no `CONFLICTS_WITH` edge.

## The 20-step roadmap (four waves, cheapest+safest first)
- **1–9 · cheap gate/ledger fixes (~20 lines each):** `return=representation`+fail-on-zero-rows (stop the false ledger:ok); add `reject_reason` column + persist `--why`; require `--refs` for product-lock; always pass `--expect-w/-h` (re-enable the halving check); map watcher modality from LANE + relax static-patch on handheld; NaN-cost + lane-specific duration refusals; fix/delete the dead first-frame path; fix `sieve-longform` per-hop verify; enforce min anchors before `lock()`.
- **10–14 · wire the KG to the engine:** merge banks into `graph.json` + make lint FAIL on missing coverage; register house/post/creative in the vault; split confidence into provenance+strength and harden the vault test; load fragments at runtime (single source of truth) + a regression asserting engine constants == law values; tie block-vs-warn to confidence.
- **15–17 · close the loop:** scan assembled `spoken` text for claim-shaped statements against the SOURCED registry (+ auto-derive transcript tokens); model delivery as an explicit state storing the final post path + widen the MCP surface; key `sieve-verdict` to `task_id` and build a `rejected_by='operator'` learning queue that drafts candidate laws.
- **18–20 · the expensive correctness wins:** video VLM judge (keyframes+montage → Gemini rubric → pairwise rank → video HERO) + gate delivered-clip identity via frame-extracted `sieve-avatar verify`; lane-aware video finishing grade; converge the three long-form/finishing paths onto one gated pipeline.

## In-flight work + open decisions
- **Hosted MCP Phase 1** (Tasks 2–7 of the plan remain): Task 2 extract a shared `mcp-tools.mjs` (phase-tag each tool) so stdio + a new HTTP server never drift; Task 3 bearer auth; Task 4 Streamable-HTTP server (official MCP SDK) — **author with Codex**; Task 5 all-brands smoke test; Task 6 Dockerfile + `railway.json` — **Codex**; Task 7 operator does the ~10-min Railway click-through then go-live. Deploy target = Railway (auto-deploy from GitHub → edit+push updates everyone).
- **OPEN DECISION 1:** deploy branch — keep `gen-image` or merge to `main` first? (ask the operator)
- **OPEN DECISION 2:** do the audit's #1+#2 (fix the lying ledger write + persist `--why`) before continuing the MCP build? Both were flagged twice independently (audit + feature-debate). Recommended: yes, they're ~20 lines total.
- **CAVEAT on recent changes to reconcile:** the parallel-candidates change removed early-abort (a doomed prompt now pays 3× — decide with the operator: save wall-clock vs save money by gating c1 first); the watcher modality edge case (audit #14) and the `return=minimal` zero-row bug (audit #10) are both in code shipped this session — fix as part of roadmap steps 5 and 1.

## How to execute
- Use `superpowers:executing-plans` or `subagent-driven-development` for the MCP plan; TDD, commit per green task.
- For roadmap fixes, work top-down (cheapest first); each fix = a failing test / repro, the change, verification, commit. Keep changes small and independently reviewable.
- Bring **Codex** in on backend-heavy authoring (HTTP server, Dockerfile) and as an adversarial reviewer via `hivemind`; the operator wants multiple GPT-5.x agents in the loop.
- The **`engine-kg-audit`** workflow is saved and re-runnable to re-check gaps after changes.
- Confirm scope before any paid video run. Report outcomes faithfully (if a gate fails, say so with the output).

First action: confirm the two open decisions with the operator, then start.
