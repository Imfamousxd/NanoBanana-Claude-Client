# Self-improvement loop

The engine learns from verdicts. Every prompt is logged; every human call on an output is turned
into durable, brand-scoped memory that the next prompt reads before it is written.

```
prompt ──► generation ──► human verdict ──► memory ──► next prompt
             │                │
             ▼                ▼
   .content-engine/     knowledge/learnings/<brand>.json     (tracked)
   prompt-log/…jsonl    Brand Context/assets/<Brand>/approved/ (tracked image copies)
   (local, raw)         knowledge/products/<brand>.json      (approved-output refs)
```

## Write side

**Prompt log** — `.content-engine/prompt-log/<brand>/<YYYY-MM>.jsonl`, append-only, local. Every
`job_run` writes a row automatically (prompt, provider/model, params, refs with hashes, outputs with
hashes, manifest path). Work done outside the engine is logged with `prompt_log` (MCP) or
`npm run content -- learn log`. Secrets are redacted before the row is written.

**Verdicts** — `feedback_record` (MCP) or `npm run content -- learn record`. The target is a log id
(`pl_…`) or the output file path; unlogged historical work can be judged by passing the prompt,
provider and output directly. Every verdict needs a concrete reason — it becomes the evidence line.

| Verdict | What is written |
| --- | --- |
| `approved` | An **exemplar**: exact prompt, provider/model, params, reference files, output hash, tags, reason. The image is copied to `Brand Context/assets/<Brand>/approved/<event>__<name>.jpg` (≤2048px, PNG kept when it has alpha) so it is tracked and survives the local-only libraries. The copy is also appended to the brand's product registry as an `approved-output` reference (attached to the product when `product` matches a sku/name), so the image knowledge graph grows with every win. An optional `law` records the rule the approval confirms. |
| `rejected` | A **law** from `law.claim` (or, failing that, from the reason), with the reason as evidence and `applies_to` = category/product. A near-duplicate claim (token Jaccard ≥ 0.5) is folded into the existing law: evidence appended, `occurrences` incremented, confidence bumped one rung (weak → moderate → strong; `measured` is set only by hand). The prompt snapshot stays in `events[]` as a negative example. |
| `revise` | An event with the reason; a law only if one is supplied. |

All verdicts update `stats`: counts per provider, per category, and per provider × category. That is
the routing signal.

## Read side

`context_pack(brand, brief, category?)` assembles, for the products the brief names:

1. brand invariants from the graph's prompt profile
2. exact reference files (canonical first) and logos, with on-disk / tracked flags
3. banned files, locked rules from the registry (brand and product level), locked spellings
4. learned laws ranked against the brief (brand laws first; meme laws for Muha; video banks for video modes)
5. approved exemplars ranked against the brief — image path **and the prompt that made it**
6. recent rejections for the same category/product
7. compliance profile with the verbatim disclosure and forbidden concepts
8. provider routing rules plus the learned approval rate per provider for this category
9. ranked knowledge chunks

`promptBlock` is the same pack rendered as Markdown for pasting into a system prompt. The
`learnings` context category also makes laws and exemplars retrievable through `knowledge_query`
(each law and exemplar is its own chunk).

## Where the memory lives

```
knowledge/learnings/<brand>.json         learning-registry/1 — laws[], exemplars[], events[], stats
Brand Context/assets/<Brand>/approved/   tracked copies of approved images
knowledge/products/<brand>.json          approvedOutputs[] + per-product approved-output references
knowledge/graph.json                     category.learnings + registry.<brand>-learnings nodes, has-learnings edges
.content-engine/prompt-log/              raw prompt rows + verdict markers (local, gitignored)
```

Learning stores are JSON on purpose: reviewable in a diff, mergeable across people, and indexed by
the same lexical retrieval as everything else. Commit them with the work they describe.

## Discipline

- **Reason, not adjective.** "badge ~30% too large, touches the corner radius" teaches; "bad" does not.
- **State laws generally.** The reason is what happened; the `law.claim` is the rule it proves
  ("Nano Banana will not rescale a badge on a rendered device — use gpt-image-2 edits").
- **One verdict per output.** Candidates are experiments; judge each one.
- **Search before adding.** `laws_search` first; a repeated rejection should strengthen, not duplicate.
- **Approvals carry the product.** Pass `product` so the registry attaches the exemplar to the right sku.
- **Confidence is earned.** New laws are `weak`; `measured` is reserved for an A/B you actually ran.

## CLI equivalents

```
npm run content -- context <brand> "brief" [--category c] [--product a,b] [--json]
npm run content -- learn log --brand b --prompt "…" --provider p [--model m] [--ref path]… [--output path]…
npm run content -- learn record --verdict approved --reason "…" --target generations/x/c1.png --product NUL-V-BPC-10
npm run content -- learn record --verdict rejected --reason "…" --target pl_… --law "general rule"
npm run content -- learn laws "badge resize" --brand muha
npm run content -- learn add-law --brand nulumin --claim "…" --evidence "…" --applies-to product-image
npm run content -- learn history --brand muha --verdict rejected
npm run content -- learn stats
```
