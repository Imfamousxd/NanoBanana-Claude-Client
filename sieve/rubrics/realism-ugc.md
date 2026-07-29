# Rubric: realism-ugc

Target: a photo that looks like **a real person shot it on a phone** — a text to a friend, a
selfie-camera clip, a snapshot. NOT a commercial, NOT cinematic, NOT a product ad.

Use `realism-cinematic` instead for commercial/hero work. **Never apply both.** They pull in
opposite directions (shallow depth-of-field and controlled key light are PASS criteria there and
FAIL criteria here), and mixing them is a known failure mode in this repo.

The defect you are hunting is not ugliness. It is **averageness** — a generative model fills every
variable the prompt left unspecified with the mean of its training data: light from everywhere,
no cast shadow, poreless skin, dead-centre framing, one uniform colour wash. Each block below
tests for one of those means. Judge only what you can actually see; if a question cannot be
resolved at this resolution, fail it and say so rather than guessing.

## BLOCK: LIGHT
- Is there ONE dominant light source with a direction you could point at?
- Is at least one side of the subject's face or body measurably darker than the other?
- Is there at least one CAST shadow (a shadow thrown onto another surface) anywhere in frame?
- Do objects resting on a surface have a CONTACT shadow where they touch it?
- FAIL if the scene is evenly lit from all sides with no discernible direction.

## BLOCK: OPTICS
- Is there a single plane of focus, with something in the frame measurably softer than the subject?
- Is the background less sharp than the subject?
- Is the image free of bright sharpening halos along high-contrast edges (hair against wall, shoulder against window)?
- FAIL if every object from foreground to background is equally sharp.

## BLOCK: SKIN
(Skip this block and mark it pass if there is no person in frame.)
- Is skin texture visible — pores, fine lines, or slight unevenness — rather than uniformly smooth?
- Is there at least one specular highlight or patch of shine (forehead, nose, cheekbone)?
- Is the face asymmetric in a natural way, rather than mirror-perfect?
- Are there any genuine imperfections — a stray hair, a blemish, uneven colour?
- FAIL if skin is poreless, waxy, airbrushed, or uniformly matte.

## BLOCK: FRAMING
- Is the subject somewhere other than dead-centre, or the horizon slightly off-level?
- Does the framing look like someone holding or propping a phone rather than a composed setup?
- Is the background genuinely lived-in — visible clutter, something slightly out of place?
- FAIL if the composition is symmetrical, perfectly level, and centred like a studio portrait.

## BLOCK: COLOUR
- Does the image have a believable white balance rather than a single global colour wash?
- Are there neutral tones somewhere (a white or grey that reads as actually white or grey)?
- FAIL if the whole frame is tinted one colour (uniformly teal, orange, or amber).

## BLOCK: ARTEFACT
- Is the image completely free of text, watermarks, captions and subtitles?
- Are hands, fingers and limbs anatomically correct and correctly counted?
- Is the image free of a phone/screen/polaroid/film-strip border or device mockup framing the scene?
- Is the geometry coherent — no objects merging, no impossible joins, no duplicated features?
- FAIL on any of the above.

## BLOCK: UGC-SPECIFIC
- Does this read as a phone camera rather than a cinema camera — slightly wide, a little flat, unglamorous?
- Is it free of cinematic grading, vignetting, letterboxing and lens flare?
- Would this be unremarkable in a normal person's camera roll?
- FAIL if it looks like an advertisement.
