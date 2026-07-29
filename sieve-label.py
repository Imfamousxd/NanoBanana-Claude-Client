#!/usr/bin/env python3
"""
sieve-label.py — deterministic on-product text gate.

    python3 sieve-label.py --canonical <ref.png> --candidate <gen.png> [--crop x0,y0,x1,y1]
    python3 sieve-label.py --expect "COGNITION ELIXIR,BLUE GLACIER,DIALED" --candidate <gen.png>

WHY THIS EXISTS
The VLM product-lock rubric asks, in these words, "is every text element present with the SAME
SPELLING? Read it letter by letter" — and then passed a generated can whose label read
"CLEAN ENERGY & CALMM FOGUS" and "BLUE GLAGIBR" instead of "CLEAN ENERGY & CALM FOCUS" and
"BLUE GLACIER". It could not resolve the type and answered confidently rather than abstaining.

Garbled label text is the single most expensive generation defect: it is invisible at thumbnail
size, obvious at full size, and unusable commercially. It is also perfectly deterministic — the
letters are either right or they are not. So this never asks a model. It OCRs both images with
Apple's Vision framework and diffs the strings.

Requires the sieve-ocr binary:  swiftc -O sieve-ocr.swift -o sieve-ocr

Note on why OCR is run WITHOUT language correction: correction would silently repair COONITION
into COGNITION and hide the exact defect being hunted.
"""
import argparse
import difflib
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image

OCR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sieve-ocr")


def ocr(path, min_conf=0.4, crop=None, upscale=True):
    """Recognised strings, highest-confidence first. Crops and upscales for small labels."""
    work = path
    tmp = None
    if crop or upscale:
        im = Image.open(path).convert("RGB")
        if crop:
            w, h = im.size
            x0, y0, x1, y1 = crop
            im = im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
        if upscale and max(im.size) < 1400:
            f = 1400 / max(im.size)
            im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
        tmp = tempfile.mktemp(suffix=".png")
        im.save(tmp)
        work = tmp
    try:
        r = subprocess.run([OCR, work, "--min-confidence", str(min_conf)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"sieve-label: OCR failed: {r.stderr.strip()[:200]}")
        d = json.loads(r.stdout)
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)
    return [(s["text"].strip(), s["confidence"]) for s in d["strings"]]


def norm(s):
    return "".join(c for c in s.upper() if c.isalnum() or c == " ").strip()


def best_match(target, pool):
    """Closest recognised string to a target, with a similarity ratio."""
    t = norm(target)
    best, ratio = None, 0.0
    for cand, _ in pool:
        r = difflib.SequenceMatcher(None, t, norm(cand)).ratio()
        if r > ratio:
            best, ratio = cand, r
    return best, ratio


# Diffusion models need roughly this much cap height to form distinct letterforms. Below the
# lower bound they synthesise letter-SHAPED NOISE, which is what "COONITION ELIXIR" was.
# Calibrated 2026-07-29 against a real failure: a Dialed Moods can at 11.5% of frame width put
# "COGNITION ELIXIR" at 6.3px and it garbled, while "DIALED" at 145px survived cleanly.
RENDERS_PX = 18.0
MARGINAL_PX = 10.0


def preflight(canonical, frame_w, product_frac, canonical_product_frac=0.62):
    """
    Predict which label elements can possibly render BEFORE spending on the generation.

    This is arithmetic, not judgement: text height scales linearly with how much of the frame the
    product occupies. If the answer is "impossible", no amount of prompt wording will fix it —
    the pixels are not there. Either make the product bigger or plan for it to be out of focus.
    """
    im = Image.open(canonical)
    CH = im.size[1]
    # Re-run raw to keep bounding boxes (ocr() drops them), so call the binary directly.
    d = json.loads(subprocess.run([OCR, canonical, "--min-confidence", "0.5"],
                                  capture_output=True, text=True).stdout)
    els = sorted(((s["box"]["h"] * CH, s["text"]) for s in d["strings"]), reverse=True)

    canon_product_px = im.size[0] * canonical_product_frac
    target_px = frame_w * product_frac
    scale = target_px / canon_product_px

    print(f"\nsieve-label PREFLIGHT — {os.path.basename(canonical)}\n")
    print(f"  output frame width      {frame_w}px")
    print(f"  product at              {product_frac * 100:.0f}% of frame = {target_px:.0f}px wide")
    print(f"  scale vs canonical      {scale:.3f}x\n")
    ok, marg, bad = [], [], []
    for h, t in els:
        r = h * scale
        label = t[:38]
        if r >= RENDERS_PX: ok.append((r, label))
        elif r >= MARGINAL_PX: marg.append((r, label))
        else: bad.append((r, label))
    for group, mark, rows in (("renders", "✓", ok), ("marginal", "~", marg), ("WILL GARBLE", "✗", bad)):
        for r, t in rows[:8]:
            print(f"  {mark} {r:6.1f}px  {t}")
        if len(rows) > 8: print(f"       … {len(rows) - 8} more {group}")
    # What size WOULD carry the full label?
    if bad:
        smallest = min(h for h, _ in els)
        need_scale = RENDERS_PX / smallest
        need_frac = (need_scale * canon_product_px) / frame_w
        print(f"\n  {len(bad)} element(s) cannot render at this size.")
        print(f"  Full label legibility needs the product at ~{need_frac * 100:.0f}% of frame width.")
        if need_frac > 0.55:
            print("  That is a hero product shot, not a prop. For a background product, DEFOCUS it —")
            print("  illegible-because-out-of-focus reads as real; illegible-because-garbled reads as fake.")
    else:
        print("\n  ✓ every label element has enough pixels at this size.")
    print()
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(add_help=True, usage=argparse.SUPPRESS)
    ap.add_argument("--candidate", required=False)
    ap.add_argument("--preflight", action="store_true", help="predict legibility before generating")
    ap.add_argument("--frame-w", type=int, default=1536, help="output frame width in px")
    ap.add_argument("--product-frac", type=float, default=0.35, help="intended product width as a fraction of frame")
    ap.add_argument("--canonical", help="reference image whose text is ground truth")
    ap.add_argument("--expect", help="comma-separated strings that MUST appear (use when there is no reference image)")
    ap.add_argument("--crop", help="x0,y0,x1,y1 as fractions, to isolate the product")
    ap.add_argument("--threshold", type=float, default=0.90, help="similarity below which a string counts as garbled")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    if a.preflight:
        if not a.canonical:
            sys.exit("sieve-label --preflight needs --canonical")
        sys.exit(preflight(a.canonical, a.frame_w, a.product_frac))

    if not a.candidate:
        sys.exit("sieve-label: need --candidate (or --preflight)")
    if not a.canonical and not a.expect:
        sys.exit("sieve-label: need --canonical or --expect")
    crop = tuple(float(x) for x in a.crop.split(",")) if a.crop else None

    cand = ocr(a.candidate, crop=crop)
    if a.canonical:
        # Only high-confidence canonical strings are treated as ground truth. A reference photo
        # has incidental low-confidence junk (background text, partial wraps) that must not become a rule.
        targets = [t for t, c in ocr(a.canonical) if c >= 0.9 and len(norm(t)) >= 4]
    else:
        targets = [t.strip() for t in a.expect.split(",") if t.strip()]

    results, fails = [], []
    for t in targets:
        m, r = best_match(t, cand)
        ok = r >= a.threshold
        results.append({"expected": t, "found": m, "similarity": round(r, 3), "ok": ok})
        if not ok:
            how = "MISSING" if r < 0.45 else "garbled as " + repr(m)
            fails.append(f'"{t}" -> {how} (sim {r:.2f})')

    status = "FAIL" if fails else "PASS"
    if a.json:
        print(json.dumps({"candidate": a.candidate, "status": status,
                          "checks": results, "read": [t for t, _ in cand]}, indent=2))
    else:
        print(f"\nsieve-label — {os.path.basename(a.candidate)}   ==> {status}\n")
        print("  read off the candidate:")
        for t, c in cand[:10]:
            print(f"    {c:.2f}  {t}")
        print()
        for r in results:
            mark = "✓" if r["ok"] else "✗"
            print(f"  {mark} {r['expected']!r:<34} sim {r['similarity']:.2f}"
                  + ("" if r["ok"] else f"  <- got {r['found']!r}"))
        if fails:
            print(f"\n  {len(fails)} label defect(s). Garbled type is invisible at thumbnail size and")
            print("  unusable at full size. Regenerate with the product larger in frame — small")
            print("  products do not have enough pixels for the model to hold lettering.\n")
        else:
            print("\n  ✓ all expected label text present and correctly spelled\n")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
