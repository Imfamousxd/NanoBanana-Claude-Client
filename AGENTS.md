# Content Engine — shared agent contract

This repository is a production content system and a historical campaign archive. Codex,
Claude Code, and other coding agents must use this file as the durable operating contract.

**This file governs doing a content task. [`CONTRIBUTING.md`](CONTRIBUTING.md) governs changing the
repository** — adding a brand, and the structural boundaries around `engine/`, `knowledge/`,
`schemas/`, and the historical archive. Read it before you add a brand or edit anything under
`engine/`. Adding a brand must not require a code change: `brandkit new` scaffolds the pack,
`brandkit validate` proves it is sound.

## Mission

Produce brand-faithful, reference-grounded, measurable content without inventing product facts,
silently spending money, or treating an attractive render as a finished deliverable. Preserve the
historical root-level scripts; new reusable behavior belongs in `engine/`, structured knowledge in
`knowledge/`, schemas in `schemas/`, and operator documentation in `docs/`.

## Start every content task here

1. Identify the brand, audience, channel, deliverable, aspect ratio, and acceptance criteria.
2. Check for a brand pack before designing anything: `npm run content -- brandkit kit <brand>`.
   A pack (`knowledge/brands/<brand>/`) carries the exact tokens, product facts, copy matrix,
   prompt blocks, and already-approved formats. Use them; do not re-derive a design system, and do
   not resurrect a rejected approach the pack's format document already records.
3. Query the knowledge layer instead of loading every brand document:
   `npm run content -- knowledge query "<brand> <task>" --brand <brand-id>`.
4. Copy `examples/ugc-product-story.json` or create a schema-compatible job.
5. Run `npm run content -- plan <job.json>`. Fix every error; discuss material warnings.
6. Before a billable call, confirm scope/cost with the user and set
   `execution.approved: true` in the job. Never infer approval from an old campaign or handoff.
7. Run `npm run content -- run <job.json>`, then review every candidate. For supported images,
   run `npm run content -- review <job.json> <image>` and perform human visual inspection too.
8. Record approved outputs and reusable learnings in the job manifest, the brand pack, or the
   knowledge layer. Do not create another root-level one-off script when the engine can express the
   job. Copy that is exact, legal, or tabular is composed deterministically — see
   `docs/BRAND_PACKS.md`, not an image model.

Run `npm run doctor` after setup and `npm run check` after engine changes.

## Source-of-truth order

When sources conflict, use this order:

1. The user's current request and supplied assets.
2. Approved/canonical assets named in the job.
3. Structured rules in `knowledge/graph.json` and applicable compliance profile.
4. Current sections retrieved from `Brand Context/` and campaign handoffs.
5. Historical scripts, prompts, and generated files as examples only.

Never infer canonical truth from a filename containing `final`, `approved`, or `vN`. Visually
inspect it and verify it against the job's declared reference role.

## Quality gates

- A product, face, character, package, logo, or exact layout that must persist requires a declared
  reference asset with a precise role. Text-only prompting is not a fidelity strategy.
- On-image copy must be supplied verbatim. Long copy, legal lines, QR codes, tables, COAs, and
  packaging microtype should be composed deterministically after generation; do not ask a model to
  invent or redraw them.
- Generate 2–3 candidates for subjective work, but vary one hypothesis at a time. Candidates are
  experiments, not random rerolls.
- Every run needs a manifest containing the compiled prompt, inputs, provider/model, output hashes,
  warnings, and review result. Secrets must never enter a manifest or log.
- A visually polished image can still fail for label drift, fake text, wrong product geometry,
  inconsistent series scale, nonfunctional QR codes, unsupported claims, or wrong audience fit.

## UGC realism contract

UGC should look intentionally captured, not like a commercial pretending to be casual. Start from
creator motivation, setting, performance, and capture behavior. Use a few coherent reality cues:
phone auto-exposure recovery, imperfect reframing, room-tone audio, natural pauses, partial
occlusion, ordinary background entropy, and platform-native pacing. Do not stack generic phrases
such as `cinematic`, `8K`, `perfect skin`, `studio lighting`, or a list of expensive lenses; those
usually produce glossy synthetic advertising.

For video, write observable timed beats and continuity constraints. Separate what the subject does,
what the camera does, what remains invariant, and what is heard. Start with one short shot; only
expand to a sequence after the identity/product/physics pass.

## Regulated-content guardrails

The current catalog includes research peptides, supplements, cannabis, and other regulated or
platform-sensitive categories. Apply the job's compliance profile before creative optimization.

- Never depict or instruct human consumption, injection, reconstitution, dosing, or protocols for
  research-use-only products.
- Never invent efficacy, safety, purity, certification, lab, regulatory, or outcome claims.
- Claims require an explicit source record and current human approval. A disclaimer does not cure
  otherwise noncompliant creative.
- Required disclosures must remain legible in the final asset, not merely present in the prompt.
- Automated review is advisory. A qualified human owns legal, medical, platform, and final brand
  approval.

## Repository hygiene

The repository currently contains a large historical asset surface. Do not bulk-move, rename,
delete, or re-encode it during ordinary content tasks. Follow `docs/REPOSITORY_MIGRATION.md` for a
separate reviewed migration. Generated outputs, caches, temporary job files, logs, and secrets stay
untracked.

