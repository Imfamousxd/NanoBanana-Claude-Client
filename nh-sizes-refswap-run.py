#!/usr/bin/env python3
# Clean-sibling ref-swap for the stubborn size-token smudges. For each target, auto-pick the
# cleanest same-token/same-color sibling (different product), reproduce it with only the product
# name changed (nh-sizes-refswap.mjs), best-of-3, replace if clean.
import os, json, subprocess, shutil
import numpy as np
from PIL import Image

ROOT = "Noble Harbor Wholesale"
SW = 720
FIXDIR = "nh-sizes-fix-out"
VOL = {"5ml-dark": "5 ml", "10ml-dark": "10 ml", "20ml": "20 ml", "20ml-dark": "20 ml",
       "30ml": "30 ml", "30ml-dark": "30 ml"}
# target (product, token, color) ; skip-set = products NOT to use as sibling (currently/were flagged)
TARGETS = [
    ("Oxytocin", "10ml-dark", "babyblue", {"Oxytocin", "Ipamorelin"}),
    ("KPV", "5ml-dark", "navy", {"KPV"}),
    ("N-Acetyl Semax Amidate", "5ml-dark", "purple", {"N-Acetyl Semax Amidate"}),
]
PRODUCTS = [s.strip() for s in open("nh-peptides.txt") if s.strip() and not s.startswith("#")]

def load_small(path):
    im = Image.open(path); im.draft("L", (SW*2, SW*2)); im = im.convert("L")
    sh = max(1, int(im.height*SW/im.width))
    return np.asarray(im.resize((SW, sh), Image.BILINEAR)).astype(np.float32)
def _central_run(qual, center, gap_tol):
    n=len(qual)
    if not qual.any(): return int(0.30*n), int(0.70*n)
    l=center
    while l>0 and (qual[l-1] or np.any(qual[max(0,l-1-gap_tol):l])): l-=1
    r=center
    while r<n-1 and (qual[r+1] or np.any(qual[r+1:min(n,r+2+gap_tol)])): r+=1
    return l,r
def bg_mask(g):
    H,W=g.shape; col=(g<210).sum(axis=0); qual=col>0.15*H
    left,right=_central_run(qual, W//2, gap_tol=int(0.04*W))
    m=np.zeros((H,W),bool); cut=int(0.74*H); m[:cut,:left]=True; m[:cut,right+1:]=True
    rows=np.where((g<210).sum(axis=1)>0.04*W)[0]; top=rows[0] if len(rows) else int(0.2*H)
    m[:max(0,top-4),:]=True; m &= (g>170); return m
def metrics(path):
    g=load_small(path); m=bg_mask(g); bg=g[m]
    if bg.size<50: return dict(smudge=0.0, wblock=255.0)
    smudge=100.0*float((bg<245).mean()); H,W=g.shape; bs=max(8,SW//45); wb=255.0
    gg=g.copy(); gg[~m]=255.0
    for y in range(0,H,bs):
        for x in range(0,W,bs):
            blk=gg[y:y+bs,x:x+bs]; mm=m[y:y+bs,x:x+bs]
            if mm.sum()>=0.6*blk.size: wb=min(wb,float(blk.mean()))
    return dict(smudge=smudge, wblock=wb)

def stem(p): return p.replace(" ", "_")

def pick_sibling(token, color, skip):
    best=None
    for p in PRODUCTS:
        if p in skip: continue
        path=f"{ROOT}/{p}/{stem(p)}_{token}_{color}.jpg"
        if not os.path.exists(path): continue
        mm=metrics(path)
        score=(mm["wblock"], -mm["smudge"])  # higher wblock (brighter/cleaner) + lower smudge
        if best is None or score>best[0]:
            best=(score, p, path, mm)
    return best

os.makedirs(FIXDIR, exist_ok=True)
results=[]
for product, token, color, skip in TARGETS:
    out=f"{ROOT}/{product}/{stem(product)}_{token}_{color}.jpg"
    sib=pick_sibling(token, color, skip)
    if not sib:
        print(f"!! no sibling for {product} {token} {color}"); continue
    (_, sib_name, sib_path, sib_m)=sib
    ref_wb=metrics(out)  # current (bad) file for reference baseline
    print(f"[{product} {token} {color}] sibling='{sib_name}' (wblock={sib_m['wblock']:.0f} smudge={sib_m['smudge']:.1f})")
    best_path, best=None, None
    for i in range(1,4):
        cand=os.path.join(FIXDIR, f"{stem(product)}_{token}_{color}_rs{i}.jpg")
        env=dict(os.environ, REF=sib_path, OUT=cand, FROM_NAME=sib_name, TO_NAME=product, VOLUME=VOL[token])
        try:
            subprocess.run(["node","nh-sizes-refswap.mjs"], env=env, stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL, timeout=200)
        except Exception: pass
        if not os.path.exists(cand): continue
        m=metrics(cand); sc=(m["wblock"], -m["smudge"])
        if best is None or sc>best:
            best, best_path = sc, cand
        if m["wblock"]>=235 and m["smudge"]<=2:  # clean enough, stop
            break
    if best_path:
        if not os.path.exists(out+".pre-fix"):
            shutil.copy2(out, out+".pre-fix")
        shutil.copy2(best_path, out)
        m=metrics(out)
        print(f"   -> replaced (wblock={m['wblock']:.0f} smudge={m['smudge']:.1f}) from {os.path.basename(best_path)}")
        results.append(dict(product=product, token=token, color=color, sibling=sib_name,
                            wblock=round(m['wblock'],1), smudge=round(m['smudge'],2)))
    else:
        print("   !! all ref-swap candidates failed to generate")
json.dump(results, open("nh-sizes-refswap-results.json","w"), indent=2)
print("\nrefswap done:", len(results), "replaced")
