#!/usr/bin/env python3
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "Flavor Badges/Orange_Galaxy_v2a_chunky.jpg"
DST = "Flavor Badges/Orange_Galaxy_v2a_white.png"

im = Image.open(SRC).convert("RGB")
arr = np.asarray(im).astype(np.float32)
bright = arr.max(2); mn = arr.min(2)
sat = bright - mn

# The galaxy/text/planets are ALL either colorful (orange) or dark. The checker
# (grey ~211 + white 255) is neutral & light. Build a solid content blob and put
# everything else on pure white; then force ANY residual neutral pixel to white.
content = (sat >= 30) | (bright <= 150)
content = ndimage.binary_closing(content, iterations=5)
content = ndimage.binary_fill_holes(content)
# keep the galaxy blob + sizable planet/star blobs; drop checker speckle
lbl, n = ndimage.label(content)
sz = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
content = np.isin(lbl, [i + 1 for i, s in enumerate(sz) if s > 1500])

alpha = ndimage.gaussian_filter(content.astype(np.float32), sigma=2.0)
alpha = np.clip(alpha, 0, 1)[..., None]

white = np.full_like(arr, 255.0)
out = arr * alpha + white * (1 - alpha)

# absolute guarantee: kill any neutral checker pixel that survived, anywhere.
out_b = out.max(2); out_s = out.max(2) - out.min(2)
neutral = (out_s < 20) & (out_b >= 150)
out[neutral] = 255.0

Image.fromarray(out.astype(np.uint8)).save(DST)
print(f"saved {DST}  content {content.mean()*100:.1f}%")
