#!/usr/bin/env python3
"""
sieve-corpus.py — measure the operator's OWN finished work and derive house-style facts.

    python3 sieve-corpus.py [--dir <folder>] [--out <json>] [--no-transcribe]

WHY THIS EXISTS
`ugc_laws` (57 laws) was derived from 29 videos found on the internet. It encodes what works for
other people. The operator has 214 videos of their own, including a complete finished campaign,
and NONE of it is in the graph. So a brief lands on a generic recipe rather than on the house
style — which is how a build produced a 20-second single-take piece when the house ships 5s, 10s
and 30s, and how it reached for a recipe's example look instead of the shot the operator approved.

Everything here is MEASURED, never judged:
  - ffprobe        duration, dimensions, aspect, audio presence
  - scene detect   cut timestamps -> shot rhythm (the UGC-vs-campaign lane split)
  - EBU R128       integrated loudness -> level consistency across a corpus
  - whisper        the actual spoken script -> word count, ARTICULATION rate (in-speech, not
                   wall-clock), hook landing time, CTA length, pause structure

Articulation rate is the gate that matters (ugc:gate-articulation-not-wallclock): wall-clock rate
is a composite of speaking speed and silence, and it hides both failure modes.
"""
import subprocess, json, os, glob, argparse, sys, statistics as st

FIN = os.path.expanduser("~/Desktop/MUHA-ALL-VIDEOS/01_FINISHED")


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration:stream=width,height,codec_type", "-of", "json", p],
                       capture_output=True, text=True)
    d = json.loads(r.stdout or "{}")
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), {})
    a = any(s.get("codec_type") == "audio" for s in d.get("streams", []))
    dur = float(d.get("format", {}).get("duration", 0) or 0)
    w, h = v.get("width"), v.get("height")
    ratio = None
    if w and h:
        r_ = w / h
        ratio = min({"9:16": 0.5625, "4:5": 0.8, "1:1": 1.0, "16:9": 1.778, "3:4": 0.75},
                    key=lambda k: abs({"9:16": 0.5625, "4:5": 0.8, "1:1": 1.0,
                                       "16:9": 1.778, "3:4": 0.75}[k] - r_))
        if abs({"9:16": 0.5625, "4:5": 0.8, "1:1": 1.0, "16:9": 1.778,
                "3:4": 0.75}[ratio] - r_) > 0.04:
            ratio = f"OFF-RATIO {w}x{h}"
    return dur, w, h, a, ratio


def cuts(p, thresh=0.30):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-filter_complex",
                        f"select='gt(scene,{thresh})',metadata=print:file=-", "-an", "-f", "null", "-"],
                       capture_output=True, text=True)
    out = r.stderr + r.stdout
    return [round(float(l.split("pts_time:")[1].split()[0]), 2)
            for l in out.splitlines() if "pts_time:" in l]


def loudness(p):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True)
    i = None
    for line in r.stderr.splitlines():
        s = line.strip()
        if s.startswith("I:") and "LUFS" in s:
            try:
                i = float(s.split()[1])
            except ValueError:
                pass
    return i


_model = None


def transcribe(p):
    """faster-whisper small.en — the same model the repo used for its earlier verbatim checks."""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _info = _model.transcribe(p, vad_filter=True, word_timestamps=False)
    segs = list(segs)
    text = " ".join(s.text.strip() for s in segs).strip()
    words = len(text.split()) if text else 0
    speaking = sum(s.end - s.start for s in segs)
    gaps = []
    for a, b in zip(segs, segs[1:]):
        g = b.start - a.end
        if g >= 0.30:
            gaps.append(round(g, 2))
    return {
        "text": text,
        "words": words,
        "speaking_s": round(speaking, 2),
        "articulation_wps": round(words / speaking, 2) if speaking > 0.5 else None,
        "hook_end_s": round(segs[0].end, 2) if segs else None,
        "hook_words": len(segs[0].text.split()) if segs else 0,
        "tail_words": len(segs[-1].text.split()) if segs else 0,
        "pauses_over_300ms": gaps,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=FIN)
    ap.add_argument("--out", default="sieve/corpus/house-measurements.json")
    ap.add_argument("--no-transcribe", action="store_true")
    a = ap.parse_args()

    files = sorted(glob.glob(os.path.join(a.dir, "*.mp4")))
    if not files:
        print("no mp4s in", a.dir)
        sys.exit(1)

    rows = []
    for p in files:
        name = os.path.basename(p)
        dur, w, h, has_a, ratio = probe(p)
        c = cuts(p)
        row = {"file": name, "duration_s": round(dur, 2), "w": w, "h": h, "ratio": ratio,
               "has_audio": has_a, "cuts": c, "shot_count": len(c) + 1,
               "avg_shot_s": round(dur / (len(c) + 1), 2) if dur else None,
               "loudness_lufs": loudness(p) if has_a else None}
        if has_a and not a.no_transcribe:
            try:
                row["speech"] = transcribe(p)
            except Exception as e:
                row["speech"] = {"error": str(e)[:120]}
        rows.append(row)
        s = row.get("speech") or {}
        print(f"{name[:42]:<43} {row['duration_s']:>6}s {str(ratio):>12} "
              f"shots={row['shot_count']:<3} {str(row['loudness_lufs']):>7} LUFS "
              f"w={s.get('words','-'):>4} art={s.get('articulation_wps','-')}")

    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(rows, open(a.out, "w"), indent=1)

    # ---- house-style summary, split by the lane the SHOT RHYTHM reveals ----
    spoken = [r for r in rows if (r.get("speech") or {}).get("words", 0) >= 8]
    single = [r for r in spoken if r["shot_count"] == 1]
    multi = [r for r in spoken if r["shot_count"] > 1]

    def band(rs, key, sub=None):
        vals = [(r[sub][key] if sub else r[key]) for r in rs
                if (r.get(sub) or r).get(key) is not None]
        vals = [v for v in vals if isinstance(v, (int, float))]
        return (round(min(vals), 2), round(max(vals), 2), round(st.median(vals), 2)) if vals else None

    print("\n" + "=" * 78)
    print(f"HOUSE STYLE — {len(rows)} clips, {len(spoken)} carry speech")
    print("=" * 78)
    for label, rs in (("SINGLE-TAKE (the UGC lane)", single), ("MULTI-SHOT (the campaign lane)", multi)):
        if not rs:
            continue
        print(f"\n{label} — {len(rs)} clips")
        print(f"  durations      {sorted({r['duration_s'] for r in rs})}")
        print(f"  ratios         {sorted({str(r['ratio']) for r in rs})}")
        print(f"  loudness LUFS  {band(rs,'loudness_lufs')}   (min, max, median)")
        print(f"  articulation   {band(rs,'articulation_wps',sub='speech')} w/s")
        print(f"  words          {band(rs,'words',sub='speech')}")
        print(f"  hook lands     {band(rs,'hook_end_s',sub='speech')} s")
        print(f"  hook words     {band(rs,'hook_words',sub='speech')}")
        if rs is multi:
            print(f"  avg shot       {band(rs,'avg_shot_s')} s")
    allq = [r["loudness_lufs"] for r in rows if r["loudness_lufs"] is not None]
    if allq:
        print(f"\nLOUDNESS SPREAD across the whole corpus: "
              f"{min(allq):.1f} to {max(allq):.1f} LUFS  ({max(allq)-min(allq):.1f} dB)")
    off = [r["file"] for r in rows if str(r["ratio"]).startswith("OFF-RATIO")]
    if off:
        print(f"OFF-RATIO deliverables: {len(off)}  {off[:5]}")
    print(f"\nwrote {a.out}")


if __name__ == "__main__":
    main()
