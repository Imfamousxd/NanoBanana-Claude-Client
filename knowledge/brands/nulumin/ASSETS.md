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

Both sets are keyed to the **31 products** in the live catalog. Packshots carry **one representative
dose per product** (31 files) because the label is the only thing that changes between doses; the
corner-hero set carries **all 66 dose-level SKUs**. See "Catalog counts" below.

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

## Adding a packshot to the set

Do not write a new root-level script and do not re-derive the look from scratch — the engine expresses
this job. Copy **`examples/nulumin-whitebg-packshot.json`** (mode `product-image`, provider
`gemini-image`), then:

1. **Reference 1 is an existing packshot from the same spectrum category**, never the wholesale PDF and
   never a corner hero. A same-category donor already carries the correct cap, accent bar and dose
   colour, so the only changes left are the name and the dose. Measured result: cap and bar land within
   **Δhue ≤ 3°** of the donor. Deriving from the BPC master instead reintroduces the vivid `#E424F0`-era
   palette, which is *not* what this set uses.
2. **Ask for exactly two changes** — the name and the dose. Every extra instruction costs fidelity: a
   third change (correcting the tagline hyphen) drifted colour by **Δhue 9–22°** and moved the framing.
3. **Long names need an explicit wrap clause** ("reduce size, wrap onto two centred italic lines") or
   the name runs into the research-use box.
4. **Normalise to the set's framing** or the file will not sit in a catalogue row with the others: crop
   to the vial's bounding box, scale so its height is **1230 px**, paste at **y = 85** (bbox 85…1315),
   horizontally centred on a **1024 × 1400** canvas, then flatten the field outside a 7px-dilated
   subject mask to pure `#FFFFFF`. Every file in the set measures identically on this; vial width
   varies 0.52–0.58 of frame and that is expected.
5. Keep the 2K original in `_raw2k/` — it is the better reference image for a later generation — and
   rebuild `_contact_sheet.png` (6 columns, 310 × 470 tiles, card at 7,6 sized 296 × 405, caption at
   y ≈ 436).

## Deliberately NOT here

- **Transparent cutouts** — removed. Superseded by generating the product on its background. The
  site serves its own at `nulumin.org/images/products/NuLumin-vials/NUL-V-{CODE}-{SIZE}.webp` if a
  true cutout is ever genuinely needed.
- **"White BG Finals"** — removed. Despite the name those vials are **EMPTY**: clear glass, no cake.
  "Finals" meant final renders, not final selection. Do not re-add it as the packshot set.

## Catalog counts — resolved 2026-07-29

**Cite 31.** The two numbers in circulation count different things, and both are internally correct:

| number | what it actually counts | where it comes from |
|---|---|---|
| **31** | distinct **products** — 27 single compounds + 4 blends | the live catalog and the D2C retail feed |
| **66** | **dose-level SKUs** across those 31 products | same source (`NUL-V-<CODE>-<SIZE>`) |
| **36** | **SKU line items** in one curated wholesale sell sheet, spanning only 23 products | `reference/NuLumin_Wholesale_Catalog_Q2-2026.pdf` |

Verified against `nulumin.org/products` on 2026-07-29: the page carries exactly **66 SKU codes across
31 product tokens** — matching the retail feed and the corner-hero set SKU for SKU.

The Q2 2026 PDF's cover line "36 Research Compounds" is **mislabelled**: 36 is its SKU count, not a
compound count. Its own category subheads say so — 9 + 10 + 6 + 3 + 8 SKUs = 36 — and those resolve to
just 23 products. That sell sheet omits 8 products the live catalog carries (5-Amino 1MQ, Foxo4-DRI,
Glutathione, N-Acetyl Selank Amidate, N-Acetyl Semax Amidate, Oxytocin, Sermorelin, Tesamorelin), so
treat it as a curated selection, never as the catalog's extent.

There is no "32", and B-12 is not in the retail catalog at all (it appears only in the gated wholesale
feed), so a count that includes it will not match anything customer-facing.

## ⚠️ Known defects — check before relying on an asset

1. **Some GHK-Cu assets render the cake WHITE.** GHK-Cu is a copper peptide; its lyophilised cake is
   **blue-violet**. Anything generated from a white-cake GHK-Cu reference inherits the error. This
   includes `White BG Powder/NuL_GHK_50mg_white.png` — do not use it as a cake-colour reference.
2. **The pink/endocrine packshots render the tagline "BIO SCIENCES" without its hyphen.** It must read
   **BIO-SCIENCES**. Affects all 8 endocrine files (CFC, CJCIpa, Ipamorelin, KissPeptin, Melanotan,
   Oxytocin, PT, Sermorelin); the violet, blue, green and gold families are correct. Prompting a
   hyphen correction while deriving from one of these donors destabilises colour and framing — a fix
   pass needs its own QC round, so fix the whole family at once rather than one file at a time.
3. **Some packshot filenames carry a dose the label does not.** `NuL_Selank_5mg_white.png` is labelled
   **10mg** (and 5mg is not a retail Selank dose). `Melanotan_3mg`, `GLP3_6mg` and `CJCIpa_5mg` are
   labelled with doses that exist in the wholesale feed but not in the 66-SKU retail feed. Read the
   label, not the filename, before using one in a catalogue row.

Claim limits live in the approved-claims record; regulated-content rules are in `AGENTS.md`.
