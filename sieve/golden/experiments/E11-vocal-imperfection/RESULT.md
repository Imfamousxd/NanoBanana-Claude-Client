# E10/E11 — Why the audio reads as AI, and the stack that fixes it

**Run 2026-07-28.** Prompted by the note that the voice "doesn't feel like what his voice is
supposed to be like — no raspiness, no coughs, no middle stutters" and that background noise is
needed to mask the AI signature. All four observations held up under test.

## The architectural finding first

Seedance generates voice and video **jointly**, so the mouth is a byproduct of the same sampling
pass that invents the audio. Nothing optimises phoneme-to-viseme accuracy — it approximates "a
talking face", which is exactly the thing humans are most tuned to spot.

Decoupling fixes five things at once:

| | Seedance native | Decoupled |
|---|---|---|
| Sync | byproduct of sampling | `sync/lipsync-2-pro`, purpose-built |
| Voice consistency | same `seed` only, within a run | permanent cloned `voice_id`, forever |
| Pacing | guessed via word count | `speed` parameter, a direct dial |
| Expressiveness | prompt adjectives | `exaggeration` / `emotion` parameters |
| Multi-person | cannot disambiguate | `active_speaker` input |

It also breaks the constraint that audio length must equal video length — no more stretching 14
words across 10 seconds, which was the root of the slow-read problem.

## Measured: the ENGINE matters more than the script

Same idea, three takes, judged blind on how human they sound:

| Take | Disfluency present | Reads as |
|---|---|---|
| A — clean script, `minimax/speech-02-hd` | no | **voiceover** |
| B — disfluency written into script, same engine | yes | **voiceover** — *"'uh' sounds artificial and robotic"* |
| C — `resemble-ai/chatterbox`, `exaggeration 0.75` | yes | **person** |

Writing "uh" into the wrong engine produces a robotic "uh". Disfluency in the script only pays off
on an engine that can perform it. **Use chatterbox for talking heads; minimax reads as an ad.**

## Measured: room tone helps

Harvested from Seedance's OWN generated room ambience (a quiet 1.2s stretch, looped, mixed at
about 5% under the voice with a high-shelf cut so it sits behind). Verdict: `room_tone_helps: true`,
take B *"adds a sense of space and realism, grounding the voice in an environment"*, dry take A
*"too clean to be mistaken for a phone recording"*.

Harvesting beats synthesising noise — it is the room the video was generated in.

## What is still missing, and it is the one thing not fixable by parameters

Strongest remaining tell after all of the above: *"prosody and intonation remain too smooth and
consistent, lacking the spontaneous micro-variations in pitch and volume of natural human speech."*

Parameters cannot add that; it is a property of the source voice. The fix is **voice cloning** —
`resemble-ai/chatterbox` takes an `audio_prompt`, and `minimax/voice-cloning` returns a reusable
`voice_id`. A cloned voice inherits the real speaker's rasp, breath and micro-variation, which is
also what makes the voice match the FACE rather than sounding like stock narration.

This needs a real recording, ~30-60s of clean speech per avatar. Only clone a voice you have the
right to use — your own, or one you have explicit permission for.

## The stack, in order

1. Clone a voice per avatar → reusable ID (once)
2. Write the line WITH disfluency — false starts, self-repair, filler, trailing off
3. TTS on chatterbox with high `exaggeration`
4. Mix room tone harvested from the video's own ambience, ~5% under
5. Generate video silent; lip-sync the finished audio on with `sync/lipsync-2-pro`

Steps 2-5 are proven. Step 1 is the gap, and it is the highest-value one.
