# E5 — Multiple avatars in one generation, through Seedance

**Run 2026-07-28. Works. This is the Higgsfield "multiple avatars at once" capability.**

## The constraint that dictates the architecture

Seedance has **no avatar/identity input for people at all**. From the live schemas:

| Model | identity inputs | humans? |
|---|---|---|
| `seedance-1.5-pro` | `image` (first frame) only — **no `reference_images`** | yes |
| `seedance-2.0` | `reference_images` (up to 9) | **NO — E005, see E1** |

So the one model that will render people cannot be handed reference images, and the one that takes
reference images refuses people. **100% of human identity in Seedance is carried by the first frame.**

That is not a limitation to work around — it is the whole design. Get the frame right and the clip
inherits it; get the frame wrong and no prompt wording will rescue it.

## Method

1. Nano Banana Pro composed ONE frame from **two** avatar canonicals — Marcus (ref 1) and Renee
   (ref 2) — with each person's role named explicitly and an instruction not to blend or swap faces.
2. Cropped each person and verified them SEPARATELY. Verifying a two-person frame as a whole is
   meaningless; the gate must be run per person.
3. Animated the pair with `seedance-1.5-pro`, 8s, 1080p, `camera_fixed: true`, audio on.
4. Re-cropped both people at frames 3 / 95 / 188 and re-verified.

## Result

| Stage | Marcus | Renee |
|---|---|---|
| Composed frame | MATCH (high) | MATCH (high) |
| Clip @ start / mid / end | **MATCH 3/3** | **MATCH 3/3** |

Output: 1080×1920, 8.04s, synced audio, both people speaking in turn. Neither identity drifted, and
the two faces did not blend into each other — the classic multi-subject failure.

## The pattern

**Compose at the IMAGE stage, animate at the VIDEO stage.** N avatars in one shot = N canonicals
into one Nano Banana frame, each person's role named, then a single image-to-video call. This is
mechanically what Higgsfield's "Hero Frame First" does, and it needs no capability Seedance lacks.

Rules that made it work, all load-bearing:
- Name each reference by role: "Reference image 1 is MAN A. Reference image 2 is WOMAN B."
- State positions explicitly ("A on the LEFT, B on the RIGHT") or the model reorders them.
- Say "do not blend, merge or swap the two faces" — multi-subject blending is the default failure.
- Say "do not beautify or slim either person" — the generator drifts toward its beauty prior.
- Verify **per person on a crop**, never on the whole frame.

## Kit inconsistency found (not a code bug)

Renee's descriptor reads "visibly plus-size ... full round face and full figure", but her canonical
portrait is chest-up and does not show that. Every generation anchors to the CANONICAL, so the
descriptor's build language can never be honoured while the two disagree. Fix the kit — either
re-shoot the canonical full-body or soften the descriptor — because a descriptor the canonical
contradicts is a rule that silently never applies.

## Cost

One frame, one 8s 1080p clip, ~10 VLM verifications. Roughly $1.20.
