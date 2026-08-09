# E6 — Does the voice stay the same across clips? (the long-form blocker)

**Run 2026-07-28. YES, but only with a fixed `seed`. Without one it re-rolls every clip.**

## Why this decides whether long-form is possible

No Seedance model will produce more than 12–15 seconds in one call, so anything longer is stitched
from segments. If the voice changes between segments, a 60-second piece has four audible seams and
is unusable. `seedance-1.5-pro` — the only model that renders people — has **no `reference_audios`**
input (that is 2.0-only, and 2.0 refuses humans), so there is no way to *supply* a voice. The only
candidate lever is `seed`.

## Method

Same first frame, same voice descriptor, judged by Gemini on timbre/resonance/accent/rhythm with an
adversarial "assume different speakers and try to confirm it" prior.

| Condition | Dialogue | Result |
|---|---|---|
| **No seed**, two runs | identical | **`same_speaker: false`, high confidence** — "distinct differences in vocal resonance and timbre" |
| **`seed: 424242`**, two runs | DIFFERENT lines | **`same_speaker: true`, high confidence, no seam** |

Median F0 corroborates the unseeded case: 111.5 Hz vs 116.4 Hz on identical inputs. (Pitch alone is
a weak identity signal — two different voices can share a median F0 — which is why the listening
judgement is the primary evidence and F0 is only supporting.)

## The rule

**Every segment of a multi-part piece must carry the SAME `seed`.** Not "should" — the voice is
otherwise re-rolled per call and there is no other input that pins it.

The seed pins voice identity even when the dialogue text changes, which is exactly the condition
stitching requires. Vary the words; never vary the seed.

## Caveat

One adversarial judgement per condition, not a large sample. The contrast is clean (high confidence
in both directions) and the mechanism is plausible — the seed initialises the whole generation
including the audio decoder — but treat "seeded voices always match" as strongly indicated rather
than exhaustively proven. Whisper-QC every take regardless; that rule predates this experiment.

## Cost

Two 5s 1080p clips plus two audio judgements. Roughly $1.30.
