#!/usr/bin/env python3
"""Strip the white interior fill from the simple ADW logo so only the ring
stroke + purple AD-W mark remain. Saves to logo simple-clean.png."""
from PIL import Image
import numpy as np

src = "ADW Assets/logo simple.png"
dst = "ADW Assets/logo simple-clean.png"

img = np.array(Image.open(src).convert("RGBA"))
h, w, _ = img.shape
cx, cy = w // 2, h // 2

# Find the ring's inner edge by scanning outward from center along +x
def is_white(px):
    return px[0] > 240 and px[1] > 240 and px[2] > 240 and px[3] > 240

inner_r = None
prev_was_white = False
for r in range(1, w // 2):
    px = img[cy, cx + r]
    cur_white = is_white(px)
    # first transition from non-white -> white = inner edge of ring
    if cur_white and not prev_was_white:
        inner_r = r - 1
        break
    prev_was_white = cur_white

if inner_r is None:
    raise RuntimeError("Could not find ring inner edge.")

print(f"Ring inner radius: {inner_r}px")

# Mask: pixels within inner_r of center that are white -> make transparent
yy, xx = np.ogrid[:h, :w]
dist2 = (xx - cx) ** 2 + (yy - cy) ** 2
inside = dist2 < inner_r * inner_r
white = (img[:, :, 0] > 240) & (img[:, :, 1] > 240) & (img[:, :, 2] > 240)
target = inside & white
print(f"Stripping {target.sum()} white interior pixels.")

img[target] = [0, 0, 0, 0]
Image.fromarray(img).save(dst)
print(f"Saved -> {dst}")
