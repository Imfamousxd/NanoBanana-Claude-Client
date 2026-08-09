# PROMPT-2.5 — how to write a maximally-detailed Seedance 2.5 prompt

Researched + cross-corroborated 2026-08-09 (ByteDance 2.5 announcement, ModelArk 2.5 guide,
vidmuse, segmind, apiyi 6-step guide). These are the *documented* rules; where a HOUSE law was
measured on our own footage it wins (marked ⚑). Sources at the bottom.

**The one idea:** detail = SPECIFICS, not adjectives. "A single line about lighting beats ten
adjectives." Every empty word ("cinematic", "beautiful", "amazing", "fast") is dropped signal.

---

## The shot formula (60–100 words per shot)

`[Subject] , [Action] , in [Environment] , camera [ONE Move] , style [Style] , avoid [Constraints]`

| Slot | Make it detailed by naming… | Weak → Strong |
|---|---|---|
| **Subject** | age, build, wardrobe (garment + color + material), hair, expression, held props | "a woman" → "a woman in her thirties, short dark hair, beige wool trench, tired half-smile" |
| **Action** | ONE continuous arc with a start and end; specific verbs; intensity | "she does stuff" → "she lifts the cup, sips, sets it down and exhales" |
| **Environment** | place, time of day, and ONE precise light | "a room" → "a dim prep kitchen at dawn, cold light through a half-closed shutter" |
| **Camera** | exactly ONE named move (list below); keep it separate from the subject's motion | "cinematic angles" → "low tracking shot, then a subtle rise" |
| **Style** | concrete grade/reference, not vibes | "epic" → "warm color grade, 35mm halation, slight handheld texture" |
| **Constraints** | only ACHIEVABLE negatives | "avoid bad stuff" → "avoid jitter, bent limbs, extra fingers" |

## The 8 camera moves — name one, only one
push-in (dolly in) · pull-out (dolly out) · pan · tracking · orbit (arc) · aerial · handheld ·
fixed (locked-off). ⚑ For a truly locked camera, set the **parameter** `camera_fixed`, don't just
write it. Two conflicting moves in one shot is a known failure.

## Killer words — delete on sight
`fast` (chaotic motion) · `cinematic` (vague) · `amazing` / `epic` / `beautiful` (empty) ·
`lots of movement`. Also never stack subject-speed + camera-speed + a complex scene in one shot.
⚑ And never name a device to describe a look ("like a phone camera" renders a phone).

## 30 seconds = a 4-beat arc, not one long moment
Write **opening → progression → turn → resolution**, each beat time-stamped, each beat one action.
Full example (cold-brew commercial, verbatim from the guide):

> Opening (0–6s): a barista's hands in a dim prep kitchen before opening. Steam, cold light
> through a half-closed shutter. Quiet.
> Progression (6–16s): the room fills and the pace lifts. Stay inside the same space, the same
> pair of hands keeps working.
> Turn (16–24s): the first customer of the day takes the cup. The grade warms, room noise drops
> behind a single line of music.
> Resolution (24–30s): wide on the open shop, brand apron in frame, hold on the last two seconds.

⚑ House pacing law still governs dialogue: UGC is UNHURRIED (2.18–3.1 w/s); count the words.

## References — cite them, name their job
2.5 takes up to **30 images, 10 videos, 10 audio** in one pass. Cite each in the prompt with
`@Image N` / `@Video N` / `@Clay Render N` (1-indexed by upload order) and say what it's FOR:
"@Image 1 is the character", "@Image 2 is the product — reproduce its label exactly." Reference
only RECURRING subjects; don't dump unlabeled refs. `@Clay Render N` (textureless 3D) locks
spatial structure, pose, motion path and camera when blocking must match an intent.
⚑ Still true: a person in ANY ref image is refused; own-brand product/card art passes.
**The engine now auto-builds the `@Image N` manifest from `refs.images[]` — set each ref's
`name` and `describe`.** ✅ MEASURED 2026-08-09 (A/B, val-2p5-cardref): 2.5 takes a
reference_image next to a text-born person and reproduces own-brand card art faithfully; @Image
and prose give COMPARABLE single-reference fidelity (both faithful). The @-notation advantage is
for disambiguating MULTIPLE references — still untested. `--cite prose` is a measured-equal
fallback. (Text-born wardrobe drifts either way — use an avatar when identity must hold.)

## QA checklist before you spend
- [ ] Subject has ≥4 concrete anchors (age/wardrobe/color/expression)?
- [ ] Exactly ONE camera move, named, separate from subject motion?
- [ ] Exactly ONE precise lighting line?
- [ ] One continuous action per beat (multi-action → split into timed beats)?
- [ ] Zero killer words (`node video-engine.mjs --brief …` warns on them)?
- [ ] Every reference cited `@Image N` and given a purpose?
- [ ] Dialogue counted against the house w/s band?

## Sources
- [ByteDance — Introducing Seedance 2.5](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5) — @-notation, 30/10/10 refs, clay render
- [ModelArk — Seedance 2.5 prompt guide](https://docs.byteplus.com/en/docs/ModelArk/2607689)
- [apiyi — Seedance 6-step formula + 8 camera moves + pitfalls](https://help.apiyi.com/en/seedance-2-0-prompt-guide-video-generation-camera-style-tips-en.html)
- [vidmuse — five-part framework](https://vidmuse.ai/blog/seedance-2-5-guide) · [segmind — 4-beat arc + example](https://blog.segmind.com/seedance-2-5-prompts-how-to-prep-your-workflow-now/)
- KG laws: `graph-fragments/seedance25_laws.json` (sd25:detailed-prompt-formula, camera-move-vocabulary, prompt-killer-keywords, reference-citation-with-at-notation, prompt-five-part-structure)
