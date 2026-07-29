#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
BRIGHT = int(sys.argv[3]) if len(sys.argv) > 3 else 165   # checker pixels are brighter than this
SAT    = int(sys.argv[4]) if len(sys.argv) > 4 else 22    # ...and lower saturation than this

im = Image.open(src).convert("RGB")
arr = np.asarray(im).astype(np.int16)
mx = arr.max(2); mn = arr.min(2)
sat = mx - mn
bright = mx

# "checkerboard background" candidate: bright & near-grey (low saturation)
bgish = (bright >= BRIGHT) & (sat <= SAT)

# the GREY checker squares (~180) are unique to the checkerboard — cream/white
# highlights in the artwork are brighter and never sit next to a 180-grey square.
grey_sq = (sat <= SAT) & (bright >= 150) & (bright <= 212)
# any bgish pixel within ~80px (>1 square) of a grey square is checkerboard,
# whether it's the outer background OR a pocket trapped between elements.
dist = ndimage.distance_transform_edt(~grey_sq)
near_checker = dist <= 80
bg = bgish & near_checker

# tidy up: close 1px gaps
bg = ndimage.binary_closing(bg, iterations=1)

# texture pass: residual orange-tinted checker still reads as low/medium
# saturation but has strong light/dark alternation at the ~47px square scale.
# Cream is smooth (low local contrast). Catch bright, not-too-saturated pixels
# that sit in a high-local-contrast neighbourhood.
loc_rng = ndimage.maximum_filter(bright, size=51) - ndimage.minimum_filter(bright, size=51)
checker_tex = (~bg) & (bright >= 150) & (sat <= 60) & (loc_rng >= 55)
# only trust texture hits that are near known background (avoids nibbling the
# busy interior of the artwork)
near_bg = ndimage.binary_dilation(bg, iterations=70)
bg = bg | (checker_tex & near_bg)
bg = ndimage.binary_closing(bg, iterations=1)

# eat the stippled anti-alias fringe: grow transparency into adjacent
# still-bright, still-low-saturation blend pixels. Saturated orange (sat>60)
# and warm cream (sat~70) block the growth, so only checker-fringe is removed.
fringe_ok = (bright >= 150) & (sat <= 58)
for _ in range(3):
    grown = ndimage.binary_dilation(bg, iterations=1) & fringe_ok
    bg = bg | grown

# final: remove small grey/low-sat specks that sit AGAINST the background
# (stray checker remnants). Specks must touch bg, so white highlights enclosed
# inside the artwork (popsicle bites, orange specular) are left untouched.
speck = (~bg) & (bright >= 150) & (sat <= 45)
slbl, sn = ndimage.label(speck)
if sn:
    bg_adj = ndimage.binary_dilation(bg, iterations=3)
    touching = set(np.unique(slbl[bg_adj & (slbl > 0)]))
    ssz = ndimage.sum(np.ones_like(slbl), slbl, range(1, sn + 1))
    drop = {i + 1 for i, s in enumerate(ssz) if s < 4000 and (i + 1) in touching}
    if drop:
        bg = bg | np.isin(slbl, list(drop))

alpha = np.where(bg, 0, 255).astype(np.float32)

# feather a 2px transition so edges aren't jagged
edge = bg & ndimage.binary_dilation(~bg, iterations=2)
# in the band, ramp alpha by how non-grey / how dark the pixel is
score = np.clip((sat.astype(np.float32) / SAT) , 0, 1)
score = np.maximum(score, np.clip((BRIGHT - bright).astype(np.float32) / 30.0, 0, 1))
alpha[edge] = (score[edge] * 255)

alpha = np.clip(alpha, 0, 255).astype(np.uint8)
out = np.dstack([arr.astype(np.uint8), alpha])
Image.fromarray(out).save(dst)
print(f"saved {dst}  cleared {bg.mean()*100:.1f}% transparent  (BRIGHT>{BRIGHT}, SAT<{SAT})")
