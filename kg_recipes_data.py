"""Recipe + facet CONTENT for kg-vault.py.

Kept separate from the builder so editing what a recipe SAYS never risks the code that
renders it. kg-vault.py exec()s this file and expects RECIPES and UNIVERSAL_FACETS.
"""

# ---------------------------------------------------------------------------
# Recipes. `banks` = which law banks govern. sd25 api/routing/moderation laws
# apply to EVERYTHING that runs on Seedance 2.5, so they are pulled in by facet.
# ---------------------------------------------------------------------------
RECIPES = [
    {
        "id": "ugc-talking-head",
        "title": "UGC talking head — a person to camera",
        # NEVER put a campaign name here. "The Golden Hour giveaway clip is this" sat in this slot
        # until 2026-08-08 — an invented campaign name at the top of the note, 195 lines above the
        # callout that debunks it. An agent that reads the header and stops is re-primed with the
        # exact error the registry exists to prevent.
        "when": "A creator, selfie framing, speaking to camera. Resolve the campaign before writing "
                "a word — see the compliance block.",
        "banks": ["ugc_laws"],
        "model": "`dreamina-seedance-2-5-260628` — **text-to-video**",
        "why": "The only model on this account that generates photoreal people speaking with native "
               "lip-sync. 720p is a hard ceiling; accept it. Do NOT reach for a first frame — see refusals.",
        # generate_audio MUST be true here. This block shipped `false` until 2026-08-08, which on a
        # talking head means a MUTE clip at full price — the audio is the deliverable. The audio
        # direction excludes MUSIC only; "no voices" belongs to speechless ambience shots and would
        # suppress the dialogue. See sd25:audio-for-talking-heads-keep-it-on-exclude-music-only.
        "call": """{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": true,
  "content": [
    { "type": "text", "text": "<prompt> … Audio: her voice close on the phone mic with natural location ambience under it. No instruments, no melody, no song, no soundtrack. --ratio 9:16 --dur 10 --resolution 720p" }
  ]
}""",
        "cost": [("5s", "$1.16"), ("10s", "$2.32"), ("30s", "$6.97")],
        "refusals": [
            ("A photoreal human as `first_frame` **or** `reference_image`",
             "`InputImageSensitiveContentDetected.PrivacyInformation` at submit — free, but blocks the shot.",
             "**Generate the person from TEXT.** The guard is image-scoped, not model-scoped: the "
             "identical person passes freely as a `reference_video`. There is no image-mediated "
             "identity route on 2.5 — measured, `ext-limits.md` finding 5."),
            ("`generate_audio` left unset — **or set to `false`**",
             "Unset defaults TRUE: the model invents a score then refuses its own output for "
             "copyright (`OutputAudioSensitiveContentDetected`). 2 of 5 refusals on 2026-08-07 were "
             "this. But `false` is NOT the fix on a talking head — it suppresses **all** audio "
             "including the dialogue, shipping a mute clip at full price.",
             "Send `true` and **direct the audio, excluding music only**: *\"her voice close on the "
             "phone mic with natural location ambience under it. No instruments, no melody, no "
             "song, no soundtrack.\"* Measured 4/4 extension hops, dialogue near-verbatim under "
             "Whisper, zero copyright refusals. **Never write \"no voices\" here** — that clause is "
             "for speechless ambience shots and it mutes your creator."),
            ("A prominent rendered third-party mark",
             "`OutputVideoSensitiveContentDetected.PolicyViolation` — billed, output withheld.",
             "Generated footage carries **unbranded action only**. Branded frames are the client's "
             "own approved artwork, animated i2v."),
        ],
        "gates": [
            "`node sd25-cost.mjs estimate --dur <n> --n <k>` — before submitting, always.",
            "Prove the prompt at **5s**, then commit at length. A 30s test costs the same as six 5s tests.",
            "`python3 sieve-watch.py <out.mp4> --modality ugc --expect-w 720 --expect-h 1280` — Tier 1, authoritative.",
            "`node sieve-judge.mjs --rubric realism-ugc --candidates <dir> --rank` — Tier 2, advisory only.",
        ],
        "extra": "**Write the script to the laws, not to taste.** Hook ≤14 words landing inside 3.6s "
                 "carrying the concrete noun. Gate *articulation* rate (~3.0–4.0 w/s while actually "
                 "speaking), not wall-clock. CTA fused, no separate outro. Spell brand names "
                 "phonetically — `MOO-ha`, not `Muha`.",
    },
    {
        "id": "product-hero-4k",
        "title": "Product hero — packaging, device, no people",
        "when": "The Gen 2x2 device, a can, a bottle, a deck, a landscape. Nothing photoreal-human in frame.",
        "banks": [],
        "model": "`dreamina-seedance-2-0-260128`",
        "why": "Accepts `4k` and **delivers 2160×3840**. No people means no privacy guard. "
               "**0 failures across 32 tasks on this account** — the most reliable route in the stack. "
               "2.5 would cap you at 720p for no gain.",
        "call": """{
  "model": "dreamina-seedance-2-0-260128",
  "generate_audio": false,
  "content": [
    { "type": "text", "text": "<prompt> --ratio 9:16 --dur 5 --resolution 4k" },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." }, "role": "first_frame" }
  ]
}""",
        "cost": [("5s", "$1.16"), ("10s", "$2.32")],
        "refusals": [
            ("A first frame carrying a third-party trademark",
             "Refused. A tightly-cropped branded watch was refused; the same watch inside the "
             "client's full poster passed twice.",
             "**Check the asset index before spending.** Moderation judges the FRAME, not the "
             "subject — so crop the mark out, or use the asset's own-brand side. Re-rolling "
             "identical input is not the fix; change the input."),
        ],
        "gates": [
            "`node sieve-product.mjs check <batch.json>` — **exit 2** if a job names a SKU and attaches no canonical.",
            "`python3 sieve-label.py --preflight --canonical <ref> --frame-w <w> --product-frac <f>` — "
            "predicts whether the label can be legible AT ALL before you spend. Below ~18px cap "
            "height a diffusion model draws letter-shaped noise.",
        ],
        "extra": "**Never instruct \"no logo\".** Told to leave a label bare, the model invented a gold "
                 "leaf emblem. An unspecified surface gets filled — specify what belongs on it.",
    },
    {
        "id": "branded-artwork",
        "title": "Branded artwork — animate the approved art",
        "when": "The raffle card, a poster, a lockup. Anything where the mark must be pixel-exact.",
        "banks": [],
        "model": "`dreamina-seedance-2-5-260628` — **image-to-video**, locked camera",
        "why": "This is simultaneously the moderation fix and the fidelity fix: the mark on screen is "
               "the client's own file rather than an imitation. Verified by cropping the type band at "
               "first/middle/last frame — every letter stayed stable.",
        "call": """{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": false,
  "content": [
    { "type": "text", "text": "<prompt> --ratio adaptive --dur 5 --camerafixed true --watermark false" },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." }, "role": "first_frame" }
  ]
}""",
        "cost": [("5s", "$1.16")],
        "refusals": [
            ("`--ratio 9:16` with a `first_frame`",
             "`InvalidParameter.TaskTypeConstraint`: *\"For first-frame generation, the output ratio "
             "follows the first-frame image. `ratio` must be `adaptive`.\"* Free, but it is a wasted round trip.",
             "**With any first frame, `--ratio` MUST be `adaptive`.** Output shape follows the image, "
             "so check the frame's dimensions before you spend."),
            ("Muha campaign cards specifically",
             "Both `Members Raffle Card.png` and `Win Cash + Challenger.png` carry a **Dodge "
             "Challenger** — a third-party mark, rendered AND as burned-in type.",
             "Expect a copyright refusal on prominent framing. Crop to the own-brand region "
             "(the M seal, the type band), or use a card side without the vehicle."),
        ],
        "gates": [
            "`./sieve-ocr <frame.png>` on first/middle/last frame — the letters are either right or they are not.",
            "`python3 sieve-label.py --expect \"MUHA MEMBERS RAFFLE,OFFICIAL ENTRY\" --candidate <frame.png>`",
        ],
        "extra": "Never regenerate a mark. Animate the approved file.",
    },
    {
        "id": "long-form",
        "title": "Long-form — one identity past 30s",
        "when": "A 45s or 60s piece that must be the same person throughout, unbroken.",
        "banks": [],
        "model": "`dreamina-seedance-2-5-260628` + `role: reference_video`",
        "why": "A single call is capped at 30s. Extensions **chain with no limit found** — depth 3 "
               "assembled 60.111s of one continuous woman with identity intact at the last frame. "
               "Resolution does not degrade (it even upscales 854×480 → 1280×720).",
        "call": """{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": true,
  "content": [
    { "type": "text", "text": "Continue [Video 1] forward from its final frame as one unbroken take. … --ratio adaptive --dur 30 --resolution 720p" },
    { "type": "video_url", "video_url": { "url": "<source .mp4 url>" }, "role": "reference_video" }
  ]
}""",
        "cost": [("30s fresh", "648,900 tok"), ("30s extension", "1,080,000 tok — **66% MORE**")],
        "refusals": [
            ("`--dur 31`, `--dur 40`, `--dur 99`",
             "HTTP 400 at submit, named param `contents[0].text.duration`. **No task created, "
             "nothing billed.** The 30s ceiling is scoped to the MODEL, not the task type.",
             "Cap at 30. `--dur 5`, `10` and `30` are all positively verified on the extension path."),
            ("Phrasing the extension as *\"Extend Video 1 **backward**\"*",
             "No continuation at all — the model re-shot the source's whole move at higher "
             "resolution. **It still billed 216,000 tokens.**",
             "Say **\"Continue … forward from its final frame\"**. The word is load-bearing."),
            ("A still from the clip as `reference_image`",
             "`InputImageSensitiveContentDetected.PrivacyInformation` at submit.",
             "Pass the **video**, not a frame of it. Same person, same lineage, minutes apart: "
             "still → refused, video → accepted four times."),
        ],
        "gates": [
            "Level-match in post — per-segment level drifts ~2.6 dB and the noise floor ~5 dB.",
            "`ffmpeg -f concat -c copy` — segments are byte-compatible, no re-encode needed.",
        ],
        "extra": "**Extend in the biggest allowed bite. Never in 5s nibbles.** Billing is "
                 "`floor(src_seconds) + k(out) × out_seconds`, with k(5)=1.0, k(10)=1.2, k(30)=1.5 — "
                 "so you re-pay for the source on every hop. Six 5s hops off a 10s source bill 90 "
                 "units; one 30s hop off a 5s source bills 50, for half again the footage.",
    },
    {
        "id": "street-interview",
        "title": "Street interview",
        "when": "Question-and-answer on the street, interviewer mostly off-camera.",
        "banks": ["street_laws"],
        "model": "`dreamina-seedance-2-5-260628` — text-to-video",
        "why": "Photoreal people speaking. Same route as UGC; the laws differ, not the plumbing.",
        "call": None,
        "cost": [("10s", "$2.32")],
        "refusals": [],
        "gates": ["**Do NOT gate this with `sieve-watch.py --modality ugc`** — it hard-fails silent "
                  "audio and reads intended camera moves as defects."],
        "extra": "",
    },
    {
        "id": "podcast-clip",
        "title": "Podcast clip",
        "when": "Two-lane format — clipped from a real recording, or generated native. Never blended.",
        "banks": ["podcast_laws"],
        "model": "`dreamina-seedance-2-5-260628` — text-to-video",
        "why": "Photoreal people speaking.",
        "call": None,
        "cost": [("10s", "$2.32")],
        "refusals": [],
        "gates": [],
        "extra": "",
    },
    {
        "id": "launch-film",
        "title": "Launch film",
        "when": "A product reveal. Tease, build, reveal.",
        "banks": ["launch_laws"],
        "model": "`dreamina-seedance-2-0-260128` for product; 2.5 if a person speaks",
        "why": "Reveal work is usually product-led, which is 2.0 territory and buys you 4K.",
        "call": None,
        "cost": [("5s", "$1.16")],
        "refusals": [],
        "gates": ["**Do NOT gate with `sieve-watch.py`** — it is calibrated for UGC and reads "
                  "intended camera moves as defects."],
        "extra": "",
    },
]

# sd25 facets that bear on EVERY job running on that model
# `audio` is here because generate_audio is a top-level field on EVERY 2.5 call, its default is
# TRUE, and getting it wrong costs either a copyright refusal or a mute deliverable at full price.
# It was omitted until 2026-08-08, which meant the talking-head audio law surfaced on exactly zero
# recipes — the findability failure mode the comprehension test was built to catch.
UNIVERSAL_FACETS = ["api", "routing", "moderation", "audio", "cost", "production"]
