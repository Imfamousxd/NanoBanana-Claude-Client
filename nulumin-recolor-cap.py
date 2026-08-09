#!/usr/bin/env python3
"""Normalize a NuLumin cap to ONE exact target color while keeping its natural
shading/relief — so a family of caps (e.g. all the blues) matches exactly.

NB cannot hold an exact cap hex (proven on the Glow/Klow work), so this is a
brand color-normalization finishing step: mask the colored cap disc (saturated,
hue-matched pixels in the top band — the grey aluminum ring and clear glass are
excluded by low saturation) and re-tint those pixels to the target color,
modulated by each pixel's own luminance so highlights/shadow relief survive.

Usage:
  python3 nulumin-recolor-cap.py <in.png> <out.png> <hexTarget> [hueLo hueHi]
    hueLo/hueHi in degrees (0-360) restrict which existing hue gets recolored
    (default 170-260 = blues). Keeps non-matching caps/labels untouched.
"""
import sys
import numpy as np
from PIL import Image
import colorsys


def main(inp, outp, hex_target, hue_lo=170.0, hue_hi=260.0):
    tr, tg, tb = (int(hex_target.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    im = Image.open(inp).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-6)

    # hue in degrees (vectorized HSV hue)
    rng = np.maximum(mx - mn, 1e-6)
    hue = np.zeros_like(mx)
    ri, gi, bi = (mx == r), (mx == g), (mx == b)
    hue[ri] = ((g - b) / rng)[ri] % 6
    hue[gi] = ((b - r) / rng)[gi] + 2
    hue[bi] = ((r - g) / rng)[bi] + 4
    hue = (hue * 60) % 360

    band = np.zeros((H, W), bool)
    band[: int(H * 0.26), :] = True              # cap sits in the top quarter
    colored = (sat > 0.18) & (mx > 60)           # exclude grey aluminum ring + clear glass
    inhue = (hue >= hue_lo) & (hue <= hue_hi)
    mask = band & colored & inhue
    if mask.sum() < 50:
        im.save(outp)
        print(f"  (no matching cap found) copied: {outp}")
        return

    # Matte relief: compress the luminance variation toward flat so the cap reads
    # MATTE (no metallic specular). RELIEF_K<1 squashes highlights/shadows; tight clip.
    RELIEF_K = 0.45
    L = 0.299 * r + 0.587 * g + 0.114 * b
    raw = L / max(L[mask].mean(), 1e-6)
    shading = np.clip(1.0 + (raw - 1.0) * RELIEF_K, 0.84, 1.13)
    out = a.copy()
    for ch, tv in zip(range(3), (tr, tg, tb)):
        out[..., ch] = np.where(mask, np.clip(tv * shading, 0, 255), out[..., ch])
    Image.fromarray(out.astype("uint8")).save(outp)
    print(f"  recolored cap -> #{tr:02X}{tg:02X}{tb:02X}: {outp}  ({int(mask.sum())} px)")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    args = sys.argv[1:]
    lo, hi = (float(args[3]), float(args[4])) if len(args) >= 5 else (170.0, 260.0)
    main(args[0], args[1], args[2], lo, hi)
