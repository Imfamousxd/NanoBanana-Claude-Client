# Engine + Knowledge-Graph Audit — 2026-08-10

> Background multi-agent audit (`engine-kg-audit` workflow). 4 Claude research agents mapped the
> pipeline / KG / MCP-ledger / selection-finishing subsystems; 4 auditor agents each debated GPT-5.4
> (Codex) and reconciled; 1 synthesizer merged the result. 9 agents, ~855K tokens, 16 min, 0 errors.
> Consensus tags: **agreed** = Claude+GPT-5.4 concurred · **contested** = they disagreed (noted) ·
> **claude-only** = one auditor, uncontested.

# Engine Gaps

Ranked by leverage (blast radius × confidence, dear-money fixes first). Duplicates across the four audits are merged; merged provenance noted inline.

### 1. Candidates are all generated and PAID before any gate runs, and every candidate submits an identical body
`--n 3` re-rolls the same prompt at 3× cost with no early abort and no diversity — re-rolling the average IS the AI look (CLAUDE.md rule 3).
- **Evidence:** `video-engine.mjs:439-441` `Promise.all` fires N `runCandidate` concurrently; `:443` gate loop runs only afterward; `:340` body identical each candidate.
- **Severity:** high
- **Fix:** Gate c1 before firing c2/c3 (fire one → gate → decide) so a systematic failure aborts at 1× not 3×; make `--n` vary a NAMED substitution (light/framing/moment) per candidate instead of resubmitting.
- **Consensus:** agreed (Codex added the identical-body sharpening).

### 2. The proof gate is satisfied by API success, not content success
The cheap-first proof exists to catch object-permanence failure, yet a visually-broken but API-succeeded 5s proof unblocks the expensive `--go` run.
- **Evidence:** `video-engine.mjs:201-203` `proofDone` = a proof `.task.json` with status `succeeded`, no content check; `:412` watcher gated on `mode==='go'` so proof clips get no watcher pass; `:290-291` go proceeds once `proofDone`.
- **Severity:** high
- **Fix:** Run `sieve-watch.py` on the proof clip (drop the `mode==='go'` guard); require a recorded operator/gate verdict — not `status==='succeeded'` — before `proofDone` flips true.
- **Consensus:** agreed.

### 3. No semantic VLM judge for VIDEO, and video survivors are presented UNRANKED
`sieve-judge` is image-only, so video is never scored on the mode that kills it (invented motion, lost object-permanence, extra limbs); `sieve-watch` is arithmetic and cannot see a growing forearm. "Selection" for video is filter-out, never choose-best.
- **Evidence:** `sieve-judge.mjs:60` `IMG_RE` matches only png/jpe?g/webp; `video-engine.mjs:439-486` gates then presents all survivors with no rank/HERO.
- **Severity:** high
- **Fix:** Extract keyframes (1–2 fps) + a strip montage → multi-image Gemini call against a video rubric (object-permanence / limb-count / invented-motion blocks); run the existing pairwise rank over survivors to repoint a video HERO; wire as advisory Tier-2 after `sieve-watch` in `gateCandidate`.
- **Consensus:** agreed.

### 4. Identity likeness is never gated on the DELIVERED clip
The casting gate fires only on the INPUT canonical; `verify` is never called on output frames; `sieve-longform` merely prints the verify command. Face/wardrobe/lip-sync drift across a shipped clip is unverified unless a human remembers to run it by hand.
- **Evidence:** `video-engine.mjs:184` casting gate on input `avatarFrame`, `gateCandidate` (375-432) never invokes verify; `sieve-avatar.mjs:640-642` verify discovers only stills; `sieve-longform.mjs:167-168` only `console.log`s the command.
- **Severity:** high
- **Fix:** Extract N frames per survivor clip, run `sieve-avatar verify` against the canonical as a load-bearing gate; make `verify` accept a video path (auto-extract). Reject clips whose mid/last frames drift.
- **Consensus:** agreed.

### 5. Claims / privacy / marks gate trusts author-declared metadata, not the artifact
Only the declared `claims_used` list is validated against the registry; the actual spoken beats are never scanned; privacy/marks fire on hand-set booleans; `--claims-initialed` accepts any string. The registry marks the spoken prize form unapproved yet a brief paraphrases it.
- **Evidence:** `video-engine.mjs:96-101` loops only over `B.claims_used`; `:114` builds `spoken` but nothing scans it; `:108-110` privacy/marks on booleans (108 refuses, 109 only warns); `:102,288` sign-off presence-only. `sieve/brands/Muha_Meds/campaigns/golden-hour-rolex.json` vs `briefs/gh-ugc-car.video.json:43`.
- **Severity:** high
- **Fix:** Scan assembled `spoken` for claim-shaped statements (numbers, prize/medical/superlative patterns), require each to map to a SOURCED registry entry or `{{SLOT}}`; treat `contains_person`/`third_party_marks` as detections (OCR/person-detector) not self-declaration; reconcile `--claims-initialed` against `claims_signoff`.
- **Consensus:** agreed (raised in both pipeline and kg audits).

### 6. The KG is decorative — the engine hardcodes what it claims to read live
The header says it reads `house_laws.json`/`seedance25_laws.json` "the SAME sources every time," but it imports NO fragments: HOUSE, MODELS and the ladder are hardcoded copies that already drift, and each law's confidence/counterexamples/conflicts are never consulted.
- **Evidence:** `video-engine.mjs:10-15` docstring names the graph as authoritative; `:32-37` imports only ledger + repo-root, no fragment read; `:56-80` MODELS/HOUSE hardcoded. Drift: engine `campaign.wps=[2.8,3.3]` vs law "3.0-3.14" (`house_laws.json:33`).
- **Severity:** high
- **Fix:** Load fragments at runtime and derive HOUSE/MODELS/ladder from them (single source of truth), or codegen the constants from JSON in CI with a checked-in hash; add a regression test asserting engine constants equal law values (would have caught the wps drift).
- **Consensus:** agreed (both auditors independently; Codex: "laws cannot evolve without code edits").

### 7. sieve-longform's advertised per-hop face verification is fake and the printed command is broken
The verify glob targets `*_last.png`, but anchor mode never writes any, and chain mode skips the final segment — so the command matches at most N-1 frames in chain and ZERO in anchor. Concatenation is raw `-c copy` with no format-compat/seam/loudness handling and invokes neither `sieve-watch` nor the ledger.
- **Evidence:** `sieve-longform.mjs:144-149` tail frame written only when `MODE==='chain' && n<length`; `:167-168` prints `--candidates '<OUT>/*_last.png'`; `:161` `ffmpeg concat -c copy`; no `sieve-watch` call in file.
- **Severity:** high
- **Fix:** Run `verify` per hop inside the loop (stop on drift as the header claims), emit last frames in BOTH modes, fix the glob, route the concatenated piece through `sieve-watch` + the ledger, and add a stream-compat probe before `-c copy` (or re-encode).
- **Consensus:** agreed.

### 8. The watcher's founding check (silent 1080p→720p halving) is disabled for every 1080p deliverable
Expected dimensions are passed to `sieve-watch.py` ONLY for 720p 9:16 clips, so a downscaled 1080p product/avatar clip has nothing to compare against.
- **Evidence:** `video-engine.mjs:417` `--expect-w/--expect-h` pushed only if `res==='720p' && ratio 9:16`; `sieve-watch.py:12-13` names the halving as a core reason the tool exists; `:108-109` the FAIL fires only when expected dims are provided.
- **Severity:** high
- **Fix:** Always compute and pass `--expect-w/--expect-h` from the routed resolution+ratio (1080p, 4:5 too), so the check runs on the lanes that actually ship at 1080p+.
- **Consensus:** claude-only (Codex did not raise; uncontested).

### 9. Operator `--why` is captured, echoed, then discarded — the ledger has no reason column
The single highest-value training signal (why a human rejected a clip the machine PASSED) is never stored.
- **Evidence:** `gen-verdict.mjs:85` prints "why (not persisted…)"; `mcp-server.mjs:189` schema admits "surfaced to the operator, not stored"; `engine-ledger.mjs:84-92` `updateVerdict` patches only `operator_verdict`; `_probe/engine_generations.sql` has no reason column.
- **Severity:** high
- **Fix:** Add a nullable `operator_note`/`reject_reason` column; have `updateVerdict(task_id, verdict, why)` PATCH it; pass `--why` straight into that write.
- **Consensus:** agreed (Codex's #1).

### 10. `updateVerdict`/`updateGates` PATCH with `return=minimal` — a zero-row match still reports `{ok:true}`
A mistyped/stale `task_id` writes nothing yet the operator is told "ledger:ok" on the one write that closes the loop.
- **Evidence:** `engine-ledger.mjs:75 & :87` PATCH with `return=minimal`; `req()` throws only on `!res.ok`, never on 0 rows.
- **Severity:** high
- **Fix:** Switch to `return=representation` (or `count=exact`), treat zero rows as failure, surface "no such task_id"; add a reviewer-identity field and an undo/reset path.
- **Consensus:** agreed.

### 11. "Delivered" is a display alias for `approved`, not a real lifecycle state
No delivery timestamp, destination, or actor exists, and the ledger stores the raw generation path — not the post-processed deliverable — so the flywheel never provably turns.
- **Evidence:** `_probe/engine_generations.sql:24` `operator_verdict DEFAULT 'pending'`; `gen-verdict.mjs:54` `delivered=(operator_verdict==='approved')`; `video-engine.mjs:364,471` stores pre-post path.
- **Severity:** high
- **Fix:** Model delivery as an explicit state (`delivered_at`/`delivered_to`) distinct from approved, and record the FINAL post-processed artifact path.
- **Consensus:** agreed (Codex: delivery is *unrepresentable*, not just unused).

### 12. Broken/dead first-frame path for the artwork-i2v lane
A top-level `first_frame` flips `--ratio` to adaptive and drives cost accounting, but `buildBody` never appends it to the request body — the advertised non-avatar i2v lane would silently pay for a frameless text-to-video.
- **Evidence:** `video-engine.mjs:228` reads `B.refs?.first_frame`; `:231/:317` sets adaptive ratio + ledger; `buildBody :238-245` pushes avatarFrame + refs.images + refs.video but never `B.refs.first_frame`. No brief populates it as data today (latent).
- **Severity:** med (latent, not currently bleeding money)
- **Fix:** Append `B.refs.first_frame` with `role:'first_frame'` when the lane is non-avatar; add a proof-mode assertion that `hasFirstFrame` implies a first_frame part is present; validate `refs.video` existence/privacy before submit. Or delete the dead field and its ratio-flip.
- **Consensus:** agreed (raised in three audits).

### 13. Finishing grade is image-only; video post fails open
The LOCKED film-grain + cast-neutralize grade never touches video; `video-engine` post is loudnorm + optional lanczos, both in try/catch that logs and continues — a post crash silently ships an ungraded clip.
- **Evidence:** `film-grain.py:100` single-still `Image.open`; `video-engine.mjs:453-460` loudnorm try/catch fails open, `:465-473` lanczos fails open.
- **Severity:** med
- **Fix:** Add a lane-aware video grade (extract→grain+neutralize→re-encode, or ffmpeg geq/noise tuned to match emulsion clumping); record whether each post step actually succeeded instead of failing open.
- **Consensus:** agreed.

### 14. Watcher modality mapping misfires campaign cuts and false-FAILs handheld UGC
`subject.type==='product'` on a campaign clip maps to modality `product`, turning intended ~4.3s cuts into hard FAILs; the static-patch flicker check assumes a rigid background, so handheld motion false-FAILs.
- **Evidence:** `video-engine.mjs:413-414` `watcherModality = subject.type==='product' ? 'product' : 'ad'` overriding lane; `sieve-watch.py:258` large histogram jump → FAIL; `:260-292` static-patch flicker >3.0 DN → FAIL.
- **Severity:** med
- **Fix:** Map modality from LANE first (campaign→ad regardless of subject.type); gate/relax the static-patch check when the brief declares handheld/moving camera.
- **Consensus:** agreed.

### 15. Transcript gate is dormant unless the author lists `required_tokens`
Most talking-head clips get no speech verification; wrong/garbled dialogue survives (the watcher catches only a speaker CHANGE, never wrong words).
- **Evidence:** `video-engine.mjs:379` gate condition `talking && (B.required_tokens||[]).length`; `briefs/sol-ugc-testimonial.video.json` and `sol-card-ugc.video.json` have spoken beats but no tokens.
- **Severity:** med
- **Fix:** Auto-derive expected tokens from the scripted beat lines; whisper the clip and WARN on low word-overlap even when `required_tokens` is empty.
- **Consensus:** claude-only (Codex framed the adjacent claims-declaration problem; uncontested).

### 16. Duration ladder validated uniformly, but the avatar lane caps near 12s
A 30s avatar brief passes validation, routes, and is PAID before the model truncates; the watcher then FAILs it on duration — after the spend.
- **Evidence:** `video-engine.mjs:77` ladder `[5,10,30]` checked `:119-120` for every lane; `:73` avatar = `seedance-1-5-pro`; `graph-fragments/seedance25_laws.json:94` records 30s only on 2.5/2.0.
- **Severity:** med
- **Fix:** Make the ceiling lane/model-specific — cap the 1.5-pro avatar lane at ~12s and refuse a longer avatar brief pre-spend.
- **Consensus:** claude-only (uncontested).

### 17. Cost certainty overstated; NaN-rate lanes still spend
`cost()` returns NaN for mini/fast lanes yet `--go` proceeds and pays; the per-second MODELS table (asserted "measured") and the token-based ledger formula diverge ~50% on the product lane.
- **Evidence:** `video-engine.mjs:251` NaN for mini/fast; `:283-292` no NaN guard on `--go`; `:57-74` perSec asserted measured vs `:326-327` ledger recomputes at flat 0.0107/1K; `seedance25_laws.json:149-155` rates UNPROBED.
- **Severity:** med
- **Fix:** Refuse (or require explicit `--measure`) when `cost()===NaN`; reconcile the pre-spend table with the ledger formula onto one basis.
- **Consensus:** agreed.

### 18. House enforcement is partial; `HOUSE.*.shots`/`.ratio` are dead constants
Only the ladder and wps band block; shot-count, ratio, hook-timing, loudness and no-caption laws have no enforcement path, and the const advertises enforcement it does not do (ratio comes from the brief, not `HOUSE[lane].ratio`).
- **Evidence:** enforced at `video-engine.mjs:118-126`; `HOUSE[lane].shots/.ratio` never dereferenced; ratio taken from `B.ratio` (`:231,317,417,465`); laws ship in `house_laws.json:31,71-93`.
- **Severity:** med
- **Fix:** Either enforce the remaining house laws or delete the dead fields.
- **Consensus:** agreed.

### 19. `sieve-judge` doesn't enforce product-lock `--refs` and `--rank` hardcodes the UGC-realism question
Product-lock without refs yields a meaningless verdict; ranking any batch silently orders by "most likely a real unedited photograph" — wrong axis for product/cinematic. The ugc↔cinematic mutual exclusion is prose-only.
- **Evidence:** `sieve-judge.mjs:175` refs optional with no rubric guard; `:161` rank prompt hardcoded regardless of `rubricId`.
- **Severity:** med
- **Fix:** Require `--refs` when `rubricId==='product-lock'` (non-zero exit without it); parameterize the rank question per rubric; encode the ugc/cinematic exclusion in code.
- **Consensus:** claude-only (uncontested, confirmed against code).

### 20. `lock()` promotes an avatar to `locked` regardless of surviving anchors
The 4-angle coverage matrix has no minimum and no left-turn/profile/full-body coverage, so a zero-anchor or all-frontal avatar is still stamped locked and production-usable.
- **Evidence:** `sieve-avatar.mjs:339` writes `status:'locked'` unconditionally after `buildCoverage`; matrix `:120-125` only 4 angles; kept count never gates.
- **Severity:** med
- **Fix:** Require a minimum of distinct verified (yaw·light) anchors before lock (else refuse or mark "thin"); widen the matrix to a genuine left turn, profile, and an alternate lighting setup (matches the documented Marcus/Renee gaps).
- **Consensus:** agreed.

### 21. MCP surface can't drive the loop: no pending queue, thin status, no reason-persisting path
`listPending` exists but isn't an MCP tool; `engine_status` omits prompt/seed/tokens/resolution/campaign/final-artifact; the only reason-bearing verdict path is off-MCP.
- **Evidence:** `engine-ledger.mjs:96` `listPending` unexposed; `mcp-server.mjs:183` `--why` non-persistent; `craft/MCP.md:78-81`; 50-row cap with no pagination (`engine-ledger.mjs:100`).
- **Severity:** med
- **Fix:** Wrap `listPending` as `engine_pending`; widen `engine_status`'s select; expose the reason-bearing verdict path through MCP.
- **Consensus:** agreed.

### 22. Ledger read failures are indistinguishable from an empty ledger; two notions of root
Outages surface as "no pending work"; the MCP spawns engine scripts with `cwd=server-dir` while `engine-ledger` derives paths via `repoRoot()`, so a relocated deploy can read a different `.env`/project.
- **Evidence:** `engine-ledger.mjs:106-108 & :124-127` swallow errors → `[]`; `gen-verdict.mjs:41` prints "no rows (or ledger offline)" for both; `mcp-server.mjs:32` `cwd:DIR` vs `engine-ledger.mjs:16` `REPO=repoRoot()`.
- **Severity:** low
- **Fix:** Return `{ok:false,error}` on fetch failure so callers can print "ledger OFFLINE" vs "no rows"; unify root (pass `repoRoot()` or set cwd to it).
- **Consensus:** agreed on the outage half; cwd/repoRoot divergence is claude-only.

---

# Knowledge-Graph Gaps

### 1. None of the four new banks is merged into `graph.json`, and lint silently SKIPS sections absent from SECTIONS
The defect the fragments' own `_merge_note` warns about is already live for 87 nodes (`ugc_laws`, `operator_verdicts`) plus all four new banks — lint still reports "clean" over a partial graph, and `CONFLICTS_WITH` never fires because no bank is in `graph.json`.
- **Evidence:** `graph.json` top keys have `ugc_laws`+`operator_verdicts` but NOT house/seedance25/post/creative; `sieve-graph.mjs:41-43` SECTIONS omits all `*_laws`; `house_laws.json:2` / `seedance25_laws.json:2` warnings; `craft/HANDOFF-video-engine.md:55`.
- **Severity:** high
- **Fix:** Merge the four banks into `graph.json`; add every law-bank section name (incl. the orphaned two) to SECTIONS; make lint FAIL, not skip, on any `graph.json` section missing from SECTIONS (assert node-count coverage).
- **Consensus:** agreed.

### 2. `kg-vault.py` ingests only Seedance — house/post/creative (42 laws) are silently dropped from the "single source of truth" vault
And `kg-vault-test.py` globs all fragments for its schema check, hiding the build-time omission.
- **Evidence:** `kg-vault.py:27-31` FRAGMENTS lists only `seedance25_laws`; `LAW_BANKS` `:33` and PLACE map `:68-72` likewise; `kg-vault-test.py` globs `*/graph-fragments/*.json` so no test fails.
- **Severity:** high
- **Fix:** Add house/post/creative to FRAGMENTS, LAW_BANKS and PLACE; add a regression asserting every fragment bank on disk also appears in the built vault.
- **Consensus:** agreed.

### 3. Weak (n≤3) and documented-external bands are enforced as exit-2 hard refusals
The wps band, the 5/10/30 ladder and the 4.3s campaign rhythm hard-refuse despite `house_laws.json` self-warning every law there is weak or moderate and `01_FINISHED` is 21/214 with one watched. A miscalibrated hard gate on thin evidence gets routed around.
- **Evidence:** `house_laws.json:5` `_sample_warning`; enforced `video-engine.mjs:119-122`; ladder admits 15s counterexamples the engine ignores.
- **Severity:** med (structurally couples to Engine #6 — confidence must be readable at runtime first)
- **Fix:** Tie block-vs-warn to each law's confidence: hard-refuse only on strong/moderate (keeping an `off_ladder_reason` override), downgrade weak bands to loud WARNs until the corpus grows.
- **Consensus:** agreed.

### 4. `seedance25_laws` header asserts "everything MEASURED against the live API" but 10 of 35 laws are `documented` (unmeasured docs)
The bank-level provenance claim is false for its newest third.
- **Evidence:** `seedance25_laws.json:3` MEASURED claim; confidence breakdown 18 strong / 1 measured / 5 moderate / 1 weak / 10 documented (five-part-structure, reference-authority, audio-syntax-tags restate the shared guide).
- **Severity:** med
- **Fix:** Scope the MEASURED claim to the measured core, or split the 10 documented laws into a `seedance25_docs` bank.
- **Consensus:** agreed.

### 5. The confidence enum collapses PROVENANCE and SAMPLE-STRENGTH onto one ordinal
A 26/26 all-documented creative bank and a 12/12 all-weak house bank read as comparably soft though they fail for opposite reasons, and "strong" (18 sd25 laws) can rest on a single probe.
- **Evidence:** `kg-law.mjs:26` `CONF=[measured,strong,moderate,documented,weak]` one flat list; `creative_laws.json` 26/26 documented; `house_laws.json:5`; sd25 "strong" from single ark_probe/res_probe runs.
- **Severity:** med
- **Fix:** Split into two orthogonal fields — `provenance` (measured-on-our-endpoint | documented-external) and `strength` (n / effect size).
- **Consensus:** agreed (both auditors independently).

### 6. Cross-bank conflicts exist only as prose; no structured `CONFLICTS_WITH` edge, and the engine models only ugc|campaign lanes
House UGC cadence/hook vs generic `ugc_laws`; commercial captions/late-hook vs house no-caption/hook-lands-later. The default prompt bans all captions/logos while a creative law requires campaign captions, and lane is ignored.
- **Evidence:** prose at `house_laws.json:32,40` and `creative_laws.json:126,150`; `kg-law.mjs:25` REQUIRED has no `edges` field; `sieve-graph.mjs:45` defines `CONFLICTS_WITH` but no bank is in `graph.json`; `video-engine.mjs:76-80` knows only ugc/campaign, so giveaway/static-ad/packshot lanes have no engine counterpart.
- **Severity:** med
- **Fix:** Add an optional `conflicts_with` edge (losing-law id + scope), merge banks into `graph.json` so lint resolves it, and extend/map the engine lane model onto the creative lanes so a conflict surfaces at plan time.
- **Consensus:** agreed.

### 7. `kg-vault-test.py` certifies SHAPE, not TRUTH
It checks the six field keys are present but never validates confidence ∈ enum, self-contradiction, or freshness; its only count assertion is `>= 224`. A hand-edited fragment (the core loop invites hand edits) with a bad confidence value passes green — `kg-law.mjs` enforces the enum only on `add`, which a direct JSON edit bypasses.
- **Evidence:** `kg-vault-test.py:66` FIELDS is a presence set; `:85` `len(allids) >= 224`; no confidence-value or contradiction check; `kg-law.mjs:26` enum only on add.
- **Severity:** med
- **Fix:** Assert confidence ∈ enum, fields non-empty, and a contradiction/staleness lint (a law referencing a since-deleted law id).
- **Consensus:** agreed.

### 8. Two disjoint verdict stores never join; the KG's reserved operator-verdicts slot stays empty
`sieve/verdicts/watch-verdicts.jsonl` captures because+scene but is keyed on clip-path + watcher-check-slug, never on the Supabase `task_id`, and is never merged into the ledger row or KG. `kg-vault.py:91` reserves `70-Evidence/Operator-verdicts` that stays empty — and `operator_verdicts` is absent from lint SECTIONS, so even once populated it is silently skipped.
- **Evidence:** `sieve-verdict.mjs:22` says the merge is "mechanical" but undone; `:34` keyed by clip path+check; `kg-vault.py:91` reserves the slot; fragment `_merge_note`s name `operator_verdicts` as unvalidated.
- **Severity:** med
- **Fix:** Key `sieve-verdict` records to `task_id` (resolve via the `.task.json` sidecar), emit `watchv:*` records into `graph operator_verdicts`, and add the section to SECTIONS.
- **Consensus:** claude-only on the specific store; Codex converged on the theme ("disconnected law JSON — no verdict/evidence edges").

### 9. `rejected_by='operator'` is declared "the enhancement backlog" but nothing aggregates it into candidate laws
The reject→new-gate-rule loop has no mechanical step; `listRecent` returns these rows mixed with everything else. Compounding: `kg_add_law` upserts overwrite history and validation runs AFTER mutation with no rollback, so even manual promotion is lossy.
- **Evidence:** `gen-verdict.mjs:10-12` intent; `engine-ledger.mjs:114-123` `listRecent` unfiltered; `kg-law.mjs:68` upsert overwrites; `mcp-server.mjs:247` validate-after-mutate.
- **Severity:** med
- **Fix:** A report filtering `rejected_by='operator'` (machine PASSED, human FAILED) as a distinct learning queue, joined to its captured reason, drafting candidate laws for `kg_add_law` review; validate-before-mutate with rollback.
- **Consensus:** agreed on the absence; Codex added the lossy-promotion detail.

### 10. KG/docs contradict runtime and identity data is drifting
`kg_recipes` routes a VIDEO output dir to the image-only `sieve-judge` (matches zero files); `post_laws.json` is an unmerged/unlinted worktree fragment; Tasha's `identity.json` says `locked` while her `AVATAR.md` says `casting`; Brooke is `casting` yet carries locked-tier canonical portraits; Sol has no `identity.json` and is invisible to `findKit`.
- **Evidence:** `kg_recipes_data.py:62` sends video dir to `sieve-judge`; `graph-fragments/post_laws.json:2` `_merge_note`; `Avatars/Tasha/identity.json` vs `AVATAR.md:4`; `Avatars/Brooke/identity.json` casting + portraits present; `Avatars/Sol/` no `identity.json`.
- **Severity:** med
- **Fix:** Make `identity.json` the single source and lint `AVATAR.md` against it; merge `post_laws` into `graph.json` + SECTIONS; generate or delete Sol's stub; resolve Brooke's stray canonicals; and either build the video judge or stop the recipe pointing video at the image judge.
- **Consensus:** agreed.

### 11. The two banks the engine trusts most rest on the thinnest evidence
`creative_laws` is 26/26 documented (zero ground truth on our endpoint) and `house_laws` — whose `_why_this_bank_exists` declares "where the two disagree, this one wins" over generic `ugc_laws` — is 12/12 weak-or-moderate with framing laws at n=1 video / 3 frames.
- **Evidence:** `creative_laws.json` all documented; `house_laws.json:5` warning; framing laws `:71-93`.
- **Severity:** med
- **Fix:** Queue the highest-leverage creative+house laws for A/B on our own endpoint; until then gate the "house wins over ugc" override behind a minimum-strength threshold rather than applying it unconditionally.
- **Consensus:** agreed on provenance; the "house wins on thinnest evidence" framing is claude-only.

### 12. Watcher thresholds have measured false positives on paid clips but are hardcoded and frozen
Voice-timbre FAIL >35% centroid jump flagged a genuine excitement beat in one continuous native take; static-patch flicker FAIL >3.0 DN flagged a patch on a moving car window. Both operator-overruled, logged only as ledger notes, with no mechanism to feed overrules back.
- **Evidence:** `sieve-watch.py:205` timbre >35 FAIL, `:288` flicker >3.0 FAIL, both hardcoded; `sieve/verdicts/watch-verdicts.jsonl` holds 2 overrules; MEMORY says re-tune at n≥5, never auto-apply.
- **Severity:** low
- **Fix:** Accumulate to n≥5 per threshold then re-tune from the ledger; meanwhile make the two contested checks WARN-not-FAIL for their misfire contexts (continuous-take excitement beats; patches landing on globally-moving regions). Do not auto-apply.
- **Consensus:** claude-only (Codex did not address watcher calibration).

### 13. Three non-converged long-form/finishing paths; the recorded-human voice path is documented-best yet entirely unused
`sieve-longform` (Seedance stitch, self-polls, no watcher/ledger), `sieve-veo` (Veo native extend), and `video-engine` (gated, single-shot) coexist; only `video-engine` is Tier-1 gated. No avatar carries a recorded-human `voiceSource` — Marcus/Tasha are Seedance-cast synthetic — so the human-believability claim is aspirational.
- **Evidence:** `sieve-longform.mjs:84-150` own poll, no `sieve-watch`; `sieve-veo.mjs` separate extend; only `video-engine.mjs:412` calls `sieve-watch`; `--from-source` exists but no `identity.json` sets `voiceSource:recorded-human`.
- **Severity:** low
- **Fix:** Converge the three onto one gated pipeline (route stitch + extend through `sieve-watch` + the ledger before delivery); exercise the recorded-human voice path on at least one avatar to validate the claim, or demote it from documented-best to untested.
- **Consensus:** agreed. **Contested nuance:** Codex treats `sieve-longform`'s "same seed holds voice" (`:59,123`) as unproven, citing Sol's AVATAR.md that a seed pins a clip, not a person. E6 actually measured seed DOES hold voice timbre while NOT carrying identity across shots — the two claims are compatible, so this is a framing dispute, not a refutation.

---

# Enhancement Roadmap

Ordered cheapest-highest-confidence first; each line is one build with its rationale.

1. **PATCH `return=representation` + zero-row failure on verdict/gate writes** (Engine #10) — a few lines, kills a silent false "ledger:ok" on the one write that closes the loop.
2. **Add the `operator_note`/`reject_reason` column and persist `--why`** (Engine #9) — one column + one PATCH field; captures the single highest-value training signal that is currently thrown away.
3. **Require `--refs` for product-lock and parameterize the rank question per rubric** (Engine #19) — small guard in one file; stops meaningless product verdicts and wrong-axis ranking.
4. **Always pass `--expect-w/--expect-h` from routed res+ratio** (Engine #8) — compute-and-pass change; re-enables the halving check the watcher was built for on every 1080p lane.
5. **Map watcher modality from LANE, not `subject.type`; relax static-patch on declared handheld** (Engine #14) — one branch; stops campaign cuts and UGC motion false-FAILing.
6. **NaN-cost guard + lane/model-specific duration ceiling** (Engine #17, #16) — two pre-spend refusals; prevents silent spend on unprobed lanes and doomed 30s avatar briefs.
7. **Fix or delete the first-frame path; validate `refs.video`** (Engine #12) — append the frame with `role:'first_frame'` + proof-mode assertion, or remove the dead field; closes a latent frameless-pay bug before any brief triggers it.
8. **Fix `sieve-longform`: verify per hop, emit last frames in both modes, fix the glob, route concat through watcher+ledger, add stream-compat probe** (Engine #7) — corrects an advertised-but-fake safety and prevents silent seam desync.
9. **Enforce a minimum verified-anchor count before `lock()`; widen the coverage matrix** (Engine #20) — stops thin/all-frontal avatars shipping as production-locked.
10. **Merge the four banks into `graph.json`, add all bank sections to SECTIONS, and make lint FAIL (not skip) on missing coverage** (KG #1) — unblocks conflict edges and stops "clean" reports over a partial graph; prerequisite for confidence-aware gating.
11. **Register house/post/creative in `kg-vault.py` + add a build-coverage regression** (KG #2) — restores 42 dropped laws to the single-source vault.
12. **Split confidence into `provenance` + `strength`; scope the sd25 MEASURED header; harden `kg-vault-test` (enum/contradiction/freshness)** (KG #5, #4, #7) — makes law trust machine-readable, the precondition for everything below.
13. **Load KG fragments at runtime (or codegen with a checked-in hash) + regression asserting engine constants == law values** (Engine #6) — ends the decorative-KG drift; laws can finally change behavior without a code edit.
14. **Tie block-vs-warn to law confidence; enforce or delete the dead `HOUSE.*` fields** (KG #3, Engine #18) — downgrades weak hard gates to WARNs so they stop getting routed around. Depends on #12–13.
15. **Scan the assembled `spoken` text for claim-shaped statements against a SOURCED registry; treat privacy/marks as detections; auto-derive transcript tokens from beats** (Engine #5, #15) — moves compliance and speech verification from honor-system to artifact-based.
16. **Model delivery as an explicit state storing the final post-processed path; wrap `listPending` + widen `engine_status` + expose the reason-verdict path over MCP** (Engine #11, #21) — makes "reached the goal" a written fact and lets the loop be driven without shelling out.
17. **Key `sieve-verdict` to `task_id`, emit `operator_verdicts` into the graph, and add a `rejected_by='operator'` learning-queue report that drafts candidate laws** (KG #8, #9) — turns human overrules into the reject→new-rule flywheel the code only promises today.
18. **Build the video-aware VLM judge (keyframes+montage → Gemini rubric → pairwise rank → video HERO) and gate delivered-clip identity via `sieve-avatar verify` on extracted frames** (Engine #3, #4) — the biggest correctness win and the most expensive; addresses the unsolved video layer, so it lands after the cheap gates and the confidence rework that will tune it.
19. **Add a lane-aware video finishing grade (grain + neutralize per frame) and make post record per-step success instead of failing open** (Engine #13) — brings video up to the LOCKED image finish once the gated pipeline is trustworthy.
20. **Converge the three long-form/finishing paths onto the one gated pipeline; exercise the recorded-human voice path on one avatar or demote the claim** (KG #13) — final consolidation once #8 and #18 make a single gated route viable.
