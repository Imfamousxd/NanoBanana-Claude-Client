# Sol — first Soul-born avatar (STATUS: CASTING)

**⚠️ CASTING — the founder has not approved this face for paid brand use.** Probe/test use only
until approved. Approving locks every downstream artifact (house rule).

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
  - Route: **Replicate `bytedance/seedance-1.5-pro` ~$0.62/5s** (preferred, 4× cheaper) or
    ModelArk `seedance-1-5-pro-251215` ~$2.62/5s est. (activated 2026-08-09; single-platform
    convenience, provenance does NOT unlock 2.5 — measured same day).
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
