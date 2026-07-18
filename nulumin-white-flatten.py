#!/usr/bin/env python3
"""Cut NuLumin vials out of their (clean, uniform) generated field, NORMALIZE every
vial to an identical size + placement, and composite onto a TRUE pure-white #FFFFFF
square canvas — uniform, shadow-free e-commerce packshots.

Uses rembg (isnet) salient-object segmentation to matte the vial (handles the
translucent glass, which a naive luminance/flood key destroys). The vial is then
cropped to its alpha bounding box, scaled so its HEIGHT == TARGET_H_FRAC of the
canvas, and pasted dead-center. Because all vials are the same physical vial,
height-normalizing + centering makes every shot identical in size and placement.
This is background-cleanup + catalog normalization on the model's genuine output —
the vial artwork itself is unaltered.

Usage:
  python3 nulumin-white-flatten.py <in.png> <out.png> [model]      # single file
  python3 nulumin-white-flatten.py <in_dir> <out_dir> [model]      # whole folder
                                                                   # -> <out_dir>/<base>_white.png
"""
import os
import sys
import numpy as np
from PIL import Image

os.environ.setdefault("U2NET_HOME", os.path.expanduser("~/.u2net"))
from rembg import remove, new_session  # noqa: E402

MODEL_DEFAULT = "isnet-general-use"
CANVAS = 4096          # final square size (px)
TARGET_H_FRAC = 0.78   # vial bbox height as a fraction of the canvas (identical for all)
ALPHA_THRESH = 16      # alpha above this counts as vial when finding the bounding box


def matte(im, session):
    return remove(
        im.convert("RGBA"),
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=8,
        post_process_mask=True,
    )


def normalize_to_white(cut):
    """Crop cutout to its alpha bbox, scale to a fixed height, center on white CANVAS."""
    a = np.asarray(cut)
    ys, xs = np.where(a[..., 3] > ALPHA_THRESH)
    if len(ys) == 0:
        bg = Image.new("RGB", (CANVAS, CANVAS), (255, 255, 255))
        return bg
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    vial = cut.crop((x0, y0, x1, y1))

    target_h = int(round(CANVAS * TARGET_H_FRAC))
    scale = target_h / vial.height
    new_w = max(1, int(round(vial.width * scale)))
    vial = vial.resize((new_w, target_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (255, 255, 255, 255))
    ox = (CANVAS - vial.width) // 2
    oy = (CANVAS - vial.height) // 2
    canvas.alpha_composite(vial, (ox, oy))
    return canvas.convert("RGB")


def process(inp, outp, session):
    normalize_to_white(matte(Image.open(inp), session)).save(outp)


def main(inp, outp, model):
    session = new_session(model)
    if os.path.isdir(inp):
        os.makedirs(outp, exist_ok=True)
        files = sorted(f for f in os.listdir(inp) if f.lower().endswith(".png"))
        print(f"=== flatten+normalize {len(files)} file(s) (h={TARGET_H_FRAC} of {CANVAS}, {model}) ===")
        for i, f in enumerate(files, 1):
            base = os.path.splitext(f)[0]
            try:
                process(os.path.join(inp, f), os.path.join(outp, f"{base}_white.png"), session)
                print(f"  [{i}/{len(files)}] OK  {base}_white.png")
            except Exception as e:  # noqa: BLE001
                print(f"  [{i}/{len(files)}] FAIL {f}: {e}")
        print("Done.")
    else:
        process(inp, outp, session)
        print(f"  normalized cutout->white: {outp}  ({model})")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else MODEL_DEFAULT)
