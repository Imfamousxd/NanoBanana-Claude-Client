#!/usr/bin/env python3
"""Detect the white QR card in an AI-integrated poster and paste the real QR inside it."""
from PIL import Image
import numpy as np
from pathlib import Path

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
SRC = BASE / "generations" / "2026-04-28T03-55-34_Edit_REFERENCE_1_existing_content_3_pos.png"
QR = BASE / "muha-app-qr.png"
DST = BASE / "Muha Giveaway Redesigned" / "content 3.png"

# Inset margin (px) inside the detected white card before pasting QR (keeps gold border visible)
INSET = 18
# How "white" a pixel needs to be (per channel min) to count as card interior
WHITE_THRESHOLD = 240
# Search region (avoid logos/text elsewhere). Card is bottom-right per prompt.
SEARCH_FRAC = (0.55, 0.65, 1.0, 1.0)  # x0, y0, x1, y1 as fractions of the image


def find_white_card(img: Image.Image):
    arr = np.array(img.convert("RGB"))
    h, w, _ = arr.shape
    x0 = int(SEARCH_FRAC[0] * w)
    y0 = int(SEARCH_FRAC[1] * h)
    x1 = int(SEARCH_FRAC[2] * w)
    y1 = int(SEARCH_FRAC[3] * h)
    region = arr[y0:y1, x0:x1]

    # Mask of "white-ish" pixels
    mask = (region[:, :, 0] >= WHITE_THRESHOLD) & \
           (region[:, :, 1] >= WHITE_THRESHOLD) & \
           (region[:, :, 2] >= WHITE_THRESHOLD)

    if not mask.any():
        raise RuntimeError("No white card region detected.")

    # Largest contiguous bounding box: rows/cols that are mostly white
    row_white = mask.sum(axis=1)
    col_white = mask.sum(axis=0)
    # Threshold: a row/col counts if it has at least 30% of search-region width worth of whites
    row_ok = np.where(row_white > 0.30 * region.shape[1])[0]
    col_ok = np.where(col_white > 0.30 * region.shape[0])[0]
    if len(row_ok) == 0 or len(col_ok) == 0:
        raise RuntimeError("Could not isolate card rows/cols.")

    top = row_ok[0] + y0
    bottom = row_ok[-1] + y0
    left = col_ok[0] + x0
    right = col_ok[-1] + x0
    return left, top, right, bottom


def main():
    img = Image.open(SRC).convert("RGB")
    left, top, right, bottom = find_white_card(img)
    cw = right - left
    ch = bottom - top
    print(f"Detected card: ({left},{top}) -> ({right},{bottom})  size {cw}x{ch}")

    # Square the card area (use min side, center within detected box)
    side = min(cw, ch) - 2 * INSET
    # Snap to nearest multiple of 41 for crisp QR module rendering
    side = (side // 41) * 41
    cx = (left + right) // 2
    cy = (top + bottom) // 2
    qx = cx - side // 2
    qy = cy - side // 2
    print(f"Pasting QR at ({qx},{qy}) size {side}x{side}")

    qr = Image.open(QR).convert("RGBA").resize((side, side), Image.NEAREST)
    img_rgba = img.convert("RGBA")
    img_rgba.paste(qr, (qx, qy), qr)
    img_rgba.convert("RGB").save(DST, "PNG")
    print(f"Saved -> {DST}")


if __name__ == "__main__":
    main()
