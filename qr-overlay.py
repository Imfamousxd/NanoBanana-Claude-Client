#!/usr/bin/env python3
"""Paste real QR larger to fully cover the AI's broken QR underneath."""
from PIL import Image
from pathlib import Path

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
QR = Image.open(BASE / "muha-app-qr.png").convert("RGBA")
DEST = BASE / "Muha Giveaway Redesigned"

# Bigger QR to fully cover the AI's broken QR — sizes are 41*N for crisp modules.
JOBS = [
    ("content 3.png", 1459, 2829, 697),   # 41*17 — bigger + recentered
]

for fname, x, y, size in JOBS:
    p = DEST / fname
    img = Image.open(p).convert("RGBA")
    qr_resized = QR.resize((size, size), Image.NEAREST)
    img.paste(qr_resized, (x, y), qr_resized)
    img.convert("RGB").save(p, "PNG")
    print(f"  -> {fname}: QR ({x},{y}) size {size}px")
print("Done.")
