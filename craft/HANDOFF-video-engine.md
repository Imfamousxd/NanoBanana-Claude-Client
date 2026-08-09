# HANDOFF — Muha / Dialed video generation engine

You are picking up a working AI video engine mid-build. Two days of measurement produced a
knowledge base, a validated generation stack, and 214 real outputs. **Your job is the
implementation layer: turning this from "the operator and one agent can drive it" into
"employees use it daily to raise their own output."**

Read this whole file before touching anything. Then read `CLAUDE.md` in the repo root — it is the
operating manual and it OVERRIDES anything here that conflicts.

Repo: `/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client`

---

## 1. THE MISSION

Build the implementation layer that lets a non-expert employee produce on-brand video without
knowing any of what follows. Concretely, that means answering:

- How does an employee say "make me a UGC clip for the Golden Hour giveaway" and get something
  usable, on-brand, and cheap — without picking a model, writing a prompt, or choosing assets?
- How do the **knowledge graph**, a reasoning model (**Claude Opus 5 / Fable 5**) and
  **Seedance 2.5** compose into one engine, rather than three things a human glues together?
- What is the shortest path from brief → shipped asset, and what has to exist for that path to be
  walkable by someone who has never read a law bank?

The knowledge exists. The generation works. The **routing, asset selection, and self-serve
interface do not.** That gap is the work.

---

## 2. WHAT ALREADY EXISTS — verify before trusting

### Knowledge: 224 measured laws across 5 banks

| Bank | Laws | Where | State |
|---|---|---|---|
| `ugc_laws` | 57 | `graph/graph.json` | **merged** |
| `podcast_laws` | 67 | `.claude/worktrees/agent-a7044511e4cba5e6d/graph-fragments/` | fragment |
| `street_laws` | 41 | `.claude/worktrees/agent-ae115bbe6627df1c1/graph-fragments/` | fragment |
| `launch_laws` | 37 | `.claude/worktrees/agent-ab63f6f372ec6ed63/graph-fragments/` | fragment |
| `seedance25_laws` | 22 | `.claude/worktrees/gen-image/graph-fragments/` | fragment |

Every law carries `claim / evidence / counterexamples / applies_to / confidence / source`. They
were derived from **122 analysed top-performing videos** plus live API measurement — not from
opinion. Prose twins live in `craft/*-PLAYBOOK.md`.

**Four of five banks are NOT merged into the graph yet.** `craft/KB-MERGE-AUDIT.md` (in the
launch worktree) is a 495-line audit that says exactly how to merge them: zero id collisions, zero
schema violations, plus one unresolved decision (the `source` field convention — launch cites an
evidence node that does not exist). **Read that audit before merging anything.**

### A known graph defect you must fix during merge
`sieve-graph.mjs` has a `SECTIONS` list (~lines 41–43). A section absent from it is **silently
skipped by lint** — not an error. `ugc_laws` and `operator_verdicts` are in that state today: lint
reports "clean, 308 nodes" for a file holding 395. Adding a section without adding it to `SECTIONS`
repeats the bug. Verify by node count after merging.

### Infrastructure
- **Worktrees by generation type**: `gen-launch`, `gen-campaign`, `gen-ugc`, `gen-voice`,
  `gen-image` — each carries `GENERATION-TYPE.md` with its governing bank and hard rules.
- **`craft/CATEGORY-KB-HARNESS.md`** — the repeatable corpus→laws pipeline. A new category
  (try-on, tutorial, unboxing) is a re-run of this, roughly a day at near-zero API cost.
- **Tooling**: the `sieve-*` suite (judge, watch, avatar, speak, phonemic, label, ocr, graph),
  plus `sd25-cost.mjs` for cost estimation and ledger auditing.
- **Research**: `.claude/worktrees/recon-fleet/recon/` — Higgsfield teardown (all 229 motion
  presets named, ~40 Academy lessons, their Marketing Studio taxonomy), six competitor teardowns,
  and an ad-intelligence access playbook.

### Data
- **214 generated videos, 2.0 GB** at `~/Desktop/MUHA-ALL-VIDEOS/`
- **122 analysed winner videos** across four corpora (UGC 29, podcast 37, street 36, launch 20)
- Brand assets in `Brand Context/`, avatars in `Avatars/`

---

## 3. WHAT IS MEASURED ABOUT SEEDANCE 2.5

Full detail: `.claude/worktrees/gen-image/craft/SEEDANCE-2.5-PLAYBOOK.md`. The load-bearing facts:

- **Model** `dreamina-seedance-2-5-260628`, host `ark.ap-southeast.bytepluses.com`.
  The host in ByteDance's own docs (`ap-southeast-1`) **does not resolve**.
- **720p is a hard ceiling.** It accepts `--resolution 720p` and rejects 1080p and 4k in both i2v
  and t2v. For 4K, route to `dreamina-seedance-2-0-260128`, which delivers 2160×3840.
- **Photoreal humans work in text-to-video**, with native lip-synced dialogue. No avatar kit, no
  voice clone, no post-sync.
- **A photoreal human as `first_frame` is REFUSED** — `InputImageSensitiveContentDetected.
  PrivacyInformation`. It refuses even its own generated output. This is a likeness protection.
  **Do not attempt to work around it.**
- **`reference_image` passes for own-brand assets, fails on third-party trademarks.** This is the
  working route to a creator holding a real product: generate the person from text, supply the
  product as a reference.
- **`generate_audio` defaults TRUE** and, undirected, invents a score then refuses its own output
  for copyright. Either disable it or direct it to ambience only.
- **`--dur` to 30s** in one take, and identity holds across the whole take.
- **`video_extension` works** and *resumes* the source — the extension's first frame is a
  re-render of the base's last frame at PSNR 31.26 dB / SSIM 0.907, so face and voice carry.
  It also bills at the cheaper rate. This is the route past 30s.
- **Spell brand names phonetically** — "MOO-ha", not "Muha". Measured A/B.

---

## 4. COST — read this before you generate anything

Rates from the actual invoice: **$0.0107/K tokens** for generation, **$0.0064/K** for
video-to-video. One 5s 720p clip = 108,633 tokens.

| Length | Generated | Extended |
|---|---|---|
| 5s | $1.16 | $0.70 |
| 30s | **$6.97** | $4.17 |

**Spent to date: $283.54 across 140 tasks.** Use `node sd25-cost.mjs estimate --dur 30 --n 3`
before firing anything, and `node sd25-cost.mjs spent` to audit.

**Mandatory discipline:**
1. **Prove every prompt at 5s, then commit at length.** A 30s test roll costs the same as six 5s
   tests. Most of the money wasted in this build went to testing at full length.
2. **Quote the cost to the operator before spending**, not after.
3. **Refusals are billed** — the model completes the work then withholds it. Five refusals burned
   ~$5.81. Every one is now preventable from the laws above.
4. **Extension is 40% cheaper than fresh generation.** Prefer it for anything over 10s.

---

## 5. FAILURE MODES THAT ALREADY HAPPENED — do not repeat them

- **Stopping a workflow does NOT stop the spend.** Submitted tasks keep running server-side. When
  you stop anything, immediately drain the task ledger and download results, or you pay for clips
  you never receive. **28 generations were lost this way.** The recovery pattern is in
  `/Users/Hassoonie/.claude/jobs/*/tmp/recover.mjs` — walk `GET .../tasks`, download every
  succeeded task's `video_url`.
- **Never report a file location without checking the filesystem.** Reading counts from a research
  summary and calling it a location wasted the operator's time three times in a row.
- **Confidence inflation in law banks is real.** The first Seedance pass tagged 13 of 19 laws
  "strong" from single incidents. "Strong" requires a repeated measurement or an unambiguous
  verbatim error. Single observation = moderate. From docs without a live test = weak, and say so.
- **A generic `InvalidParameter` names nothing.** Isolate one variable at a time. A single failed
  probe produced a wrong blanket rule ("resolution is rejected") that a proper re-test corrected to
  "only 720p is accepted."
- **Do not gate launch/campaign work with `sieve-watch.py`** — it hard-fails silent audio and reads
  intended camera moves as defects. It is calibrated for UGC.

---

## 6. THE BIGGEST OPEN GAP — asset reasoning

This is where I would start.

**Avatar asset selection is systematic**: `sieve-avatar.mjs resolve` picks anchors by yaw, light
and expression, with documented reasoning, plus a casting gate and an adversarial verifier.

**Brand asset selection does not exist.** `Brand Context/<Brand>.md` is prose. Choosing which card
image, which product shot, which crop is a human reading a folder and eyeballing it. An employee
cannot do that, and neither can an agent.

Worse: the most expensive lesson of this build — *a card carrying a third-party watch is refused as
a reference image; the same card's own-brand side passes* — **is not encoded anywhere a system can
act on.**

Build a per-brand machine-readable asset index where every asset carries:
`role` · `third_party_marks` (the flag that decides reference-image eligibility) ·
`has_burned_in_type` (animate vs regenerate) · `transparent_bg` · `canonical` ·
`use_for` / `never_use_for`.

Then `resolve` works for brands the way it already works for faces, and a refusal becomes a lookup
instead of a $1.16 lesson. Start with Muha — it is the live campaign.

---

## 7. OTHER OPEN WORK, RANKED

1. **Asset index** (above) — blocks self-serve.
2. **Merge the four law fragments** into `graph/graph.json` per `KB-MERGE-AUDIT.md`, patch
   `SECTIONS`, resolve the `source` convention. Until this happens the banks are documents, not a
   queryable graph.
3. **Wire laws into gates.** No code reads any law bank yet. `sieve-lint.mjs` still enforces a
   2.5–3.5 w/s band that fails UGC's own winners *and* every launch VO spec. The audit lists 15
   `ugc_laws` needing scope qualifiers and seven `sieve-watch.py` gates that misfire on new
   categories. **Laws that nothing enforces are just prose.**
4. **Finish the enhancement studies.** A fleet was stopped partway: prompt ablation, realism
   levers, candidate selection, post-processing, look consistency. Clips exist at
   `.claude/worktrees/gen-image/research/sd25/`; the synthesis was never written.
5. **Moderation map** — the refusal rate on identical benign input is unknown, so a real block
   cannot be told from a coin flip. Also untested: whether the cannabis product category itself
   trips refusals. **This matters before employees start generating.**
6. **Billing visibility** — `arkcli auth login` is needed (the SSO refresh token is expired) to pull
   the real split by API key. There is an unexplained gap between the Seedance line and the
   ModelArk total that is worth understanding before usage scales.

---

## 8. HOW THE THREE PIECES SHOULD COMPOSE

The engine the operator wants is:

**Knowledge graph** = the constraints. Which category this is, what its laws say, which assets are
eligible, what the model will refuse.

**Reasoning model (Opus 5 / Fable 5)** = the router and author. Reads the brief, picks the
category, pulls the governing laws, selects assets by role, writes the prompt to the measured
bands, chooses the model by subject and resolution need, budgets the words by articulation rate.

**Seedance 2.5** = execution, plus 2.0 for 4K and non-human subjects.

Today a human does the middle layer. **The implementation work is making that layer a program.**

---

## 9. FIRST MOVES

1. Read `CLAUDE.md`, then `craft/SEEDANCE-2.5-PLAYBOOK.md`, then `craft/KB-MERGE-AUDIT.md`.
2. Verify the inventory above actually exists — do not trust this document, check the filesystem.
   Prior handoffs in this build were wrong precisely because someone trusted a summary.
3. Ask the operator what "employees using it daily" concretely means — a CLI, a web form, a Slack
   bot, a batch spec file. That answer changes the whole design and is not yet decided.
4. Build the Muha asset index as the first vertical slice, then make one brief → one shipped asset
   run end to end without a human choosing anything.

**Ask before spending. Quote the number first.**
