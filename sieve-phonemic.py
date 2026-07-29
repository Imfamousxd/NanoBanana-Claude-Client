#!/usr/bin/env python3
"""
sieve-phonemic.py — make clean TTS sound like it was recorded on a phone in a room.

    python3 sieve-phonemic.py <in.wav> <out.wav> [--room <clip.mp4>] [--strength 1.0]

WHY THIS EXISTS
Every TTS engine tested (chatterbox cloned, minimax, OpenAI gpt-4o-mini-tts across three voices,
plus ElevenLabs per the operator) was judged NOT believable as human, high confidence. Swapping
engines stopped paying. The recurring tells were "too perfect", "breath sounds like separate sound
effects", "emphasis in the wrong places".

The insight is that two different things are being judged and only one is the voice:

    1. Does the PERFORMANCE sound human?   <- engine's job, currently capped
    2. Does the RECORDING sound real?      <- nobody was doing this at all

TTS returns pristine, full-bandwidth, noise-free, perfectly-levelled studio audio. A real phone
video is the opposite: band-limited by a tiny mic, AGC-pumped, room-noisy, and lossily compressed
twice over. Pristine audio over a phone-shot picture is a mismatch the ear catches even when it
cannot say why. This fixes (2), which nothing in the pipeline was addressing.

THE CHAIN (each stage models a real physical stage of phone capture):
  1. band-limit      phone mics have almost nothing below ~110 Hz and roll off hard past ~7.5 kHz
  2. proximity/AGC   phones ride gain constantly; loud parts squash, quiet parts lift
  3. room tone       real ambience, harvested from the clip's own room, not synthesised hiss
  4. mic self-noise  a real noise floor sits under everything
  5. codec artefacts encode through a low-bitrate lossy codec and back - the same artefacts any
                     phone video carries. This is the stage that is impossible to fake by EQ.

Deliberately NOT a "make it worse" knob. Overdone, it sounds like a bad phone call rather than a
normal one; --strength 1.0 is calibrated to "ordinary iPhone in a kitchen".
"""
import argparse
import os
import subprocess
import sys
import tempfile


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-v", "error", *args], check=True)


def probe(path, entry="format=duration"):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entry,
                          "-of", "default=nw=1:nk=1", path],
                         capture_output=True, text=True, check=True)
    return out.stdout.strip().splitlines()[0]


def main():
    ap = argparse.ArgumentParser(add_help=True, usage=argparse.SUPPRESS)
    ap.add_argument("infile")
    ap.add_argument("outfile")
    ap.add_argument("--room", help="video/audio to harvest real room tone from")
    ap.add_argument("--room-at", type=float, default=8.6, help="seconds into --room to sample")
    ap.add_argument("--strength", type=float, default=1.0, help="0.5 subtle, 1.0 normal, 1.5 rough")
    ap.add_argument("--keep-clean", action="store_true", help="also write <out>_clean.wav for A/B")
    a = ap.parse_args()

    if not os.path.exists(a.infile):
        sys.exit(f"sieve-phonemic: input not found: {a.infile}")
    s = max(0.2, min(2.0, a.strength))
    tmp = tempfile.mkdtemp(prefix="phonemic_")
    dur = probe(a.infile)

    # ── 1+2. band-limit + AGC-style gain riding ───────────────────────────────
    # highpass climbs and lowpass drops as strength rises: a worse mic in a worse room.
    hp = 90 + 40 * s
    lp = 9000 - 1800 * s
    # acompressor models the phone's automatic gain: fast attack, audible pumping on louder words.
    chain = (
        f"highpass=f={hp:.0f},lowpass=f={lp:.0f},"
        f"acompressor=threshold=-20dB:ratio={2.5 + s:.1f}:attack=5:release=180:makeup={1.5 + s:.1f},"
        f"equalizer=f=2500:t=q:w=1.4:g={2.5 * s:.1f},"     # presence bump typical of small mics
        f"equalizer=f=400:t=q:w=1.2:g={-2.0 * s:.1f}"      # boxy-midrange scoop
    )
    voiced = os.path.join(tmp, "voiced.wav")
    ff("-i", a.infile, "-af", chain, "-ar", "24000", "-ac", "1", voiced)

    # ── 3+4. room tone (real, harvested) + mic self-noise ─────────────────────
    bed = os.path.join(tmp, "bed.wav")
    if a.room and os.path.exists(a.room):
        seed = os.path.join(tmp, "seed.wav")
        ff("-ss", str(a.room_at), "-t", "1.2", "-i", a.room, "-vn", "-ac", "1", "-ar", "24000", seed)
        ff("-stream_loop", "-1", "-i", seed, "-t", dur,
           "-af", f"volume={0.06 * s:.3f},highshelf=g=-4:f=4000", bed)
    else:
        # No room supplied: synthesise a floor. Weaker than real ambience — prefer --room.
        ff("-f", "lavfi", "-i", f"anoisesrc=color=brown:amplitude={0.012 * s:.4f}:r=24000",
           "-t", dur, "-ac", "1", bed)

    hiss = os.path.join(tmp, "hiss.wav")
    ff("-f", "lavfi", "-i", f"anoisesrc=color=white:amplitude={0.0016 * s:.4f}:r=24000",
       "-t", dur, "-ac", "1", hiss)

    mixed = os.path.join(tmp, "mixed.wav")
    ff("-i", voiced, "-i", bed, "-i", hiss, "-filter_complex",
       "[0:a][1:a][2:a]amix=inputs=3:duration=first:weights=1 1 1:normalize=0[o]",
       "-map", "[o]", mixed)

    # ── 5. codec round-trip ───────────────────────────────────────────────────
    # The stage EQ cannot imitate. Every phone video has been through a lossy encoder at least
    # once; the smearing it leaves on transients and sibilance is a genuine fingerprint of capture.
    br = int(48 - 16 * s)
    lossy = os.path.join(tmp, "lossy.m4a")
    ff("-i", mixed, "-c:a", "aac", "-b:a", f"{max(20, br)}k", "-ar", "24000", "-ac", "1", lossy)

    os.makedirs(os.path.dirname(os.path.abspath(a.outfile)) or ".", exist_ok=True)
    ff("-i", lossy, "-ar", "24000", "-ac", "1", a.outfile)

    if a.keep_clean:
        clean = a.outfile.rsplit(".", 1)[0] + "_clean.wav"
        ff("-i", a.infile, "-ar", "24000", "-ac", "1", clean)
        print(f"  A/B reference: {clean}")

    print(f"sieve-phonemic: {os.path.basename(a.infile)} -> {a.outfile}"
          f"  (strength {s:.1f}, {hp:.0f}-{lp:.0f} Hz, {max(20, br)}kbps round-trip"
          f"{', real room tone' if a.room else ', synthetic floor'})")


if __name__ == "__main__":
    main()
