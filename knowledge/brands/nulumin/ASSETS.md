# NuLumin — vendored product assets

Read this before generating any NuLumin creative that shows the product. Everything listed here is
committed, so a fresh clone has it; nothing needs regenerating and nothing needs downloading.

## What is here, and when to use which

| set | path | use it for |
|---|---|---|
| **Corner heroes** | `NuLumin Generated/Hero Shots v3 (fixed)/retail/` | finished retail hero shots — D2C pages, PDP art, anywhere a composed product photograph is the deliverable |
| **White-BG packshots (with cake)** | `NuLumin Generated/White BG Powder/` | catalogue rows, comparison tables, and **reference images for generation** — the vial is on plain white with the lyophilised cake visible |
| **Catalog** | `knowledge/brands/nulumin/catalog.json` · `reference/NuLumin_Wholesale_Catalog_Q2-2026.pdf` | SKU codes, doses, blend compositions, categories |
| **Brand system** | `design-system.json` · `AD_SYSTEM.md` · `HERO_PROMPTS.md` | tokens, type, the approved ad system and hero prompt blocks |

Naming is `NuL_<COMPOUND>_<DOSE>_white.png` for packshots and SKU codes `NUL-V-<CODE>-<SIZE>` in the
catalog — so a compound maps to its asset mechanically.

## Using these as generation references

When a generation must preserve the product, pass a **white-BG packshot as reference image 1** and a
**high-resolution crop of the label as reference image 2**. Text-only prompting is not a fidelity
strategy — the model re-letters the label from comprehension when it only sees a small vial.

State proportions explicitly as well, because independent generations otherwise each invent their
own: the complete vial is **≈1.97 : 1 tall-to-wide**, a squat broad-shouldered 3 ml vial, cap plus
crimp collar ≈13% of total height.

**Do not composite a cut-out vial onto a background.** It reads as pasted, and scaling a cutout down
softens the label until it stops being legible. Generate the product *on* its background instead and
let the photograph be the whole image.

## Deliberately NOT here

- **Transparent cutouts** — removed. Superseded by generating the product on its background. The
  site serves its own at `nulumin.org/images/products/NuLumin-vials/NUL-V-{CODE}-{SIZE}.webp` if a
  true cutout is ever genuinely needed.
- **"White BG Finals"** — removed. Despite the name those vials are **EMPTY**: clear glass, no cake.
  "Finals" meant final renders, not final selection. Do not re-add it as the packshot set.

## ⚠️ Known defects — check before relying on an asset

1. **Some GHK-Cu assets render the cake WHITE.** GHK-Cu is a copper peptide; its lyophilised cake is
   **blue-violet**. Anything generated from a white-cake GHK-Cu reference inherits the error.
2. **Coverage gap.** `White BG Powder` covers 24 SKUs; the corner-hero set covers far more. Missing
   SKUs have no white-BG packshot yet and must be generated before they can be used as references.
3. **Compound count is contested.** `catalog.json` and the Q2 2026 wholesale PDF disagree (31 vs 36,
   with different category splits). Confirm against the live catalog before putting a number in
   customer-facing copy.

Claim limits live in the approved-claims record; regulated-content rules are in `AGENTS.md`.
