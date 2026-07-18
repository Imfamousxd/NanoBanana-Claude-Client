#!/usr/bin/env python3
# Build per-product contact sheets for fast human verification of the 10ml set.
# Each sheet: 9 rows (one per cap color). Each row = [ 5ml twin | 10ml | zoomed dose-line crop of 10ml ].
# So you can eyeball, in one glance per product: framing match, clean bg, and that "10 ml" reads right.
# Output: nh-10ml-sheets/<Product>.jpg
# Usage: python3 nh-10ml-sheets.py

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = "Noble Harbor Wholesale"
OUT = "nh-10ml-sheets"
COLORS = ["navy","black","white","red","green","babyblue","yellow","pink","purple"]
TH = 300                      # thumbnail height
PAD = 14
LABELW = 150
FONT = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 30, index=1)
HFONT = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 40, index=1)

def thumb(path, h=TH):
    im = Image.open(path).convert("RGB")
    w = int(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)

def dose_crop(path, h=TH):
    # generous lower-center label band: captures product name + 'xx mg · 10 ml' + compliance
    im = Image.open(path).convert("RGB")
    W, H = im.size
    c = im.crop((int(0.24*W), int(0.60*H), int(0.80*W), int(0.785*H)))
    w = int(c.width * h / c.height)
    return c.resize((w, h), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
products = sorted([d for d in os.listdir(ROOT)
                   if os.path.isdir(os.path.join(ROOT, d)) and not d.startswith("_")])

for product in products:
    stem = product.replace(" ", "_")
    rows_imgs = []
    for c in COLORS:
        cand = os.path.join(ROOT, product, f"{stem}_10ml_{c}.jpg")
        twin = os.path.join(ROOT, product, f"{stem}_5ml_{c}.jpg")
        if not os.path.exists(cand):
            continue
        t5 = thumb(twin) if os.path.exists(twin) else None
        t10 = thumb(cand)
        dc = dose_crop(cand)
        rows_imgs.append((c, t5, t10, dc))
    if not rows_imgs:
        continue

    col5w = max((r[1].width if r[1] else 0) for r in rows_imgs)
    col10w = max(r[2].width for r in rows_imgs)
    colcw = max(r[3].width for r in rows_imgs)
    rowh = TH + PAD
    sheetw = LABELW + col5w + col10w + colcw + PAD * 5
    sheeth = 70 + rowh * len(rows_imgs) + PAD
    sheet = Image.new("RGB", (sheetw, sheeth), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 16), f"{product}    [ 5ml | 10ml | dose-zoom ]", font=HFONT, fill=(0, 0, 0))

    y = 70
    for (c, t5, t10, dc) in rows_imgs:
        d.text((PAD, y + TH // 2 - 16), c, font=FONT, fill=(40, 40, 40))
        x = LABELW
        if t5: sheet.paste(t5, (x, y));
        x += col5w + PAD
        sheet.paste(t10, (x, y)); x += col10w + PAD
        sheet.paste(dc, (x, y))
        # divider line under each row
        d.line((PAD, y + rowh - PAD // 2, sheetw - PAD, y + rowh - PAD // 2), fill=(225, 225, 225), width=1)
        y += rowh

    sheet.save(os.path.join(OUT, f"{stem}.jpg"), quality=92)
    print(f"  {product}: {len(rows_imgs)} rows -> {OUT}/{stem}.jpg")

print(f"\nDone. {len(products)} sheets in {OUT}/")
