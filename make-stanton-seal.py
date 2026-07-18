#!/usr/bin/env python3
# Render the Stanton Medical Supply seal (navy double-ring + white clinical cross) to a clean PNG
# from the brand-kit SVG geometry, so it can be used as a logo reference for generation.
from PIL import Image, ImageDraw
import os

S = 4                      # supersample factor
N = 1024                   # final size
W = N * S
k = W / 44.0               # viewBox 0..44 -> pixels
NAVY = (15, 28, 52, 255)   # #0f1c34
TEAL = (54, 184, 194, 255) # #36b8c2

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

def circle(cx, cy, r, fill=None, outline=None, width=0):
    d.ellipse([(cx-r)*k, (cy-r)*k, (cx+r)*k, (cy+r)*k], fill=fill, outline=outline, width=int(width*k))

def rrect(x, y, w, h, rad, fill):
    d.rounded_rectangle([x*k, y*k, (x+w)*k, (y+h)*k], radius=rad*k, fill=fill)

# navy disc
circle(22, 22, 21, fill=NAVY)
# teal inner ring (~0.55 opacity over navy -> use a mid teal for the ref)
circle(22, 22, 17.6, outline=(60, 150, 165, 255), width=1.0)
# white clinical cross
rrect(19.4, 12.6, 5.2, 18.8, 1.1, (255, 255, 255, 255))
rrect(12.6, 19.4, 18.8, 5.2, 1.1, (255, 255, 255, 255))

img = img.resize((N, N), Image.LANCZOS)
out_dir = "Stanton Assets"
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "stanton-seal.png")
img.save(out)
print("wrote", out)
