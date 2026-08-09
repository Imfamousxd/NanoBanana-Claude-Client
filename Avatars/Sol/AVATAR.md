# Sol — first Soul-born avatar (STATUS: APPROVED)

**✅ APPROVED 2026-08-09 by the founder (operator) for paid brand use.** The face is now locked;
every downstream artifact (anchors, scene frames, any future coverage) is anchored to this
identity. Relocking later would invalidate them, so treat the canonical as fixed.

## Who he is
24-year-old Mexican-American man, Southern California. Short dark curly hair, light stubble
(mustache-forward), thin gold chain, plain white t-shirt. Easy half-smile, natural unhurried
delivery. Born 2026-08-09 as Higgsfield **Soul** generation `c6630b08` (seed 626510) — a fully
synthetic person; no real likeness involved.

## Why he exists
He is the proof-of-concept for the **Soul casting lane**: Higgsfield Soul produces the identity
(real-sun light, true skin texture — quality our text-prompted image models never hit on a first
roll), and Seedance 1.5-pro animates it with native speech. Measured 2026-08-09: identity holds
through animation; scripted line delivered VERBATIM on the first roll ("Yeah, man, this thing
actually works" — Whisper-confirmed).

## The consistency law for Soul avatars
- **Identity carrier = the identity portrait(s) in `identity/`, passed as the first frame.**
  Same rules as every avatar: never animate from memory or prompt description alone.
- **Video model: Seedance 1.5-pro ONLY.** Measured walls, not preferences:
  - Seedance **2.5 refuses him entirely** — any human image in any role, AND any video of him
    not born in 2.5 (law `sd25:extension-only-accepts-25-born-humans`).
  - Seedance **2.0 refuses human first frames** (E005, image-triggered).
  - Route: **ModelArk `seedance-1-5-pro-251215`** OR **Replicate `bytedance/seedance-1.5-pro`** —
    cost is basically a wash, correcting an earlier doc error. Real rates from the live billing
    table applied to the measured 5s/1080p token count (245025): ModelArk **~$0.29 silent /
    ~$0.59 with audio** (ToVSilentCompletion 0.0012/K, ToVCompletion 0.0024/K); Replicate ~$0.62
    flat. ModelArk is cheaper or equal, so prefer it for single-platform simplicity. Provenance
    still does NOT unlock 2.5 (measured 2026-08-09).
- **He cannot be registered as a ModelArk digital asset** — `aigc_writable: false` on our
  account. See `craft/DIGITAL-CHARACTERS.md` for the full door map.

## Voice
Whatever 1.5-pro rolls per take (no voice pinning on this lane; `seed` pins a CLIP, not a
person). First take's voice: young, relaxed SoCal — operator-judged pending. For multi-segment
pieces carry the SAME seed across segments (E6 law) and vary only the words.

## Files
- `identity/portrait_car_sunlight.png` — canonical (Soul c6630b08, 1152×2048)
- `takes/2026-08-09_first-words-replicate-15pro.mp4` — first spoken take, transcript verbatim
- `takes/2026-08-09_silent-modelark-15pro.mp4` — ModelArk-native silent take (P-15A)

## To extend his coverage
Generate more Soul portraits FROM the same character (Higgsfield `soul_id` character training —
5-20 photos of him already exist across takes; or one-off `soul_2` + this portrait as reference)
→ verify likeness with `sieve-avatar.mjs verify Sol --candidates ...` before adding to
`identity/`. Anchor diversity (yaw × light) is what holds a face — same as every avatar.
