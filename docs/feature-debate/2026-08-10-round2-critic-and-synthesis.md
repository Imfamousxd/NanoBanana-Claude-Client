# Feature Debate — Round 2 (Codex critic) + Synthesis

> Two GPT-5.4 (Codex) agents, adversarial. Round 1 proposed a roadmap and picked #1 to build first.
> Round 2 (this) attacked it. Below: the critic's verdict, then Claude's synthesis of what to
> actually do. Round 1 lives in `2026-08-10-round1-codex-proposals.md`.

## Critic's verdict (Codex, round 2)

**The round-1 "build #1 first" pick is wrong.** #1 (self-improving candidate selection) is overrated
because the repo has no machinery to support it:

- The `weakest` field it leans on comes from `sieve-judge.mjs` — an **image-only** evaluator the
  video engine never invokes (`sieve-judge.mjs:127`). Video candidates get only transcript-token +
  arithmetic-watcher checks (`video-engine.mjs:372`), which produce no semantic prompt revision.
- **No durable learning target:** operator feedback is binary, and `--why` is explicitly **not
  persisted** (`gen-verdict.mjs:85`). Nothing to learn operator preference from.
- Ranking isn't stable enough to drive autonomous optimization — the repo's own round-robin flipped
  positions in **5 of 15** comparisons (`research/sd25/cand/judge/passD_roundrobin.txt:18`).
- It overstates its evidence elsewhere too: the "four off-size clips" were arithmetically 4:5 and
  the law concedes they were **not misframed** (`house_laws.json:63,66`); #2's house laws rest on
  ~3 clips/lane and one framing video (`house_laws.json:5`); #3's "cheapest backend" rests on
  unverified token-shaped billing (`seedance25_laws.json:149`).

**Build #4 (asset preflight) first instead**, in two releases:
1. Deterministic **pre-submit** validation — inspect real dimensions/aspect/MIME/duration/role
   compatibility; show the exact output geometry a first-frame will force (`seedance25_laws.json:29`);
   verify first-frame-vs-references combos; run person/mark detection as a **report** (don't trust
   author `contains_person`, don't hard-reject from an uncalibrated classifier); persist the result.
2. Later: sample output frames for identity/product/text/continuity, **report-only** until precision
   is measured on approved+rejected fixtures.

**Committed sequence:** #4 (preflight, deterministic + report-only) → #1 (reduced: one control + two
named variants, persisted reasons, no autonomous rewriting) → #3 (dry-run recommendation router,
not an autonomous selector) → #5 (opt-in lane finishing presets) → #2 (graph-lint + provenance
first) → #6 (one kill-switchable probe at a time).

**Biggest thing round 1 missed:** the repo has **no usable learning target** — binary approval +
discarded `--why` — so candidate optimization, router benchmarking, law promotion, and gate
calibration all lack ground truth.

## Synthesis (what to actually do)

The two agents agree on the *diagnosis* (`--n` re-rolls the same prompt; gates run post-spend) and
disagree productively on *sequence*. The critic wins on ROI and risk. Two concrete, cheap actions
fall out that neither proposal alone surfaced:

1. **Build a pre-submit asset-preflight gate first.** Every current gate runs AFTER the clip is
   generated and downloaded — i.e. after the money is spent — which contradicts the repo's own
   economic law "gate the cheap step before the expensive one" (`CLAUDE.md:51`, and rule 8 in
   `CLAUDE.md`). A deterministic preflight (dimensions, first-frame→output geometry, role-compat) is
   small, high-confidence, and pays for itself the first time it stops a bad $2 submit. **This is the
   recommended next feature build after the hosted MCP.**
2. **Persist the operator's `--why` (the missing learning target).** It's a ~10-line change
   (`gen-verdict.mjs` already accepts `--why` and throws it away; add a `verdict_reason` column to
   the ledger and write it). It's the prerequisite that unlocks #1/#2/#3 later. Do it opportunistically.

Neither is in scope for the hosted-MCP Phase-1 work in flight; both are logged here as the top of the
engine-feature backlog, with the debate as their justification.
