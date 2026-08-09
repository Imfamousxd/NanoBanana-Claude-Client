# NuLumin — vendored product assets

Read this before generating any NuLumin creative that shows the product. Everything listed here is
committed, so a fresh clone has it; nothing needs regenerating and nothing needs downloading.

## What is here, and when to use which

| set | path | use it for |
|---|---|---|
| **★ Vial library** | `NuLumin Generated/NuLumin Vial Library/` | **the current vial set — start here.** All 66 retail SKUs as transparent PNGs *and* white-background JPEGs, plus the 5 category heroes and a machine-readable `index.json` |
| **Corner heroes** | `NuLumin Generated/Hero Shots v3 (fixed)/retail/` | finished retail hero shots — D2C pages, PDP art, anywhere a composed product photograph is the deliverable. Also the **colour authority** for the vial library |
| **Catalog** | `knowledge/brands/nulumin/catalog.json` · `reference/NuLumin_Wholesale_Catalog_Q2-2026.pdf` | SKU codes, doses, blend compositions, categories |
| **Brand system** | `design-system.json` · `AD_SYSTEM.md` · `HERO_PROMPTS.md` | tokens, type, the approved ad system and hero prompt blocks |

Everything is keyed by retail SKU code, `NUL-V-<CODE>-<SIZE>`. Resolve a SKU to its files through
`NuLumin Vial Library/index.json` rather than guessing from a filename — it carries compound, dose,
category, accent hex, cake colour, glass colour and both asset paths for all 66.

`White BG Powder/` is the **previous** packshot set and is superseded by the vial library; see
"Superseded sets" below before reaching for it. See "Catalog counts" below.

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

## Generating a new vial, or a new SKU

**Derive from the category hero, changing only name and dose.**
`NuLumin Generated/NuLumin Vial Library/Category Heroes/HERO_<category>.jpg` is the reference; it
already carries the correct accent colour, cap, crimp, label, cake and framing.

Never re-specify the colour in the same step as re-lettering. Re-colouring while changing the name is
what produced up to **45° of hue drift** across a category; inheriting the colour from the hero holds
it to **1–7°**. If a colour ever has to be stated, pass a flat swatch as a second reference — hex
words alone drift.

Model is **Nano Banana Pro** (`gemini-3-pro-image`) at 4K. gpt-image-1 was tried twice and rejected
both times for looking computer-generated: flat glass, a label that reads pasted on, a smooth band
instead of brushed metal. It is also the only model that emits alpha, which is why the pipeline below
derives transparency instead of asking for it.

### The pipeline

1. **White master** — derive from the category hero, name and dose only.
2. **High-contrast companion** — reproduce that render with *only* the background changed to pure
   black. Forbid relighting explicitly, or the model adds a rim light "helpfully" and the maths breaks.
3. **Gate the pair** before matting (see below).
4. **Solve the alpha** from the pair: `α = 1 − (I_white − I_black)/255`, `F = I_black/α`. Exact, not
   keyed — which is why clear glass comes out genuinely see-through rather than a silhouette.

### Gates — every one of these caught a real failure

Run them *before* matting; a bad pair produces a plausible-looking asset, not an obvious error.

- **Companion background is actually black.** Nine renders silently returned a white frame. Two
  identical frames make the difference degenerate: α resolves to 1 everywhere and you get an opaque
  blob that looks fine in a thumbnail.
- **Vial not relit.** Compare label brightness across the pair; a darkened companion drags α down.
- **Registration.** Compare bounding boxes; anything past ~10 px of drift mattes badly.
- **Family fit.** Compare a downscaled signature against the category hero. This is what catches a
  redesigned label — and it caught **invented fine print**, blocks of gibberish like
  "Fine-print contematriseolinia" on a regulated product. Compare amber SKUs against `NAD-250`, not
  against the cellular hero, or the amber itself reads as the deviation and hides a real defect.
- **Colour.** Cap hue and saturation against the category target.
- **Eyes.** The signature check ranked a vial reading **"Didon+" instead of "NAD+"** as ordinary
  variance. Column-density can't separate one word from another. Read the contact sheet.

### Where the matte needs help, and why

The difference solve is reliable on clear glass and unreliable on anything specular or coloured. All
three fixes take the region from the white render, where an opaque object shows its own true colour:

- **Cap and crimp** are opaque, so partial alpha there is physically meaningless. Left alone, α
  collapsed to ~90/255 on some SKUs and the dark companion bled through, rotating hue by **100–115°**.
  Take both alpha and colour for the closure band from the white render.
- **Silhouette edges**: `F = I_black/α` explodes where α is tiny and paints the edge white. Floor the
  divisor (α = 90) — that white halo was a bug, not a lighting choice.
- **Amber glass** is light-protective and must read amber on dark as well as light. As ordinary
  translucent glass its α collapsed unevenly — to 40/255 on one vial — so the tint vanished on part of
  the body and differed vial to vial. Amber SKUs build **opaque**: silhouette alpha, white-render
  colour. Clear-glass SKUs keep the real matte.

Normalise every asset the same way: crop to the vial, scale to 90% of frame height, centre on
2048 × 3072. A category then lines up without per-file nudging.


## Superseded sets — do not reach for these

The vial library replaced all of them. They remain on disk as history, not as options.

- **`White BG Powder/`** — the previous packshot set. Straight-on rather than the approved hero angle,
  1024 × 1400 rather than 2048 × 3072, one dose per product rather than all 66 SKUs, and its endocrine
  vials carry the missing-hyphen defect below. Superseded 2026-07-30.
- **`Vial Library v2/`** — an earlier build of the current library, with measured colour drift.
- **`Transparent_*`, `nobg*`, `White BG *`, `NuLumin Transparent One-Per-Peptide/`** — earlier cutout
  lineages. Their alpha is a keyed silhouette with stray haze across the canvas, not a solved matte.
- **`White BG Finals/`** — despite the name those vials are **EMPTY**: clear glass, no cake. "Finals"
  meant final renders, not final selection.

The **corner heroes** (`Hero Shots v3 (fixed)/retail/`) are **not** superseded — they are the approved
composed hero shots and the colour authority the vial library is keyed to.

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

**The vial library is clean on all of these** — the notes below apply to the superseded sets, which
are still on disk and still inherited if you use one as a reference.

1. **Product-accuracy traps: GHK-Cu's cake and NAD+'s glass.** GHK-Cu is a copper peptide, so its
   lyophilised cake is **blue-violet**, and NAD+ ships in **amber** light-protective glass, tinted
   continuously from crimp collar to base. Renders default to a white cake and clear glass, so both
   must be pinned explicitly every time — `catalog.json` carries the wording as
   `cakeColors.copperViolet` and `glassColors.amber`. Correct in the vial library and in
   `White BG Powder`; **wrong in most other folders**, and the error is inherited by anything derived
   from them.
2. **The pink/endocrine packshots in `White BG Powder` render the tagline "BIO SCIENCES" without its
   hyphen.** It must read
   **BIO-SCIENCES**. Affects all 8 endocrine files (CFC, CJCIpa, Ipamorelin, KissPeptin, Melanotan,
   Oxytocin, PT, Sermorelin); the violet, blue, green and gold families are correct. Prompting a
   hyphen correction while deriving from one of these donors destabilises colour and framing — a fix
   pass needs its own QC round, so fix the whole family at once rather than one file at a time.
3. **Some `White BG Powder` filenames carry a dose the label does not.** `NuL_Selank_5mg_white.png` is labelled
   **10mg** (and 5mg is not a retail Selank dose). `Melanotan_3mg`, `GLP3_6mg` and `CJCIpa_5mg` are
   labelled with doses that exist in the wholesale feed but not in the 66-SKU retail feed. Read the
   label, not the filename, before using one in a catalogue row.

Claim limits live in the approved-claims record; regulated-content rules are in `AGENTS.md`.
