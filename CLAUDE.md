# CLAUDE.md — operating manual for this content-gen engine

This repo generates **images and video**. When the user asks for a visual, you generate it by
writing and running a small Node script (or using the bundled CLI tools), then showing the result.

## Before you generate anything — read the rulebook

1. **Always read `Brand Context/00_ENGINE.md` first.** It is the authoritative spec for the model
   back-ends, exact model slugs, input schemas, formats and the locked global rules. This file is a
   summary; `00_ENGINE.md` wins on any conflict.
2. **If the user names a brand** (Muha, NuLumin, Dialed Health, Dialed Moods, Stanton, Noble Harbor,
   Aevum, Becca Boo …), read that brand's playbook in `Brand Context/<Brand>.md` **and** its
   `Brand Context/assets/<Brand>/` folder before generating. Logos, colours and locked rules live there.
3. **If the job features a recurring person**, read `Avatars/<Name>/AVATAR.md` — see Pattern E.

## Golden rules

1. **Write a small, self-contained `.mjs` script per generation**, run it with `node`, save the
   output with a timestamped name, and **open it for review**: `open -a Preview "<path>"` (macOS).
   This is the core loop. Copy an existing `*.mjs` as a template — they all follow the same shape.
2. **Iterate by PROMPT, not by pixel-pushing.** Never hand-composite or "paste" generated parts
   together to fake a result (no PIL/sharp paste of a face/product/logo onto art to force fidelity).
   Re-generate or edit with a better prompt + reference images. (Compositing a *flat logo/QR/text
   plate* onto a deliberately-reserved clean area in post is fine; faking hero/product fidelity is not.)
3. **Generate 2–3 candidates** for anything subjective and let the user pick. Set `"n": 3` and a
   stable `"_id"` on the batch job — both runners honour them as of 2026-07-28. Candidates land at
   `generations/<batch>/<_id>/c1.png … cN.png` plus a `HERO.png` copy of c1 that downstream video
   jobs can point at. **This was not expressible before**: `gpt-image.mjs` hardcoded `n:1` and
   `nanobanana.mjs` had no candidate concept, so every asset this repo ever shipped was a first
   draft. Omit `n`/`_id` and the old flat timestamped naming is unchanged.
   Widen with NAMED substitutions, not blind re-rolls — vary the light, the framing, the moment.
   Re-rolling the same prompt just resamples the model's average, and the average IS the AI look.
4. **Anchor with reference images.** To keep a character/style/product consistent, pass the real
   reference image(s) into the request and instruct "use ONLY the likeness from reference image N".
   Text-only prompts drift; references lock it.
5. **Spell text exactly** in the prompt and add a negative ("no other text, no misspellings").
   Nano Banana / Gemini garble small text — keep it short and call out each exact string.
   **Exception, verified 2026-07-27: gpt-image-2 sets small lowercase type accurately** and drew the
   DIALED/HEALTH ECG lockup correctly across four consecutive generations (`dh-gpt-creatives.mjs`).
   Let gpt-image-2 render the whole creative, type included; keep the composite-after-the-fact rule
   for Gemini only. Corollary: **never instruct "no logo"** — told to leave a label bare it invented
   a gold leaf emblem. An unspecified surface gets filled, so specify what belongs on it.
6. Default to **gpt-image-2** for images. Switch to **Nano Banana (Gemini)** when you need stronger
   reference-image fidelity at hero scale. Use **Veo 3.1** or **Seedance (Replicate)** for video.
7. **Never name a device to describe a look.** The model renders every noun you write and ignores
   the ones you tell it to omit. "Framed like a phone camera held by hand" made Nano Banana render
   the entire scene *inside an iPhone mockup* — bezel, notch and all — and Seedance then spent the
   clip "pushing in" to escape the bezel (verified, `dh-video-ads.mjs` DH-V01, 2026-07-26). Say
   "casual handheld snapshot, full-bleed, fills the frame edge to edge, no border, no mockup".
   The same trap applies to "screen", "monitor", "polaroid" and "film strip".
8. **Gate the cheap step before the expensive one.** A frame is ~$0.13 and a 12s clip is ~$1.50, so
   never animate an unreviewed frame — a bad frame guarantees a bad clip at 10× the price. Scripts
   that generate video should take a `--frame-only` flag (see `dh-video-ads.mjs`).
9. **Negatives do not suppress, they summon.** "Only fine wisps of steam, never a plume, never
   smoke, never fog" produced a heavy smoke column — the prompt named smoke four times. To remove
   an effect, delete every mention of it and change the scene so it cannot occur (no hot liquid in
   frame). Corollary of rule 7.
10. **Animate faces, not prop still-lifes.** Seedance 1.5 Pro holds identity when anchored to a
    face (Pattern E — every proven clip in this repo is a talking head). Asking it to animate hands
    moving objects loses object permanence: a two-mug counter scene dropped one mug, swapped the
    other's shape mid-clip, and grew an extra forearm by second 9 (`dh-video-ads.mjs` DH-V01 take 2,
    2026-07-26). For b-roll that must survive review, shoot it on a real phone — it is free.

## Setup assumptions

- Node 20+. Keys live in `.env` (gitignored). Required: `OPENAI_API_KEY` (images),
  `GEMINI_API_KEY` (Nano Banana + Veo), `REPLICATE_API_TOKEN` (Seedance). See `.env.example`.
- Every script loads `.env` with this snippet at the top:
  ```js
  import fs from "fs";
  for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
  ```
- Save outputs to a project folder and stamp the name:
  `const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);`

## Pattern A — gpt-image-2 EDIT (with reference images)

Use for: restyle/extend an image, place a character/product from a reference, multi-ref composition.
Endpoint `POST https://api.openai.com/v1/images/edits`, `multipart/form-data`. Pass one or more
`image[]` parts (refs/base) and an optional `mask`. Per-call sizes: `1024x1024`, `1024x1536`, `1536x1024`.

```js
const form = new FormData();
form.append("model", "gpt-image-2");
form.append("prompt", PROMPT);          // describe the change; name each reference image's role
form.append("size", "1024x1536");
form.append("quality", "high");
form.append("n", "2");                   // 2 candidates
form.append("image[]", new Blob([fs.readFileSync(BASE)], {type:"image/png"}), "base.png");
form.append("image[]", new Blob([fs.readFileSync(REF)],  {type:"image/jpeg"}), "ref.jpg");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method:"POST", headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
});
const data = (await res.json()).data || [];
data.forEach((it,i)=> fs.writeFileSync(`out_c${i+1}.png`, Buffer.from(it.b64_json,"base64")));
```

Tips: to change ONE thing, pass the approved image as the first `image[]` and say "reproduce
EXACTLY except …". To preserve a region precisely, supply a `mask` (transparent = repaint).

## Pattern B — gpt-image-2 GENERATE (no references)

Same as A but endpoint `POST /v1/images/generations`, JSON body `{ model, prompt, size, quality, n }`,
no `image[]`. Or just run the interactive tool: `node gpt-image.mjs` (supports `--batch batch.json`).
`gpt-image.mjs` exposes friendly ratios → high-res sizes (`16:9`→3840×2160, `9:16`→2160×3840, etc.).

## Pattern C — Nano Banana Pro (Gemini images)

Model `gemini-3-pro-image-preview`. Reference images go in as `inline_data` parts *before* the text.
Use it when gpt-image-2 won't hold a reference's likeness. See `nanobanana.mjs` for the full call;
quickest path is `node nanobanana.mjs` (interactive: prompt, aspect ratio, size, ref images).

## Pattern D — Video

**Use the batch runner, don't hand-roll a fetch:**
```bash
node seedance-batch.mjs --batch batches/my.video.json --dry-run   # prints the plan, bills nothing
node seedance-batch.mjs --batch batches/my.video.json
node seedance-run.mjs job.json --model bytedance/seedance-2.0     # single clip
```
A batch entry is `{ id, prompt, image, duration, aspect_ratio, resolution, generate_audio }`.
**Always `--dry-run` first** and show the user the plan — a 12s clip is ~$1.50.

**Pick the model by SUBJECT.** Verified against the live Replicate schemas 2026-07-28 — do not guess
slugs and do not assume they share inputs:

| Subject | Model | Audio | Resolution control | Camera |
|---|---|---|---|---|
| **People** — talking heads, UGC, any photoreal human | `bytedance/seedance-1.5-pro` | ✅ `generate_audio` | ✅ `resolution` — **undeclared but honoured, always send `1080p`** | ✅ `camera_fixed`, `fps` |
| **People, identity-locked** | `veo-3.1-fast-generate-preview` + `referenceImages` | ✅ native | ✅ `resolution` | — |
| **Objects / scenes / product** | `bytedance/seedance-2.0` | ✅ (default true) | ✅ `resolution` — **defaults to 720p, always set `1080p`** | ❌ none |
| legacy | `bytedance/seedance-1-pro` | ❌ **silent, no audio input** | ✅ | ✅ |

- **Veo 3.1 identity lock — the only reference-image face lock in the paid stack.**
  `node nanobanana-video.mjs --prompt "…" --identity a.jpg --identity b.jpg` sends up to 3 asset
  images of one person/character/product and preserves their appearance. Mutually exclusive with
  `--ref` (first frame). The runner now defaults to the **fast** tier at **$0.12/s** — same price as
  seedance-1.5-pro and one third of the standard tier it used to pin — and sets `resolution` explicitly
  (it silently defaulted to 720p before). **`1080p`/`4k` require `--duration 8`**; the runner
  downgrades to 720p rather than 400 if you ask for anything else.
  Payload gotcha, verified by probe: ai.google.dev documents `referenceImages` as
  `{image:{inlineData:{mimeType,data}}}`, but that is the `generateContent` shape. On
  `:predictLongRunning` it 400s — this endpoint wants `{image:{bytesBase64Encoded,mimeType},
  referenceType:"asset"}`, the same image object as `instance.image`.
- **`camera_fixed: true` (1.5-pro) beats any "the phone does not move" prompt suffix.** Measured:
  1.5-pro does not use your first frame verbatim, it **re-renders** it — ~0.98 scale, framed wider,
  graded about 9 levels darker. So a hero frame *conditions* composition, it does not lock it. Set
  the parameter; do not describe the camera and hope.

- **`seedance-2.0` CATEGORICALLY REFUSES photoreal human first frames** — `E005 "input or output
  flagged as sensitive"`. Settled by controlled experiment (`sieve/golden/experiments/E1-e005-whitelist/`):
  Seedream and Nano Banana portraits fail identically; the same portrait still fails with every
  person-word stripped from the prompt; a non-human frame with that identical prompt succeeds.
  **The trigger is the image, not the phrasing — rephrasing does not fix it** (unlike the other E005
  case, which is phrasing-based). 1.5-pro is not a preference for people, it is the only option.
- **ALWAYS send `resolution: "1080p"` — including to 1.5-pro, which does not declare it.**
  A schema is not the contract: Replicate tolerates undeclared keys and ByteDance honours this one.
  Measured A/B 2026-07-28, identical 1536×2752 first frame and identical prompt —
  **`resolution` sent → 1080×1920; omitted → 720×1280.** Do not "clean up" this field by gating it
  on the declared schema; that silently halves your delivery resolution.
- Frame quality is still load-bearing for a different reason (rule 8): the frame carries identity,
  wardrobe and set, and a bad frame guarantees a bad clip at 10× the price. Generate, review, *then*
  animate — but resolution is controlled by the parameter, not inherited from the frame.
- `image` (first frame) **cannot** be combined with `reference_images`. Reference images must be
  downscaled to ≤1024px or the API 504s.
- **`aspect_ratio` IS IGNORED WHENEVER YOU SUPPLY A FIRST FRAME — the frame's shape wins.** The
  schema says so outright and it bites silently. An avatar canonical generated at 3:4 produced a
  1248×1664 clip despite `aspect_ratio: "9:16"`, which then carried through the whole pipeline.
  **Never animate a canonical portrait directly.** Build a purpose-made scene frame at the delivery
  ratio, anchored to the canonical, and animate that. Check the frame's dimensions before spending
  on video — a 9:16 frame is ~0.562 wide/tall.
- Dialogue goes in the prompt in "double quotes". 10–12s clips need explicit timed beats
  (`Beat 0-3s: … She says: "…"`) or the runtime is wasted. See `batches/ugc-recovery.video.json`.
- **Veo 3.1 (Gemini) — START HERE FOR TALKING HEADS.** `node nanobanana-video.mjs`. Native joint
  audio + video, which means **native lip sync** — the mouth and the voice are generated together
  rather than assembled. Operator-judged 2026-07-29: *"very, very good"*, after six assembled
  alternatives were rejected (Seedance native, chatterbox cloned, minimax, OpenAI TTS, ElevenLabs,
  and Seedance-then-post-sync). Prefer it over anything you have to stitch together.
  - **CORRECTED 2026-07-29: extension is NOT 16:9-only.** Verified working in 9:16 vertical
    (`sieve/golden/experiments/E16-veo-extend/`): 8s base + 7s extension = 15s, 720×1280, one
    continuous generation. The old note here said otherwise and was wrong — it cost a day of
    building stitching machinery that Veo does natively.
  - **`video` extension takes a URI, not inline bytes**, and the input **must be 720p** (1080p is
    rejected outright). So long-form Veo is a 720p ceiling; 1080p is single-shot only.
  - Documented: extend by 7s up to 20 times (~148s). `durationSeconds` must be `8` when using
    extension, reference images, or 1080p/4k.
  - Because an extension CONTINUES one generation rather than starting a new one, voice and
    character carry across the seam for free — no seed matching, no cloning, no post-sync.
- Video is slow and costs money — confirm scope (count, length, aspect ratio) before firing a batch.

## Pattern F — Finishing (the grade that cannot be prompted)

`python3 film-grain.py <in> <out> <sigma> <size> [--neutralize] [--chroma f] [--seed n]`

- Presets from `Brand Context/NuLumin_BioSciences.md:253-256`, where this is marked **LOCKED and
  mandatory**: **heavy ≈ `18 0.7`**, **medium ≈ `11 0.6`**. That playbook states at 100% confidence
  that Nano Banana renders clean smooth skin and **will not** produce film grain from a prompt — so
  asking for grain in the prompt is a known dead end. Add it in post.
- Keep raw generations in a `_raw/` subfolder so the grade stays re-tunable.
- `--neutralize` removes the faint global colour cast both image back-ends lay over a frame. Real
  capture has a white balance, not a wash — the cast is a strong "generated" tell.
- This is a **finishing grade on a whole frame**, which is the explicitly allowed exception to the
  never-paste rule (rule 2 here, rule 3 in `00_ENGINE.md`). It is not asset-pasting.
- Grain is luminance-weighted and generated at `size`× resolution then resampled up, so it clumps
  like emulsion instead of sitting on every pixel like sensor noise. Flat grain across the tone
  curve is the giveaway of faked grain — do not replace this with a one-line noise filter.

## Pattern G — Selection (generate many, surface few)

```bash
node sieve-judge.mjs --rubric realism-ugc  --candidates 'generations/<batch>/<id>' --rank
node sieve-judge.mjs --rubric product-lock --refs "Brand Context/assets/<Brand>/<canonical>.jpg" \
                     --candidates 'generations/<batch>/<id>'
```

Rendering `n` candidates without ranking them just moves the eyeballing onto the user. This is the
other half: a vision critic that scores each candidate against a binary rubric, then a pairwise
forced-choice bracket that picks a winner and repoints `HERO`.

- **Rubrics** live in `sieve/rubrics/*.md`: `realism-ugc`, `realism-cinematic`, `product-lock`.
  **`realism-ugc` and `realism-cinematic` are mutually exclusive — never apply both.** Shallow
  depth-of-field and a controlled key light are PASS criteria in one and FAIL criteria in the other.
  Mixing them is a known failure mode here (a prompt asking for "shot-on-phone, not cinematic" next
  to "shallow-DoF hero separation" cannot be satisfied).
- **`product-lock` requires `--refs`.** Never judge product fidelity from memory or from the prompt —
  it is the one axis with real ground truth, so compare against the canonical asset.
- **Reports by default; it only blocks with `--gate`.** Run it in report mode until you trust a
  rubric. A miscalibrated gate that rejects everything on a deadline gets routed around, and routing
  around it means going back to hand-written one-off scripts.
- **`weakest` is returned even on a PASS** — it names a concrete prompt change. That field is the
  point of the tool; use it to drive the next iteration rather than re-rolling blind.
- If nothing passes, it says so and ranks anyway, so you always get the least-bad plus a reason.
  At n≥4 that usually means one over-strict block, not four bad candidates.
- Calibrated 2026-07-28: 3/3 PASS on real UGC frames, 0/4 on studio/product/graphic frames.
  Re-check discrimination on a known-good and a known-bad set after editing any rubric.

## Pattern H — Avatars (reusable people, mechanically)

```bash
# CREATE
node sieve-avatar.mjs new Dana --brief "Woman, 34, Midwest, red hair, freckles" --n 3
node sieve-avatar.mjs import Dana --brief "..." --from photo1.jpg photo2.jpg   # a look you already have
node sieve-avatar.mjs lock Dana --pick dana_c2       # approve + build the anchor set
node sieve-avatar.mjs coverage Marcus                # extend an already-locked avatar

# USE
node sieve-avatar.mjs list
node sieve-avatar.mjs resolve Marcus --yaw 3q-left --light window-left   # prints anchor paths
node sieve-avatar.mjs check batches/x.batch.json                          # refusal, exit 2
node sieve-avatar.mjs verify Marcus --candidates 'generations/<b>/<id>'   # likeness gate

python3 sieve-sheet.py sieve/sheets/dana.jpg --title "Dana casting" --group "Dana" Avatars/Dana/_candidates/*
```

**`lock` is the Soul-ID equivalent** — and the reason it exists is that a picked face alone is not
an identity. It promotes the pick to canonical, then GENERATES the coverage angles from it
(3/4 left, 3/4 right, flat-even, low-key), verifies each against the canonical, and discards drift.
An avatar therefore leaves `lock` spanning several poses and lighting setups instead of the two
frontals every shot used to get anchored to regardless of what it needed.

**MULTIPLE avatars in one shot — compose at the IMAGE stage, animate at the VIDEO stage.**
Seedance has NO identity input for people: `1.5-pro` takes only a first frame, and `2.0` has
`reference_images` but refuses humans (E1). So 100% of human identity is carried by the first frame,
and N people in a shot means N canonicals into ONE Nano Banana frame, then a single image-to-video
call. Proven end-to-end in `sieve/golden/experiments/E5-multi-avatar/` — two avatars, both MATCH at
start, middle and end of an 8s 1080p clip. Rules that made it work, all load-bearing:
name each reference by role ("Reference image 1 is MAN A"), state positions explicitly or they get
reordered, say "do not blend, merge or swap the two faces", say "do not beautify or slim either
person", and **verify per person on a crop** — verifying a two-person frame as a whole is meaningless.

**`seed` reproduces a CLIP, not a PERSON.** `1.5-pro` exposes `seed` ("set for reproducible
generation"), which re-renders the same clip from the same inputs. It does NOT carry a person across
different shots — change the first frame and the seed means nothing. Identity across shots comes from
anchors, always. Do not reach for `seed` to solve consistency.

**Two verification priors, deliberately opposite — do not "unify" them:**
- `verify` judges OUTPUT frames and defaults to **IMPOSTER**. A false match ships the wrong face.
- `buildCoverage` judges anchors re-shot at a DIFFERENT ANGLE on purpose, and defaults to **KEEP**,
  discarding only on a named difference that survives the angle change. Projection alone changes
  apparent nose width, eye spacing and jaw line. Carrying the default-deny prior here rejected 3 of
  4 correct anchors on the first run — one of them citing *"no discernible differences in bone
  structure"* as its reason to discard.

**Known generator limits (measured on Marcus, 2026-07-28):** Nano Banana does **not** reliably
honour left-vs-right head turn — asking for 3/4-left and 3/4-right produced two turns the same
way — and "low-key" tends to darken the BACKGROUND rather than the face. `analyze` tags what it
actually sees, so the metadata stays truthful even when the filename does not. Check `list` after
a coverage build; if a yaw is still missing, re-run and expect to curate.

`Avatars/<Name>/AVATAR.md` remains the human source of truth for prose, workflow and hard-won
per-avatar lore. `Avatars/<Name>/identity.json` is its **machine twin** — what code acts on.
Edit the prose; re-run `analyze` when you add images.

- **`resolve` picks anchors by (yaw, light, expr), weighting yaw highest.** Anchoring a
  3/4 or profile shot to a frontal portrait is the single biggest cause of likeness drift, which
  is exactly what the old "paste the same two portraits into everything" behaviour did.
- **`analyze` tags anchors by LOOKING at them**, not by trusting filenames — which is how we found
  that several kits' `portrait_neutral` is actually a smiling frame.
- **Casting gate.** `status:"casting"` avatars are REFUSED (exit 2). Brooke and Dialed_Ava are
  both casting: their AVATAR.md files say the founder must approve the face first, and
  Dialed_Ava's says *"before any paid use"*. Approving locks every downstream artifact —
  anchors, gate thresholds, any future LoRA — so relocking later invalidates all of them.
  `--allow-casting` exists for throwaway tests only.
- **`verify` is adversarial by design and defaults to IMPOSTER.** It is told to assume two
  different people and try to confirm it, and to enumerate nose/eyes/jaw/ears/mouth/marks before
  deciding. This is not fussiness — the first version was told to "ignore hairstyle and wardrobe"
  and duly passed **Mack as Marcus** at high confidence, calling the difference "hairstyle, beard
  length." Two people of the same age, sex and colouring read as "same type", and type is not
  identity. The errors are asymmetric: a false MATCH ships the wrong person's face, a false
  IMPOSTER costs one re-roll. Calibrated 2026-07-28: Marcus's own takes MATCH, Mack IMPOSTER.
- **Known coverage gap — the thing to fix next.** `analyze` revealed that Marcus has 9 anchors
  spanning exactly ONE (yaw, light) combination: all `frontal · window-left`. Renee and Dialed_Ava
  likewise have one each. So `resolve --yaw profile-left` currently returns a frontal portrait
  because nothing better exists. **Shoot 3/4-left, 3/4-right and a second lighting setup per
  locked avatar**, then re-run `analyze`. Anchor diversity, not anchor count, is what holds a face.

## Pattern I — Long-form (30 / 45 / 60s)

```bash
node sieve-longform.mjs --spec sieve/longform/rec-30s.json --dry-run   # always first
node sieve-longform.mjs --spec sieve/longform/rec-30s.json [--mode chain|anchor]
```

**Hard API caps, probed 2026-07-28: `seedance-1.5-pro` = 12s, `seedance-2.0` = 15s.** There is no
long-form model. Anything above that is stitched, and stitching has exactly three failure modes:

1. **Voice seam — solved by `seed`.** The voice re-rolls on every call, and `1.5-pro` has no
   `reference_audios` to pin it (2.0-only, and 2.0 refuses humans). E6 measured it: unseeded, two
   runs of an identical prompt returned *"different speaker, high confidence"*; with a fixed seed
   and DIFFERENT dialogue, *"same speaker, no seam"*. **Every segment carries the SAME seed.**
   `sieve-longform.mjs` refuses a spec without one. Vary the words, never the seed.
2. **Face drift** — every hop is verified against the avatar canonical; the run stops rather than
   shipping a piece that changes person halfway.
3. **Look drift** — 1.5-pro re-renders its first frame slightly wider and darker, so naive chaining
   COMPOUNDS it. Hence two modes: `--mode chain` (default, best pose continuity, good to ~3
   segments) and `--mode anchor` (every segment restarts from the original frame — no compounding
   drift, pose resets at each cut, better for 5+ segments).

**DIALOGUE DENSITY IS THE PACING CONTROL — underfilling a segment is what makes it sound like an ad
read.** Seedance stretches whatever you give it to fill `duration`. Write 14 words into a 10s
segment and it delivers them slowly and evenly, which reads as narration, not conversation.
Measured 2026-07-28: the first 30s/60s pieces ran at **1.0–1.6 words/sec** and were judged
*"slow, deliberate, monotone, resembling a prepared statement"*. The same face, same seed, same
duration at **3.5 words/sec** was judged *"conversational… like someone explaining something to a
friend"*.
- **Target 2.5–3.5 words/sec.** 10s ≈ 25–35 words. Count them; do not eyeball it.
- **State pace as a POSITIVE instruction**: "FAST natural cadence — the speed of real casual
  conversation, not narration." Do not write "unhurried" or "natural conversational pace"; the
  model reads both as slow.
- Add openness cues that produce real speech texture: "open throat, slightly clipped consonants,
  runs sentences together, occasionally rushes a word."
- Beware negative-only voice notes ("never announcer-like") — per golden rule 9, naming the thing
  summons it. Say what the voice IS.

**Same person, one shot with a product and one without:** do it at the IMAGE stage, not by
prompting the video. Build frame A (person + product), then generate frame B *from frame A* with
"reproduce this image EXACTLY, change only: his hand is empty, the product is gone." That is
Pattern A's change-one-thing move. Animate both with the **same seed** and they read as the same
person in the same room. Never try to make the video model add or remove a held object mid-clip —
object permanence in hands is a known Seedance weakness (golden rule 10).

## Conventions checklist (do these every time)

- [ ] Small `.mjs` per job; `.env` loaded; output stamped + saved to a sensible folder.
- [ ] `open -a Preview "<path>"` after generating so the user can review.
- [ ] 2–3 candidates for subjective work; let the user choose.
- [ ] References passed for any consistency requirement; roles named in the prompt.
- [ ] Exact spellings + a tight negative for any on-image text.
- [ ] Long/expensive runs (video, big batches) → run in the background and report when done.
- [ ] Never fake fidelity by pasting; iterate the prompt instead.

## Pattern E — Avatars (reusable talking-head people)

Saved personas live in `Avatars/<Name>/` — read `AVATAR.md` there before any UGC/creator
video. Each kit = identity portraits (`identity/`), approved seed frames from past videos
(`takes/`), and the exact identity + voice descriptors to paste into prompts.

The consistency law: **a person only stays the same person if every generation is anchored
to their identity refs.** New video → build the first frame with Nano Banana using
`identity/*.jpg` as reference images ("use ONLY the likeness of the man in reference
image 1"), then animate it.

**Which video model: see Pattern D — it is authoritative and this section is not.** Two
claims that used to live here were wrong and are corrected there, dated 2026-07-29:
- Veo 3.1 scene-extension is **NOT** 16:9-only — it is verified working in 9:16 vertical
  (`sieve/golden/experiments/E16-veo-extend/`). Believing otherwise cost a day of building
  stitching machinery Veo does natively.
- Veo 3.1 is **where to start for talking heads**, not the fallback. Its audio and video are
  generated jointly, so lip sync is native rather than assembled; it was operator-judged
  *"very, very good"* after six assembled alternatives were rejected. Seedance 1.5 Pro
  (`generate_audio: true`, duration ≤ 12s, dialogue in quotes, acronyms spelled phonetically)
  remains correct when you need a first-frame-conditioned shot or `camera_fixed`.

Kling = silent B-roll only (its lip-sync tool was tried and rejected — robotic stock voice).
Whisper-QC every take's audio. After approval, save first + last frames into `takes/` so the
next video starts warm.

To create a NEW avatar: copy `Avatars/Marcus/AVATAR.md` as the template, generate 2–3
canonical portraits (neutral + smile) of the new person, fill in the descriptors.

## ⚠️ LOCAL MACHINE NOTE (this Mac only — added at setup, do not commit)

This machine's `~/.secrets` (sourced by `~/.zshrc`) exports a DIFFERENT, older
`OPENAI_API_KEY` into every shell. The `.env` loader in this repo's scripts only sets
variables that aren't already in the environment, so the shell key silently wins and
bills/uses the wrong account.

**Always run generation scripts with the shell key stripped:**

```bash
env -u OPENAI_API_KEY node <script>.mjs
```

Sanity check anytime: the project key ends in `rpQA`; the stale shell key ends in `o71YYA`.
