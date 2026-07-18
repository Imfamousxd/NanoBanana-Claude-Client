#!/usr/bin/env python3
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "stroke_glow", Path(__file__).parent / "adw-logo-stroke-glow.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
OUT = BASE / "ADW Campaign"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    (BASE / "generations/2026-05-04T23-53-43_Slide_1_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v7_01.png", (110, 110), 380, 0),
    (BASE / "generations/2026-05-04T23-56-52_Slide_2_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v7_02.png", (110, 110), 380, 0),
    (BASE / "generations/2026-05-05T00-47-26_Slide_3_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v7_03.png", None, 1200, 80),  # hero logo, sized to clear headline
]

for src, dst, pos, size, top in JOBS:
    mod.paste_logo_native(src, dst, pos, size, top)
print("Done.")
