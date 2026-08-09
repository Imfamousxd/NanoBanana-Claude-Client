#!/usr/bin/env python3
"""
film-grain.py — the LOCKED finishing grade.

    python3 film-grain.py <in> <out> <sigma> <size> [options]

Contract is fixed by Brand Context/NuLumin_BioSciences.md:253-256, which marks this a
MANDATORY post step and states at 100% confidence that Nano Banana renders clean smooth
skin and will NOT produce heavy film grain from the prompt. Presets from that playbook:

    heavy   ≈ sigma 18, size 0.7
    medium  ≈ sigma 11, size 0.6

This is a finishing grade on a whole frame, NOT asset-pasting — it is the explicitly
allowed exception in 00_ENGINE.md rule 3 / NuLumin rule 7. Keep raw generations in a
`_raw/` subfolder so the grade stays re-tunable.

Why it looks like film rather than digital noise, and why each step is here:
  - Grain is generated at `size` x resolution then resampled up, so a grain cluster is
    larger than a pixel. That clumping is the whole difference; per-pixel noise reads as
    sensor noise, not emulsion.
  - Grain is luminance-WEIGHTED. Real emulsion grain peaks in the midtones and falls away
    in deep shadow and blown highlight. Flat noise across the tone curve is the single
    biggest tell of faked grain.
  - Grain is monochrome by default. Colour film grain is overwhelmingly a density
    fluctuation, not a hue fluctuation. --chroma adds a little back if you want 800T dirt.

Options:
  --neutralize        remove a colour cast by neutralising the grey point (see below)
  --chroma <f>        fraction of grain applied per-channel independently (default 0.0)
  --upscale <f>       Lanczos upscale BEFORE graining, so grain sits at output scale
  --seed <n>          reproducible grain
"""
import sys
import os
import argparse
import numpy as np
from PIL import Image

# Rec. 709 luma — matches how the eye weights the channels.
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def grain_field(h, w, sigma, size, rng):
    """Gaussian noise generated small and resampled up, so grain clumps."""
    # size < 1 => coarser grain. Clamp so we always have at least a few pixels to work with.
    gh = max(8, int(round(h * size)))
    gw = max(8, int(round(w * size)))
    noise = rng.normal(loc=0.0, scale=sigma, size=(gh, gw)).astype(np.float32)
    if (gh, gw) == (h, w):
        return noise
    # Bilinear resample keeps the clusters soft-edged; nearest would look like blocks.
    # No explicit mode: PIL infers "F" from float32 (mode= is deprecated in Pillow 13).
    return np.asarray(
        Image.fromarray(noise).resize((w, h), Image.BILINEAR),
        dtype=np.float32,
    )


def luminance_weight(lum):
    """
    Emulsion response: grain peaks mid-tone, falls off at both ends.
    4*l*(1-l) is the parabola through (0,0) (0.5,1) (1,0). The 0.15 floor keeps a
    little grain alive in the blacks so shadows don't read as plastic.
    """
    return 0.15 + 0.85 * (4.0 * lum * (1.0 - lum))


def neutralize(arr):
    """
    Grey-point correction. Nano Banana and gpt-image-2 both tend to lay a faint global
    cast over a frame; that cast is a strong 'generated' tell because real capture has a
    white balance, not a wash. Scale each channel so the image mean becomes neutral.
    """
    mean = arr.reshape(-1, 3).mean(axis=0)
    target = float(mean.mean())
    gain = np.where(mean > 1e-6, target / np.maximum(mean, 1e-6), 1.0)
    # Clamp so a genuinely warm-lit scene isn't bleached into grey.
    gain = np.clip(gain, 0.9, 1.1).astype(np.float32)
    return arr * gain


def main():
    p = argparse.ArgumentParser(add_help=True, usage=argparse.SUPPRESS)
    p.add_argument("infile")
    p.add_argument("outfile")
    p.add_argument("sigma", type=float, help="grain strength, 0-255 scale (heavy 18, medium 11)")
    p.add_argument("size", type=float, help="grain scale, <1 = coarser (heavy 0.7, medium 0.6)")
    p.add_argument("--neutralize", action="store_true", help="neutralise the grey point")
    p.add_argument("--chroma", type=float, default=0.0, help="0-1 fraction of per-channel grain")
    p.add_argument("--upscale", type=float, default=1.0, help="Lanczos upscale before graining")
    p.add_argument("--seed", type=int, default=None, help="reproducible grain")
    a = p.parse_args()

    if not os.path.exists(a.infile):
        sys.exit(f"film-grain: input not found: {a.infile}")
    if not 0.05 <= a.size <= 1.0:
        sys.exit(f"film-grain: size must be 0.05-1.0 (got {a.size}); <1 means coarser grain")

    img = Image.open(a.infile)
    icc = img.info.get("icc_profile")
    img = img.convert("RGB")

    if a.upscale and abs(a.upscale - 1.0) > 1e-6:
        w, h = img.size
        img = img.resize((int(round(w * a.upscale)), int(round(h * a.upscale))), Image.LANCZOS)

    arr = np.asarray(img, dtype=np.float32)
    h, w, _ = arr.shape

    if a.neutralize:
        arr = neutralize(arr)

    rng = np.random.default_rng(a.seed)

    # Luminance weight computed from the pre-grain image, normalised to 0-1.
    lum = (arr @ LUMA) / 255.0
    weight = luminance_weight(np.clip(lum, 0.0, 1.0))[:, :, None]

    # Monochrome grain: one field applied to all three channels equally.
    mono = grain_field(h, w, a.sigma, a.size, rng)[:, :, None]
    grain = mono * (1.0 - a.chroma)

    # Optional chroma grain: independent field per channel.
    if a.chroma > 0.0:
        per_channel = np.stack(
            [grain_field(h, w, a.sigma, a.size, rng) for _ in range(3)], axis=-1
        )
        grain = grain + per_channel * a.chroma

    out = np.clip(arr + grain * weight, 0.0, 255.0).astype(np.uint8)

    os.makedirs(os.path.dirname(os.path.abspath(a.outfile)) or ".", exist_ok=True)
    result = Image.fromarray(out)
    save_kw = {"icc_profile": icc} if icc else {}
    if a.outfile.lower().endswith((".jpg", ".jpeg")):
        save_kw.update(quality=96, subsampling=0)
    result.save(a.outfile, **save_kw)

    print(
        f"film-grain: {os.path.basename(a.infile)} -> {a.outfile}  "
        f"({w}x{h}, sigma {a.sigma}, size {a.size}"
        f"{', neutralized' if a.neutralize else ''}"
        f"{f', chroma {a.chroma}' if a.chroma else ''})"
    )


if __name__ == "__main__":
    main()
