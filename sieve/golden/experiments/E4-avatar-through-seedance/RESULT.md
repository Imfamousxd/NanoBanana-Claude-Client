# E4 — Does an avatar survive the whole chain, and does `resolution` matter on 1.5-pro?

**Run 2026-07-28. Two results: the chain works, and a regression was caught.**

## Part 1 — avatar identity end-to-end

The question behind "can we make multiple avatars, or always reuse the same one, through Seedance":
does a locked identity actually survive **anchor → new-scene frame → Seedance clip**?

| Step | Result |
|---|---|
| `resolve Marcus --yaw 3q-right --light window-left` | returned the matching anchor, not a frontal |
| Nano Banana Pro frame in a **garage gym** — a set Marcus has never appeared in | generated |
| **Gate 1** — `verify Marcus` on the frame | **MATCH** (high) |
| `seedance-1.5-pro`, 5s, `camera_fixed: true`, audio on | succeeded |
| **Gate 2** — `verify Marcus` on clip frames at **start, middle and end** | **MATCH 3/3** (high) |

Identity survives a scene change AND survives animation, and it is checked at three points in the
clip rather than only at frame 0, because drift shows up late. The chain is real.

## Part 2 — the regression this run caught

The clip came back **720×1280**, while `REC-ugc-01` (generated before today's edits, from a frame of
identical dimensions) was **1080×1920**.

Cause: earlier today `seedance-run.mjs` and `seedance-batch.mjs` were given "capability gates" that
withhold any field a model does not declare in its OpenAPI schema. `seedance-1.5-pro` does not
declare `resolution`, so it stopped being sent — and output silently halved.

Controlled A/B, identical 1536×2752 first frame, identical prompt, one variable:

| `resolution` | Output |
|---|---|
| omitted | **720×1280** |
| `"1080p"` | **1080×1920** |

**`resolution` is UNDECLARED BUT HONOURED on seedance-1.5-pro.** Replicate tolerates undeclared
input keys and ByteDance's model uses this one. So "absent from the schema" does **not** mean
"rejected", and the earlier claim that 1.5-pro output "tracks the first frame" was wrong — the frame
was identical in both runs.

Fixed: both runners now always send `resolution`, with a comment warning against re-gating it.
`camera_fixed`/`fps` gating stays — those genuinely are absent on 2.0.

## Lesson worth keeping

A capability gate built from a declared schema is a guess about the server's tolerance, not a fact
about it. Where a field is cheap to send and costly to omit, send it and verify the output — do not
infer from the schema. This one cost half the delivery resolution on every people clip until an
end-to-end run measured actual pixels.

## Cost

One Nano Banana frame, two 5s 1080p clips, ~8 VLM verifications. Roughly $1.50.
