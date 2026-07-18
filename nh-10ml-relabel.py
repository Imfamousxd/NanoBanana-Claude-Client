#!/usr/bin/env python3
# Deterministic 5ml -> 10ml relabel.
# Keeps the original photo 100% intact and overwrites ONLY the dose/volume line,
# changing "xx mg · 5 ml" -> "xx mg · 10 ml" in matching Helvetica Neue Bold.
#
# Usage: python3 nh-10ml-relabel.py SRC.jpg DST.jpg [--debug]
#   --debug also writes DST with a red box around the detected dose line.

import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"
BOLD_IDX = 1
NEW_LINE = "xx mg · 10 ml"   # middle dot U+00B7

def main():
    src, dst = sys.argv[1], sys.argv[2]
    debug = "--debug" in sys.argv[3:]

    img = Image.open(src).convert("RGB")
    W, H = img.size
    arr = np.asarray(img).astype(np.int16)
    gray = arr.mean(axis=2)
    # Saturation proxy: max channel - min channel (0..255). Low => neutral grey.
    sat = arr.max(axis=2) - arr.min(axis=2)

    # "ink" = neutral grey, medium-dark luminance. Excludes white label, colored caps/bars,
    # the grey/white accent bar (too light), and the black bar (too dark).
    ink_full = (sat < 45) & (gray >= 25) & (gray <= 180)

    # Search region where the label text block lives (excludes cap above, bar/lot/base below)
    sx0, sx1 = int(0.18 * W), int(0.82 * W)
    sy0, sy1 = int(0.45 * H), int(0.79 * H)
    ink = np.zeros_like(ink_full)
    ink[sy0:sy1, sx0:sx1] = ink_full[sy0:sy1, sx0:sx1]

    row_counts = ink.sum(axis=1)
    min_row = max(6, int(0.010 * (sx1 - sx0)))
    rows = np.where(row_counts > min_row)[0]
    if len(rows) == 0:
        print("ERR: no text rows detected"); sys.exit(2)

    # Group rows into line-bands (small gap tolerance so name & dose stay separate)
    gap_tol = max(4, int(0.004 * H))
    bands = []
    cur = [rows[0]]
    for y in rows[1:]:
        if y - cur[-1] <= gap_tol:
            cur.append(y)
        else:
            bands.append((cur[0], cur[-1])); cur = [y]
    bands.append((cur[0], cur[-1]))

    def metrics(b):
        by0, by1 = b[0], b[1]
        mask = ink[by0:by1 + 1, :]
        cols = mask.sum(axis=0)
        xs = np.where(cols > 0)[0]
        if len(xs) == 0:
            return None
        return dict(y0=by0, y1=by1, h=by1 - by0,
                    x0=xs[0], x1=xs[-1], area=int(mask.sum()))

    ms = [m for m in (metrics(b) for b in bands) if m]
    if len(ms) < 2:
        print("ERR: fewer than 2 text bands"); sys.exit(2)

    # Product name = the largest-area text band; dose line = nearest band below it
    name = max(ms, key=lambda m: m["area"])
    below = [m for m in ms if m["y0"] > name["y1"] and (m["y0"] - name["y1"]) < name["h"]]
    if not below:
        print("ERR: no dose band below product name"); sys.exit(2)
    dose = min(below, key=lambda m: m["y0"])

    cx = (dose["x0"] + dose["x1"]) / 2.0
    dose_h = dose["y1"] - dose["y0"]
    dose_w = dose["x1"] - dose["x0"]

    # Sample text color (dark px) and label white (light px) inside the dose bbox
    pad = max(4, int(0.10 * dose_h))
    rx0, ry0 = max(0, dose["x0"] - pad), max(0, dose["y0"] - pad)
    rx1, ry1 = min(W, dose["x1"] + pad), min(H, dose["y1"] + pad)
    region = arr[ry0:ry1, rx0:rx1]
    rgray = region.mean(axis=2)
    txt_px = region[rgray < 150]
    wht_px = region[rgray > 225]
    txt_color = tuple(int(c) for c in np.median(txt_px, axis=0)) if len(txt_px) else (60, 60, 60)
    fill_color = tuple(int(c) for c in np.median(wht_px, axis=0)) if len(wht_px) else (245, 245, 245)

    print(f"img {W}x{H} | name h={name['h']} | dose y[{dose['y0']}..{dose['y1']}] h={dose_h} "
          f"x[{dose['x0']}..{dose['x1']}] w={dose_w} cx={cx:.0f}")
    print(f"txt_color={txt_color} fill_color={fill_color}")

    draw = ImageDraw.Draw(img)

    if debug:
        draw.rectangle([dose["x0"], dose["y0"], dose["x1"], dose["y1"]], outline=(255, 0, 0), width=4)
        draw.rectangle([name["x0"], name["y0"], name["x1"], name["y1"]], outline=(0, 160, 255), width=3)
        img.save(dst); print(f"DEBUG saved {dst}"); return

    # Choose font size so rendered line height matches the detected dose height.
    probe = 200
    f = ImageFont.truetype(FONT_PATH, probe, index=BOLD_IDX)
    l, t, r, b = f.getbbox(NEW_LINE)
    h_probe = b - t
    size = max(8, int(round(probe * dose_h / h_probe)))
    f = ImageFont.truetype(FONT_PATH, size, index=BOLD_IDX)
    l, t, r, b = f.getbbox(NEW_LINE)
    new_w, new_h = r - l, b - t

    # Erase the old line: cover the wider of old/new line width, centered on cx
    erase_w = max(dose_w, new_w) + 2 * pad
    ex0 = int(cx - erase_w / 2 - pad)
    ex1 = int(cx + erase_w / 2 + pad)
    ey0 = dose["y0"] - pad
    ey1 = dose["y1"] + pad
    draw.rectangle([ex0, ey0, ex1, ey1], fill=fill_color)

    # Draw new line: ink-top aligned to dose y0, horizontally centered on cx
    px = int(round(cx - new_w / 2 - l))
    py = int(round(dose["y0"] - t))
    draw.text((px, py), NEW_LINE, font=f, fill=txt_color)

    img.save(dst, quality=97)
    print(f"saved {dst}  (font size {size})")

if __name__ == "__main__":
    main()
