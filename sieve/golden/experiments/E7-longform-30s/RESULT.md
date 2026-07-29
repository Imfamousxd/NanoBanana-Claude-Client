# E7 — A real 30-second piece from a 12-second model

**Run 2026-07-28. Works. 3 × 10s segments, chain mode, one seed.**

Output: `generations/longform/REC-30s-demo/REC-30s-demo_FINAL.mp4` — **1080×1920, 30.2s**, synced
audio throughout. Cost ~$3.60.

## QC across all three segments

| Check | Result |
|---|---|
| **Voice** — would a listener hear a cut? | `all_same_speaker: true` (high), **no seam at cut 1 or cut 2** |
| **Face identity** vs the Marcus canonical | **MATCH 3/3** (high) |
| **Descriptor conformance** | seg1 OK · seg2 OK · **seg3 VIOLATED — "warm brown eyes"** |
| **Look drift** (mean luma) | 126.73 → 126.33 → **122.90** |

## What this confirms

**The seed solves the audio seam.** Three separately-generated segments, different dialogue in each,
and no audible voice change at either cut. This was the blocker for all long-form work and it is
closed. E6 predicted it; E7 confirms it on a real multi-segment piece.

**Chain-mode drift is real but mild at 3 segments** — about 3% darkening end-to-end, plus a slight
push-in visible on the contact sheet. That matches the predicted direction and supports the current
guidance: chain to ~3 segments, switch to `--mode anchor` beyond that. A 60s piece (6 segments)
would roughly double this, which is why anchor mode exists.

**The descriptor gate earned its place.** All three segments passed the FACE check — correct bone
structure, genuinely Marcus — but by segment 3 the eye colour had drifted off "warm brown". A
face-only gate would have shipped that. Identity and descriptor conformance are different questions
and both need asking; this is the case that proves it.

## Practical rule

For anything past ~3 segments, use `--mode anchor`, or re-derive a fresh first frame from the avatar
canonical every third segment. Fixing the seed costs nothing and must always be done. Re-run
`sieve-avatar.mjs verify` on the segment frames before shipping — the seed holds the voice, not the
face, and not the descriptor.
