#!/usr/bin/env python3
# Best-of-N selector: for each defect (product,color), measure every generated candidate's
# background, and file the CLEANEST one (lowest worst-block) if it beats the currently-filed
# image. Reports the result vs the 5ml twin's level.

import os, re, glob, shutil, importlib.util
import numpy as np, json

spec = importlib.util.spec_from_file_location("v", "nh-verify-10ml.py")
v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
ROOT = "Noble Harbor Wholesale"; OUT = "nh-bestof-out"

rows = json.load(open("nh-10ml-delta.json"))
defects = [r for r in rows if (r["dwb"] > 25 and r["wb10"] > 30) or (r["ds"] > 4 and r["s10"] > 5)]

def jsslug(p): return re.sub(r'[^a-z0-9]+', '-', p.lower()).strip('-')

def wb(path):
    return v.bg_metrics(v.load_small(path))[2]

print(f"Selecting best-of-N for {len(defects)} defects\n")
results = []
for r in defects:
    product = r["file"].split("/")[0]; color = r["color"]; stem = product.replace(" ", "_")
    tag_us = f"nh-{jsslug(product)}-10ml-{color}".replace('-', '_')[:40]
    cands = [f for f in glob.glob(os.path.join(OUT, "*.jpg")) if tag_us in os.path.basename(f)]
    cur = os.path.join(ROOT, product, f"{stem}_10ml_{color}.jpg")
    twin = wb(os.path.join(ROOT, product, f"{stem}_5ml_{color}.jpg"))
    scored = [(wb(f), f) for f in cands]
    cur_wb = wb(cur)
    if not scored:
        print(f"  {product}/{color}: NO candidates found ({tag_us})"); continue
    best_wb, best_f = min(scored, key=lambda x: x[0])
    chose = "kept current"
    if best_wb < cur_wb - 2:
        shutil.copyfile(best_f, cur); chose = "REPLACED"
        final = best_wb
    else:
        final = cur_wb
    status = "clean" if final <= max(twin + 8, 18) else "STILL HIGH"
    results.append((product, color, final, twin, status))
    print(f"  {product}/{color:9} cands={[round(s) for s,_ in sorted(scored)]} cur={cur_wb:.0f} "
          f"twin={twin:.0f} -> {chose} final_wblock={final:.0f}  [{status}]")

still = [r for r in results if r[4] != "clean"]
print(f"\nDone. Clean now: {len(results)-len(still)}/{len(results)}.  Still high: {len(still)}")
for p, c, f, t, s in still:
    print(f"  STILL HIGH: {p}/{c}  wblock={f:.0f} (twin {t:.0f})")
