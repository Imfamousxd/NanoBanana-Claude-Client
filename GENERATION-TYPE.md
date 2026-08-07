# GENERATION TYPE — IMAGE

**Branch:** `gen-image` · **Worktree:** `.claude/worktrees/gen-image`

## What this worktree is for

**Stills** — posters, plates, badges, packaging, key art, and first frames destined for a video
lane. Anything whose deliverable is a static image.

## Governing knowledge bank

| Source | What it holds |
|---|---|
| `Brand Context/00_ENGINE.md` | **authoritative** — model slugs, schemas, locked global rules |
| `Brand Context/<Brand>.md` + `assets/<Brand>/` | per-brand playbook, logos, colours, locked rules |
| `CLAUDE.md` Patterns A / B / C / F / G | edit, generate, Nano Banana, finishing, selection |

Read `00_ENGINE.md` first. It wins on any conflict with a summary, including this file.

## Hard rules

1. **gpt-image-2 is the default.** Switch to **Nano Banana Pro**
   (`gemini-3-pro-image-preview`) when you need stronger reference-image fidelity at hero
   scale — that is the only reason to switch, not preference.

2. **2–3 candidates, always.** Set `"n": 3` and a stable `"_id"`; candidates land at
   `generations/<batch>/<_id>/c1.png … cN.png` with a `HERO.png` copy of c1. Then rank them —
   rendering candidates without ranking just moves the eyeballing onto the operator:

   ```bash
   node sieve-judge.mjs --rubric <realism-ugc|realism-cinematic|product-lock> \
        --candidates 'generations/<batch>/<id>' --rank
   ```

   `product-lock` **requires `--refs`** pointing at the canonical asset — it is the one axis with
   real ground truth, so never judge product fidelity from the prompt or from memory.
   `realism-ugc` and `realism-cinematic` are **mutually exclusive**; never apply both.

3. **Spell every on-image string exactly**, and add a tight negative ("no other text, no
   misspellings"). gpt-image-2 sets small lowercase type accurately and can render the whole
   creative, type included. Nano Banana garbles small text — for Gemini, keep type out of the
   generation and composite the flat plate onto a deliberately reserved clean area in post.

4. **Never instruct "no logo".** Told to leave a surface bare, the model invents something (a
   gold leaf emblem, verified). An unspecified surface gets filled — specify what belongs on it.

5. **Never name a device to describe a look.** "Framed like a phone camera" renders an iPhone
   mockup, bezel and all. Say "casual handheld snapshot, full-bleed, fills the frame edge to
   edge, no border, no mockup". Same trap: "screen", "monitor", "polaroid", "film strip".

6. **Negatives summon, they do not suppress.** To remove an effect, delete every mention of it
   and change the scene so it cannot occur.

7. **Anchor with reference images**, and name each one's role in the prompt ("reference image 1
   is MAN A"). Text-only prompts drift. To change one thing, pass the approved image as the first
   `image[]` and say "reproduce EXACTLY except …".

8. **Never fake fidelity by pasting.** Compositing a flat logo / QR / text plate onto a reserved
   clean area is fine; pasting a face or product to force likeness is not — re-prompt instead.

9. **Widen with NAMED substitutions, not blind re-rolls.** Vary the light, the framing, the
   moment. Re-rolling the same prompt resamples the model's average, and the average IS the AI
   look.

## Finishing

`python3 film-grain.py <in> <out> <sigma> <size> [--neutralize]` — heavy `18 0.7`, medium
`11 0.6`. Keep raw generations in `_raw/` so the grade stays re-tunable. `--neutralize` removes
the global colour cast both back-ends lay over a frame; real capture has a white balance, not a
wash. **Exception:** launch/reveal stills ship clean — no grain (see the `gen-launch` worktree).

## Frames destined for video

A still built as a video first frame must be generated **at the delivery ratio**. `aspect_ratio`
is ignored whenever a first frame is supplied — the frame's shape wins, silently. Never animate a
canonical portrait directly; build a purpose-made scene frame anchored to the canonical. Check
dimensions before spending on video (a 9:16 frame is ~0.562 wide/tall).

## Local machine note

Run every generation script with the stale shell key stripped:

```bash
env -u OPENAI_API_KEY node <script>.mjs
```

Project key ends in `rpQA`; the stale shell key ends in `o71YYA`.
