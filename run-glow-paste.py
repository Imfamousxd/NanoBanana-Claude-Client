#!/usr/bin/env python3
"""Paste ADW logo with glow into Day 1 v2 slides."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

# Reload module so any changes in adw-logo-glow-paste.py take effect
spec_name = "adw_logo_glow_paste"
import importlib.util
spec = importlib.util.spec_from_file_location(
    spec_name, Path(__file__).parent / "adw-logo-glow-paste.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
OUT = BASE / "ADW Campaign"

JOBS = [
    (BASE / "generations/2026-05-04T23-53-43_Slide_1_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v4_01.png", (80, 80), 480, 0),
    (BASE / "generations/2026-05-04T23-56-52_Slide_2_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v4_02.png", (80, 80), 480, 0),
    (BASE / "generations/2026-05-05T00-00-03_Slide_3_of_3_Day_1_manifesto_carousel.png",
     OUT / "Day1_v4_03.png", None, 760, 200),
]

for src, dst, pos, size, top in JOBS:
    mod.paste_logo_with_glow(src, dst, pos, size, top)
print("Done.")
