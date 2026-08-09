# Seedance 2.5 — `video_extension` call shape

Measured against the live BytePlus ModelArk API, 2026-08-08 UTC.
Generation budget: 4. **Actual paid generations: 4** (`G1 G2 G3 G4`), plus 1 free HTTP-400
submit rejection (`P1`) that created no task and billed no tokens.

Artifacts: `/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client/.claude/worktrees/gen-image/research/sd25/ext/`
(`*.json` request bodies · `*.log` verbatim transcripts · `*.mp4` downloads · `*.png` boundary frames · `run.mjs` runner)

---

## VERDICT

**`video_extension` IS REACHABLE on `dreamina-seedance-2-5-260628`, and it works.** There is no
separate endpoint, no separate task-type field, and no task id hand-off. It is the SAME
`POST /api/v3/contents/generations/tasks` body as everything else. Two things make it an extension:

1. a content part of `type: "video_url"` with `role: "reference_video"`, whose `video_url.url` is a
   **publicly-fetchable HTTPS URL** (not inline base64, not a ModelArk task id), and
2. **a prompt that reads as an extension instruction.** The task type is inferred by the model FROM
   THE PROMPT TEXT — the API tells you so in its own error string. This is the single most surprising
   fact about this surface and it is the thing that will bite an operator.

The direction word is load-bearing and measured: **`forward` = append (sequel), `backward` = prepend
(prequel).** An append starts on a frame that is effectively the source's final frame (mean abs
difference 3.05/255 versus 29.1 for a control frame from the same clip) — a genuinely seamless join,
not a re-render.

Two production-blocking priors were overturned:

- **A photoreal human in a `reference_video` is ACCEPTED.** The likeness refusal recorded in
  `sd25:first-frame-refuses-real-people` is scoped to IMAGE inputs. A video of the same person passes
  moderation, and identity carries across the seam. (G3, G4)
- **`generate_audio: true` survives an extension, dialogue included.** The continuation spoke my line
  verbatim (WER 0) at a median f0 of 183.9 Hz against the source's 186.6 Hz — a 1.4% difference, i.e.
  the same voice. No copyright refusal. **This removes the reason `sieve-longform.mjs` exists for this
  model:** the voice seam that `seed` was invented to solve does not occur, because an extension is a
  continuation rather than a fresh generation. (G4)

The one real defect is **exposure/grade drift inside the extension**, measured below (Finding 6).

---

## THE EXACT WORKING REQUEST BODY

`POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks`
`Authorization: Bearer $MODELARK_API_KEY` · `Content-Type: application/json`

```json
{
  "model": "dreamina-seedance-2-5-260628",
  "generate_audio": false,
  "content": [
    {
      "type": "text",
      "text": "Extend [Video 1] forward. Continuing seamlessly from the last frame of [Video 1], the camera keeps drifting slowly forward along the varnished teak deck toward the bow, the coiled white rope sways gently, sunlit water slides past the hull. Keep the exact lighting, colour grade, lens and pace of [Video 1]. --ratio adaptive --dur 5 --resolution 720p"
    },
    {
      "type": "video_url",
      "video_url": {
        "url": "https://hiqefhtlfmcpbyypensf.supabase.co/storage/v1/object/public/sd25probe/cine-02-deck-ritual.mp4"
      },
      "role": "reference_video"
    }
  ]
}
```

Then poll `GET https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id}`.

Verbatim success shape (G2, `cgt-20260808082624-xqcwx`):

```json
{
  "id": "cgt-20260808082624-xqcwx",
  "model": "dreamina-seedance-2-5-260628",
  "status": "succeeded",
  "content": {
    "video_url": "https://ark-acg-ap-southeast-1.tos-ap-southeast-1.volces.com/dreamina-seedance-2-5/3003863700/Video/xwcqx-42628080806202-tgc_.../cgt-20260808082624-xqcwx.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&...&X-Tos-Expires=86400&X-Tos-Max-Requests=100&..."
  },
  "usage": { "completion_tokens": 324000, "total_tokens": 324000 },
  "created_at": 1786148788,
  "updated_at": 1786148935,
  "seed": 53843,
  "resolution": "720p",
  "ratio": "9:16",
  "duration": 5,
  "framespersecond": 24,
  "service_tier": "default",
  "execution_expires_after": 172800,
  "generate_audio": false,
  "draft": false,
  "priority": 0,
  "output_format": "mp4"
}
```

Note `"ratio": "9:16"` in the response although `--ratio adaptive` was sent: `adaptive` resolves to
the source video's shape and the response reports the RESOLVED value, not the requested one.

---

## FINDINGS

### 1. The source video is passed as a public URL under `role: "reference_video"` — MEASURED

`type: "video_url"`, object `video_url: { url }`, sibling key `role: "reference_video"`. This is the
same part shape the vendor documents for Seedance 2.0's "Extend video" (recon
`bp_batch3.md:1184-1204`, a three-clip stitch example), and it is confirmed working unchanged on 2.5.

Not a task id. Not inline bytes: the vendor's own input-requirements table
(`bp_batch3.md:5886-5889`) states for video, verbatim:

> * Input methods: Video URL or asset ID.

— against images on the line above, which additionally allow "Base64 string of image". So the Veo
precedent (URI required, inline bytes rejected) holds here too, *by documentation*; I did not spend a
generation re-proving it, and a sibling probe body at
`_probe/sd25-edit/p3-b64-tiny.json` already stages that test.

The staged source used for every probe below (10.08 s · 720×1280 · 24 fps · h264+aac · 7,254,545 B)
answers anonymously:

```
$ curl -sS -I https://hiqefhtlfmcpbyypensf.supabase.co/storage/v1/object/public/sd25probe/cine-02-deck-ritual.mp4
HTTP/2 200
content-type: video/mp4
content-length: 7254545
```

### 2. The TASK TYPE IS CLASSIFIED FROM THE PROMPT, not from a parameter — MEASURED

There is no `task_type` field. The API says so itself. Verbatim, from an earlier task on this account
(`cgt-20260808063938-zhs4p`, same model, retrieved via `GET .../tasks/{id}`):

```
{"code":"InvalidParameter.TaskTypeConstraint","message":"The parameter `duration` specified in the request is not valid. Seedance identified your task as video editing based on your prompt. For this task type, the output ratio and duration follow the input video selected by the model for editing, and the video selected must satisfy the duration requirement of 4 to 30 seconds. Issues: [0] `duration` must be -1. Request id: 02178614239794200000000000000000000ffffc0a87c5dc3d4e8"}
```

Two consequences that matter operationally:

- **Same body, different prompt = different task type with different parameter contracts.** A prompt
  the model reads as *editing* demands `duration: -1`; a prompt it reads as *extension* takes a real
  duration (proven: `--dur 5` succeeded four times for four). Do not port an editing job's flags to an
  extension job or vice versa.
- The word `Extend` plus a bracketed `[Video 1]` reference is a reliable extension trigger — 4/4.

### 3. Direction: `forward` = APPEND, `backward` = PREPEND — MEASURED, one-variable A/B

G1 and G2 are byte-identical bodies except a single word (`backward` → `forward`). Frames extracted at
the boundaries; the metric is per-pixel mean absolute RGB difference on 0-255. The source darkens
substantially over its 10 s (mean luma 124.0 → 87.2), which makes the two ends easy to tell apart.

| frame | mean RGB | vs `src_first` | vs `src_last` |
|---|---|---|---|
| `src_first` | 124.0, 96.6, 78.9 | — | 34.97 |
| `src_last` | 87.2, 64.7, 48.7 | 34.97 | — |
| **G1 (`backward`) first** | 119.1, 92.6, 75.7 | **5.20** | 31.15 |
| **G1 (`backward`) last** | 122.8, 95.1, 78.0 | **2.65** | 33.92 |
| **G2 (`forward`) first** | 85.8, 62.7, 47.1 | 36.57 | **2.35** |
| **G2 (`forward`) last** | 122.7, 95.2, 77.9 | 2.46 | 33.78 |

`forward` opens on the source's closing frame (2.35). `backward` closes on the source's opening frame
(2.65) — it is a prequel that hands off INTO the source. Confirmed visually as well as numerically:
`g2f.png` reproduces the source's final composition (both brass cleats, coiled rope, furled ensign,
mahogany coaming) at the source's dusk exposure.

**Caveat, honestly stated:** on this near-static locked-off shot the metric is dominated by exposure,
so it separates "bright end" from "dark end" cleanly but cannot by itself certify composition. The
visual check is what carries the composition claim. On the human clip (Finding 5) the same metric is
unambiguous because the framing changes.

### 4. The output contains ONLY the new footage — the source is NOT prepended or appended — MEASURED

`--dur 5` against a 10.08 s source returned exactly 5.000 s, 120 frames, in all four runs.

```
$ ffprobe G2-extend-forward-dur5.mp4
video h264 720x1280 24/1  nb_frames=120   duration=5.000000  size=4095599
```

So an extension is not a longer video — it is the next shot, seam-matched. **Long form is
`ffmpeg -f concat` locally**, and the API's own duration ceiling (30 s, `sd25:duration-accepts-up-to-30s`)
still bounds each hop. The vendor's tip for 2.0 says the same thing in the other direction
(`bp_batch3.md:1520`), verbatim: *"the generated video usually only includes the tail footage of the
original video"*.

### 5. A `reference_video` containing a photoreal human is ACCEPTED — MEASURED, overturns a standing law

Staged `ugc-01-selfie-marina.mp4` (a prior 2.5 text-to-video output: a woman's face filling a 720×1280
frame, freckles and all) to the same public bucket and extended it.

G3 (`cgt-20260808083040-c4p4j`): `SUBMIT HTTP 200` → `succeeded`, 5.000 s delivered.
G4 (`cgt-20260808083621-xpsls`): `SUBMIT HTTP 200` → `succeeded`, 5.000 s delivered.

No `InputImageSensitiveContentDetected.PrivacyInformation`. No moderation error of any kind. This is
the exact refusal that a photoreal `first_frame` triggers *at submit* per `sd25:first-frame-refuses-real-people`,
so the refusal is **input-modality-scoped: images of people are refused, videos of people are not.**

Identity and the seam, measured on the human clip where framing genuinely moves:

| pair | mean abs diff |
|---|---|
| source last frame vs **G3 first frame** | **3.05** |
| source last frame vs **G4 first frame** | **4.45** |
| source last frame vs source FIRST frame (control) | 29.10 |
| source last frame vs G3 last frame | 27.71 |
| source last frame vs G4 last frame | 28.23 |

An order of magnitude closer than the control. Visual check on `u_last.png` / `g3f.png` / `g4f.png`:
same woman, same freckle pattern, same eye colour, same backlit rim on the hair, same smile. `g3l.png`
(5 s later) is still recognisably the same person.

### 6. Native audio survives the extension, dialogue is verbatim, and the VOICE MATCHES — MEASURED

G4 sent `generate_audio: true` with a continuing spoken line and the ambient-only audio direction from
`sd25:ambient-audio-direction-passes-music-does-not`. Delivered: stereo AAC 32 kHz, 5.000 s, no
copyright refusal.

Whisper (`small.en`) on the extension:

```
{"file": "G4-extend-human-audio.mp4", "text": "It takes about 10 seconds and then you are in. That is the whole thing.", "avg_logprob_mean": -0.2682, "no_speech_prob_mean": 0.0082}
```

The prompt asked for `"It takes about ten seconds, and then you are in. That is the whole thing."` —
verbatim, WER 0.

Voice comparison, source clip vs extension (`_audio_analyze.py`):

| | source `ugc-01` | extension `G4` |
|---|---|---|
| `f0_median_hz` | 186.6 | **183.9** (−1.4%) |
| `speech_db` | −15.99 | −16.95 |
| `noise_floor_db` | −39.55 | −40.78 |
| `dynamic_range_db` | 23.56 | 23.83 |
| `bandwidth_99_hz` | 2242.2 | 2710.9 |

Same register, same level discipline, same room. **Two variables moved at once here** (audio on AND
new dialogue text) because it was the last generation in budget — flagged, not hidden.

### 7. Grade drift inside the extension is real and compounds — MEASURED

G2's append opens correctly dark (mean luma 85.8) and closes at 122.7 — it drifts +37 luma levels
back toward a bright grade in 5 seconds, i.e. it does not hold the source's dusk look for the length of
the shot even though the prompt said *"Keep the exact lighting, colour grade, lens and pace of
[Video 1]."* The same rise appears on the human clip (G3/G4 last frames sit ~28 from the source's
last frame, on a par with the control).

This is the same failure mode Pattern I records for `1.5-pro` chaining, and it means a naive
extend-the-extension chain will visibly ramp. The mitigation to test is the anchor mode: always extend
from the ORIGINAL clip, never from the previous extension.

### 8. Out-of-range `duration` is rejected BEFORE task creation — free, and it names the parameter — MEASURED

P1 sent `--dur 99`, everything else identical to G1:

```
=== SUBMIT HTTP 400 (2.0s) ===
{"error":{"code":"InvalidParameter","message":"The parameter `contents[0].text.duration` specified in the request is not valid: the specified duration is not supported for model dreamina-seedance-2-5. Request id: 0217861484134859cf4adffd4482a40b9bfd1b5a653f234136916","param":"contents[0].text.duration","type":"BadRequest"}}
```

No task id returned, no task in the list, no tokens. **Trailing `--flags` are validated as
`contents[0].text.<param>`** — the flag really is parsed out of the text part, and the error path
names it precisely enough to isolate. Contrast Finding 2, where a *plausible* parameter got past
submit and failed later as a created task (`status: failed`, no `usage` block, also free).

### 9. Cost — MEASURED

All four extensions: `completion_tokens: 324000` for 5 s at 720p, identical whether audio was on or
off, whether the subject was a deck or a face. Against `sd25:cost-shape` (108,633 tokens for a 5 s
720p generation) an extension of a 5 s clip costs **~3× a plain 5 s generation** — the reference video
is billed input. Budget accordingly; extension is not cheap.

Wall clock: 148 s / 193 s / 249 s / 250 s.

### 10. Output URLs expire — MEASURED

`X-Tos-Expires=86400`, `X-Tos-Max-Requests=100` on every returned `video_url`, matching the vendor's
retention note (`bp_batch3.md:5932`): *"Task data ... is only retained for 24 hours"*. **Download in
the poll loop** (`run.mjs` does). And a re-hosted copy of your own output — a public bucket URL — is
what you feed back in as `reference_video`; the signed TOS URL is not a durable input.

---

## PROPOSED LAWS

### `sd25:video-extension-call-shape`
- **claim**: `video_extension` needs no new endpoint or field. POST the ordinary
  `/contents/generations/tasks` body with a `{"type":"video_url","video_url":{"url":"https://…"},"role":"reference_video"}`
  part and a prompt beginning `Extend [Video 1] forward.` / `backward.`. Params ride as trailing
  `--flags` exactly as elsewhere; `--ratio adaptive --dur N --resolution 720p` is the working set.
- **evidence**: 4/4 submits returned HTTP 200 and 4/4 tasks reached `succeeded`
  (`cgt-20260808082034-8wtl5`, `-082624-xqcwx`, `-083040-c4p4j`, `-083621-xpsls`), delivering
  5.000 s / 720×1280 / 24 fps each. Shape matches the vendor's documented 2.0 extension example
  (`bp_batch3.md:1184-1204`) unchanged.
- **counterexamples**: none observed on 2.5.
- **applies_to**: api
- **confidence**: strong

### `sd25:task-type-is-inferred-from-the-prompt`
- **claim**: Seedance picks the task type (multimodal_to_video / video_editing / video_extension) by
  READING THE PROMPT, and each type enforces a different parameter contract. An editing-sounding prompt
  demands `duration: -1`; an extension-sounding prompt takes a real duration. Write the verb you mean.
- **evidence**: verbatim API error, `cgt-20260808063938-zhs4p`: *"Seedance identified your task as video
  editing based on your prompt. For this task type, the output ratio and duration follow the input video
  … Issues: [0] `duration` must be -1."* The identical body shape with a prompt beginning `Extend
  [Video 1] …` accepted `--dur 5` and succeeded, 4/4.
- **counterexamples**: none — but the classifier's exact trigger vocabulary is not mapped; only
  `Extend [Video n] forward|backward` is proven.
- **applies_to**: api
- **confidence**: strong

### `sd25:forward-appends-backward-prepends`
- **claim**: `forward` produces a SEQUEL that opens on the source's final frame; `backward` produces a
  PREQUEL that closes on the source's opening frame. One word, opposite deliverables.
- **evidence**: one-variable A/B, G1 vs G2, bodies identical but for that word. Mean abs RGB diff:
  `forward` first frame vs source last = **2.35** (vs 36.57 against source first); `backward` last frame
  vs source first = **2.65** (vs 33.92 against source last). Confirmed visually on the extracted frames.
- **counterexamples**: none in 2 runs; n=2, and only on one source clip.
- **applies_to**: prompt
- **confidence**: medium-strong

### `sd25:extension-returns-only-the-new-footage`
- **claim**: The delivered file is exactly `--dur` seconds of NEW footage. The source is never included.
  Long form is local concatenation of seam-matched hops, not a growing single file.
- **evidence**: `--dur 5` against a 10.08 s source returned 5.000 s / 120 frames in all four runs
  (ffprobe). Vendor tip for 2.0 agrees: *"the generated video usually only includes the tail footage of
  the original video"* (`bp_batch3.md:1520`).
- **counterexamples**: the vendor states the 2–3-clip stitch mode DOES include the original content
  (`bp_batch3.md:1523`). Untested here — the single-clip claim is what is measured.
- **applies_to**: api
- **confidence**: strong

### `sd25:human-refusal-is-image-scoped-not-video-scoped`
- **claim**: The likeness protection that refuses a photoreal `first_frame` at submit does NOT apply to
  a `reference_video`. A video of a real-looking person is accepted, and the person's identity carries
  across the seam. **The route to long-form talking heads on 2.5 is: generate the person text-to-video,
  then EXTEND the resulting video.**
- **evidence**: `ugc-01-selfie-marina.mp4` (face filling the frame) submitted twice as `reference_video`
  → HTTP 200 both times, both `succeeded`, zero moderation errors — against
  `sd25:first-frame-refuses-real-people`, where the same kind of subject as an IMAGE is refused at submit
  with `InputImageSensitiveContentDetected.PrivacyInformation`. Seam: source last frame vs extension
  first frame = 3.05 and 4.45 mean abs diff, control 29.10.
- **counterexamples**: none in 2 runs. Both subjects were MODEL-GENERATED faces. A photograph of a real
  identifiable person is untested and must not be assumed to pass.
- **applies_to**: moderation
- **confidence**: medium-strong (strong on the API behaviour, medium on generalising past
  model-generated faces)

### `sd25:extension-carries-the-voice-natively`
- **claim**: `generate_audio: true` works on an extension, the new dialogue is spoken near-verbatim, and
  the VOICE matches the source clip's speaker. There is no voice seam to solve, so `seed`-pinning and
  the whole stitching apparatus in Pattern I are unnecessary for 2.5 long form. Keep the ambient-only
  audio direction to avoid the copyright self-refusal.
- **evidence**: G4 delivered stereo AAC 32 kHz, no refusal. Whisper `small.en` returned the prompted
  line verbatim (WER 0, `no_speech_prob 0.0082`). `f0_median_hz` 186.6 (source) vs 183.9 (extension),
  −1.4%; `speech_db` −15.99 vs −16.95; `dynamic_range_db` 23.56 vs 23.83.
- **counterexamples**: n=1, and it moved two variables at once (audio on + new dialogue). f0 is a proxy
  for register, not a speaker-ID verdict — nobody has LISTENED to the seam yet.
- **applies_to**: api
- **confidence**: medium

### `sd25:extension-drifts-brighter-so-anchor-do-not-chain`
- **claim**: An extension re-grades as it runs — measured +37 luma levels over 5 s — despite an explicit
  "keep the exact colour grade" instruction. Chaining extension-of-extension will compound it. Extend
  from the ORIGINAL clip each hop (anchor mode), not from the previous output.
- **evidence**: G2 mean luma 85.8 (first frame, correctly matching the source's dusk close) → 122.7
  (last frame, back at the source's bright OPENING level). Same rise on the human clip: G3/G4 last
  frames sit 27.7 / 28.2 from the source's last frame, on a par with the 29.1 control.
- **counterexamples**: none, but anchor-vs-chain was not itself tested — the mitigation is inferred from
  the drift, by analogy to Pattern I's `--mode anchor`.
- **applies_to**: routing
- **confidence**: medium (drift MEASURED; the anchor mitigation INFERRED)

### `sd25:extension-costs-3x-a-plain-generation`
- **claim**: A 5 s 720p extension bills 324,000 completion tokens — ~3× the 108,633 of a plain 5 s 720p
  generation. The reference video is billed input. Extension is a premium operation; do not treat it as
  a cheap way to add seconds.
- **evidence**: `usage.completion_tokens: 324000` on all four extension tasks, identical across audio
  on/off and subject. Baseline from `sd25:cost-shape`.
- **counterexamples**: token cost did not vary with source length here — only one source length
  (10.08 s) was used, so the scaling law is unknown.
- **applies_to**: cost
- **confidence**: medium-strong

### `sd25:extension-input-must-be-a-public-url-you-host`
- **claim**: The `reference_video` URL must be anonymously fetchable, and the API's own output URLs are
  NOT usable as inputs beyond 24 h (`X-Tos-Expires=86400`, `X-Tos-Max-Requests=100`). Re-host every clip
  you intend to extend to a public bucket, and download every output inside the poll loop.
- **evidence**: vendor input table, verbatim: *"Input methods: Video URL or asset ID"*
  (`bp_batch3.md:5889`) and *"Make sure the URL is publicly accessible"* (`:313`); retention note
  *"only retained for 24 hours"* (`:5932`). All four working calls used a public Supabase object URL
  that answers `HTTP/2 200` to an unauthenticated `curl -I`.
- **counterexamples**: base64 video input was not tested by me (staged at
  `_probe/sd25-edit/p3-b64-tiny.json` by the parallel editing probe); the docs' exclusion of base64 for
  video is documentation, not measurement.
- **applies_to**: api
- **confidence**: medium-strong (URL path MEASURED; base64 exclusion documented only)

---

## STILL UNKNOWN

1. **Multi-clip stitch (2–3 `reference_video` parts).** The vendor's flagship extension example
   (`bp_batch3.md:1184-1204`) passes THREE videos and asks for transitions between them, and states
   that this mode DOES include the original footage in the output. Never invoked on 2.5. This is the
   highest-value next probe — it is a different deliverable, not a variation.
2. **Maximum `--dur` on an extension.** Only 5 was run. `sd25:duration-accepts-up-to-30s` covers plain
   generation; 99 is rejected at submit (Finding 8), so the ceiling sits somewhere in (5, 99].
3. **Is `--ratio adaptive` REQUIRED with a `reference_video`, or merely accepted?** Never tested an
   explicit ratio, nor omitting the flag. The law for `first_frame` is that adaptive is mandatory;
   whether it transfers is assumed, not measured.
4. **Is `--resolution 720p` required, or would omitting it silently drop to 480p?** Untested. Given
   `sd25:schema-is-not-the-contract` and the 1.5-pro precedent where omitting `resolution` halved the
   delivery, always send it — but that is caution, not a measurement.
5. **Chain vs anchor.** Extending an extension was never run. The drift in Finding 7 predicts
   compounding; nobody has measured how fast, or whether anchoring to the original actually fixes it.
6. **Whether the seam is audible.** f0 and level statistics match, and the dialogue is verbatim, but no
   human has listened to source+extension concatenated. Do this before shipping anything long-form.
7. **Extension length limits on the INPUT video.** The 2.0 doc says a reference video must be 2–15 s
   and ≤3 clips totalling ≤15 s (`bp_batch3.md:5895`); the 2.5 editing error quotes **4–30 s**
   (Finding 2). Which bound governs 2.5 extension is unresolved — my source was 10.08 s, inside both.
8. **Base64 video input.** Documented as unsupported; not measured by me.
9. **`--watermark false`.** Present in the parallel editing probes' bodies; I deliberately omitted it
   to keep the extension probe minimal. Unverified on 2.5.
10. **A photograph of a REAL identifiable person as `reference_video`.** Finding 5 used
    model-generated faces only. Do not read that result as permission to upload a real person.
