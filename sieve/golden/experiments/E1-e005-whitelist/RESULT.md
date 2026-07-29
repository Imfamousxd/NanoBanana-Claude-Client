# E1 — Does seedance-2.0's human filter whitelist Seedream-generated portraits?

**Run 2026-07-28. Hypothesis REFUTED. Do not retry this.**

## Why it was worth $2

Every talking-head clip this repo has ever shipped runs through `bytedance/seedance-1.5-pro`
(arena Elo ~1,000, rank ~19) because `bytedance/seedance-2.0` (Elo ~1,199, **rank 1** for
image-to-video) throws `E005 "input or output flagged as sensitive"` on photoreal human first
frames. If ByteDance treated its own Seedream-generated portraits as trusted input, routing every
human first frame through Seedream would have moved 100% of character video ~200 Elo for zero
training cost. That was the single largest measured quality delta available anywhere in the audit.

## Method

One variable at a time, `bytedance/seedance-2.0`, 5s / 480p / 9:16 / no audio throughout.

| # | First frame | Prompt | Result |
|---|---|---|---|
| A | Seedream-4 portrait | person-language ("the woman speaks…") | **E005** |
| B | Nano Banana Pro portrait | person-language (identical to A) | **E005** |
| C | Seedream-4 portrait | fully neutral, no person language | **E005** |
| D | Dialed Moods can (non-human) | neutral, identical to C | **SUCCEEDED** |

## Findings

1. **Seedream provenance confers nothing.** A and B are identical failures. The filter does not
   care which model produced the frame.
2. **The trigger is the IMAGE, not the prompt.** C strips every person-word from the prompt and
   still fails; D sends that same neutral prompt with a product frame and succeeds. So this is not
   the known `E005`-on-phrasing behaviour (which rephrasing does fix) — it is a categorical refusal
   of photoreal humans as image input.
3. **D also proves the pipeline itself is sound** — same code path, same account, same parameters,
   succeeds on a non-human frame. The failures are the filter, not a bug here.

## Consequence for the engine

- `seedance-1.5-pro` is **locked in** as the only Seedance route for people. Not a preference — a
  constraint. `seedance-2.0` is objects and scenes only, permanently.
- ~~Because 1.5-pro exposes no `resolution` input, the first frame *is* the output resolution.~~
  **CORRECTED 2026-07-28 by E4** — this was wrong. `resolution` is undeclared on 1.5-pro but IS
  honoured: identical first frame, `1080p` sent → 1080×1920, omitted → 720×1280. Always send it.
  Frame quality still matters (it carries identity, wardrobe and set) but does not set resolution.
- The realistic upgrades for character video are now, in order:
  1. `veo-3.1-fast-generate-preview` + `referenceImages` — $0.12/s, same price as 1.5-pro, and the
     only reference-image identity lock in the paid stack.
  2. Larger, better-graded first frames into 1.5-pro, gated by `sieve-judge` before animating.
  3. A hosted FLUX character LoRA (~$1.50-2.40) used as an identity **still** factory feeding both.

## Cost

One Seedream image (~$0.03), one successful 5s 480p control clip, three E005 failures (failures do
not bill). Well under the $2 budgeted.
