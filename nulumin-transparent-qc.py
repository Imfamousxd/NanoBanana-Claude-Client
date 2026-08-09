#!/usr/bin/env python3
# QC the NuLumin transparent shots: verify each is RGBA with transparent corners + opaque vial,
# and build a checkerboard contact sheet for visual review.
import os, glob
from PIL import Image

D = "NuLumin Generated/Transparent"
files = sorted(glob.glob(os.path.join(D, "NuL_*_transparent.png")))
print(f"checking {len(files)} transparent shots")
bad = []
for f in files:
    im = Image.open(f)
    rgba = im.convert("RGBA"); W, H = rgba.size
    corners = [rgba.getpixel(p)[3] for p in [(2,2),(W-3,2),(2,H-3),(W-3,H-3)]]
    center = rgba.getpixel((W//2, H//2))[3]
    ok = (im.mode == "RGBA") and (max(corners) <= 8) and (center >= 200)
    if not ok:
        bad.append((os.path.basename(f), im.mode, max(corners), center))
        print(f"  ⚠ {os.path.basename(f)}: mode={im.mode} maxCorner={max(corners)} center={center}")
print(f"clean: {len(files)-len(bad)}/{len(files)}   flagged: {len(bad)}")

# ---- checkerboard contact sheet ----
if files:
    cols = 6; rows = (len(files) + cols - 1)//cols
    cw, ch = 340, 470; pad = 12
    s = 22
    W = cols*cw + (cols+1)*pad; H = rows*ch + (rows+1)*pad
    sheet = Image.new("RGB", (W, H), (245,245,247))
    def checker(w, h):
        bg = Image.new("RGBA", (w, h)); px = bg.load()
        for y in range(h):
            for x in range(w):
                px[x,y] = (206,206,211,255) if ((x//s+y//s)%2==0) else (232,232,236,255)
        return bg
    from PIL import ImageDraw
    dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        r, c = divmod(i, cols)
        x0 = pad + c*(cw+pad); y0 = pad + r*(ch+pad)
        cell = checker(cw, ch-26)
        im = Image.open(f).convert("RGBA"); im.thumbnail((cw-16, ch-26-16))
        ox = (cw - im.width)//2; oy = (ch-26 - im.height)//2
        cell.alpha_composite(im, (ox, oy))
        sheet.paste(cell.convert("RGB"), (x0, y0))
        dr.text((x0+6, y0+ch-22), os.path.basename(f).replace("NuL_","").replace("_transparent.png",""), fill=(40,40,45))
    out = os.path.join(D, "_contact_sheet_transparent.png")
    sheet.save(out)
    print("contact sheet ->", out, sheet.size)
