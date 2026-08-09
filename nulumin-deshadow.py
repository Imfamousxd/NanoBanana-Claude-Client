#!/usr/bin/env python3
"""Remove the faint contact shadow from NuLumin natural white-bg vial shots while
keeping the natural soft glass edges (NOT a clinical hard cut-out).

Matte the vial with rembg (which captures the vial object, NOT its shadow), then
alpha-composite it onto a uniform canvas filled with the shot's OWN sampled soft
white (from the shadow-free top corners) — so the background becomes perfectly
even (shadow gone) but keeps the warm natural tone, and the vial keeps its soft
anti-aliased edges. Also normalizes size + placement (height == TARGET_H_FRAC,
dead-center) so the whole set stays uniform.

Usage:
  python3 nulumin-deshadow.py <in_dir> <out_dir>      # whole folder
  python3 nulumin-deshadow.py <in.png> <out.png>      # single file
"""
import os
import sys
import numpy as np
from PIL import Image

os.environ.setdefault("U2NET_HOME", os.path.expanduser("~/.u2net"))
from rembg import remove, new_session  # noqa: E402

CANVAS = 4096
TARGET_H_FRAC = 0.78
ALPHA_BBOX = 16
MODEL = "isnet-general-use"
_SESS = {}


def session():
    if MODEL not in _SESS:
        _SESS[MODEL] = new_session(MODEL)
    return _SESS[MODEL]


def top_bg(a):
    """Sample the clean background from the shadow-free top corners."""
    s = max(10, min(a.shape[:2]) // 30)
    patch = np.concatenate([a[:s, :s].reshape(-1, 3), a[:s, -s:].reshape(-1, 3)])
    return np.median(patch, axis=0)


def deshadow(inp, outp):
    im = Image.open(inp).convert("RGB")
    a = np.asarray(im)
    # FIXED_BG="r,g,b" snaps every shot to ONE identical soft-white; else per-image tone.
    if os.environ.get("FIXED_BG"):
        bg = tuple(int(v) for v in os.environ["FIXED_BG"].split(","))
    else:
        bg = tuple(int(v) for v in top_bg(a))

    cut = remove(
        im.convert("RGBA"), session=session(),
        alpha_matting=True, alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=12, alpha_matting_erode_size=6,
        post_process_mask=True,
    )
    arr = np.asarray(cut)
    ys, xs = np.where(arr[..., 3] > ALPHA_BBOX)
    if len(ys) == 0:
        Image.new("RGB", (CANVAS, CANVAS), bg).save(outp)
        return
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    vial = cut.crop((x0, y0, x1, y1))

    target_h = int(round(CANVAS * TARGET_H_FRAC))
    scale = target_h / vial.height
    vial = vial.resize((max(1, int(round(vial.width * scale))), target_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), bg + (255,))
    canvas.alpha_composite(vial, ((CANVAS - vial.width) // 2, (CANVAS - vial.height) // 2))
    canvas.convert("RGB").save(outp)


def main(inp, outp):
    if os.path.isdir(inp):
        os.makedirs(outp, exist_ok=True)
        files = sorted(f for f in os.listdir(inp) if f.lower().endswith(".png"))
        print(f"=== de-shadow {len(files)} file(s) ===")
        for i, f in enumerate(files, 1):
            base = os.path.splitext(f)[0]
            try:
                deshadow(os.path.join(inp, f), os.path.join(outp, f"{base}_white.png"))
                print(f"  [{i}/{len(files)}] OK  {base}_white.png")
            except Exception as e:  # noqa: BLE001
                print(f"  [{i}/{len(files)}] FAIL {f}: {e}")
        print("Done.")
    else:
        deshadow(inp, outp)
        print(f"  de-shadowed: {outp}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
