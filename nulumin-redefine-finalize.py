#!/usr/bin/env python3
# Grade (sigma12) + name the corrected-theme renders into per-theme folders.
import os, re, glob, subprocess
BASE = "Nulumin Generated/Themed Lifestyle"
BYTHEME = f"{BASE}/By Theme"
STAGING = f"{BYTHEME}/_staging_raw2"
FOLDER = {"weight-loss": "Weight Loss", "recovery": "Recovery", "longevity": "Longevity",
          "performance": "Performance", "cognitive": "Cognitive", "sexual-health": "Sexual Health"}
CODE2 = {"wl": "weight-loss", "rec": "recovery", "lon": "longevity", "perf": "performance", "cog": "cognitive", "sex": "sexual-health"}

byc = {t: [] for t in FOLDER}
for p in glob.glob(f"{STAGING}/*.jpg"):
    m = re.search(r"nul_(wl|rec|lon|perf|cog|sex)_(\d+)", os.path.basename(p))
    if m:
        byc[CODE2[m.group(1)]].append((int(m.group(2)), p))

for theme, folder in FOLDER.items():
    out = f"{BYTHEME}/{folder}"
    os.makedirs(out, exist_ok=True)
    for old in glob.glob(f"{out}/{folder} *.jpg"):
        os.remove(old)
    for nn, src in sorted(byc[theme]):
        subprocess.run(["python3", "film-grain.py", src, f"{out}/{folder} {nn:02d}.jpg", "12", "0.65"],
                       stdout=subprocess.DEVNULL)
    print(f"{folder}: {len(byc[theme])} graded+named")
