#!/usr/bin/env python3
# Best-of-N selector for 10mg smudge fixes: for each defect in nh-10mg-smudged.txt,
# measure every candidate in nh-bestof-10mg-out/, and file the CLEANEST (lowest wblock)
# if it beats the currently-filed image. Backs up the original as .pre-fix.
# Reports the result vs the root placeholder twin's level.

import os, re, glob, shutil, importlib.util

spec = importlib.util.spec_from_file_location("v", "nh-verify-10mg.py")
v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
ROOT = "Noble Harbor Wholesale"; OUT = "nh-bestof-10mg-out"

def jsslug(p): return re.sub(r'[^a-z0-9]+', '-', p.lower()).strip('-')

def wb(path):
    return v.bg_metrics(v.load_small(path))[2]

defects = [l.strip() for l in open("nh-10mg-smudged.txt") if l.strip()]
print(f"Selecting best-of-N for {len(defects)} defects\n")
results = []
for line in defects:
    product = line.split("/")[0]
    stem = product.replace(" ", "_")
    m = re.search(r'_10mg_(\dml)_([a-z]+)\.jpg$', line)
    if not m:
        print(f"  skip unparseable: {line}"); continue
    size, color = m.groups()
    tag_us = f"nh-{jsslug(product)}-10mg-{size}-{color}".replace('-', '_')[:40]
    cands = [f for f in glob.glob(os.path.join(OUT, "*.jpg")) if tag_us in os.path.basename(f)]
    cur = os.path.join(ROOT, product, "10mg", f"{stem}_10mg_{size}_{color}.jpg")
    twin = wb(os.path.join(ROOT, product, f"{stem}_{size}_{color}.jpg"))
    if not cands:
        print(f"  {product}/{size}/{color}: NO candidates found ({tag_us})"); continue
    scored = [(wb(f), f) for f in cands]
    cur_wb = wb(cur)
    best_wb, best_f = min(scored, key=lambda x: x[0])
    chose = "kept current"
    if best_wb < cur_wb - 2:
        if not os.path.exists(cur + ".pre-fix"):
            shutil.copyfile(cur, cur + ".pre-fix")
        shutil.copyfile(best_f, cur); chose = "REPLACED"
        final = best_wb
    else:
        final = cur_wb
    status = "clean" if final <= max(twin + 8, 18) else "STILL HIGH"
    results.append((product, size, color, final, twin, status))
    print(f"  {product}/{size}/{color:9} cands={[round(s) for s,_ in sorted(scored)]} cur={cur_wb:.0f} "
          f"twin={twin:.0f} -> {chose} final_wblock={final:.0f}  [{status}]")

still = [r for r in results if r[5] != "clean"]
print(f"\nDone. Clean now: {len(results)-len(still)}/{len(results)}.  Still high: {len(still)}")
for p, sz, c, f, t, s in still:
    print(f"  STILL HIGH: {p}/{sz}/{c}  wblock={f:.0f} (twin {t:.0f})")
