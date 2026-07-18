#!/usr/bin/env python3
# Finalize per-theme sets: carry over the 20 approved frames, then grade+name the 52 new renders.
# Output: "By Theme/<Theme>/<Theme> NN.jpg" (carryover first, then new).
import os, re, glob, shutil, subprocess, sys

BASE = "Nulumin Generated/Themed Lifestyle"
BYTHEME = f"{BASE}/By Theme"
STAGING = f"{BYTHEME}/_staging_raw"

FOLDER = {"weight-loss": "Weight Loss", "recovery": "Recovery", "longevity": "Longevity",
          "performance": "Performance", "cognitive": "Cognitive", "sexual-health": "Sexual Health"}
TOK2 = {"weight_loss": "weight-loss", "recovery": "recovery", "longevity": "longevity",
        "performance": "performance", "cognitive": "cognitive", "sexual_health": "sexual-health"}
CODE2 = {"wl": "weight-loss", "rec": "recovery", "lon": "longevity", "perf": "performance",
         "cog": "cognitive", "sex": "sexual-health"}

# 1) carryover existing graded (already sigma12) from Blur/ + No Blur/
carry = {t: [] for t in FOLDER}
for d in ("Blur", "No Blur"):
    for p in glob.glob(f"{BASE}/{d}/*.jpg"):
        m = re.search(r"nul_grit_(\d+)_(weight_loss|recovery|longevity|performance|cognitive|sexual_health)_", os.path.basename(p))
        if m:
            carry[TOK2[m.group(2)]].append((int(m.group(1)), p))

# 2) new staged raws -> grade
new = {t: [] for t in FOLDER}
for p in glob.glob(f"{STAGING}/*.jpg"):
    m = re.search(r"nul_(wl|rec|lon|perf|cog|sex)_new_(\d+)", os.path.basename(p))
    if m:
        new[CODE2[m.group(1)]].append((int(m.group(2)), p))

for theme, folder in FOLDER.items():
    out = f"{BYTHEME}/{folder}"
    os.makedirs(out, exist_ok=True)
    # clear any prior finals so re-runs are clean
    for old in glob.glob(f"{out}/{folder} *.jpg"):
        os.remove(old)
    n = 0
    for _, src in sorted(carry[theme]):
        n += 1
        shutil.copy(src, f"{out}/{folder} {n:02d}.jpg")
    for _, src in sorted(new[theme]):
        n += 1
        subprocess.run(["python3", "film-grain.py", src, f"{out}/{folder} {n:02d}.jpg", "12", "0.65"],
                       stdout=subprocess.DEVNULL)
    print(f"{folder}: {len(carry[theme])} carried + {len(new[theme])} new = {n}")
