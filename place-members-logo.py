#!/usr/bin/env python3
# Composite the REAL Members logo (transparent PNG) into the reserved top band of the v3 posters.
import sys
from PIL import Image

LOGO = "AI Fruit VIdeos Muha/refs/MMembers Logo.png"
BASES = [
    "AI Fruit VIdeos Muha/Master Case Designs/2026-06-09T05-39-02_mastercase-wholesale-cast-v3-c1.png",
    "AI Fruit VIdeos Muha/Master Case Designs/2026-06-09T05-39-02_mastercase-wholesale-cast-v3-c2.png",
]
LOGO_W_FRAC = float(sys.argv[1]) if len(sys.argv) > 1 else 0.46   # logo width as fraction of poster width
TOP_MARGIN_FRAC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.018  # top margin as fraction of poster height

logo = Image.open(LOGO).convert("RGBA")
outs = []
for base_path in BASES:
    base = Image.open(base_path).convert("RGBA")
    W, H = base.size
    lw = int(W * LOGO_W_FRAC)
    lh = int(lw * logo.height / logo.width)
    lg = logo.resize((lw, lh), Image.LANCZOS)
    x = (W - lw) // 2
    y = int(H * TOP_MARGIN_FRAC)
    base.alpha_composite(lg, (x, y))
    out = base_path.replace(".png", "_logo.png")
    base.convert("RGB").save(out, "PNG")
    print("✓", out)
    outs.append(out)

import subprocess
subprocess.run(["open", "-a", "Preview"] + outs)
