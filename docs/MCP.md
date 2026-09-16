# Content-engine MCP server

The repository is an MCP server. Any MCP client (Claude Code, Cursor, Codex, a custom agent) that
opens this checkout gets the engine's knowledge graph, asset catalog, self-improvement loop and job
runner as tools — the same functions the CLI exposes, over stdio.

```
.mcp.json          Claude Code project config  → node engine/mcp/server.mjs
.cursor/mcp.json   Cursor project config
npm run mcp        run it by hand (stdio; stdout is the protocol, logs go to stderr)
```

The server is `engine/mcp/server.mjs`; the tool table is `engine/mcp/tools.mjs` (plain
`{name, description, inputSchema, handler}` objects, so the same table serves tests and any future
HTTP transport). It reads `.env` from the checkout for provider keys; nothing else is configured.

## Tools

| Tool | What it does | Billable |
| --- | --- | --- |
| `brand_list` | Brands with aliases, compliance profile, registry paths, asset counts, learning-store size | no |
| `brand_get` | One brand in depth: prompt profile, compliance, locked rules, products, gaps, banned files, logos | no |
| `assets_search` | Find reference files by brand / product / role / free text; says whether each exists on this disk and is tracked in git | no |
| `assets_products` | Products per brand with reference counts and roles | no |
| `assets_gallery` | Build the browsable HTML gallery (`.content-engine/gallery/index.html`); `open: true` opens it | no |
| `knowledge_query` | Ranked retrieval over graph nodes and brand documents, scoped by `--category` | no |
| `knowledge_categories` | The context categories and their sizes | no |
| `knowledge_rebuild` | Force an index rebuild (normally automatic) | no |
| `context_pack` | **Call before writing any prompt.** Brand invariants + exact refs for the products in the brief + banned files + locked rules + learned laws + approved exemplars with their prompts + recent rejections + compliance + routing, plus a paste-ready `promptBlock` | no |
| `prompt_log` | Log a generation made outside `job_run` (any provider, any script) so it can receive a verdict | no |
| `prompt_log_search` | What has been tried, newest first, with verdicts | no |
| `feedback_record` | Record the human verdict. Approved → exemplar + tracked image copy + registry entry. Rejected → law | no |
| `laws_search` | Search every law bank (brand learnings, meme laws, video law banks) | no |
| `laws_add` | Add or strengthen a distilled rule | no |
| `learning_stats` | Verdict counts, approval rate per provider and category, laws by confidence, recent events | no |
| `job_plan` | Validate + compile a content job, preflight, retrieved context | no |
| `job_run` | Execute a job. Refuses unless `execution.approved: true` in the job file | **yes** |
| `job_review` | OpenAI visual critic on a candidate (advisory) | **yes** |
| `doctor` | Environment check | no |
| `dam_search` | Natural-language search over the Dropbox/local asset library (lexical + semantic + visual, filters for brand/product/class/orientation/people/duration); each hit says why | embed call only |
| `dam_asset` | Full understanding of one asset: structured read, measured video facts, transcript, keyframes, proxies, verdict | no |
| `dam_similar` | Visual siblings of an asset (other angles, takes, sizes) | no |
| `dam_ugc_profile` | Measured real-creator UGC profile per brand: bands, patterns, exemplars, distilled laws | no |
| `dam_sync_knowledge` | Push product candidates and the UGC profile into the registries and learning stores | no |
| `dam_verdict` | Human call on a library asset (approve with roles / reject → do_not_use) | no |
| `dam_scan` | Discover new/changed files in a source and queue free probes | no |
| `dam_work` | Drain the DAM queue; probe is free, analyze/embed need `approve` and the spend cap | **yes** when approved |
| `dam_stats` | Sources, cursors, assets by status/brand/class, queue depth, spend | no |

The DAM tools read the same Supabase project as the generation ledger; see `docs/DAM.md`.

Resources: `content://brands`, `content://learnings/{brand}`. Prompt: `content-task` (brand, brief)
returns the operating contract plus the instruction to start with `context_pack`.

## The loop an agent is expected to run

```
brand_list / brand_get           resolve the brand, read invariants, locked rules, gaps
context_pack(brand, brief)       exact refs, laws, exemplars, rejections, compliance, routing
assets_search                    anything the pack lacks — never a file found by browsing folders
job_plan → job_run  |  own call  generate 2–3 candidates, one hypothesis varied at a time
prompt_log                       if the generation did not go through job_run
(human looks at candidates)
feedback_record                  approved / rejected / revise, with a concrete reason
```

A generation is not finished until it has a verdict. `feedback_record` is what makes the next
`context_pack` smarter — see [`SELF_IMPROVEMENT.md`](SELF_IMPROVEMENT.md).

## Adding to another machine

Clone, `npm install`, open the folder in Claude Code or Cursor; the project config registers the
server. Tracked knowledge (`knowledge/`, `Brand Context/assets/`) is present on every clone; large
local-only libraries are not, and `assets_search` / the gallery say so per file (`exists`,
`tracked`). To make a reference available to everyone, copy it under
`Brand Context/assets/<Brand>/` and point the registry at that path.

## Remote transport

The server is stdio today. The tool table is transport-agnostic; an HTTP deployment (like the
dialed-studio video MCP on Railway) would wrap `createTools()` in the SDK's Streamable HTTP
transport with a bearer token and a read-only checkout of this repository.

## Stills: presets, automatic references, learned rules (2026-09-16)

| Tool / command | What it does |
|---|---|
| `presets` / `npm run content -- presets` | The 13 style presets (routing, channel size, references wanted, named variations) and the 9 channels. |
| `job_create` / `npm run content -- new …` | brand + style + product(s) + objective → `jobs/<id>.json` with routing and size filled, `references.auto: true`. |
| `job_plan` | Now async: resolves the product's references from the DAM (`engine/learning/auto-refs.mjs`), attaches them as `product-canon` / `reference-image` / `logo-canon` with instructions, adds the laws learned from rejections and approved-exemplar excerpts to the prompt, and returns `autoReferences`, `learned`, `variants`. |
| `job_run` | Runs one provider call per named variation (`<basename>-v1..n`), so candidates are experiments. |
| `dam_product_refs` | The reference kit for one product, with reasons; `exportForStudio` gives the same in the video MCP's refs shape. |

Routing rules encoded in `engine/prompts/presets.mjs`: gpt-image-2 by default (sets small type, renders the whole creative), quality `medium` (quality:high exceeds the ~60 s connection cap), Nano Banana (`gemini-image`) when a reference's likeness must hold at hero scale (characters), gpt-image-1 for transparent backgrounds. Scaffolds say what belongs on a surface and never "no logo" (negatives summon). Flyers are phone snapshots, not AI posters. Grain is a post step.
