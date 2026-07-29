#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src = sys.argv[1]
dst = sys.argv[2]
# whiteness threshold: pixels brighter than this (all channels) count as "background-white"
thr = int(sys.argv[3]) if len(sys.argv) > 3 else 238

im = Image.open(src).convert("RGB")
arr = np.asarray(im).astype(np.int16)
R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]

# near-white mask
white = (R >= thr) & (G >= thr) & (B >= thr)

# connected components of white; keep only those touching the border
lbl, n = ndimage.label(white)
border_labels = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
border_labels.discard(0)
bg = np.isin(lbl, list(border_labels))

# Build alpha. Fully transparent where bg-white; opaque elsewhere.
alpha = np.where(bg, 0, 255).astype(np.uint8)

# Soft edge: feather a few px so the cut isn't jagged, using brightness ramp
# only in the transition band (bg pixels adjacent to opaque content).
H, W = alpha.shape
bright = (R + G + B) / 3.0
# distance-based feather: dilate bg edge inward by 1px partial alpha
edge = bg & ndimage.binary_dilation(~bg, iterations=2)
ramp = np.clip((255 - bright) / 22.0, 0, 1)  # whiter -> more transparent
alpha_f = alpha.astype(np.float32)
alpha_f[edge] = (ramp[edge] * 255).astype(np.float32)
alpha = np.clip(alpha_f, 0, 255).astype(np.uint8)

out = np.dstack([arr.astype(np.uint8), alpha])
Image.fromarray(out, "RGBA").save(dst)
print(f"saved {dst}  ({W}x{H})  cleared {bg.mean()*100:.1f}% as transparent")
