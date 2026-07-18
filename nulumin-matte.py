#!/usr/bin/env python3
# Cut out a NuLumin white-BG vial to a transparent PNG with a SOLID/OPAQUE vial silhouette
# (glass filled, not see-through), so it reads the same on ANY background — the standard
# e-commerce product-cutout look. Keeps the original pixels/colours; only the surround goes clear.
#   python3 nulumin-matte.py <in_white.png> <out_transparent.png>
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from rembg import remove, new_session

_SESS = new_session("isnet-general-use")

def matte(inp, outp):
    orig = Image.open(inp).convert("RGB")
    W, H = orig.size
    cut = remove(orig.convert("RGBA"), session=_SESS, post_process_mask=True)
    a = np.asarray(cut.getchannel("A"))
    m = a > 40
    m = ndimage.binary_fill_holes(m)                 # fill see-through glass -> solid silhouette
    m = ndimage.binary_opening(m, iterations=2)       # drop stray specks
    # keep only the largest connected component (the vial)
    lbl, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n+1))
        m = lbl == (int(np.argmax(sizes)) + 1)
    er = max(2, round(W * 0.0018))                    # erode the white fringe (~7px @4096)
    m = ndimage.binary_erosion(m, iterations=er)
    mask = Image.fromarray((m * 255).astype("uint8"))
    mask = mask.filter(ImageFilter.GaussianBlur(max(1.0, W * 0.0009)))  # soft anti-aliased edge
    out = orig.convert("RGBA"); out.putalpha(mask)
    out.save(outp)
    return out.size

if __name__ == "__main__":
    print("saved", matte(sys.argv[1], sys.argv[2]))
