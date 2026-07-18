#!/usr/bin/env python3
# Deterministic background cleanup for the 10ml vials: whiten the studio backdrop to pure
# white (its intended color) while leaving the vial, its reflection, and the base contact
# shadow untouched. White-on-white => no visible "pasted" edge.
#
# Strategy: find the vial's horizontal extent (central column-run, incl. the wider cap) and
# the cap top. Whiten (a) everything ABOVE the cap and (b) the LEFT/RIGHT side fields outside
# the vial, but ONLY above y=0.80H so the base shadow/reflection band is fully preserved.
# Feather the inner edges so there is no hard line.
#
# Usage: python3 nh-clean-bg.py SRC.jpg DST.jpg

import sys
import numpy as np
from PIL import Image

def central_run(qual, center, gap_tol):
    n = len(qual)
    if not qual.any():
        return int(0.30*n), int(0.70*n)
    l = center
    while l > 0 and (qual[l-1] or np.any(qual[max(0, l-1-gap_tol):l])):
        l -= 1
    r = center
    while r < n-1 and (qual[r+1] or np.any(qual[r+1:min(n, r+2+gap_tol)])):
        r += 1
    return l, r

def clean(src, dst):
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.float32)
    H, W, _ = arr.shape
    gray = arr.mean(axis=2)

    col = (gray < 210).sum(axis=0)
    qual = col > 0.15 * H
    left, right = central_run(qual, W // 2, gap_tol=int(0.04 * W))
    central_row = (gray[:, int(0.30*W):int(0.70*W)] < 210).sum(axis=1)
    qr = np.where(central_row > 0.05 * (0.40*W))[0]
    cap_top = int(qr[0]) if len(qr) else int(0.10 * H)

    mX = int(0.012 * W)        # keep a small margin around the vial
    feather = int(0.018 * W)
    ml = max(0, left - mX)
    mr = min(W, right + mX)
    yt = max(0, cap_top - int(0.012 * H))
    y_side = int(0.80 * H)     # below this, preserve everything (base shadow + reflection)

    # build a "whiten weight" map in [0,1]; 1 = force white, 0 = keep original
    w = np.zeros((H, W), np.float32)
    w[:yt, :] = 1.0                          # above the cap
    w[:y_side, :ml] = 1.0                    # left side field
    w[:y_side, mr:] = 1.0                    # right side field
    # feather the inner vertical edges (ml and mr) so there's no hard seam
    for i in range(feather):
        a = 1.0 - (i + 1) / (feather + 1)
        xl = ml + i
        if xl < W: w[:y_side, xl] = np.maximum(w[:y_side, xl], a)
        xr = mr - 1 - i
        if 0 <= xr: w[:y_side, xr] = np.maximum(w[:y_side, xr], a)
    # feather the horizontal cap edge
    for i in range(feather):
        a = 1.0 - (i + 1) / (feather + 1)
        yy = yt + i
        if yy < H: w[yy, :] = np.maximum(w[yy, :], a)
    # soft vertical taper of the side fields as they approach y_side
    taper = int(0.05 * H)
    for i in range(taper):
        yy = y_side - 1 - i
        if yy < 0: break
        a = (i + 1) / (taper + 1)
        w[yy, :ml] *= a
        w[yy, mr:] *= a

    # only actually whiten pixels that are at least slightly off-white (don't touch true white;
    # never touch dark vial pixels even if mask leaked)
    off = (gray < 251) & (gray > 120)   # smudge/haze range
    w = w * off.astype(np.float32)

    w3 = w[:, :, None]
    out = arr * (1 - w3) + 255.0 * w3
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=97)
    print(f"cleaned -> {dst}  (vial x[{left}..{right}] capTop {cap_top})")

if __name__ == "__main__":
    clean(sys.argv[1], sys.argv[2])
