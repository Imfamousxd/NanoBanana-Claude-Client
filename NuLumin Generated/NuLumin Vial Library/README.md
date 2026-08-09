# NuLumin vial asset library

**This is the current vial asset set. Use it. Nothing else in this repository supersedes it.**

Every one of the 66 retail SKUs, rendered as one product line in one session: same vial, same angle,
same lighting, same label, differing only in product name, dose and category colour.

| what | where | format |
|---|---|---|
| **Transparent** — real alpha, composites onto any background | `Transparent/NUL-V-<CODE>.png` | PNG RGBA, 2048×3072 |
| **White background** | `White/NUL-V-<CODE>.jpg` | JPEG q94 4:4:4, 2048×3072 |
| **Category heroes** — the colour authority, and the reference for generating new SKUs | `Category Heroes/HERO_<category>.jpg` | JPEG, 4K |
| **Machine-readable index** — every SKU with compound, dose, category, accent hex, both paths | `index.json` | JSON |
| Contact sheets | `_CONTACT_1_transparent.jpg` · `_CONTACT_2_white.jpg` | JPEG |

`<CODE>` is the retail SKU code, e.g. `NUL-V-BPC-05`. Look anything up in `index.json` rather than
guessing from a filename.

```js
const lib = require("./index.json");
const ghk = lib.skus.find(s => s.sku === "NUL-V-GHK-50");
// ghk.transparent, ghk.white, ghk.accentHex, ghk.cake, ghk.glass
```

## Which file to reach for

- **Compositing onto a coloured or photographic background** → `Transparent/`. The alpha is solved,
  not keyed, so clear glass is genuinely see-through rather than a silhouette.
- **Catalogue rows, comparison tables, anything already on white** → `White/`. Identical framing, so
  the two sets are interchangeable and drop-in.
- **Generating a new SKU, or any creative where the product must stay on-brand** → pass the matching
  `Category Heroes/HERO_<category>.jpg` as the reference image. See "Adding a SKU" below.

Every asset is normalised to the same canvas: the vial is centred, 90% of frame height, so a whole
category lines up without per-file nudging.

## Category colours

The accent (cap, vertical bar, dose text) is sampled from the approved corner heroes, which are the
client-approved colour authority. **These are vivid, not pastel** — the muted `surfaces.packaging`
values in `design-system.json` are a marketing palette and do **not** describe the vial cap.

| category | accent | hue |
|---|---|---|
| Tissue | `#906BE4` | 258° |
| Cellular | `#11C6E3` | 188° |
| Neural | `#13B330` | 131° |
| Metabolic | `#EDC31B` | 48° |
| Endocrine | `#E336DE` | 302° |

Two product facts are baked in and must survive any regeneration: **GHK-Cu** (50/100mg) has a
**blue-violet** copper-peptide cake, and **NAD+** (250/500/1000mg) ships in **amber** light-protective
glass, tinted continuously from crimp collar to base.

## Adding a SKU

Derive from the **category hero**, changing only name and dose — never re-specify the colour in the
same step. Re-colouring while re-lettering is what produced up to 45° of hue drift in an earlier pass;
inheriting the colour from the hero holds it to 1–7°.

The full pipeline, its QC gates and the failure modes they catch are documented in
[`knowledge/brands/nulumin/ASSETS.md`](../../knowledge/brands/nulumin/ASSETS.md).

## Superseded — do not use

- `NuLumin Generated/White BG Powder/` — the previous packshot set. Straight-on, lower resolution,
  and its endocrine vials render the tagline without its hyphen.
- `NuLumin Generated/Vial Library v2/` — an earlier build of this library with measured colour drift.
- Any `Transparent_*`, `nobg*` or `White BG *` folder — earlier lineages, superseded.

The **corner heroes** at `NuLumin Generated/Hero Shots v3 (fixed)/retail/` are *not* superseded: they
remain the approved composed hero shots and the colour authority this library is keyed to.
