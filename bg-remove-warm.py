#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
BRIGHT = int(sys.argv[3]) if len(sys.argv) > 3 else 158
WARM   = int(sys.argv[4]) if len(sys.argv) > 4 else 35   # R-B; checker~0, cream~70, orange~180

im = Image.open(src).convert("RGB")
arr = np.asarray(im).astype(np.int16)
R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
bright = arr.max(2)
warm = R - B

# checkerboard background = bright AND neutral/cool (low warmth). Cream (warm~70)
# and orange (warm~180) are excluded cleanly regardless of brightness.
bgish = (bright >= BRIGHT) & (warm <= WARM)

# remove background connected to the image border (outer bg + any bays/pockets
# that open to it). Specular highlights fully enclosed by artwork stay opaque.
lbl, _ = ndimage.label(bgish)
border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1]); border.discard(0)
bg = np.isin(lbl, list(border))

# also clear any fully-enclosed bgish pocket that is genuine checkerboard,
# identified by neutral tone over a sizable area (highlights are tiny).
enclosed = bgish & ~bg
elbl, en = ndimage.label(enclosed)
if en:
    esz = ndimage.sum(np.ones_like(elbl), elbl, range(1, en + 1))
    big = {i + 1 for i, s in enumerate(esz) if s > 1500}
    if big:
        bg = bg | np.isin(elbl, list(big))

bg = ndimage.binary_closing(bg, iterations=1)

# eat the anti-alias fringe: grow into adjacent bright, neutral blend pixels.
fringe_ok = (bright >= 150) & (warm <= 50)
for _ in range(3):
    bg = bg | (ndimage.binary_dilation(bg, iterations=1) & fringe_ok)

alpha = np.where(bg, 0, 255).astype(np.float32)
edge = bg & ndimage.binary_dilation(~bg, iterations=2)
ramp = np.clip(warm.astype(np.float32) / max(WARM, 1), 0, 1)
ramp = np.maximum(ramp, np.clip((BRIGHT - bright).astype(np.float32) / 30.0, 0, 1))
alpha[edge] = ramp[edge] * 255
alpha = np.clip(alpha, 0, 255).astype(np.uint8)

out = np.dstack([arr.astype(np.uint8), alpha])
Image.fromarray(out).save(dst)
print(f"saved {dst}  cleared {bg.mean()*100:.1f}% transparent  (BRIGHT>{BRIGHT} WARM<{WARM})")
