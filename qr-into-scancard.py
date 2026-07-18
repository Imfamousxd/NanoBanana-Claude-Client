#!/usr/bin/env python3
"""Detect the white scan-card interior and paste the real QR inside it.

The AI rendered the card design (corner brackets, SCAN tag, glow, shadow);
this script just drops the real QR pixel-perfect into the white area.
"""
from PIL import Image
import numpy as np
from pathlib import Path

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
QR = BASE / "muha-app-qr.png"

# Each job: (source generation, destination, search-region as (x0,y0,x1,y1) fractions)
JOBS = [
    {
        "src": BASE / "generations" / "2026-04-28T22-25-48_Create_a_NEW_Muha_Meds_How_to_Enter_gi.png",
        "dst": BASE / "Muha Giveaway Redesigned" / "content 1.png",
        "search": (0.00, 0.70, 0.45, 1.00),  # bottom-left
    },
    {
        "src": BASE / "generations" / "2026-04-28T22-28-32_Create_a_NEW_Muha_Meds_How_to_Enter_gi.png",
        "dst": BASE / "Muha Giveaway Redesigned" / "content 2.png",
        "search": (0.00, 0.65, 0.55, 1.00),  # lower-left
    },
    {
        "src": BASE / "generations" / "2026-04-28T22-31-18_Create_a_NEW_Muha_Meds_How_to_Enter_gi.png",
        "dst": BASE / "Muha Giveaway Redesigned" / "content 3.png",
        "search": (0.55, 0.65, 1.00, 1.00),  # lower-right
    },
]

WHITE_THRESHOLD = 235      # per-channel min to count as "white interior"
ROW_COL_FILL    = 0.30     # fraction of search-region span a row/col must be white to count
INNER_PAD       = 16       # px inside detected white box before QR (keeps brackets visible)
QR_MODULE       = 41       # snap QR side to multiple of 41 for crisp modules


def find_white_card(img: Image.Image, search_frac):
    arr = np.array(img.convert("RGB"))
    h, w, _ = arr.shape
    x0, y0 = int(search_frac[0] * w), int(search_frac[1] * h)
    x1, y1 = int(search_frac[2] * w), int(search_frac[3] * h)
    region = arr[y0:y1, x0:x1]

    mask = (region[:, :, 0] >= WHITE_THRESHOLD) & \
           (region[:, :, 1] >= WHITE_THRESHOLD) & \
           (region[:, :, 2] >= WHITE_THRESHOLD)
    if not mask.any():
        raise RuntimeError("No white card region detected.")

    row_white = mask.sum(axis=1)
    col_white = mask.sum(axis=0)
    row_ok = np.where(row_white > ROW_COL_FILL * region.shape[1])[0]
    col_ok = np.where(col_white > ROW_COL_FILL * region.shape[0])[0]
    if len(row_ok) == 0 or len(col_ok) == 0:
        raise RuntimeError("Could not isolate card rows/cols.")

    return col_ok[0] + x0, row_ok[0] + y0, col_ok[-1] + x0, row_ok[-1] + y0


def paste_qr(job):
    img = Image.open(job["src"]).convert("RGBA")
    left, top, right, bottom = find_white_card(img, job["search"])
    cw, ch = right - left, bottom - top
    print(f"\n{job['dst'].name}")
    print(f"  card box: ({left},{top}) -> ({right},{bottom})  ({cw}x{ch})")

    # Square the QR area: min side - inner padding, snapped to module multiple
    side = min(cw, ch) - 2 * INNER_PAD
    side = (side // QR_MODULE) * QR_MODULE
    cx, cy = (left + right) // 2, (top + bottom) // 2
    qx, qy = cx - side // 2, cy - side // 2
    print(f"  QR at ({qx},{qy}) size {side}px")

    qr = Image.open(QR).convert("RGBA").resize((side, side), Image.NEAREST)
    img.paste(qr, (qx, qy), qr)
    img.convert("RGB").save(job["dst"], "PNG")
    print(f"  saved -> {job['dst']}")


def main():
    for job in JOBS:
        paste_qr(job)


if __name__ == "__main__":
    main()
