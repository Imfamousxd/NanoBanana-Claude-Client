#!/usr/bin/env python3
# Deterministic verification of the 10mg dose sets (no AI judgment).
# For each <Product>/10mg/<stem>_10mg_<size>_<color>.jpg vs its root placeholder twin
# <Product>/<stem>_<size>_<color>.jpg:
#   - wblock : worst small background BLOCK's avg darkness (localized dark smudge detector)
#   - smudge%: % of background pixels not near-pure-white (global haze)
#   - worst  : darkest single bg patch (0.5th percentile luminance)
#   - framing: vial size & position drift vs the twin
# Flag on DELTA vs the twin (the accepted baseline), not absolute:
#   wblock delta > 25, or smudge delta > 4, or framing > 16.
# Same bg-mask approach as nh-verify-10ml.py (outside vial+cap silhouette, above base shadow).
#
# Usage: python3 nh-verify-10mg.py

import os, json
import numpy as np
from PIL import Image

ROOT = "Noble Harbor Wholesale"
COLORS = ["navy","black","white","red","green","babyblue","yellow","pink","purple"]
SIZES = ["3ml","5ml"]
SW = 720

def load_small(path):
    im = Image.open(path)
    im.draft("L", (SW * 2, SW * 2))
    im = im.convert("L")
    sh = max(1, int(im.height * SW / im.width))
    g = np.asarray(im.resize((SW, sh), Image.BILINEAR)).astype(np.float32)
    return g

def vial_shape(g):
    H, W = g.shape
    mask = g < 238
    area = float(mask.sum()) / (H * W)
    rows = np.where(mask.sum(axis=1) > 0.04 * W)[0]
    if len(rows) == 0:
        return dict(area=area, top=0.0, bot=1.0)
    return dict(area=area, top=rows[0] / H, bot=rows[-1] / H)

def _central_run(qual, center, gap_tol):
    n = len(qual)
    if not qual.any():
        return int(0.30*n), int(0.70*n)
    l = center
    while l > 0 and (qual[l-1] or np.any(qual[max(0, l-1-gap_tol):l])):
        l -= 1
    r = center
    while r < n-1 and (qual[r+1] or np.any(qual[r+1:min(n, r+2+gap_tol)])):
        r += 1
    return l, r

def bg_mask(g):
    H, W = g.shape
    col = (g < 210).sum(axis=0)
    qual = col > 0.15 * H
    left, right = _central_run(qual, W // 2, gap_tol=int(0.04 * W))
    central_row = (g[:, int(0.30*W):int(0.70*W)] < 210).sum(axis=1)
    qr = np.where(central_row > 0.05 * (0.40*W))[0]
    cap_top = int(qr[0]) if len(qr) else int(0.10 * H)

    ml = max(0, left - int(0.025*W)); mr = min(W, right + int(0.025*W))
    yt, yb = int(0.015*H), int(0.74*H)
    mt = max(yt, cap_top - int(0.02*H))

    bg = np.zeros((H, W), bool)
    bg[yt:yb, :ml] = True
    bg[yt:yb, mr:] = True
    bg[yt:mt, :] = True
    return bg

def bg_metrics(g):
    bg = bg_mask(g)
    vals = g[bg]
    if len(vals) == 0:
        return 0.0, 255.0, 0.0
    smudge = float((vals < 243).mean()) * 100.0
    worst = float(np.percentile(vals, 0.5))
    H, W = g.shape
    dark = np.where(bg, np.clip(243.0 - g, 0, None), 0.0)
    cnt = bg.astype(np.float32)
    B = max(6, H // 40)
    ny, nx = H // B, W // B
    ds = dark[:ny*B, :nx*B].reshape(ny, B, nx, B).sum(axis=(1, 3))
    cs = cnt[:ny*B, :nx*B].reshape(ny, B, nx, B).sum(axis=(1, 3))
    valid = cs > (0.5 * B * B)
    bm = np.where(valid, ds / np.maximum(cs, 1), 0.0)
    wblock = float(bm.max()) if valid.any() else 0.0
    return smudge, worst, wblock

def main():
    rows = []
    twin_cache = {}
    for product in sorted(os.listdir(ROOT)):
        pdir = os.path.join(ROOT, product, "10mg")
        if not os.path.isdir(pdir) or product.startswith("_"):
            continue
        stem = product.replace(" ", "_")
        for size in SIZES:
            for c in COLORS:
                cand = os.path.join(pdir, f"{stem}_10mg_{size}_{c}.jpg")
                twin = os.path.join(ROOT, product, f"{stem}_{size}_{c}.jpg")
                if not os.path.exists(cand):
                    continue
                g = load_small(cand)
                sc = vial_shape(g)
                smudge, worst, wblock = bg_metrics(g)
                dArea = dTop = dBot = float("nan")
                t_sm = t_wb = float("nan")
                if os.path.exists(twin):
                    if twin not in twin_cache:
                        tg = load_small(twin)
                        twin_cache[twin] = (vial_shape(tg),) + bg_metrics(tg)
                    ts, t_sm, t_wo, t_wb = twin_cache[twin]
                    dArea = (sc["area"]/ts["area"] - 1) * 100 if ts["area"] > 0 else 0
                    dTop = (sc["top"] - ts["top"]) * 100
                    dBot = (sc["bot"] - ts["bot"]) * 100
                framing = max(abs(dArea) if dArea==dArea else 0,
                              abs(dTop)*3 if dTop==dTop else 0,
                              abs(dBot)*3 if dBot==dBot else 0)
                d_wb = wblock - (t_wb if t_wb==t_wb else 0)
                d_sm = smudge - (t_sm if t_sm==t_sm else 0)
                rows.append(dict(file=f"{product}/10mg/{os.path.basename(cand)}",
                                 product=product, size=size, color=c,
                                 smudge=smudge, worst=worst, wblock=wblock,
                                 twin_wblock=t_wb, twin_smudge=t_sm,
                                 d_wblock=d_wb, d_smudge=d_sm,
                                 dArea=dArea, framing=framing))

    flagged = [r for r in rows if r["d_wblock"] > 25 or r["d_smudge"] > 4 or r["framing"] > 16]
    rows.sort(key=lambda r: -(r["d_wblock"] + r["d_smudge"]*3))
    with open("nh-verify-10mg-flagged.txt", "w") as f:
        f.write("\n".join(r["file"] for r in flagged))
    with open("nh-verify-10mg-results.jsonl", "w") as f:
        f.write("\n".join(json.dumps(r) for r in rows))

    print(f"Verified {len(rows)} images.  Flagged (worse than twin): {len(flagged)}")
    print(f"{'wblock':>6} {'twinWB':>6} {'dWB':>6} {'smudge%':>7} {'dSm':>5} {'frm':>4}  file")
    for r in rows[:30]:
        print(f"{r['wblock']:6.1f} {r['twin_wblock']:6.1f} {r['d_wblock']:6.1f} "
              f"{r['smudge']:7.2f} {r['d_smudge']:5.1f} {r['framing']:4.0f}  {r['file']}")
    wb=np.array([r['wblock'] for r in rows]); dwb=np.array([r['d_wblock'] for r in rows])
    print(f"\nwblock   median={np.median(wb):.1f}  p90={np.percentile(wb,90):.1f}  max={wb.max():.1f}")
    print(f"d_wblock median={np.median(dwb):.1f}  p90={np.percentile(dwb,90):.1f}  max={dwb.max():.1f}")
    print(f"\nFlagged ({len(flagged)}) -> nh-verify-10mg-flagged.txt")

if __name__ == "__main__":
    main()
