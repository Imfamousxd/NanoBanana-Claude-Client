#!/usr/bin/env python3
# Bake a soft, natural contact shadow into a transparent product PNG so it reads as a real photo
# (grounded) instead of a floating render. Shadow is semi-transparent -> shows on any background.
#   python3 nulumin-shadow.py <in.png> <out.png>
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def add_contact_shadow(inp, outp):
    im = Image.open(inp).convert("RGBA")
    a = np.asarray(im.getchannel("A"))
    H, W = a.shape
    ys, xs = np.where(a > 40)
    if len(ys) == 0:
        im.save(outp); return
    base_y = ys.max()
    top_y = ys.min()
    # horizontal extent of the vial near its base (bottom 6% of the object)
    band = ys >= (base_y - 0.06 * (base_y - top_y))
    bx = xs[band]
    base_l, base_r = bx.min(), bx.max()
    base_w = max(20, base_r - base_l)
    base_cx = (base_l + base_r) / 2.0

    # room needed below the base for the shadow
    need = int(base_w * 0.42)
    extra = max(0, need - (H - base_y) + 10)
    H2 = H + extra
    canvas = Image.new("RGBA", (W, H2), (0, 0, 0, 0))

    # shadow layer
    sh = Image.new("RGBA", (W, H2), (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    cx = base_cx + base_w * 0.06          # key light upper-left -> shadow drifts slightly right
    cy = base_y + base_w * 0.04
    # broad soft halo
    rw, rh = base_w * 0.62, base_w * 0.14
    d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=(18, 16, 22, 105))
    # darker tighter core near the contact point
    rw2, rh2 = base_w * 0.40, base_w * 0.085
    d.ellipse([cx - rw2, cy - rh2, cx + rw2, cy + rh2], fill=(14, 12, 18, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(base_w * 0.055))

    canvas.alpha_composite(sh)
    canvas.alpha_composite(im, (0, 0))    # vial on top, original position
    canvas.save(outp)
    print(f"  {outp}  base_w={base_w} canvas={canvas.size}")

if __name__ == "__main__":
    add_contact_shadow(sys.argv[1], sys.argv[2])
