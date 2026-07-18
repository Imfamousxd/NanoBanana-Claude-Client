#!/usr/bin/env python3
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

GEN = sys.argv[1]
BADGE = "AI Fruit VIdeos Muha/AI fruit Muha Flavors/ARCTIC BLUEBERRY.png"
OUT = sys.argv[2]
# placement knobs (fractions of gen width/height)
WIDTH_FRAC = float(sys.argv[3]) if len(sys.argv) > 3 else 0.82
TOP_FRAC   = float(sys.argv[4]) if len(sys.argv) > 4 else 0.018

gen = Image.open(GEN).convert("RGBA")
GW, GH = gen.size

badge = Image.open(BADGE).convert("RGBA")
a = np.asarray(badge)[..., 3]
ys, xs = np.where(a > 8)
badge = badge.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
bw, bh = badge.size

tw = int(GW * WIDTH_FRAC)
th = int(bh * tw / bw)
badge = badge.resize((tw, th), Image.LANCZOS)
x = (GW - tw) // 2
y = int(GH * TOP_FRAC)

# wipe the drifted rendered badge underneath using the wall color, so nothing
# pokes out around the real badge. Sample wall color from top side strips.
arr = np.asarray(gen).astype(np.float32)
left = arr[10:y + th, 5:60, :3].reshape(-1, 3)
right = arr[10:y + th, GW - 60:GW - 5, :3].reshape(-1, 3)
wall = np.median(np.vstack([left, right]), axis=0)
band = arr.copy()
band[0:y + th + 40, :, :3] = wall  # flat wall color across the top band
band[0:y + th + 40, :, 3] = 255
# feather the bottom seam of the wiped band back into the real wall
seam = np.zeros((GH, GW), np.float32)
seam[0:y + th - 20, :] = 1.0
seam = ndimage.gaussian_filter(seam, sigma=25)[..., None]
base = (band * seam + arr * (1 - seam)).astype(np.uint8)
base = Image.fromarray(base, "RGBA")

# soft drop shadow for the poster
shadow = Image.new("RGBA", gen.size, (0, 0, 0, 0))
sh = Image.new("RGBA", badge.size, (10, 20, 40, 90))
sh.putalpha(badge.split()[3].point(lambda v: int(v * 0.45)))
shadow.paste(sh, (x + 14, y + 18), sh)
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
base = Image.alpha_composite(base, shadow)

base.paste(badge, (x, y), badge)
base.convert("RGB").save(OUT)
print(f"saved {OUT}  badge at x{x} y{y} {tw}x{th}")
