#!/usr/bin/env python3
# Deterministic QC for the 6 new size tokens. Each new output is compared to its SOURCE ref
# (the vial it was reproduced from), flagging DELTA regressions, not absolutes (per the learned
# rule: the source line is considered clean even where faintly cloudy).
#
#   amber 5ml-dark / 10ml-dark / 20ml-dark / 30ml-dark  vs  <P>_3ml-dark_<c>.jpg
#   clear 20ml / 30ml                                    vs  <P>_5ml_<c>.jpg
#
# Metrics (from nh-verify-10ml.py): wblock (worst small bg block darkness) is the key smudge
# detector; smudge% global; framing (area/top/bot). Flag when a token is NOTABLY worse than its
# own source: wblock delta > 25, or smudge% delta > 4.  (White caps: higher noise floor -> judge
# visually; still listed but tagged.)  Reads the same nh-sizes-all.json job matrix for pairing.
#
# Usage: python3 nh-verify-sizes.py

import os, json
import numpy as np
from PIL import Image

ROOT = "Noble Harbor Wholesale"
SW = 720
WBLOCK_DELTA = 25.0
SMUDGE_DELTA = 4.0

def load_small(path):
    im = Image.open(path)
    im.draft("L", (SW * 2, SW * 2))
    im = im.convert("L")
    sh = max(1, int(im.height * SW / im.width))
    return np.asarray(im.resize((SW, sh), Image.BILINEAR)).astype(np.float32)

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
    m = np.zeros((H, W), bool)
    cut = int(0.74 * H)                 # above the base shadow
    m[:cut, :left] = True
    m[:cut, right+1:] = True
    # also the band above the cap
    rows = np.where((g < 210).sum(axis=1) > 0.04 * W)[0]
    top = rows[0] if len(rows) else int(0.2*H)
    m[:max(0, top-4), :] = True
    m &= (g > 170)                      # keep only near-white bg (dark vial excluded)
    return m

def metrics(path):
    g = load_small(path)
    m = bg_mask(g)
    bg = g[m]
    if bg.size < 50:
        return dict(smudge=0.0, wblock=0.0, worst=255.0, **vial_shape(g))
    smudge = 100.0 * float((bg < 245).mean())
    worst = float(np.percentile(bg, 0.5))
    # worst small block: tile bg region, min mean over blocks with enough pixels
    H, W = g.shape
    bs = max(8, SW // 45)
    wb = 255.0
    gg = g.copy(); gg[~m] = 255.0
    for y in range(0, H, bs):
        for x in range(0, W, bs):
            blk = gg[y:y+bs, x:x+bs]
            mm = m[y:y+bs, x:x+bs]
            if mm.sum() >= 0.6 * blk.size:
                wb = min(wb, float(blk.mean()))
    return dict(smudge=smudge, wblock=255.0 - wb if False else wb, worst=worst, **vial_shape(g))

def main():
    jobs = json.load(open("nh-sizes-all.json"))
    results, flagged = [], []
    for j in jobs:
        out, ref = j["out"], j["ref"]
        if not os.path.exists(out):
            flagged.append({**j, "reason": "MISSING-OUTPUT"}); continue
        mo, mr = metrics(out), metrics(ref)
        # wblock stored as darkness value (lower = darker smudge); delta = ref - out (positive => out darker)
        d_wblock = mr["wblock"] - mo["wblock"]
        d_smudge = mo["smudge"] - mr["smudge"]
        d_area = mo["area"] - mr["area"]
        rec = dict(out=out, color=j["color"], token=j["token"], product=j["product"],
                   out_wblock=round(mo["wblock"],1), ref_wblock=round(mr["wblock"],1),
                   d_wblock=round(d_wblock,1), d_smudge=round(d_smudge,2),
                   d_area=round(d_area,4), white=(j["color"]=="white"))
        results.append(rec)
        if (d_wblock > WBLOCK_DELTA or d_smudge > SMUDGE_DELTA):
            flagged.append(rec)
    with open("nh-verify-sizes-results.jsonl", "w") as f:
        for r in results: f.write(json.dumps(r) + "\n")
    flagged.sort(key=lambda r: -(r.get("d_wblock", 0) if isinstance(r.get("d_wblock"), (int,float)) else 999))
    with open("nh-verify-sizes-flagged.txt", "w") as f:
        for r in flagged: f.write(json.dumps(r) + "\n")
    print(f"checked {len(results)} outputs; {len(flagged)} flagged (delta wblock>{WBLOCK_DELTA} or smudge>{SMUDGE_DELTA})")
    nonwhite = [r for r in flagged if not r.get("white") and "reason" not in r]
    white = [r for r in flagged if r.get("white")]
    miss = [r for r in flagged if r.get("reason") == "MISSING-OUTPUT"]
    print(f"  non-white smudge flags: {len(nonwhite)}   white (judge visually): {len(white)}   missing outputs: {len(miss)}")
    for r in nonwhite[:40]:
        print(f"    {r['product']:24s} {r['token']:10s} {r['color']:9s} d_wblock={r['d_wblock']:6} d_smudge={r['d_smudge']}")

if __name__ == "__main__":
    main()
