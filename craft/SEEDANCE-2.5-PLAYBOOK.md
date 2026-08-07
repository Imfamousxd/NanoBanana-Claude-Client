# SEEDANCE 2.5 — how to actually use it

19 measured laws, `graph-fragments/seedance25_laws.json` (prefix `sd25:`). Everything here was
probed against the live ModelArk API on 2026-08-06/07 while building the Muha Golden Hour campaign.
Where ByteDance's docs disagree, the measurement wins and the doc is named as wrong.

---

## PART 0 — WHERE THIS OVERTURNS OUR OWN RULEBOOK

Read this first; three standing rules in `CLAUDE.md` are now wrong or wrongly scoped.

1. **"Seedance categorically refuses photoreal humans — 1.5-pro is the only option."**
   FALSE for 2.5 in text-to-video. It generates photoreal people *speaking, lip-synced*, from text
   alone. The refusal is scoped to a supplied photoreal **first frame**, not to the model.
   → `sd25:e005-is-frame-scoped-not-model-scoped`

2. **"ALWAYS send `resolution: 1080p`."**
   Correct on Replicate for 1.5-pro/2.0. On ModelArk 2.5 it is a hard error — the model accepts
   **only** `720p`. → `sd25:resolution-is-720p-only`

3. **"seedance-1.5-pro = 12s, 2.0 = 15s, anything longer is stitched."**
   2.5 accepts `--dur 30` and completes. The stitching machinery is not needed on this model.
   → `sd25:duration-accepts-up-to-30s`

---

## PART 1 — PICK THE MODEL BY SUBJECT, NOT BY RECENCY

| Subject | Model | Why |
|---|---|---|
| A person talking | **2.5** | only model that does photoreal humans + native lip-synced speech. 720p ceiling, accept it. |
| Product, landscape, yacht, deck, packaging | **2.0** | accepts `4k`, **delivers 2160×3840**. No people means no refusal. |
| Client's branded artwork | **2.5 i2v, locked camera** | animate the approved art; never regenerate a mark. |

Getting this wrong costs either resolution or a refusal. There is no model that does both people
and 4K on this account today.

---

## PART 2 — THE CALL THAT WORKS

```
POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
GET  .../tasks/{id}        # poll
```

**The docs' `ark.ap-southeast-1...` host does not resolve.** Exit 6, HTTP 000.

```jsonc
{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": false,          // TOP-LEVEL field, defaults TRUE — see Part 4
  "content": [
    { "type": "text", "text": "<prompt> --ratio adaptive --dur 10 --camerafixed true --watermark false" },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." }, "role": "first_frame" }
  ]
}
```

- Parameters ride as **trailing `--flags` inside the text part**, not as JSON keys.
- `generate_audio` is the exception — a real top-level field.
- **With a `first_frame`, `--ratio` MUST be `adaptive`.** Any explicit ratio is a hard error, and
  output shape follows the frame. Check the frame's dimensions before spending.
- With **no** first frame, `--ratio 9:16` works normally.
- Roles: `first_frame` · `last_frame` · `reference_image` · `reference_video` · `reference_audio`.
  Only the first two of those were exercised here — do not assume the others' input shapes.

---

## PART 3 — THE UGC RECIPE (the thing that actually worked)

Five blocks, in this order. Omitting any one of them measurably degrades the result.

1. **Look** — "Vertical selfie video, shot on a phone at arm's length, golden hour at a marina."
   Use that phrasing. **Never name a device model** — naming one makes it render the device.
2. **Skin** — visible pores, natural oil shine on nose and forehead, freckles, faint sunburn,
   *no beauty filter and no skin smoothing*.
3. **Camera behaviour** — she holds the phone herself so the frame bobs, drifts and re-centres;
   auto-exposure hunts as she moves relative to the sun.
4. **Human micro-behaviour** — squints into the low sun, blinks naturally, glances down and back,
   pushes hair off her face when the wind catches it.
5. **Timed beats with speech in double quotes** —
   `0-6s: Close on her face. She says: "…"` — the model executes the beats as distinct shots,
   including camera moves, inside one generation.

**Write the script to `ugc_laws`**, not to taste: hook ≤14 words landing inside 3.6s carrying the
concrete noun; gate **articulation** rate (~3.0–4.0 w/s while actually speaking) rather than
wall-clock; CTA fused, no separate outro.

**Spell brand names phonetically** — write `MOO-ha`, not `Muha`, or it comes back "MUHU".

---

## PART 4 — THE FOUR WAYS IT TAKES YOUR MONEY

1. **Audio defaults ON and refuses itself.** Leave `generate_audio` unset and the model invents a
   score, then refuses its own output: `OutputAudioSensitiveContentDetected`. Cost us 2 of 3 clips
   on the first paid run. Either set it `false`, or direct it (next item).
2. **Ambience passes; music does not.** To keep native audio, say exactly what it is and close off
   the musical vocabulary: *"natural location ambience only — water and a light breeze, as recorded
   on location. No voices, no instruments, no melody, no song, no soundtrack."* Four for four.
3. **Moderation judges the FRAME, not the subject.** A tightly-cropped branded watch was refused;
   the same watch inside the client's full poster passed twice. Spoken brand names pass. Prominent
   rendered branded product fails. **Re-rolling identical input is not the fix — change the input.**
4. **A generic `InvalidParameter` tells you nothing.** Isolate one variable at a time. A single
   failed probe in this build produced a wrong blanket rule that a proper re-test corrected.

---

## PART 5 — THE PATTERN FOR BRANDED WORK

Generated footage carries **unbranded action only**. Every branded frame is the client's own
approved artwork, animated i2v with a locked camera.

That is simultaneously the moderation fix and the fidelity fix: the mark on screen is pixel-exact
rather than an imitation. Verified by cropping the type band at first/middle/last frame — every
letter stayed stable.

**The cost of this pattern:** the creator cannot be generated *holding* the real product. The open
route is a composited first frame — Nano Banana places the real card in her hand, that frame goes
to 2.5 as `first_frame`. **Untested, and it is the single highest-value next experiment**, because
it is the difference between a creator miming a card and a creator showing one.

---

## PART 6 — WHAT WE STILL DO NOT KNOW

Named so nobody assumes them:

- **Photoreal human as a `first_frame` on 2.5.** Never tested. Blocks the hold-the-product route.
- **`video_extension`.** Declared; the documented route past 30s with identity intact. Untested.
- **`video_editing`, `last_frame`, `reference_video`, `reference_audio`.** Declared, untested.
- **Whether a policy-refused generation is billed.** Assumed yes; verify on the next statement.
- **Whether the ambience exclusion list can be shortened.** Applied as one block.
- **Audio realism.** Operator judgement: the voice reads cleaner than a real phone recording.
  Untested lever — ask for the voice to be *recorded on the phone's microphone* rather than
  describing it as close and clipped.
