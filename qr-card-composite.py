#!/usr/bin/env python3
"""PIL-only composite: designed QR card + real QR onto the sharp original poster.

No AI roundtrip = poster stays bit-perfect sharp.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

BASE = Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client")
SRC = BASE / "generations" / "2026-04-28T01-54-29_REDESIGN_this_Muha_Meds_How_to_Enter_i.png"
QR = BASE / "muha-app-qr.png"
DST = BASE / "Muha Giveaway Redesigned" / "content 3.png"

# Card geometry (top-left x,y and side length on the 2160x3840 poster)
CARD_X, CARD_Y, CARD_SIZE = 1500, 2870, 595

# Card styling
RADIUS         = 22
BORDER_PX      = 2
BORDER_COLOR   = (210, 175, 110, 255)   # warm gold/cream
SHADOW_OFFSET  = (14, 18)
SHADOW_BLUR    = 36
SHADOW_COLOR   = (8, 2, 0, 170)         # deep warm shadow
GLOW_BLUR      = 60
GLOW_COLOR     = (200, 70, 30, 90)      # subtle red/amber outer glow
INNER_MARGIN   = 8                      # white margin between border and QR

# QR module multiple — snap QR side to N*41 for crisp modules
QR_MODULE = 41


def make_rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0]-1, size[1]-1), radius=radius, fill=255)
    return mask


def composite_card(base: Image.Image) -> Image.Image:
    canvas = base.convert("RGBA")
    W, H = canvas.size

    card_box = (CARD_X, CARD_Y, CARD_X + CARD_SIZE, CARD_Y + CARD_SIZE)

    # ---- Glow layer (full canvas, blurred warm color through rounded shape) ----
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(card_box, radius=RADIUS, fill=GLOW_COLOR)
    glow = glow.filter(ImageFilter.GaussianBlur(GLOW_BLUR))
    canvas = Image.alpha_composite(canvas, glow)

    # ---- Drop shadow ----
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sx = CARD_X + SHADOW_OFFSET[0]
    sy = CARD_Y + SHADOW_OFFSET[1]
    sd.rounded_rectangle(
        (sx, sy, sx + CARD_SIZE, sy + CARD_SIZE),
        radius=RADIUS,
        fill=SHADOW_COLOR,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    canvas = Image.alpha_composite(canvas, shadow)

    # ---- White card with gold border ----
    card = Image.new("RGBA", (CARD_SIZE, CARD_SIZE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    # Gold border (slightly larger rounded rect)
    cd.rounded_rectangle(
        (0, 0, CARD_SIZE - 1, CARD_SIZE - 1),
        radius=RADIUS,
        fill=BORDER_COLOR,
    )
    # White interior (border thickness inset)
    inset = BORDER_PX
    cd.rounded_rectangle(
        (inset, inset, CARD_SIZE - 1 - inset, CARD_SIZE - 1 - inset),
        radius=max(RADIUS - inset, 0),
        fill=(255, 255, 255, 255),
    )
    canvas.paste(card, (CARD_X, CARD_Y), card)

    # ---- Real QR centered inside, snapped to module multiple ----
    interior = CARD_SIZE - 2 * (BORDER_PX + INNER_MARGIN)
    qr_side = (interior // QR_MODULE) * QR_MODULE
    qr_img = Image.open(QR).convert("RGBA").resize((qr_side, qr_side), Image.NEAREST)
    qx = CARD_X + (CARD_SIZE - qr_side) // 2
    qy = CARD_Y + (CARD_SIZE - qr_side) // 2
    canvas.paste(qr_img, (qx, qy), qr_img)
    print(f"  Card ({CARD_X},{CARD_Y}) {CARD_SIZE}px | QR ({qx},{qy}) {qr_side}px")

    return canvas


def main():
    base = Image.open(SRC)
    print(f"Source: {SRC.name}  size={base.size}")
    out = composite_card(base)
    out.convert("RGB").save(DST, "PNG", optimize=False)
    print(f"Saved -> {DST}")


if __name__ == "__main__":
    main()
