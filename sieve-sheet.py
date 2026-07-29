#!/usr/bin/env python3
"""
sieve-sheet.py — labelled contact sheets for picking.

    python3 sieve-sheet.py <out.jpg> --title "..." --group "Label" img1 img2 ... [--group "Label2" ...]

Exists because "pick one" is the step the engine kept pushing back onto the human with no
affordance. Candidates lived as loose PNGs with names like `renee2_c3.png`; deciding meant
opening files one at a time and holding faces in your head. A sheet makes the comparison
simultaneous, which is the only way small identity differences are visible at all.

Every cell is captioned with the exact token you say back ("brooke_c2"), so a pick is
unambiguous and can be fed straight to `sieve-avatar.mjs lock <Name> --pick <token>`.
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

CELL_H = 620          # tall enough to judge a face, small enough to fit a row on screen
PAD = 14
CAP_H = 34
HEAD_H = 58
GROUP_H = 40
BG = (250, 250, 249)
FG = (24, 24, 27)
MUTED = (113, 113, 122)
RULE = (214, 211, 209)


def font(sz, bold=False):
    for p in ([
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]):
        try:
            return ImageFont.truetype(p, sz)
        except Exception:
            continue
    return ImageFont.load_default()


def parse(argv):
    out, title, groups = argv[0], "", []
    i, cur = 1, None
    while i < len(argv):
        a = argv[i]
        if a == "--title":
            i += 1; title = argv[i]
        elif a == "--group":
            i += 1; cur = (argv[i], []); groups.append(cur)
        else:
            if cur is None:
                cur = ("", []); groups.append(cur)
            cur[1].append(a)
        i += 1
    return out, title, groups


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__.strip())
    out, title, groups = parse(sys.argv[1:])
    groups = [(name, [f for f in files if os.path.exists(f)]) for name, files in groups]
    groups = [g for g in groups if g[1]]
    if not groups:
        sys.exit("sieve-sheet: no input images exist")

    f_title, f_group, f_cap, f_sub = font(30, True), font(19, True), font(17, True), font(15)

    # Lay each group out as one row; sheet width is the widest row.
    rows, width = [], 0
    for name, files in groups:
        cells = []
        for p in files:
            im = Image.open(p).convert("RGB")
            w = max(1, int(im.width * CELL_H / im.height))
            cells.append((im.resize((w, CELL_H), Image.LANCZOS), os.path.splitext(os.path.basename(p))[0]))
        rows.append((name, cells))
        width = max(width, sum(c[0].width for c in cells) + PAD * (len(cells) + 1))

    height = HEAD_H + sum(GROUP_H + CELL_H + CAP_H + PAD for _ in rows) + PAD
    sheet = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 16), title or "Contact sheet", font=f_title, fill=FG)

    y = HEAD_H
    for name, cells in rows:
        d.line([(PAD, y - 6), (width - PAD, y - 6)], fill=RULE, width=1)
        d.text((PAD, y + 8), name, font=f_group, fill=FG)
        y += GROUP_H
        x = PAD
        for im, label in cells:
            sheet.paste(im, (x, y))
            d.rectangle([x, y, x + im.width - 1, y + CELL_H - 1], outline=RULE, width=1)
            d.text((x + 2, y + CELL_H + 8), label, font=f_cap, fill=FG)
            x += im.width + PAD
        y += CELL_H + CAP_H + PAD

    sheet.save(out, quality=93)
    n = sum(len(c) for _, c in rows)
    print(f"sieve-sheet: {out}  {sheet.width}x{sheet.height}  ({n} candidate(s) in {len(rows)} group(s))")


if __name__ == "__main__":
    main()
