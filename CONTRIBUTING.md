# Contributing

This repository is a production content system and a client archive. Real brands, regulated
categories, and paid API calls run through it. That shapes everything below.

**Read this before you add a brand or change anything in `engine/`.** It applies to humans and to
coding agents equally. Agents also load `AGENTS.md`, which is the operating contract for a *content
task*; this file is the contract for *changing the repository*.

---

## The one-paragraph version

Adding a brand should never require changing code. Run `brandkit new <brand>`, fill in the pack,
commit the artwork, run `brandkit validate <brand>`. If that flow can't express what you need, say so
before you start editing `engine/` — the gap is worth a conversation, and the fix usually belongs in
the pack format rather than in a new code path.

---

## Adding a brand

### 1. Scaffold it

```bash
npm run content -- brandkit new <brand-id> --name "Display Name" --compliance <profile>
```

`<brand-id>` is lowercase kebab-case and becomes the directory name and the CLI handle.
`--compliance` names a profile in `knowledge/graph.json` (`regulated-health-ruo`,
`regulated-health`, `supplement-marketing`, `cannabis-advertising`, `general`). Pick the strictest
one that applies.

This creates `knowledge/brands/<brand-id>/` with five files and registers the brand, the pack, and
its asset collection in `knowledge/graph.json`. It refuses to overwrite an existing pack.

### 2. Fill in the pack

| File | What goes in it |
|---|---|
| `design-system.json` | Exact colors, type, signature devices, disclosures, asset paths. Keep surfaces separate — a marketing palette and a packaging palette are different systems. |
| `catalog.json` | Products, their categories, and the physical facts a prompt must pin. Anything that renders wrong by default belongs here as explicit wording. |
| `selling-points.json` | The copy matrix. Three forms per point (`label`, `loud`, `spec`) because each format renders a different one. Every point names a claim record. |
| `hero-prompts.json` | Verbatim generative prompt blocks, the approved styles, and **the styles that were dropped, with the reason**. |
| `FORMATS.md` | The layout law and the rejection history. |

Two rules that matter more than the rest:

- **Every value is verified, never guessed.** A hex sampled from a real asset, a claim read off the
  live site, a dose from the label. If you can't verify it, leave the TODO and say so.
- **Write down why each rule is locked.** A rule without its rejection history gets undone by the
  next person, and the same round gets rejected again. The rejection table in `FORMATS.md` is the
  most valuable thing in a pack.

### 3. Commit the artwork

Curated assets go under `Brand Context/assets/<Brand_Name>/creative/` and are referenced from
`design-system.json` with **repository-relative paths**. A fresh clone must be able to render
without you.

Never reference an absolute path, a scratch directory, a session temp folder, or `~/Downloads`. That
is the single most common way this repo has been broken: the work runs perfectly for the person who
made it and for nobody else.

Keep committed assets small and purposeful — logo lockups, product cutouts at native resolution,
scene anchors at render size. Full-resolution generated output is not a repository asset.

### 4. Register the claims

Every factual selling point needs a record in `knowledge/claims/` conforming to
`schemas/claim-record.schema.json`.

Ship them as `status: "draft"` with the source citation filled in. **A published statement is
evidence that it is published, not that it is approved for advertising.** A qualified human sets
`owner`, refreshes `reviewedAt`, and flips `status` to `approved`. The validator rejects an approved
claim that has no owner, and the engine blocks any job whose prompt asserts an unsourced claim.

Do not resurrect claims from historical campaign copy. Old prose is not evidence of approval.

### 5. Validate and index

```bash
npm run content -- brandkit validate <brand-id>
npm run knowledge:build
npm test
```

Fix every error. Read every warning and decide deliberately — most of them mean "this will look
wrong to a client", not "this is a style nit".

### 6. Write the format document last

Once you have produced real work for the brand, go back and fill in `FORMATS.md`: the invariant
element order, what makes each format *different in texture* rather than a re-skin, and the table of
what was rejected and why.

---

## Structural boundaries

The architecture is small on purpose. These boundaries are what keep it that way.

### Where things belong

| Kind of thing | Home | Not |
|---|---|---|
| Brand facts, tokens, copy, prompt text | `knowledge/brands/<brand>/` | hardcoded in code |
| Reusable behavior | `engine/` | a new root-level script |
| Committed brand artwork | `Brand Context/assets/<Brand>/` | a scratch directory |
| Approved claims | `knowledge/claims/` | inline in a prompt |
| Job contracts | `schemas/` | implied by code |
| Operator docs | `docs/` | a comment |
| Generated output, caches, temp jobs | untracked (`generations/`, `.content-engine/`) | committed |

**A brand pack contains knowledge, not code and not assets.** Only `.json` and `.md` files. If you
find yourself wanting to put a script in a pack, the behavior belongs in `engine/`, parameterized by
pack data.

### Changes that need a conversation first

Open the question before writing the code:

- Renaming or restructuring `engine/`, `knowledge/`, `schemas/`, or `docs/`.
- Changing `schemas/content-job.schema.json` in a way that invalidates existing jobs. Additive
  optional fields are fine; required fields and renames are not.
- Adding a provider, or changing a default model. Model defaults carry a `verifiedAt` date and a
  source URL in `knowledge/graph.json` and are not permanent truths — update the record, don't just
  swap the string.
- Weakening a quality gate, a compliance check, or a preflight rule. Every one of them exists
  because something shipped wrong once.
- Bulk-moving, renaming, deleting, or re-encoding the historical asset surface. Follow
  `docs/REPOSITORY_MIGRATION.md` for that, as a separate reviewed change.

### Changes that are always safe

- Adding or editing a brand pack.
- Adding a claim record.
- Adding a format module or an example job.
- Adding tests.
- Improving a document, especially by adding the reason a rule exists.

### The historical scripts

Hundreds of `*.mjs` and `*.py` files at the repository root are a campaign archive. **Keep them
runnable; do not refactor them, and do not copy them as a pattern for new work.** They hardcode
absolute paths and session-local state — that is precisely what the engine exists to replace. When
you need what one of them does, express it in `engine/` and leave the original alone.

---

## Quality rules that apply to every brand

These are not stylistic preferences. Each one is here because work was rejected without it.

- **Anything that must stay identical needs a declared reference asset with a role.** A product, a
  face, a package, a logo, an exact layout. Text-only prompting is not a fidelity strategy.
- **Exact copy is composed deterministically, never generated.** Legal lines, long copy, QR codes,
  tables, COAs, packaging microtype — HTML/CSS to headless Chrome, not an image model. An image
  model asked for text will invent a claim eventually.
- **Candidates are experiments.** Generate 2–3 for subjective work, varying one hypothesis at a
  time. Rerolling the same prompt is not a test.
- **Every run leaves a manifest** with the compiled prompt, inputs, provider and model, output
  hashes, warnings, and review result. Secrets never enter a manifest or a log.
- **Confirm scope and cost before a billable call**, and set `execution.approved: true` in the job.
  Approval never carries over from an old campaign or handoff.
- **A polished render can still fail** — for label drift, invented text, wrong product geometry,
  inconsistent scale across a series, a QR code that doesn't resolve, an unsupported claim, or the
  wrong audience. Look at every candidate.

---

## Before you open a pull request

```bash
npm run doctor      # environment, brand packs, pack integrity
npm run check       # syntax + full test suite
```

Both must pass. If you touched a pack, `brandkit validate` runs inside `doctor` — a structurally
broken pack fails the check rather than surfacing later as a bad render in front of a client.

Do not commit `.env`, provider credentials, generated output, or caches.
