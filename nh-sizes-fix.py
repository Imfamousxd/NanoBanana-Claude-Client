#!/usr/bin/env python3
# Best-of-N smudge fixer for the size-expansion flags. For each flagged (non-white) output:
#   generate candidates one at a time (same ref, same reproduce prompt via nh-sizes-batch.mjs),
#   score each vs its REF with the same wblock/smudge metric as nh-verify-sizes.py, stop early once
#   a candidate is clean, else keep the best of N. Replace the original only if a candidate is
#   cleaner (original backed up as .pre-fix). Leftover stubborn ones are reported for ref-swap.
#
#   python3 nh-sizes-fix.py            # fix all non-white flags
#   python3 nh-sizes-fix.py --white    # also include white flags
import os, json, subprocess, shutil, tempfile, sys
import numpy as np
from PIL import Image

SW = 720
MAXN = 4
ACCEPT_WBLOCK = 18.0   # candidate accepted early if d_wblock <= this AND
ACCEPT_SMUDGE = 3.0    # d_smudge <= this (cleaner than the 25/4 flag threshold)
FIXDIR = "nh-sizes-fix-out"
INCLUDE_WHITE = "--white" in sys.argv

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
    H,W=g.shape
    col=(g<210).sum(axis=0); qual=col>0.15*H
    left,right=_central_run(qual, W//2, gap_tol=int(0.04*W))
    m=np.zeros((H,W),bool); cut=int(0.74*H)
    m[:cut,:left]=True; m[:cut,right+1:]=True
    rows=np.where((g<210).sum(axis=1)>0.04*W)[0]
    top=rows[0] if len(rows) else int(0.2*H)
    m[:max(0,top-4),:]=True
    m &= (g>170)
    return m

def metrics(path):
    g=load_small(path); m=bg_mask(g); bg=g[m]
    if bg.size<50: return dict(smudge=0.0, wblock=255.0)
    smudge=100.0*float((bg<245).mean())
    H,W=g.shape; bs=max(8,SW//45); wb=255.0
    gg=g.copy(); gg[~m]=255.0
    for y in range(0,H,bs):
        for x in range(0,W,bs):
            blk=gg[y:y+bs,x:x+bs]; mm=m[y:y+bs,x:x+bs]
            if mm.sum()>=0.6*blk.size: wb=min(wb,float(blk.mean()))
    return dict(smudge=smudge, wblock=wb)

def gen(job, out):
    j=dict(job); j["out"]=out
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump([j], f); tmp=f.name
    env=dict(os.environ, IMG_SIZE="4K", LOG="/dev/null")
    try:
        subprocess.run(["node","nh-sizes-batch.mjs",tmp,"--force"], env=env,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=200)
    except Exception:
        pass
    finally:
        os.unlink(tmp)
    return os.path.exists(out)

def main():
    flagged=[json.loads(l) for l in open("nh-verify-sizes-flagged.txt")]
    alljobs={(j["product"],j["token"],j["color"]): j for j in json.load(open("nh-sizes-all.json"))}
    targets=[r for r in flagged if r.get("reason")!="MISSING-OUTPUT" and (INCLUDE_WHITE or not r.get("white"))]
    os.makedirs(FIXDIR, exist_ok=True)
    results=[]
    print(f"fixing {len(targets)} flagged outputs (best-of-{MAXN}, early-stop)")
    for k,r in enumerate(targets,1):
        job=alljobs[(r["product"],r["token"],r["color"])]
        out=job["out"]; ref=job["ref"]
        mref=metrics(ref)
        def dscore(mo): return (mref["wblock"]-mo["wblock"], mo["smudge"]-mref["smudge"])
        # baseline = the current (flagged) file
        best_path=out; best_d=dscore(metrics(out)); best_is_orig=True
        stem=os.path.basename(out)[:-4]
        for i in range(1,MAXN+1):
            cand=os.path.join(FIXDIR, f"{stem}_c{i}.jpg")
            if not gen(job, cand):  # gen failed; try again
                continue
            d=dscore(metrics(cand))
            better = (d[0] < best_d[0]-1) or (abs(d[0]-best_d[0])<=1 and d[1] < best_d[1])
            if better:
                best_path, best_d, best_is_orig = cand, d, False
            if best_d[0] <= ACCEPT_WBLOCK and best_d[1] <= ACCEPT_SMUDGE:
                break
        status="kept-original"
        if not best_is_orig:
            if not os.path.exists(out+".pre-fix"):
                shutil.copy2(out, out+".pre-fix")
            shutil.copy2(best_path, out)
            status="fixed" if (best_d[0]<=25 and best_d[1]<=4) else "improved"
        elif best_d[0] > 25 or best_d[1] > 4:
            status="STUBBORN"  # nothing cleaner found; needs ref-swap
        results.append(dict(product=r["product"], token=r["token"], color=r["color"],
                            status=status, d_wblock=round(best_d[0],1), d_smudge=round(best_d[1],2)))
        print(f"  [{k}/{len(targets)}] {r['product'][:22]:22s} {r['token']:10s} {r['color']:9s} -> {status} (dwb={round(best_d[0],1)} dsm={round(best_d[1],2)})")
    json.dump(results, open("nh-sizes-fix-results.json","w"), indent=2)
    from collections import Counter
    print("\nsummary:", dict(Counter(r["status"] for r in results)))
    stub=[r for r in results if r["status"]=="STUBBORN"]
    if stub:
        print("STUBBORN (need clean-sibling ref-swap):")
        for r in stub: print("   ", r["product"], r["token"], r["color"])

if __name__=="__main__":
    main()
