#!/usr/bin/env python3
# Build an inpaint mask for the trio image using estimated rectangular regions
# for each can's interior body. Transparent = edit, opaque = preserve.

from PIL import Image, ImageDraw
import numpy as np

SRC = "Dialed Moods L-Doba Generations/Trio/trio-cans.png"
DST = "Dialed Moods L-Doba Generations/Trio/trio-mask.png"

img = Image.open(SRC).convert("RGB")
W, H = img.size
print(f"Source: {W}x{H}")

# Build fully-opaque mask, then carve transparent rectangles over each can body.
# Rectangles are inside each can — just the WHITE BODY area between the colored
# top cap+banner and the colored bottom band+text, narrower than the can outline.
mask = Image.new("RGBA", (W, H), (255, 255, 255, 255))
draw = ImageDraw.Draw(mask)

def carve(x0_frac, y0_frac, x1_frac, y1_frac):
    box = (int(W * x0_frac), int(H * y0_frac), int(W * x1_frac), int(H * y1_frac))
    draw.rectangle(box, fill=(0, 0, 0, 0))
    print(f"  carved {box}")

# LEMONADE (front-center, biggest can)
# Body interior between yellow top banner and yellow bottom band
carve(0.395, 0.165, 0.595, 0.770)

# BLACK CHERRY VANILLA (back-left)
# Body interior between magenta banner and magenta bottom band
carve(0.140, 0.235, 0.320, 0.760)

# BLUE GLACIER (back-right)
# Body interior between cyan banner and cyan bottom band
carve(0.680, 0.235, 0.860, 0.760)

mask.save(DST)
print(f"✓ Saved: {DST}")
