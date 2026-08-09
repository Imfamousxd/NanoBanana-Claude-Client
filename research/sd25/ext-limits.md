# Seedance 2.5 `video_extension` — ceiling, chaining, economics

Measured against the live ModelArk API, 2026-08-07/08, account `3003863700`.
Host `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks`, model
`dreamina-seedance-2-5-260628`.

**Generation budget: 4. Actual paid generations: 4** (E1, E2, E4, E5). Three further probes were
rejected at submit — HTTP 400, no task created, no `usage` object, nothing billed — and are not
counted as generations.

Artifacts: `research/sd25/extlim/` (bodies, task JSON, clips, frames, `ASSEMBLED-60s.mp4`).

---

## VERDICT

**Extension works, chains without limit found, and reaches 60s with one identity — but it is the
most expensive footage this stack produces, and it is the ONLY route to a long-form photoreal human
because every image route is closed by the privacy guard.**

Five things settled:

1. **The ceiling is per-call, not per-chain.** A single call generates **4–30s** of new footage.
   `--dur 31`, `40` and `99` are all rejected at submit with a named error. But extensions **chain**:
   I ran depth 3 with no degradation and assembled **60.111 s** of one continuous woman —
   `10.08 → +5 → +10 → +5 → +30` — from a 10 s base. No chain limit was reached.
2. **The output is the NEW SEGMENT ONLY — you pay for the source again anyway.** A 5 s extension of
   a 10 s clip returns a 5.000 s file and bills 15 s. Assembly is your job (stream-copy concat works;
   all segments come out byte-compatible).
3. **Resolution does not degrade. 720p, 720×1280, 24 fps, AAC 32 kHz stereo, through all four hops.**
   Extension even *upscales*: an 854×480 source returned 1280×720.
4. **Audio continues rather than restarting** — same codec, same ambience bed, dialogue delivered
   near-verbatim in every segment including 82 words across a 30 s extension. But per-segment
   level drifts ~2.6 dB and the noise floor ~5 dB; level-match in post.
5. **The alternative route is CLOSED.** A still frame of a generated human, passed as
   `reference_image`, is refused at submit for privacy — the same guard that blocks `first_frame`.
   The guard is **image-scoped, not model-scoped**: the identical person, from the identical
   generation, passes freely as a **video**. There is no cheaper identity path; extension is it.

**Economics headline:** a 30 s extension costs **1,080,000 tokens** against **648,900** for a fresh
30 s generation — a **66 % premium** for continuity. The premium is worst on short extensions
(3.0× per delivered second) and best on long ones (1.67×). **Therefore: extend in the biggest
allowed bite (30 s), never in 5 s nibbles.**

---

## NUMBERED FINDINGS

### 1. A single extension is capped at 30 s — rejected at SUBMIT, named parameter, free

`--dur 40` and `--dur 31`, both with a `reference_video` part, returned HTTP 400 in ~2 s:

```
SUBMIT HTTP 400 (2.1s)
{"error":{"code":"InvalidParameter","message":"The parameter `contents[0].text.duration` specified in the request is not valid: the specified duration is not supported for model dreamina-seedance-2-5. Request id: 021786148395282b70b2a74477c2b606f823ac231da8329b8d5e9","param":"contents[0].text.duration","type":"BadRequest"}}
```

```
SUBMIT HTTP 400 (2.0s)
{"error":{"code":"InvalidParameter","message":"The parameter `contents[0].text.duration` specified in the request is not valid: the specified duration is not supported for model dreamina-seedance-2-5. Request id: 0217861484085165c43ce2d9f034e7655d8947a03ca6d932251d2","param":"contents[0].text.duration","type":"BadRequest"}}
```

A sibling probe at `--dur 99` returned the identical code and param path. The message scopes the
limit to **the model**, not to the extension task — the same 30 s ceiling as text-to-video.

Positively verified on the extension path in this pass: **`--dur 5`, `--dur 10`, `--dur 30` all
succeed** (E1, E2, E5). The lower bound of 4 is documented by a third-party mirror and corroborated
by two pre-existing `duration:4` tasks on this account; I did not probe 3.

Note the API's own inconsistency, worth knowing when parsing errors: the duration error names
`contents[0].text.duration` (**plural** `contents`) while the privacy error below names
`content[1]` (**singular**). Do not build a parser that assumes one spelling.

### 2. Extension is real, and it is `role: "reference_video"` plus a FORWARD-continuation prompt

Working body shape (E1):

```json
{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": true,
  "content": [
    { "type": "text", "text": "Continue [Video 1] forward from its final frame as one unbroken take. … --ratio adaptive --dur 5 --resolution 720p" },
    { "type": "video_url", "video_url": { "url": "https://ark-acg-ap-southeast-1.tos-…/cgt-20260808051516-lq62m.mp4" }, "role": "reference_video" }
  ]
}
```

Verbatim success shape:

```json
{
  "id": "cgt-20260808082254-xt4zf",
  "status": "succeeded",
  "content": { "video_url": "https://ark-acg-ap-southeast-1.tos-ap-southeast-1.volces.com/…/cgt-20260808082254-xt4zf.mp4?X-Tos-Expires=86400&X-Tos-Max-Requests=100&…" },
  "usage": { "completion_tokens": 324000, "total_tokens": 324000 },
  "seed": 35974, "resolution": "720p", "ratio": "9:16", "duration": 5,
  "framespersecond": 24, "generate_audio": true, "output_format": "mp4"
}
```

The extension's **first frame is the source's last frame** — same woman, same pose, same golden-hour
key, same marina furniture at the right edge, mouth mid-word. Verified at all four joins by frame
extraction (`extlim/frames/`) and corroborated by mean-luma continuity (finding 6).

**Say "Continue … forward from its final frame".** A prior probe on this account phrased it
"Extend Video 1 **backward**" and got no continuation at all — the model re-shot the source's whole
move at higher resolution (its output's *last* frame matched the source's *last* frame, and its
first frame was invented). That probe still billed 216,000 tokens. The word matters.

### 3. Extensions chain; depth 3 reached with no degradation; 60 s assembled

| hop | task | source | src dur | `--dur` | delivered | tokens |
|---|---|---|---|---|---|---|
| base | `cgt-20260808051516-lq62m` | *(fresh t2v)* | — | 10 | 10.080 s | 216,900 |
| 1 (E1) | `cgt-20260808082254-xt4zf` | base | 10.080 | 5 | 5.000 s | 324,000 |
| 2 (E2) | `cgt-20260808082727-5n7gj` | E1 output | 5.000 | 10 | 10.000 s | 367,200 |
| 3 (E4) | `cgt-20260808083314-8czk5` | E2 output | 10.000 | 5 | 5.000 s | 324,000 |
| 4 (E5) | `cgt-20260808083737-tfp2j` | E4 output | 5.000 | 30 | 30.000 s | 1,080,000 |

Assembled with `ffmpeg -f concat -c copy` (no re-encode — every segment shares codec, dimensions and
timebase):

```
extlim/ASSEMBLED-60s.mp4   duration=60.111003   720x1280   nb_frames=1441   size=80,611,068
```

Identity holds at the last frame of hop 4 — same face, freckle pattern, eye colour, hair and top as
the base clip 60 s earlier. **No chain limit was found; 3 is simply the deepest I paid for.**

### 4. You are billed for the source on every hop — extension footage costs 1.67–3.0× fresh footage

720×1280 9:16 fresh text-to-video bills `21,600 × duration + 900` tokens (measured across 4/5/7/10/
15/30 s tasks on this account). Extensions bill in the same 21,600-token second-units but with **no
`+900`**, and they bill the source too:

| probe | src s | out s | tokens | billed units (÷21,600) | tokens per NEW second | vs fresh |
|---|---|---|---|---|---|---|
| prior `p1` | 5.07 | 5 | 216,000 | 10 | 43,200 | 2.00× |
| E1 | 10.08 | 5 | 324,000 | 15 | 64,800 | 3.00× |
| E2 | 5.00 | 10 | 367,200 | 17 | 36,720 | 1.70× |
| E4 | 10.00 | 5 | 324,000 | 15 | 64,800 | 3.00× |
| E5 | 5.00 | 30 | 1,080,000 | 50 | 36,000 | 1.67× |

All five fit **`billed_units = floor(src_seconds) + k(out) × out_seconds`** exactly, with a measured
output surcharge `k(5) = 1.0`, `k(10) = 1.2`, `k(30) = 1.5`. The naive "source + output" model fits
the three `--dur 5` cases and **fails** on the longer ones (E2 billed 17 where source+output = 15;
E5 billed 50 where source+output = 35), so do not use it.

Two consequences, both counter-intuitive:

- **A 30 s extension (1,080,000) costs 66 % more than a fresh 30 s generation (648,900).** The
  premium is what identity continuity costs.
- **Short extensions are the expensive ones.** Six 5 s hops off a 10 s source would bill 90 units;
  one 30 s hop off a 5 s source bills 50 for half again the footage. **Extend in 30 s bites.**

Dollar figures are INFERRED, not measured: the account's charge items are `NV2VCompletion` at
`0.0107` and `V2VCompletion` at `0.0064` per 1,000 tokens, but which item an extension posts to is
unverified. At the V2V rate the four hops (2,095,200 tokens, 50 s of new footage) are ≈ **$13.41**;
at the NV2V rate ≈ $22.42. Reconcile against a statement before quoting a client.

A third-party mirror (wavespeed.ai) independently describes this model as billing on "combined
duration" and prices 720p at $0.22/s of source+extension — the same shape as the measured token
counts, arrived at independently.

### 5. The image route is closed — the privacy guard is IMAGE-scoped, not model-scoped

Passing a 576-px still extracted from the base clip as `role: "reference_image"`, with no
`first_frame` anywhere in the body:

```
SUBMIT HTTP 400 (5.3s)
{"error":{"code":"InputImageSensitiveContentDetected.PrivacyInformation","message":"The request failed because the input image 'content[1]' may contain real person. Request id: 021786149188649d3ceb3d471ce278cd568773b7d71d63997a665","param":"content[1]","type":"BadRequest"}}
```

This is the controlled comparison that matters: **the same person, from the same generation
lineage, on the same account, minutes apart** —

- as a **still image** (`reference_image`) → refused at submit, privacy;
- as a **video** (`reference_video`) → accepted, extended, four times.

So the existing law "a photoreal human as `first_frame` is REFUSED" generalises to *every image
role*, and simultaneously **does not apply to video inputs at all**. The cheaper long-form path the
brief hoped for does not exist; there is no image-mediated identity route on 2.5.

### 6. Resolution, audio and grade across four hops

Every hop delivered **720×1280, 24 fps, h264 + AAC 32 kHz stereo**. `resolution: "720p"` and
`ratio: "9:16"` were echoed on every task; `--ratio adaptive` followed the source shape each time.
No degradation, no drift in dimensions. (The prior `p1` probe *upscaled* an 854×480 source to
1280×720, so extension re-renders rather than passing pixels through.)

Audio continues rather than restarting — but it is not level-matched:

| segment | speech dB | noise floor dB | f0 median Hz | bandwidth99 Hz |
|---|---|---|---|---|
| base | −15.99 | −39.55 | 186.6 | 2242 |
| E1 | −15.81 | −40.34 | 220.7 | 2609 |
| E2 | −16.94 | −40.47 | 189.3 | 2180 |
| E4 | −17.52 | −43.09 | 223.8 | 3016 |
| E5 | −14.89 | −44.78 | 197.5 | 2938 |

Speech level spans 2.6 dB and the noise floor 5.2 dB across the chain; median f0 wobbles 186–224 Hz
with **no monotonic drift**, which reads as prosody rather than a change of speaker — but that
interpretation is INFERRED, not a speaker-verification result.

Dialogue is delivered near-verbatim in every segment (Whisper `small.en`), including the 30 s hop:

> "Okay, so people always ask me the same three things, so I'm just going to answer all of them
> right now and then I'll go. First one, no, you do not have to do it every day. Once is fine.
> Second one, yes, it works right on your phone. You don't need anything else. And the third one,
> honestly, is just people telling me they forgot. So set a reminder, do it tonight, do it tonight,
> and then forget about it like I did."

(one stutter — "do it tonight" doubled — in 82 written words.)

Grade drift is mild. Mean luma per segment: **105.2 → 103.6 → 102.7 → 103.6 → 99.9** (≈1.3 levels
per hop). Luma across each join: 97.8→100.0, 100.4→102.0, 96.1→98.2, 94.9→95.5 — no visible step.
For contrast, the Pattern I note for `seedance-1.5-pro` records ~9 levels darker **per hop**.
2.5's extension is roughly seven times more grade-stable, which is why chaining does not compound
here the way it did there.

`generate_audio: true` passed on all four hops with the ambience-plus-speech direction from the
existing law ("no instruments, no melody, no song, no soundtrack") — zero copyright refusals.

---

## PROPOSED LAWS

**`sd25:extension-is-reference-video-plus-forward-prompt`**
- *claim*: Video extension is not a separate endpoint or task field. It is `role: "reference_video"`
  on a `video_url` part plus a prompt that says **"Continue [Video 1] forward from its final frame"**.
  The output begins on the source's last frame. Say *forward*; "extend backward" makes the model
  re-shoot the source instead of continuing it, at full price.
- *evidence*: E1 `cgt-20260808082254-xt4zf` — first frame of the output is the source's last frame
  (same pose, light, background furniture). Four hops, four seamless joins, corroborated by luma
  continuity ≤2.1 levels at every join. Prior probe `p1` with "Extend Video 1 backward" produced a
  regeneration whose last frame matched the source's last frame; billed 216,000 anyway.
- *counterexamples*: none for the forward phrasing in 4/4 hops. The backward phrasing is a single
  observation and its source was also a different resolution, so "backward is the cause" is inferred.
- *applies_to*: api
- *confidence*: strong

**`sd25:extension-ceiling-is-30s-per-call-and-chains-are-uncapped`**
- *claim*: One call adds 4–30 s. `--dur` above 30 is rejected at submit (HTTP 400, ~2 s, free, named
  param) — the ceiling is model-scoped, identical to text-to-video. Length beyond 30 s comes from
  CHAINING extensions, which has no limit yet found: depth 3 verified, assembling 60.111 s of one
  identity from a 10 s base.
- *evidence*: `--dur 40`, `31` (this pass) and `99` (sibling) all return
  `InvalidParameter … contents[0].text.duration … not supported for model dreamina-seedance-2-5`.
  `--dur 5/10/30` all succeeded on the extension path. `extlim/ASSEMBLED-60s.mp4` = 60.111003 s,
  720×1280, 1441 frames, stream-copy concat of five segments.
- *counterexamples*: none. Depth 4+ untested; the minimum `--dur 3` untested.
- *applies_to*: api
- *confidence*: strong

**`sd25:extension-returns-only-the-new-segment-but-bills-the-source`**
- *claim*: The response contains ONLY the newly generated seconds — a 5 s extension of a 10 s clip
  is a 5.000 s file — while billing covers the source as well. You must concatenate, and
  `ffmpeg -f concat -c copy` is enough because every segment shares codec, dimensions and timebase.
- *evidence*: E1 delivered 5.000 s / 120 frames for `duration: 5` against a 10.080 s source and
  324,000 tokens (15 second-units). E2 delivered exactly 10.000 s / 240 frames. Stream-copy concat
  of all five segments produced a valid 60.111 s file with no re-encode.
- *counterexamples*: none in 4/4.
- *applies_to*: api
- *confidence*: strong

**`sd25:extension-costs-1.7-to-3x-fresh-so-extend-in-30s-bites`**
- *claim*: `billed_units = floor(src_seconds) + k(out) × out_seconds`, in the same 21,600-token
  second-unit as fresh 720×1280 generation, with a measured output surcharge k(5)=1.0, k(10)=1.2,
  k(30)=1.5 and **no** `+900` constant. Consequences: a 30 s extension (1,080,000) costs 66 % more
  than a fresh 30 s generation (648,900); and per delivered second, short extensions are the
  expensive ones (3.0× fresh at `--dur 5` off a 10 s source, 1.67× at `--dur 30` off a 5 s source).
  **Always take the largest allowed bite.**
- *evidence*: five measured `usage.completion_tokens` — 216,000 / 324,000 / 367,200 / 324,000 /
  1,080,000 — fitting the formula exactly at 10/15/17/15/50 units. Fresh-generation baseline
  `21,600 d + 900` measured across 4/5/7/10/15/30 s tasks on the same account. Independently
  corroborated in shape by wavespeed.ai, which bills this model on "combined duration".
- *counterexamples*: source duration was only ever 5 or 10 s, so a source-side surcharge is not
  excluded — the fit is parsimonious, not proven. k between the three measured durations is
  interpolation, not measurement. Dollar conversion is unverified (two charge items, unknown which).
- *applies_to*: cost
- *confidence*: moderate

**`sd25:privacy-guard-is-image-scoped-video-inputs-bypass-it`**
- *claim*: The photoreal-human refusal applies to **every image role**, not just `first_frame` —
  `reference_image` is refused at submit with the same PRIVACY code. It does **not** apply to video
  inputs: the same person from the same lineage passes as `reference_video`. So there is no
  image-mediated identity route on 2.5, and extension is the only way to carry a generated person
  across shots.
- *evidence*: `InputImageSensitiveContentDetected.PrivacyInformation … input image 'content[1]' may
  contain real person` on a still extracted from the base clip, with no `first_frame` in the body —
  minutes after and minutes before extensions of that same clip succeeded.
- *counterexamples*: none. Untested whether a non-photoreal or heavily stylised human still passes,
  and whether `reference_video` refuses a real (camera-shot) person as opposed to a generated one.
- *applies_to*: routing
- *confidence*: strong

**`sd25:extension-holds-720p-and-audio-but-not-level`**
- *claim*: Four hops hold 720×1280 / 24 fps / AAC 32 kHz stereo with no resolution degradation, and
  audio continues rather than restarting — ambience bed persists, dialogue lands near-verbatim.
  Grade drifts only ~1.3 luma levels per hop (against ~9 per hop for `seedance-1.5-pro`). What does
  drift is **audio level**: 2.6 dB of speech level and 5.2 dB of noise floor across the chain.
  Normalise per segment before delivery.
- *evidence*: ffprobe on all five segments; `_audio_analyze.py` table (speech dB −14.89…−17.52,
  noise floor −39.55…−44.78, f0 186.6…223.8 Hz); mean luma 105.2→99.9 across four hops with join
  deltas ≤2.1 levels; Whisper transcripts near-verbatim in all four extensions.
- *counterexamples*: f0 wobble of ±10 % is not a speaker-verification result — "same voice" is
  inferred from continuity and level, not proven.
- *applies_to*: video
- *confidence*: moderate

---

## STILL UNKNOWN

- **Chain depth beyond 3.** Nothing degraded at depth 3; where it breaks is unmeasured. 60 s was
  reached, 90–120 s is extrapolation.
- **The exact output surcharge curve.** k is measured only at `--dur` 5, 10 and 30. Whether the
  source term also carries a surcharge is confounded — source was only ever 5 or 10 s.
- **Which charge item extensions post to** (`V2VCompletion` 0.0064 vs `NV2VCompletion` 0.0107 per
  1k). A 3.5× spread in the dollar answer hangs on this. Read one statement and it is settled.
- **Trimming the source to cut cost.** Since billing includes the source, a 30 s extension off a
  30 s source should bill ≈75 units (30 + 1.5×30) where the same extension off a trimmed 5 s tail
  bills 50 — the measured E5 case — a third off the bill for the same delivered footage. Untested,
  because it needs self-hosting: TOS URLs cannot be trimmed, and whether a 5 s context degrades
  continuity is itself unknown. The likely cheapest 60 s route (30 s fresh base + one 30 s
  extension, ≈2.27 M tokens, 2 calls versus my 5) is INFERRED, not measured.
- **Whether the source context window is really "last 30 s".** A third-party mirror says so; I never
  fed a source longer than 10.08 s to an extension, so it is unverified here, and the cost of
  extending a 30 s source is therefore also unverified.
- **`--dur 3` and the lower bound.** Documented as 4; not probed.
- **Explicit `--ratio` with a `reference_video`.** I used `adaptive` on all four hops. Whether an
  explicit ratio errors the way it does with `first_frame` is untested.
- **`reference_video` with a REAL (camera-shot) person.** All sources here were model-generated.
  The privacy guard's behaviour on genuine footage is unknown and should be assumed stricter.
- **Whether a refused submit is billed.** The three HTTP 400s created no task and returned no
  `usage` object, which is consistent with free — but only a statement proves it.
