# Image-gen knowledge graph

The image-gen knowledge graph indexes every brand's products, their canonical reference images,
and the locked rules that govern generating with them — so an image call (gpt-image-2, Nano
Banana, gpt-image-1) is always handed the right files instead of a from-memory description.
It is the stills counterpart to the video-gen knowledge layer merged from the `gen-image`
branch (`sieve/`, `graph-fragments/`), and it lives inside the existing knowledge layer, not
beside it.

## Where things live

| Piece | Path | What it holds |
| --- | --- | --- |
| Product registries | `knowledge/products/<brand>.json` | Per-brand product entries: SKU, aliases, geometry, role-tagged reference images, locked rules, known gaps |
| Graph wiring | `knowledge/graph.json` | `brand`, `product`, `product-registry`, and `routing-rule` nodes + `has-product` / `has-products` edges; every registry is also a retrieval source |
| Query CLI | `npm run content -- knowledge query "<terms>" --brand <brand>` | Full-text retrieval over graph nodes and registry files |
| NuLumin SKU index | `NuLumin Generated/NuLumin Vial Library/index.json` | Already-built 66-SKU machine index — the NuLumin registry points at it rather than duplicating it |

Seven brands are covered: dialed-moods, dialed-health, dialed-labs, muha-meds, noble-harbor,
stanton, nulumin. (Aevum+, Becca Boo, Agency DevWorks, GridShift, and Dial Echo were removed
from the graph by operator decision 2026-08-09; their Brand Context docs remain on disk.)

## Reference roles

Every reference image in a registry carries a `role` so a job knows *why* it is being passed:

- **canonical** — the product/label truth. Pass it whenever the product appears; label drift
  against this file is a rejection.
- **shape** — container geometry only (e.g. `Capsule Example.png`); style comes from elsewhere.
- **style** — an approved look/scene/lighting anchor (e.g. the Dialed Health vial master shot,
  the Social Elixir dark-luxe anchor).
- **logo** — a brand mark. Always passed as a reference, never redrawn.
- **approved-output** — a shipped deliverable, reusable as a layout/style reference.

Registries also carry `banned` / `neverUse` entries — files that look usable and are not
(e.g. Muha's group-truck shot with the wrong Arctic Blueberry).
Treat those as hard blocks, not suggestions.

Beyond the curated `references`, products and asset families carry `assets` arrays — the
actual files, enumerated and disk-verified (~950 across the seven brands): the full DH Shots
approved gallery with every lifestyle set, all 10 Muha characters (canonical + small + wall
badge each), the 35 realistic badges, raffle-card finals with print versions, delivered
campaign posts, Noble Harbor's baselines + verified 9-color cap set + contact sheets + COA
art, all Stanton label candidates, and NuLumin's corner heroes, category heroes, and ad
scenes. Only Noble Harbor's full per-product render library (thousands of files) stays
addressed by pattern rather than enumeration.

## How to use it in a job

1. Resolve the brand: `npm run content -- knowledge query "<brand> <product>" --brand <brand-id>`.
   Product nodes and registry chunks return the exact reference paths.
2. Open `knowledge/products/<brand>.json` and take the product's `references` array verbatim —
   canonical first, then shape/style/logo as the job needs. Do not substitute a file you found
   by browsing folders; the superseded pools exist precisely to be avoided.
3. Apply the product's `locked` rules to the prompt (they encode past rejections).
4. Route the call per the `rule.image-provider-routing` node (summary below).
5. After approval, add the shipped file to the registry as `approved-output` and record any new
   locked rule — the registry is only as good as its last update.

## Provider routing (the cross-brand laws)

- Default **gpt-image-2**; switch to **Nano Banana** (`gemini-3-pro-image-preview`) for
  hero-scale reference fidelity.
- **Never composite or PIL-paste** product art into a scene — generate the whole graphic with
  the real assets passed as references.
- **Transparent output = gpt-image-1 only.**
- If a supplied render's own printed copy must stay correct, use **gpt-image-2
  `/v1/images/edits`** with the render as the edit base.
- gpt-image-2 `quality:high` dies at the ~60s connection cap — use `quality:medium` and rebuild
  the FormData on every retry.
- gpt-image-2 cannot output 9:16; video ads are always 9:16 (house format).
- On-image copy is supplied verbatim; long, legal, or tabular copy is composed
  deterministically after generation (see `docs/BRAND_PACKS.md`).

## Tracked vs local-only assets

`.gitignore` is a curated allowlist. `Brand Context/assets/<Brand>/` is the tracked mirror
layer of canonical refs; most large libraries (`DH Shots/`, `Flavor Badges/`,
`Noble Harbor Wholesale/`, `Dialed Moods Social Elixir/`, the email-campaign trees) are
**local-only** on this machine. A registry path that resolves on disk here may not exist on a
fresh clone — if a ref that matters is untracked, mirror it into `Brand Context/assets/`
before relying on it from CI or another machine.

Path-case trap: git tracks `NuLumin Generated/` (capital L) while the folder prints as
`Nulumin Generated` on disk and inside the Vial Library's own `index.json`. Same folder on
this case-insensitive filesystem; use the git casing in anything tracked.

## Known gaps (verified 2026-08-09)

- **Muha Magnetic Disposables** device/city art is not in the repo (client-side
  `~/Downloads/Magnetic Disposables/`), and the EuroSummer gold/navy lockup is likewise
  Downloads-only.
- **Dialed Moods**: Secret Juice has no Brand Context render; Social Elixir is missing
  `Front_MangoPeach` / `45_Lemonade` refs and has no brand doc.
- **Dialed Labs**: the canonical wordmark is the live-site webp, not in-repo; ~8 scattered
  copies with no declared canonical.
- **Noble Harbor**: logo source of truth is remote; Oxytocin's 10 mg colorway set and
  `PT-141 2/5mg/*_red.jpg` are flagged untrustworthy/mislabeled.
- **Stanton**: the Peptide Prep Kit label has no single approved file (layout not locked).

When a gap blocks a job, say so and ask for the missing asset — do not substitute a
lookalike or regenerate a "canonical" from memory.
