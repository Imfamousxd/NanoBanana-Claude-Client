# Avatar: Tasha

Created 2026-07-29 by `sieve-avatar.mjs`. **FACE NOT YET APPROVED —
founder picks from candidates before any paid use.** Status stays `casting` (and every job using
this avatar is refused) until `sieve-avatar.mjs lock Tasha --pick <token>` is run.

## Identity (use this EXACT descriptor in every prompt)
Woman, 29, Black American, box braids pulled back, small gold studs, plain fitted tee, athletic build, quick expressive face

## Voice (Seedance descriptor — keep verbatim once locked)
Bright, quick American female voice, fast natural cadence, talks over herself slightly when excited, warm and open, never announcer-like

## How to use (the engine workflow)
1. FIRST FRAME — Nano Banana Pro. Get anchors with:
   `node sieve-avatar.mjs resolve Tasha --yaw <frontal|3q-left|3q-right> --light <...>`
   Prompt: "Use ONLY the likeness of the person in reference image 1" + the descriptor above.
2. TALKING VIDEO — `bytedance/seedance-1.5-pro`, image = the approved first frame,
   `generate_audio: true`, duration <= 12, 9:16. Dialogue in quotes, acronyms spelled
   phonetically, PERIODS not em-dashes (dashes render as a vocal tick).
   seedance-2.0 categorically refuses human frames — do not try it.
3. VERIFY — `node sieve-avatar.mjs verify Tasha --candidates '<dir>'` before animating.
4. AFTER AN APPROVED TAKE — save first + last frames into `takes/`, then re-run
   `node sieve-avatar.mjs analyze Tasha` so they become retrievable anchors.
5. NEVER regenerate the face from text alone — always pass anchors (CLAUDE.md golden rule 4).
