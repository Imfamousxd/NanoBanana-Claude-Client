# Content Engine v2 architecture

## Design goal

Turn a valuable but ad-hoc campaign archive into a reusable agent-native system without breaking
historical jobs. The engine separates durable knowledge, creative intent, provider mechanics,
quality evaluation, and generated artifacts. A coding agent should be able to enter the repository,
retrieve the right facts, plan safely, produce candidates, and leave evidence another operator can
reproduce.

## Lifecycle

```text
user brief
   ↓
versioned job JSON ─────── canonical assets
   ↓                             ↓
knowledge graph + ranked markdown retrieval
   ↓
mode-specific prompt compiler (UGC / product / campaign)
   ↓
static preflight (schema, asset, provider, compliance, cost)
   ↓
provider adapter with retry + operation persistence
   ↓
hashed outputs + run manifest
   ↓
deterministic checks + optional multimodal critic + human approval
   ↓
approved asset and reusable learning returned to knowledge
```

## Components

### Job contract

`schemas/content-job.schema.json` describes intent, audience, deliverable, provider, references,
creative direction, compliance, approval, and output. `engine/core/job.mjs` applies defaults and the
runtime checks that JSON Schema alone cannot express, such as provider/capability compatibility,
workspace path containment, Seedance input conflicts, required product canon, and paid-execution
approval.

Jobs are reviewable artifacts. A job should answer what changes and what must remain invariant.
Historical scripts often mixed those concerns with HTTP calls, filenames, and environment parsing.

### Hybrid knowledge graph

`knowledge/graph.json` stores durable entities and relationships: brands, aliases, source documents,
compliance profiles, provider defaults, content modes, and canonical asset collections. Markdown
continues to hold deep narrative context. `engine/knowledge/indexer.mjs` chunks Markdown by heading
and preserves source/heading provenance; `retrieval.mjs` ranks and diversifies relevant chunks.

This is intentionally hybrid:

- Graph nodes answer exact questions: which brand, rule profile, provider, or asset collection?
- Ranked chunks answer semantic questions: what has this brand learned about this creator or shot?
- Claim records answer evidence questions: is a factual statement approved and current?

The index is lexical and local by default, so it is fast, private, inspectable, and provider-neutral.
An embeddings layer can be added behind the same result contract when the corpus outgrows lexical
retrieval; it should complement rather than erase explicit graph relationships and citations.

### Prompt compilation

`engine/prompts/compiler.mjs` compiles a job into operational provider instructions. It states each
rule once and separates social purpose, creator performance, environment, capture behavior,
reference roles, brand invariants, exact copy, compliance placement, and exclusions. UGC guidance
lives in `knowledge/playbooks/UGC_REALISM.md`, not in hundreds of copied prompts.

The compiler does not dump every retrieved chunk into the image model. Retrieval is an agent context
pack; only curated brand invariants and the job enter the render prompt. This limits context noise and
prevents an unverified strategy statistic from silently becoming on-image copy.

### Provider boundary

Adapters live in `engine/providers/` and share environment, path, retry, download, and output logic.
Provider IDs are stable even when model IDs change:

- `openai-image` → Image API, generation and multi-reference edit
- `gemini-image` → Gemini native image generation/editing
- `google-omni-video` → current Google default for multimodal video generation
- `google-veo` → long-running video generation with persisted operation names
- `replicate-seedance` → long-running multimodal video generation with persisted prediction IDs

Model IDs can be set in each job or environment. Provider errors are redacted, retryable HTTP states
use bounded exponential backoff, and long-running IDs are saved under `.content-engine/operations/`
before polling. Ambiguous network failures on billable submissions are not automatically retried,
which avoids silently creating duplicate paid generations. A crash no longer destroys the only
handle to an expensive run.

### Quality and provenance

Preflight detects missing references, out-of-workspace paths, MIME/extension lies, low-resolution
canon, text that should be overlaid deterministically, UGC prestige-language drift, regulated claims,
and billable calls without explicit approval. `assets audit` reports dimensions, encoding mismatch,
hash duplicates, and unreadable files for a selected canonical directory.

Every execution writes a manifest before the API call and updates it on success/failure. Inputs and
outputs are SHA-256 hashed. The optional OpenAI visual critic compares a candidate against the job and
canonical references using a fixed structured rubric; its result is advisory and never replaces the
human legal/medical/brand gate.

## Extension rules

- Add a provider behind `runProvider`; do not embed its HTTP call in a campaign script.
- Add a content mode through the job schema, compiler, preflight rules, example, and tests together.
- Add brand facts to the brand source or a structured node, not `AGENTS.md`.
- Add a factual marketing claim only as an approved claim record with source and review date.
- Add deterministic typography/QR/layout as a post-production stage whose output is separately
  checked. Do not rely on negative prompting to make long text exact.
- Treat evaluation as a dataset: keep representative jobs, expected invariants, accepted/rejected
  outputs, reviewer reasons, provider/model, and cost/latency. Optimize against this set instead of
  declaring a prompt better after one attractive image.

## Known boundaries

This refactor does not relocate the historical archive, approve any legal claim, normalize every
legacy asset, or run paid generation. Model behavior and platform rules remain externally changing
dependencies. Provider jobs must be tested against a small canary after credentials and cost scope
are confirmed.
