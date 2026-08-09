# Voice recording spec — source audio for avatar voice cloning

One session per voice. ~15 minutes of talent time each. The output is cloned once and reused
forever, so this is a one-time cost per persona.

## Why we are recording at all

Five TTS engines were tested and every one was judged synthetic at high confidence — chatterbox
(including cloned), minimax, three OpenAI `gpt-4o-mini-tts` voices, and ElevenLabs. The tells were
consistent: emphasis landing in the wrong places, breath that reads as a pasted-in sound effect,
delivery "too perfect". Post-processing (`sieve-phonemic.py`) fixed the *recording* half — raw TTS
now ranks last against phone-processed versions — but it cannot fix a synthetic *performance*.

A cloned real voice inherits real micro-variation in pitch and volume, real breath, and real
imperfect emphasis. That is the half no parameter reaches.

---

## RECORD CLEAN. Add the dirt later.

The instinct is to record on a phone in a kitchen so it "sounds like UGC". **Do not.** The clone
learns whatever is in the source, permanently — record in a noisy kitchen and every line that
avatar ever speaks is stuck in that kitchen.

Record the voice cleanly, then `sieve-phonemic.py` adds phone-mic band-limiting, gain riding, room
tone and codec artefacts per shot. That way the capture character is a dial, not a tattoo.

## Setup

| | Spec | Notes |
|---|---|---|
| **Mic** | Any USB mic (Blue Yeti / Samson Q2U class, ~$60-100) | A phone's Voice Memos at highest quality is acceptable. A laptop's built-in mic is not. |
| **Room** | Small, soft, carpeted. A closet full of hanging clothes is genuinely ideal. | Avoid kitchens, bathrooms, empty rooms — hard surfaces put slap-back into the clone. |
| **Distance** | 6-10 inches, angled slightly off-axis | Off-axis kills plosive pops on P and B. |
| **Format** | WAV, 48 kHz, 24-bit if offered | Never MP3 for source. Never Bluetooth earbuds — they band-limit before you do. |
| **Levels** | Peaks around -6 dB, never clipping | Quiet-but-clean beats loud-and-clipped; clipping cannot be undone. |
| **Processing** | **NONE.** No noise reduction, no EQ, no compression, no "voice enhance". | Turn off every phone/app enhancement. Raw is required. |

Silence phones, fridge, HVAC, anything with a fan. Record 10 seconds of the empty room before you
start — that is the room-tone bed for this avatar.

## What to record

Three passes, ~15 min total.

### Pass 1 — Conversational body (target 90 seconds of speech)

The clone's main diet. Read it **the way you would tell a friend**, not the way you would read a
script. Stumble and keep going — do not restart on a fumble, the fumbles are the point.

> Okay so, honestly? I wasn't sure about this at first. Like at all. I'd already tried, what,
> three or four other things and none of it really did anything, so I kind of assumed this would
> be the same deal.
>
> But — and this is the part that got me — about three weeks in, my sister goes, wait, you look
> different. And I hadn't even noticed it myself, which is wild, right? You don't see it when
> it's your own face every day.
>
> So yeah. I don't know. I'm not gonna sit here and tell you it's magic, because it isn't. It
> just... actually worked, and I wasn't expecting that. That's kind of the whole thing.
>
> Anyway. That's where I'm at with it. Take that for whatever it's worth.

Then, for phonetic coverage, read these once each, plainly:

> The quick brown fox jumps over the lazy dog.
> She sells sixty-seven shiny shells by the shore.
> Would you judge a rough vision of a huge orange budget?
> Bring me five thick blue books from the top shelf.

### Pass 2 — Range (about 45 seconds)

Same voice, different registers. Say each line twice, differently.

- Flat / tired: "Yeah, no, I get it. It's fine."
- Amused, half a laugh in it: "I mean — okay, that's actually pretty funny."
- Emphatic: "No, listen, that's the whole point."
- Question, real curiosity: "Wait, so how does that even work?"
- Trailing off, losing interest: "I guess we could try it, or... I don't know."
- Quiet, close to the mic, confiding: "Between you and me, I almost didn't bother."

### Pass 3 — The texture library (about 60 seconds)

**This is the pass everyone skips and it is the one that buys realism.** Record each with two
seconds of silence either side so they can be cut out cleanly as individual samples:

- 3 breaths in, as if about to speak
- 3 breaths out, as if finishing a thought
- 2 short throat clears
- 2 coughs — one small and stifled, one fuller
- 2 sniffles
- 3 lip/mouth clicks (the small wet sound before speaking)
- "um" ×3, "uh" ×3, "like" ×3, "so" ×3 — thrown away, not enunciated
- 2 short laughs — one exhaled through the nose, one voiced
- 2 sighs

These get spliced between phrases so the disfluency is a **real** human sound rather than a
synthesised one. A synthetic cough on a synthetic voice adds nothing; a real cough is the tell
working in your favour.

---

## Deliver

```
Avatars/<Name>/voice/source/
    pass1_body.wav
    pass2_range.wav
    pass3_texture.wav
    roomtone.wav          # the 10s of empty room
```

Then: `node sieve-avatar.mjs voice <Name> --from-source`

## Rights — settle before recording, not after

The recording is cloned and reused indefinitely across commercial content. Get it in writing:
a buyout for synthetic voice replication, unlimited use, in perpetuity, across all the brands.
Do not record someone on a handshake and clone them — for the talent's sake and yours. Standard
voice-talent rates for a buyout of this kind are typically a few hundred dollars per voice; it
is the cheapest line item in the whole pipeline and the only one with a person attached.

Never clone a voice you do not have explicit written permission to use.

## How many

One per avatar you actually intend to run. Currently locked: **Marcus, Mack, Renee, Tasha**.
Casting and unapproved: Brooke, Dialed_Ava, Diego, Priya — do not record those until the faces
are picked, or the voice may end up attached to a face you reject.

Different talent per avatar. One person doing four voices will read as one person doing four
voices, which is the exact problem we are trying to solve.
