#!/usr/bin/env python3
# Composite the real Blue Glacier can into the v10 scene and INTEGRATE it: window-left
# relight, desk reflection, edge feather, grain + contrast match so it doesn't look pasted.
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

scene = Image.open("Dialed Moods/dialed-lifestyle-recreated-v10.jpg").convert("RGBA")
W, H = scene.size

can = Image.open("Dialed Moods L-Doba Generations/Product REfs/Blue glacier.png").convert("RGBA")
a = np.asarray(can)[..., 3]
ys, xs = np.where(a > 12)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
y1 = y0 + int((y1 - y0) * 0.90)            # trim drop-shadow ellipse
can = can.crop((x0, y0, x1 + 1, y1 + 1))
cw, ch = can.size

TARGET_H = 730
TARGET_W = round(TARGET_H * cw / ch)
can_r = can.resize((TARGET_W, TARGET_H), Image.LANCZOS)
cx_center, bottom_y = 952, 1922
px, py = cx_center - TARGET_W // 2, bottom_y - TARGET_H

rgb = np.asarray(can_r.convert("RGB")).astype(np.float32)
alpha = np.asarray(can_r.split()[3]).astype(np.float32) / 255.0

# 1) lower contrast toward the soft daylight photo (pull toward mid grey)
rgb = (rgb - 128) * 0.86 + 128 + 6
# 2) directional window light from the LEFT: bright left -> dim right
gx = np.linspace(1.12, 0.84, TARGET_W)[None, :, None]
rgb *= gx
# 3) warm bounce from the wooden desk near the bottom
gy = np.clip(np.linspace(0, 1, TARGET_H), 0, 1)[:, None, None] ** 3
warm = np.array([10, 4, -6])[None, None, :]
rgb += gy * warm
# 4) neutral-cool overall balance to match scene
rgb *= np.array([0.985, 0.995, 1.02])[None, None, :]
rgb = np.clip(rgb, 0, 255)
can_g = Image.fromarray(rgb.astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(0.9))
# feather the silhouette so edges aren't razor-cut
alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
can_g = Image.merge("RGBA", (*can_g.split(), alpha_img))

# desk reflection (flipped, faded) under the can
refl = can_g.transpose(Image.FLIP_TOP_BOTTOM)
ra = np.asarray(refl.split()[3]).astype(np.float32)
fade = np.linspace(0.28, 0.0, TARGET_H)[:, None]
refl = Image.merge("RGBA", (*refl.convert("RGB").split(),
                            Image.fromarray((ra * fade).astype(np.uint8))))
refl = refl.filter(ImageFilter.GaussianBlur(4))

# contact shadow
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).ellipse(
    [cx_center - int(TARGET_W * 0.62), bottom_y - 24, cx_center + int(TARGET_W * 0.62), bottom_y + 40],
    fill=(18, 12, 6, 165))
shadow = shadow.filter(ImageFilter.GaussianBlur(20))

out = Image.alpha_composite(scene, shadow)
out.alpha_composite(refl, (px, bottom_y - 6))
out.alpha_composite(can_g, (px, py))

# unify with photo grain
o = np.asarray(out.convert("RGB")).astype(np.float32)
o += np.random.default_rng(11).normal(0, 3.6, (H, W, 1)).astype(np.float32)
Image.fromarray(np.clip(o, 0, 255).astype(np.uint8)).save(
    "Dialed Moods/dialed-lifestyle-FINAL.jpg", quality=95)
print("saved Dialed Moods/dialed-lifestyle-FINAL.jpg")
