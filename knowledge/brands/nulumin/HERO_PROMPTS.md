# NuLumin hero scenes — generation technique

The generative half of a NuLumin ad: one photoreal vial, on an ownable set, with room reserved for
the layout. The literal prompt blocks are in `hero-prompts.json`; this explains how to use them and
why each part exists.

Model: **Nano Banana Pro** (`gemini-3-pro-image`) at 4K. It holds reference likeness and label text
at hero scale, which is the whole job here. gpt-image-2 does not hold the label.

---

## The prompt is assembled, not written

```
<style>            one of cryo / caustics / causticsblue / plate
<composition>      the exact-ratio block — 9:16 or 4:5
<product>          the invariant vial contract, with {name} {dose} {rules} {cap} {cake} filled in
```

Fill the placeholders from `catalog.json` — `capColors` and `cakeColors` hold the exact wording.
Never paraphrase the product block. It is the accumulated result of many rejected rounds and each
sentence is load-bearing.

## Two references, in this order

1. **The whole transparent vial cutout** — `product-canon`.
2. **A high-resolution crop of the label** — `reference-image`.

Reference 2 is the single fix that stopped label drift. Given only a small whole vial, the model
re-letters the label from comprehension: wrong wordmark weight, missing accent rules, no fine-print
box. Given a label crop and told it is the typographic authority, it copies.

## Things that render wrong by default

| Default behaviour | Correction |
|---|---|
| Caps come back bare aluminium | Pin the cap color explicitly, every time |
| The GHK-Cu cake comes back white | GHK-Cu is a copper peptide — the cake is **blue-violet** |
| The cake renders as loose powder | Demand a solid, flat-topped, freeze-dried plug and enumerate what it must *not* look like |
| The vial fills to the shoulder | Powder occupies **only the bottom third** |
| The label gets rim-lit into silhouette | Soft, even **frontal** key on the label |

## Composition: brief the centre line, not a percentage

Percentage-only briefs get ignored — a briefed "upper 42% empty" rendered as 34%. The instruction
that has actually held is the horizontal-centre-line rule: *if you drew a line across the exact
centre of the image, the whole vial including its cap sits beneath it.*

9:16 and 4:5 deliberately share the same structural wording. Giving 4:5 its own description is what
made the two placements diverge across a set.

## When the model will not place the vial small enough

In 4:5 the vial reliably crowds the text zone, and cropping a 9:16 render makes it relatively
*bigger*, not smaller. Fix: shoot the set **empty** with the `empty` block, then composite the
approved vial cutout at an exact size. Placement is composed at build time — never with a CSS
`transform`, which drifts across ratios.

## Multi-compound creatives

Never render three vials in one generation. All three come back re-lettered. Generate each vial
separately on the `plate` style, matte it out, and compose the group. One vial per generation is the
only condition under which the label has held.

## Cutting a vial out of an approved scene

Prefer this over the flat website cutouts — those read as mock-ups next to real photography and are
noticeably slimmer than the rendered product. Cutting from an approved hero keeps the glass wet-look
glossy, the cake visible, and the lighting matched to the campaign.

Derive the matte from luminance (the scenes are near-black), then:

1. Morphological **close** (`MaxFilter` → `MinFilter`, radius ~21) so the label's black type does not
   punch holes through the glass.
2. Slight blur to soften the edge.
3. A **blur-based confine** (heavy blur, multiplied back in) so the scene's ambient glow does not
   come along as a rectangular haze.
4. Crop to the alpha bbox and cap the longest edge — these get base64'd into a page.

## Verify before you build a layout on it

Open the render. Check the label letterforms against the reference crop, the cap color, the cake
color and level, and that nothing crosses the label. A visually polished scene still fails for label
drift, wrong product geometry, or a cake that reads as poured sugar.
