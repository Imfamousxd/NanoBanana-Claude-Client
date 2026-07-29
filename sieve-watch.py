#!/usr/bin/env python3
"""
sieve-watch.py — deterministic QC on generated video. Tier 1 of the watcher.

    python3 sieve-watch.py <video.mp4> [--manifest <m.json>] [--modality ugc|cinema|ad]
    python3 sieve-watch.py <video.mp4> --expect-w 720 --expect-h 1280 --expect-dur 29

WHY THIS TIER IS THE AUTHORITATIVE ONE
Every genuine defect found while building this engine was objectively measurable:
    a clip came out 720x960 instead of 9:16          -> ffprobe
    a regression silently halved 1080p to 720p       -> ffprobe
    a missing audio stream                            -> ffprobe
    compounding luma decay across stitched segments   -> pixel statistics
    a 3:4 avatar canonical propagating into video     -> image dimensions
Meanwhile the VLM used to judge "is this good" was caught giving OPPOSITE high-confidence
verdicts on the SAME file depending only on what it was compared against, and rated a real
human recording as synthetic.

So: this file NEVER asks a model anything. Every check here is arithmetic on the actual bytes,
which means it cannot hallucinate and can run unattended. Model judgement belongs in a separate,
clearly-advisory tier (sieve-judge.mjs / sieve-avatar.mjs verify), never here.

MODALITY MATTERS. Several criteria INVERT between modalities — even, controlled exposure is a
quality signal for a packshot and a defect for UGC; a locked-off camera is right for a product
shot and wrong for handheld. Checks that flip are marked and only applied when the modality is
known. When it is unknown, they are reported as notes rather than judged.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image


def probe(path, args):
    r = subprocess.run(["ffprobe", "-v", "error", *args, "-of", "json", path],
                       capture_output=True, text=True)
    try:
        return json.loads(r.stdout or "{}")
    except json.JSONDecodeError:
        return {}


def frames(path, n=12):
    """Evenly-spaced frames as float arrays. The basis of every temporal check."""
    tmp = tempfile.mkdtemp(prefix="watch_")
    dur = float(probe(path, ["-show_entries", "format=duration"])
                .get("format", {}).get("duration", 0) or 0)
    out = []
    for i in range(n):
        t = max(0.0, dur * (i + 0.5) / n)
        f = os.path.join(tmp, f"f{i}.png")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}",
                        "-i", path, "-frames:v", "1", f], check=False)
        if os.path.exists(f):
            out.append((t, np.asarray(Image.open(f).convert("RGB"), dtype=np.float32)))
    return dur, out


LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def main():
    ap = argparse.ArgumentParser(add_help=True, usage=argparse.SUPPRESS)
    ap.add_argument("video")
    ap.add_argument("--manifest", help="sidecar JSON of what was REQUESTED")
    ap.add_argument("--modality", choices=["ugc", "cinema", "ad", "product"], default=None)
    ap.add_argument("--expect-w", type=int)
    ap.add_argument("--expect-h", type=int)
    ap.add_argument("--expect-dur", type=float)
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    a = ap.parse_args()

    if not os.path.exists(a.video):
        sys.exit(f"sieve-watch: not found: {a.video}")

    # Intent. Without it "720x1280" is unjudgeable — correct if requested, a defect if not.
    want = {}
    if a.manifest and os.path.exists(a.manifest):
        want = json.load(open(a.manifest))
    modality = a.modality or want.get("modality")
    ew = a.expect_w or want.get("width")
    eh = a.expect_h or want.get("height")
    ed = a.expect_dur or want.get("duration")

    v = probe(a.video, ["-select_streams", "v:0", "-show_entries",
                        "stream=width,height,r_frame_rate,codec_name,nb_frames"])
    f = probe(a.video, ["-show_entries", "format=duration,bit_rate,size"])
    au = probe(a.video, ["-select_streams", "a:0", "-show_entries",
                         "stream=codec_name,channels,sample_rate"])
    vs = (v.get("streams") or [{}])[0]
    aus = (au.get("streams") or [{}])
    fmt = f.get("format", {})

    W, H = int(vs.get("width", 0)), int(vs.get("height", 0))
    dur = float(fmt.get("duration", 0) or 0)
    fails, warns, notes = [], [], []

    # ── container / stream ────────────────────────────────────────────────────
    if not W or not H:
        fails.append("no video stream")
    if ew and eh and (W, H) != (ew, eh):
        fails.append(f"resolution {W}x{H}, requested {ew}x{eh}")
    if ed and dur and abs(dur - ed) > max(0.75, ed * 0.06):
        fails.append(f"duration {dur:.1f}s, requested {ed:.1f}s")
    ar = W / H if H else 0
    if want.get("aspect_ratio"):
        wr, hr = (want["aspect_ratio"].split(":") + ["1"])[:2]
        target = float(wr) / float(hr)
        if abs(ar - target) > 0.02:
            fails.append(f"aspect {ar:.3f} ({W}x{H}), requested {want['aspect_ratio']} = {target:.3f}")
    notes.append(f"{W}x{H} ar={ar:.3f} {dur:.2f}s {vs.get('codec_name','?')} "
                 f"{int(fmt.get('bit_rate',0) or 0)//1000}kbps "
                 f"{int(fmt.get('size',0) or 0)//1048576}MB")

    # ── audio ─────────────────────────────────────────────────────────────────
    if not aus or not aus[0].get("codec_name"):
        fails.append("NO AUDIO STREAM")
    else:
        notes.append(f"audio {aus[0].get('codec_name')} {aus[0].get('channels')}ch "
                     f"{aus[0].get('sample_rate')}Hz")
        # EBU R128 loudness + true peak. Silence and clipping are both hard defects.
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.video,
                            "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True)
        tail = r.stderr[-2500:]
        lufs = peak = None
        for line in tail.splitlines():
            s = line.strip()
            if s.startswith("I:") and "LUFS" in s:
                try: lufs = float(s.split()[1])
                except Exception: pass
            if s.startswith("Peak:") and "dBFS" in s:
                try: peak = float(s.split()[1])
                except Exception: pass
        if lufs is not None:
            notes.append(f"loudness {lufs:.1f} LUFS" + (f", peak {peak:.1f} dBFS" if peak is not None else ""))
            if lufs < -50: fails.append(f"audio effectively silent ({lufs:.1f} LUFS)")
            elif lufs < -30: warns.append(f"audio very quiet ({lufs:.1f} LUFS)")
            # Social platforms normalise around -14 LUFS; far off means it will be re-levelled.
            elif not (-24 <= lufs <= -8): warns.append(f"loudness {lufs:.1f} LUFS outside typical social range (-24..-8)")
        if peak is not None and peak > -0.1:
            warns.append(f"audio at/over full scale ({peak:.1f} dBFS) — likely clipping")

    # ── voice continuity ──────────────────────────────────────────────────────
    # Detects the voice CHANGING mid-piece, which is what happens when a video model extends
    # itself: each hop re-rolls the speaker. Caught 2026-07-29 only because the operator heard
    # it — a median-F0 check had reported the piece as continuous, because pitch is blind to
    # timbre. Two different voices routinely share a median F0.
    #
    # Spectral centroid (the brightness of the spectrum) tracks timbre and DOES move when the
    # speaker changes. On the failing piece it ran 1268 -> 2102 -> 1851 -> 2574 Hz across four
    # beats; beat 4 was double beat 1. A single speaker holds it far tighter than that.
    if aus and aus[0].get("codec_name") and dur > 6:
        wav = os.path.join(tempfile.mkdtemp(prefix="watchaud_"), "a.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-vn",
                        "-ac", "1", "-ar", "24000", wav], check=False)
        if os.path.exists(wav):
            import wave as _wave
            w = _wave.open(wav)
            sr = w.getframerate()
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

            def centroid(seg):
                win, hop, acc = 1024, 512, []
                for i in range(0, len(seg) - win, hop):
                    s = seg[i:i + win]
                    if np.sqrt((s ** 2).mean()) < 0.02:      # skip silence
                        continue
                    acc.append(np.abs(np.fft.rfft(s * np.hanning(win))))
                if not acc:
                    return None
                m = np.mean(acc, axis=0); m = m / (m.sum() + 1e-9)
                return float((np.fft.rfftfreq(win, 1 / sr) * m).sum())

            # Fixed 6s windows: long enough for a stable estimate, short enough to localise a switch.
            wins, t = [], 0.0
            while t + 6 <= dur:
                c = centroid(x[int(t * sr):int((t + 6) * sr)])
                if c: wins.append((t, c))
                t += 6
            if len(wins) >= 2:
                cs = np.array([c for _, c in wins])
                spread = (cs.max() - cs.min()) / max(cs.mean(), 1e-6) * 100
                notes.append("voice timbre (centroid Hz): "
                             + " -> ".join(f"{c:.0f}" for c in cs)
                             + f"  spread {spread:.0f}%")
                # Threshold from the failure: a re-rolling piece spread ~70%+ between windows.
                # A single continuous speaker stays well under 30%.
                worst = max(abs(cs[i] - cs[i - 1]) / max(cs[i - 1], 1e-6) for i in range(1, len(cs))) * 100
                if worst > 35:
                    at = max(range(1, len(cs)), key=lambda i: abs(cs[i] - cs[i - 1]))
                    fails.append(f"VOICE CHANGES mid-piece: timbre jumps {worst:.0f}% at ~{wins[at][0]:.0f}s "
                                 f"— the speaker is not the same person throughout")
                elif worst > 22:
                    warns.append(f"voice timbre shifts {worst:.0f}% at ~{wins[max(range(1,len(cs)), key=lambda i: abs(cs[i]-cs[i-1]))][0]:.0f}s")

    # ── temporal / pixel ──────────────────────────────────────────────────────
    total_dur, fr = frames(a.video, 12)
    if len(fr) < 4:
        warns.append("could not sample enough frames for temporal checks")
    else:
        lum = np.array([(im @ LUMA).mean() for _, im in fr])
        # Black or blown frames are unambiguous failures.
        if (lum < 8).any(): fails.append(f"black frame(s) at {[f'{t:.1f}s' for (t,_),l in zip(fr,lum) if l<8]}")
        if (lum > 247).any(): warns.append("blown-out frame(s)")
        # Compounding luma drift. This is what distinguished a broken stitching pipeline from a
        # sound one, but the FIRST version of this check missed it: the threshold was written in
        # per-SEGMENT units (-1.90/segment) while this samples frames across the whole file, and
        # it demanded STRICT monotonicity, which within-segment noise breaks.
        #
        # Correct tool: Spearman rank correlation between frame index and luma. It detects a
        # consistent trend without requiring every step to go the same way, and it is scale-free.
        # Paired with TOTAL drift as a share of mean luma, which is the quantity that actually
        # matters — a slope only means something once you know how many samples it acts over.
        n = len(lum)
        idx = np.arange(n)
        rank_l = np.argsort(np.argsort(lum))
        rho = float(np.corrcoef(idx, rank_l)[0, 1]) if n > 2 else 0.0
        slope = float(np.polyfit(idx, lum, 1)[0])
        total_drift = slope * (n - 1)
        pct = abs(total_drift) / max(lum.mean(), 1e-6) * 100
        notes.append(f"luma {lum.min():.0f}-{lum.max():.0f} · trend rho={rho:+.2f} · "
                     f"total drift {total_drift:+.1f} ({pct:.1f}% of mean)")
        # Both must hold: a consistent direction AND enough magnitude to see.
        if abs(rho) > 0.7 and pct > 2.5:
            fails.append(f"compounding luma drift: rho={rho:+.2f}, {total_drift:+.1f} luma "
                         f"({pct:.1f}% of mean) — the piece visibly "
                         f"{'darkens' if total_drift < 0 else 'brightens'} end to end")
        elif abs(rho) > 0.7 and pct > 1.2:
            warns.append(f"mild consistent luma drift (rho={rho:+.2f}, {pct:.1f}%) — watch it if you add segments")
        # Frozen video: consecutive sampled frames identical means generation stalled.
        for i in range(1, len(fr)):
            if np.abs(fr[i][1] - fr[i-1][1]).mean() < 0.4:
                fails.append(f"frozen/duplicate frames around {fr[i][0]:.1f}s — generation likely stalled")
                break
        # Unintended hard cuts: a big histogram jump where the piece should be continuous.
        jumps = []
        for i in range(1, len(fr)):
            a_, b_ = fr[i-1][1], fr[i][1]
            hj = np.abs(np.histogram(a_ @ LUMA, 32, (0, 255))[0] - np.histogram(b_ @ LUMA, 32, (0, 255))[0]).sum()
            if hj / a_[..., 0].size > 0.55: jumps.append(f"{fr[i][0]:.1f}s")
        if jumps:
            (warns if modality in ("ad", "cinema") else fails).append(
                f"large scene change at {', '.join(jumps)} — unintended cut?")
        # ── STATIC-PATCH FLICKER + COMPOSITION DRIFT ─────────────────────────
        # Catches the picture MORPHING across a piece — framing creeping tighter, props sliding,
        # a hand leaving frame. Global luma is blind to it: the scene can restructure completely
        # while mean brightness holds. Missed exactly that on a 29s piece the operator caught by eye.
        #
        # Two complementary measures:
        #   flicker  — find the flattest patch in frame 1 (a wall, a window frame: something that
        #              should be RIGID) and measure how much it varies over time. If nothing should
        #              move, any variation is generation instability. Strongest single deterministic
        #              discriminator found: 0.98 DN on an accepted clip vs 2.34 on a rejected one.
        #   drift    — correlation of each frame against frame 1, downsampled so it measures LAYOUT
        #              rather than detail. A steady decline means composition is walking away from
        #              where it started, which is what chain-mode extension does.
        g = [(im @ LUMA) for _, im in fr]
        h0, w0 = g[0].shape
        ps = 32
        if h0 > ps * 3 and w0 > ps * 3:
            # Scan the top third — background, above where a subject's head usually sits.
            best, bv = None, 1e9
            for yy in range(0, h0 // 3 - ps, max(8, ps // 2)):
                for xx in range(0, w0 - ps, max(8, ps // 2)):
                    v = float(g[0][yy:yy + ps, xx:xx + ps].std())
                    if v < bv: bv, best = v, (yy, xx)
            if best:
                yy, xx = best
                patches = np.array([f[yy:yy + ps, xx:xx + ps].mean() for f in g])
                flicker = float(patches.std())
                notes.append(f"static-patch flicker {flicker:.2f} DN (patch at {xx},{yy})")
                if flicker > 3.0:
                    fails.append(f"static background is unstable ({flicker:.2f} DN) — the picture is "
                                 f"morphing; a region that should be rigid is not")
                elif flicker > 1.8:
                    warns.append(f"static background drifts ({flicker:.2f} DN) — mild morphing")

        # Composition drift vs the opening frame, at low resolution so it reads layout not detail.
        def small(x):
            im = Image.fromarray(x.astype(np.uint8)).resize((48, 84))
            v = np.asarray(im, dtype=np.float32).ravel()
            return (v - v.mean()) / (v.std() + 1e-6)
        base = small(g[0])
        corr = np.array([float((base * small(f)).mean()) for f in g])
        notes.append("layout vs opening: " + " ".join(f"{c:.2f}" for c in corr[::max(1, len(corr)//6)]))
        if corr[-1] < 0.55 and corr[-1] < corr[0] - 0.2:
            fails.append(f"composition drifts away from the opening frame "
                         f"(layout correlation {corr[0]:.2f} -> {corr[-1]:.2f}) — the shot does not "
                         f"stay the same shot")
        elif corr[-1] < 0.75 and corr[-1] < corr[0] - 0.12:
            warns.append(f"composition creeps (layout correlation {corr[0]:.2f} -> {corr[-1]:.2f})")

        # Contrast. INVERTS by modality: flat is fine-ish for UGC, a defect for cinema.
        contrast = float(lum.std())
        if modality == "cinema" and contrast < 4:
            warns.append(f"low tonal variation ({contrast:.1f}) — flat for cinematic work")
        elif modality in ("ugc", None):
            notes.append(f"tonal variation {contrast:.1f} (not judged for UGC — flat is normal)")

    # ── report ────────────────────────────────────────────────────────────────
    status = "FAIL" if fails else ("WARN" if warns else "PASS")
    if a.json:
        print(json.dumps({"file": a.video, "status": status, "modality": modality,
                          "fails": fails, "warns": warns, "notes": notes}, indent=2))
    else:
        print(f"\nsieve-watch — {os.path.basename(a.video)}"
              f"{f'  [{modality}]' if modality else ''}   ==> {status}\n")
        for n in notes: print(f"  · {n}")
        for w in warns: print(f"  ! WARN  {w}")
        for x in fails: print(f"  ✗ FAIL  {x}")
        if not fails and not warns: print("  ✓ all deterministic checks passed")
        print()
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
