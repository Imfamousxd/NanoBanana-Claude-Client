#!/usr/bin/env python3
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "Flavor Badges/Orange_Dream_galaxy_v1.jpg"
DST = "Flavor Badges/Orange_Galaxy_white.png"

im = Image.open(SRC).convert("RGB")
arr = np.asarray(im).astype(np.float32)
R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
bright = arr.max(2); mn = arr.min(2)
sat = bright - mn
warm = R - B

# "content" = the galaxy glow / text / planets / stars. All are warm (orange) or
# saturated or quite bright-warm. The checker (neutral, warm~0, sat~0) is NOT.
content = (sat >= 40) | ((warm >= 32) & (bright >= 110)) | (bright >= 250)

# clean up: close small gaps so the galaxy oval is solid, drop tiny neutral specks
content = ndimage.binary_closing(content, iterations=3)
content = ndimage.binary_opening(content, iterations=1)
# keep the big galaxy blob + any sizable planet blobs (drop noise specks)
lbl, n = ndimage.label(content)
sz = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
keep_lbls = {i + 1 for i, s in enumerate(sz) if s > 2500}
content = np.isin(lbl, list(keep_lbls))
# fill interior holes (stars/dark gaps inside the galaxy) so we keep original there
content = ndimage.binary_fill_holes(content)

# soft alpha with a feathered edge
alpha = ndimage.gaussian_filter(content.astype(np.float32), sigma=2.0)
alpha = np.clip(alpha, 0, 1)[..., None]

white = np.full_like(arr, 255.0)
out = arr * alpha + white * (1 - alpha)
Image.fromarray(out.astype(np.uint8)).save(DST)
print(f"saved {DST}  content {content.mean()*100:.1f}%")
