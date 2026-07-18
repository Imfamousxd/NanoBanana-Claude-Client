#!/usr/bin/env python3
"""Subtle direct logo paste — no glow, no card. Slight opacity reduction for integration."""
from PIL import Image
from pathlib import Path

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
LOGO = BASE / "ADW Assets" / "ADW_Logo_Final_W.png"
OUT = BASE / "ADW Campaign"
OUT.mkdir(parents=True, exist_ok=True)

OPACITY = 0.92  # very slight reduction so it feels less stamped

JOBS = [
    (BASE / "generations/2026-05-04T23-53-43_Slide_1_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v6_01.png", (110, 110), 380),
    (BASE / "generations/2026-05-04T23-56-52_Slide_2_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v6_02.png", (110, 110), 380),
    (BASE / "generations/2026-05-05T00-00-03_Slide_3_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v6_03.png", None, 580),  # centered, top 280
]

for src, dst, pos, size in JOBS:
    img = Image.open(src).convert("RGBA")
    cw = img.size[0]
    logo = Image.open(LOGO).convert("RGBA").resize((size, size), Image.LANCZOS)

    if OPACITY < 1.0:
        alpha = logo.split()[-1].point(lambda p: int(p * OPACITY))
        logo.putalpha(alpha)

    if pos is None:
        x = (cw - size) // 2
        y = 280
    else:
        x, y = pos

    img.alpha_composite(logo, (x, y))
    img.convert("RGB").save(dst, "PNG")
    print(f"  -> {dst.name}: ({x},{y}) {size}px @ {int(OPACITY*100)}%")
