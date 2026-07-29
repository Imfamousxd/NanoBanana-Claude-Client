#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
BRIGHT = int(sys.argv[3]) if len(sys.argv) > 3 else 158
SAT    = int(sys.argv[4]) if len(sys.argv) > 4 else 38
CLOSE  = int(sys.argv[5]) if len(sys.argv) > 5 else 18

im = Image.open(src).convert("RGB")
arr = np.asarray(im).astype(np.int16)
mx = arr.max(2); mn = arr.min(2)
sat = mx - mn; bright = mx

# background-checker = bright AND low saturation. Everything else is artwork
# (saturated orange OR warm cream, which has sat ~70).
bgish = (bright >= BRIGHT) & (sat <= SAT)
art = ~bgish

# Close small gaps so thin checker lines between nearby elements are bridged and
# concave "bays" of background become enclosed; then fill all enclosed checker.
art_c = ndimage.binary_closing(art, structure=np.ones((3, 3)), iterations=CLOSE)
filled = ndimage.binary_fill_holes(art_c)

# Drop background that the closing artificially added back: keep a pixel opaque
# only if it's filled AND (original art OR was an enclosed hole, i.e. filled but
# not part of the outer background). Outer background = bgish reachable from border.
lbl, _ = ndimage.label(bgish)
border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1]); border.discard(0)
outer = np.isin(lbl, list(border))
keep = filled & ~outer

# remove tiny isolated opaque specks (noise)
klbl, kn = ndimage.label(keep)
sizes = ndimage.sum(np.ones_like(klbl), klbl, range(1, kn + 1))
small = {i + 1 for i, s in enumerate(sizes) if s < 40}
if small:
    keep &= ~np.isin(klbl, list(small))

alpha = np.where(keep, 255, 0).astype(np.float32)
# feather 2px at the boundary for clean anti-aliased edges
edge = (~keep) & ndimage.binary_dilation(keep, iterations=2)
ramp = np.clip((sat.astype(np.float32) / SAT), 0, 1)
ramp = np.maximum(ramp, np.clip((BRIGHT - bright).astype(np.float32) / 30.0, 0, 1))
alpha[edge] = ramp[edge] * 255
alpha = np.clip(alpha, 0, 255).astype(np.uint8)

out = np.dstack([arr.astype(np.uint8), alpha])
Image.fromarray(out).save(dst)
print(f"saved {dst}  opaque {keep.mean()*100:.1f}%  (BRIGHT>{BRIGHT} SAT<{SAT} CLOSE={CLOSE})")
