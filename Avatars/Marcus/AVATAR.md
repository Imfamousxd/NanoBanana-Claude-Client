# Avatar: Marcus (working name — rename folder + this file freely)

Reusable UGC creator persona. First used: NuLumin BPC-157/TB-500 series, 2026-07-22.

## Identity (use this EXACT descriptor in every prompt)
Fit, friendly man in his early 30s, short dark hair, light stubble, warm brown eyes,
wearing a plain heather-grey crewneck tee. Relaxed, genuine, direct-to-camera energy.

## Voice (Seedance prompt descriptor — keep verbatim for consistency)
Warm mid-range American male voice, natural conversational pace, casual and friendly,
never announcer-like.

## Home set
Bright modern home studio: soft natural window light from the left, softly blurred
neutral wall behind, faint warm lamp glow on the right. Chest-up framing, vertical 9:16,
shot-on-phone front camera look — natural, not cinematic.

## How to use (the engine workflow)
1. FIRST FRAME — Nano Banana Pro, refs = `identity/*.png` FIRST, then product/scene refs.
   Prompt: "Use ONLY the likeness of the man from reference image 1/2 — same face, same
   hair, same stubble" + the identity descriptor above + scene/product instructions.
2. TALKING VIDEO — Seedance 1.5 Pro (`bytedance/seedance-1.5-pro` on Replicate),
   image = the first frame, `generate_audio: true`, `duration` ≤ 12 (hard max), 9:16.
   Put dialogue in quotes; spell acronyms phonetically ("BPC one-five-seven");
   include the voice descriptor. ~2.5 words/sec budget. Whisper-QC every take.
   Punctuate dialogue with PERIODS, not em-dashes — dashes render as a small
   vocal tick/hesitation in Seedance speech (seen across all 5 takes, 2026-07-22;
   period-only scripts came back artifact-free).
   HAND-LOCK (proven on Seedance AND Veo, 2026-07-22): include verbatim — "His raised
   hand holding the tiny vial stays LOCKED in exactly the same position at shoulder
   height for the entire video. The hand and the vial do not move, drift, lower,
   rotate, or gesture at all. His other arm stays down and completely still. Only his
   face, jaw, eyes and slight head movements animate as he speaks."
3. LONGER VIDEOS — chain takes via last frame (`ffmpeg -sseof -0.1 -i clip.mp4 -update 1
   last.png`) and hide seams with 1–2s product B-roll inserts.
4. AFTER AN APPROVED TAKE — save its first + last frame into `takes/`, note the
   Replicate seed if set. These become future seeds for this avatar.
5. NEVER regenerate the face from text alone — always pass identity refs. Text-only
   prompts drift the likeness (CLAUDE.md golden rule 4).

## Files
- `identity/portrait_neutral.jpg` — canonical face ref (no product in hand)
- `identity/portrait_smile.jpg` — canonical smiling ref
- `takes/` — approved first/last frames from produced videos
- `scenes/` + `SCENES.md` — the scene library (wardrobe/location/light kits: couch,
  jacket, hallway, …). Videos are person-on-screen START TO FINISH — no mid-video
  product cutaways (user rejected those); product lives in his hand or in the caption.

## Compliance (inherited from brand work)
This is a synthetic spokesperson. Scripts stay research-framed for peptide brands
(no cure/efficacy claims, no doctor/patient personas, RUO line in captions per
Brand Context/NuLumin_BioSciences.md).
