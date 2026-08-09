# Rubric: product-lock

Target: **the SKU in the candidate is the same physical object as the SKU in the reference.**

REQUIRES `--refs <canonical.jpg>`. Without a reference this rubric is meaningless — run it as
`--rubric product-lock --refs "Brand Context/assets/<Brand>/<canonical>.jpg" --candidates ...`.
Product fidelity is the one axis with real ground truth, so never judge it from memory or from
the prompt text. Compare against the reference image only.

The failure this catches is the model **inventing a plausible variant** — right category, wrong
object. A vial that is the correct shape with a subtly different cap, a re-drawn wordmark, an
invented emblem on a surface the prompt left unspecified. It looks fine until it sits next to the
real product, which is exactly when a client sees it.

Judge the PRODUCT only. Ignore scene, lighting, background and styling — those are meant to differ.

## BLOCK: IDENTITY
- Is the candidate's product the same object category and silhouette as the reference?
- Are the proportions the same — height against width, cap depth against body length?
- Are the component parts the same in number and arrangement (cap, band, body, neck, closure)?
- FAIL if it is a plausible sibling product rather than the same product.

## BLOCK: COLOUR
- Is the body/container colour the same as the reference, including finish (matte, gloss, frosted, clear)?
- Is the cap or closure colour the same?
- Is any accent, band or trim the same colour and in the same place?
- FAIL on any colour shift you would notice with the two side by side.

## BLOCK: LABEL
(Skip and mark pass if the reference product carries no label or printed surface.)
- Is the label the same shape, and in the same position and proportion on the body?
- Does the label wrap the surface with correct perspective, rather than floating flat like a decal?
- Is the wordmark the same mark — same letterforms, same weight, same relative size?
- Is every text element present in the reference also present, with the SAME SPELLING? Read it letter by letter.
- Is the candidate free of any text, emblem, icon or graphic that does NOT appear in the reference?
- FAIL if the model invented, re-drew, translated, reflowed or misspelled anything.

## BLOCK: SURFACE
- Are surfaces the reference leaves blank still blank, with nothing invented on them?
- Is the material response the same (a metal band still reads as metal, glass still as glass)?
- FAIL if a bare surface has been filled with an invented emblem or pattern.
  (Known failure mode in this repo: instructed to leave a label bare, the model invented a gold
  leaf emblem. An unspecified surface gets filled — so this block is checking for exactly that.)

## BLOCK: INTEGRITY
- Is there exactly ONE of the product, unless the reference shows more?
- Is the product whole and undistorted — not warped, melted, bent or partially merged with the scene?
- Is it physically supported, with a contact shadow where it meets its surface, rather than floating?
- FAIL on any of the above.
