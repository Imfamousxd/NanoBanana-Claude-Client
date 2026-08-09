#!/usr/bin/env python3
# Remove the white background from a NuLumin vial while KEEPING THE GLASS SEE-THROUGH, with clean
# natural edges (NO alpha matting). Uses rembg (isnet) for the alpha, then DESPILLS the white
# background out of the semi-transparent edge pixels (unmix against #FFFFFF) so there is no white
# halo — crisp edges on any background, glass stays transparent.
#   python3 nulumin-nobg.py <SKU> [<SKU> ...]   (SKU = e.g. BPC_10mg)
import sys, os
import numpy as np
from PIL import Image
from rembg import remove, new_session

SRC = "NuLumin Generated/White BG Finals"
OUT = "NuLumin Generated/nobg"
_SESS = new_session("isnet-general-use")

def nobg(sku):
    src = f"{SRC}/NuL_{sku}_white.png"
    if not os.path.exists(src):
        print("MISSING", sku, flush=True); return
    im = Image.open(src).convert("RGBA")
    cut = remove(im, session=_SESS, post_process_mask=True)   # NO alpha_matting
    arr = np.asarray(cut).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0
    # unmix white bg out of edge pixels:  observed = a*F + (1-a)*255  ->  F = (observed-(1-a)*255)/a
    F = (rgb - (1.0 - a) * 255.0) / np.clip(a, 1e-3, 1.0)
    F = np.clip(F, 0, 255)
    F = np.where(a > 0.004, F, rgb)                            # leave fully-transparent areas alone
    out = np.concatenate([F, arr[..., 3:4]], axis=-1).astype(np.uint8)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(out, "RGBA").save(f"{OUT}/NuL_{sku}_nobg.png")
    print("ok", sku, cut.size, flush=True)

if __name__ == "__main__":
    for s in sys.argv[1:]:
        nobg(s)
    print("ALLDONE", flush=True)
