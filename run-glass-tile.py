#!/usr/bin/env python3
"""Apply the glass-tile logo treatment to Day 1 v2 slides."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "glass_tile", Path(__file__).parent / "adw-logo-glass-tile.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
OUT = BASE / "ADW Campaign"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    (BASE / "generations/2026-05-04T23-53-43_Slide_1_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v5_01.png", (80, 80), 480, 0),
    (BASE / "generations/2026-05-04T23-56-52_Slide_2_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v5_02.png", (80, 80), 480, 0),
    (BASE / "generations/2026-05-05T00-00-03_Slide_3_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v5_03.png", None, 760, 200),
]

for src, dst, pos, size, top in JOBS:
    mod.paste_logo_tile(src, dst, pos, size, top)
print("Done.")
