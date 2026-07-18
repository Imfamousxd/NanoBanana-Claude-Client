#!/usr/bin/env python3
# Render the Noble Harbor COA SVG to an extremely-high-res PNG via headless Chrome
# (Chrome fetches the Google-Fonts @import; sharp/librsvg would drop the web fonts).
import subprocess, os, pathlib, sys

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SVG = "Noble Harbor Wholesale/coa_bpc157_hires.svg"
VW, VH = 1389, 1457            # SVG viewBox
SCALE = int(os.environ.get("SCALE", "6"))   # 6x -> 8334 x 8742 (~73 MP)
OUT = os.environ.get("OUT", f"Noble Harbor Wholesale/coa_bpc157_hires_{SCALE}x.png")

TW, TH = VW * SCALE, VH * SCALE   # target pixel size
svg = open(SVG, encoding="utf-8").read()
# Rewrite the SVG root width/height to the target pixels (its intrinsic attrs otherwise win over
# CSS and it renders at 1x in the corner). viewBox stays, so the vector scales cleanly. dsf=1.
svg = svg.replace(f'width="{VW}" height="{VH}"', f'width="{TW}" height="{TH}"', 1)
html = f'''<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Nunito:wght@600;700;800;900&family=Spectral:ital,wght@1,500&display=swap" rel="stylesheet">
<style>html,body{{margin:0;padding:0;background:transparent}}
 #wrap{{width:{TW}px;height:{TH}px}} #wrap svg{{width:{TW}px;height:{TH}px;display:block}}</style>
</head><body><div id="wrap">{svg}</div></body></html>'''
hp = "/tmp/nh_coa.html"; open(hp, "w", encoding="utf-8").write(html)

os.makedirs("Noble Harbor Wholesale", exist_ok=True)
cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
       "--default-background-color=00000000",            # transparent bg
       f"--window-size={TW},{TH}",
       "--virtual-time-budget=6000",                      # wait for fonts/network
       f"--screenshot={OUT}", f"file://{hp}"]
r = subprocess.run(cmd, capture_output=True, text=True)
ok = os.path.exists(OUT)
print("rendered:", OUT, "exists:", ok)
if ok:
    dim = subprocess.run(["sips","-g","pixelWidth","-g","pixelHeight",OUT], capture_output=True, text=True).stdout
    print(dim.strip())
else:
    print(r.stderr[-500:]); sys.exit(1)
