#!/usr/bin/env python3
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "/tmp/od_sat.png"
DST = "Flavor Badges/Approved/Orange_Dream_transparent.png"

im = Image.open(SRC).convert("RGBA")
arr = np.asarray(im).astype(np.int16)
R, G, B, A = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
bright = arr[..., :3].max(2)
warm = R - B
H, W = A.shape

# Targeted boxes (full-res coords) where leftover checker hugs the artwork edge.
# Within each box, clear only bright + fairly-neutral pixels (the checker),
# leaving warm shadow/letter pixels intact.
# In the lower band there is NO cream — only the warm letter/fruit, the letter's
# pale soft shadow, and the blended checker (now the same salmon tone as the
# shadow). Keep only the strongly-warm letter/fruit pixels; drop everything pale.
# This removes a little soft shadow under the D in exchange for a clean, fully
# checker-free edge.
boxes = [
    (540, 2880, 1800, 3300),   # curved band under the D swash + lower-left/right
]
clear = np.zeros_like(A, dtype=bool)
for x0, y0, x1, y1 in boxes:
    region = np.zeros_like(A, dtype=bool)
    region[y0:y1, x0:x1] = True
    clear |= region & (warm < 82) & (A > 0)

A2 = A.copy()
A2[clear] = 0

# light feather on the newly cut edge
bg = A2 == 0
edge = bg & ndimage.binary_dilation(~bg, iterations=2)
# (keep existing alpha elsewhere; only soften brand-new cuts handled by clear set)
arr[..., 3] = A2
Image.fromarray(arr.astype(np.uint8)).save(DST)
print(f"cleared extra {clear.sum()} px; saved {DST}")
