#!/usr/bin/env python3
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "constellation", Path(__file__).parent / "adw-logo-constellation.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
OUT = BASE / "ADW Campaign"

mod.constellation_logo(
    BASE / "generations/2026-05-05T00-47-26_Slide_3_of_3_Day_1_manifesto_carousel.png",
    OUT / "Day1_v8_03.png",
    None, 1200, 80,
)
