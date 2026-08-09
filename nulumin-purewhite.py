#!/usr/bin/env python3
# Put NuLumin vials on PURE WHITE (#FFFFFF) by compositing the clean BRIA cutout (nobg/) onto
# white using the vial's own alpha. White-on-white hides any edge imperfection; the label is
# protected by its alpha (no flood-fill spots). Uses the 4096 source RGB for a sharp label.
import os, glob
import numpy as np
from PIL import Image
SRC="NuLumin Generated/White BG Finals"; NOBG="NuLumin Generated/nobg"; OUT="NuLumin Generated/White BG Pure"
os.makedirs(OUT,exist_ok=True)
for f in sorted(glob.glob(f"{SRC}/NuL_*_white.png")):
    sku=os.path.basename(f).replace("NuL_","").replace("_white.png","")
    orig=np.asarray(Image.open(f).convert("RGB")).astype(np.float32); H,W,_=orig.shape
    A=np.asarray(Image.open(f"{NOBG}/NuL_{sku}_nobg.png").convert("RGBA").getchannel("A").resize((W,H),Image.BILINEAR)).astype(np.float32)/255.0
    out=orig*A[...,None]+255.0*(1-A[...,None])
    Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(f"{OUT}/NuL_{sku}_white.png"); print("ok",sku,flush=True)
print("DONE")
