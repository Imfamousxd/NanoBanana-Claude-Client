# Content-Gen Engine

An agent-native content pipeline for Codex, Claude Code, and other coding agents. It combines
structured briefs, a hybrid knowledge graph, prompt compilation, provider routing, preflight
checks, run manifests, and visual review. The hundreds of root-level scripts remain as a historical
campaign archive and compatibility layer; new work should use `engine/`.

## Setup

Requirements: Node 20+, only the provider keys you use, and Google Chrome or Chromium if you render
deterministic layouts (`CHROME_PATH` overrides discovery).

```bash
npm install
cp .env.example .env
npm run doctor
npm run knowledge:build
npm test
```

## Core workflow

```bash
# Retrieve only relevant knowledge
npm run content -- knowledge query "NuLumin verifier unboxing" --brand nulumin

# Compile prompt + validate references/compliance without spending money
npm run content -- plan examples/ugc-product-story.json

# A billable run also requires execution.approved=true inside the job
npm run content -- run examples/ugc-product-story.json

# Optional OpenAI visual critic; human review is still required
npm run content -- review examples/ugc-product-story.json path/to/candidate.png
```

`AGENTS.md` is the shared operating contract. Claude Code imports it through `CLAUDE.md`.

## Brand packs

A brand pack is everything a generator needs to be right on the first attempt: exact design tokens,
the product facts a prompt must pin, the copy matrix with its claim records, verbatim prompt blocks,
and the ad formats that already survived client review. `Brand Context/` says who a brand is; a pack
says how to build for it.

```bash
npm run content -- brandkit list                       # packs present
npm run content -- brandkit kit nulumin                # formats, compounds, hooks, missing assets
npm run content -- brandkit fonts nulumin              # one-time offline webfont bundle
npm run content -- brandkit ad nulumin single --compound ghkcu --ratio 9:16,4:5
npm run content -- brandkit job nulumin hero --compound ghkcu --style cryo > job.json
```

`brandkit ad` renders the layout deterministically in headless Chrome — no provider call, no cost,
and no chance of a model inventing copy. `brandkit job` emits a schema-valid job for the generative
half, which then goes through the usual `plan` → approve → `run` path.

Shipping packs: **nulumin** (`knowledge/brands/nulumin/`). See `docs/BRAND_PACKS.md` to add another.

## Providers

| Provider ID | Default model | Capability |
|---|---|---|
| `openai-image` | `gpt-image-2` | image generation/editing |
| `gemini-image` | `gemini-3-pro-image` | image generation/editing |
| `google-omni-video` | `gemini-omni-flash-preview` | default multimodal video generation |
| `google-veo` | `veo-3.1-generate-preview` | video with last-frame/extension controls |
| `replicate-seedance` | `bytedance/seedance-2.0` | multimodal video |

All model IDs are configurable in the job or environment. Volatile defaults are stored with a
verification date and source URL in the knowledge graph, not treated as permanent truths.

## Project map

- `engine/` — CLI, prompt compiler, retrieval, providers, quality gates, manifests, brand packs
- `knowledge/` — graph, compliance profiles, creative playbooks, per-brand packs, claim registry
- `schemas/` — versioned job contract
- `examples/` — safe starting jobs
- `test/` — offline engine tests
- `docs/` — architecture, audit, migration, and operator notes
- `Brand Context/` — detailed source documents indexed by the engine
- root `*.mjs` / `*.py` — historical jobs; keep runnable, do not copy as new architecture

Generated files and engine caches belong in project output folders and `.content-engine/`; they
are ignored by Git. Never commit `.env` or provider credentials.
