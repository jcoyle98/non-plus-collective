#!/usr/bin/env python3
"""Take the printed border and the "Pag. 68." off image 142, keeping "TAB. V."

    python3 tools/unframe.py tools/source/142-arterial-system.jpg

writes tools/source/142-arterial-system-clean.jpg, for tools/ink_mask.py. The border is a slightly
skewed rectangle; everything from its lines outwards is covered with a patch
of blank paper from the same print, tiled and toned to match the paper just
inside the border. The numbers are specific to this image.
"""

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

# Centre of each border line where it was measured: (x, y) at each end
TOP = ((80, 81.5), (880, 89))
BOTTOM = ((80, 1519), (880, 1529.5))
LEFT = ((66, 100), (65.5, 1500))
RIGHT = ((892, 100), (900, 1500))
HALF = 6                          # half a line's thickness, plus a little
PAPER = (80, 1390, 240, 1505)     # a patch of blank paper inside the border


def at_x(line, x):
    (x0, y0), (x1, y1) = line
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def at_y(line, y):
    (x0, y0), (x1, y1) = line
    return x0 + (x1 - x0) * (y - y0) / (y1 - y0)


src = Path(sys.argv[1])
im = Image.open(src).convert("RGB")
W, H = im.size

# Blank paper over the whole image, tiled with alternate tiles mirrored so the seams don't show
patch = im.crop(PAPER)
pw, ph = patch.size
paper = Image.new("RGB", im.size)
for j, y in enumerate(range(0, H, ph)):
    for i, x in enumerate(range(0, W, pw)):
        tile = patch.transpose(Image.FLIP_LEFT_RIGHT) if i % 2 else patch
        paper.paste(tile.transpose(Image.FLIP_TOP_BOTTOM) if j % 2 else tile, (x, y))

# Keep only what lies inside the border's lines
keep = Image.new("L", im.size, 0)
corners = [
    (at_y(LEFT, at_x(TOP, 66)) + HALF, at_x(TOP, 66) + HALF),
    (at_y(RIGHT, at_x(TOP, 896)) - HALF, at_x(TOP, 896) + HALF),
    (at_y(RIGHT, at_x(BOTTOM, 900)) - HALF, at_x(BOTTOM, 900) - HALF),
    (at_y(LEFT, at_x(BOTTOM, 66)) + HALF, at_x(BOTTOM, 66) - HALF),
]
ImageDraw.Draw(keep).polygon(corners, fill=255)

# Tone the patch to the paper in a 24px band just inside the border (light pixels only, so no ink)
band = keep.copy()
inner = Image.new("L", im.size, 0)
ImageDraw.Draw(inner).polygon([(x + (24 if x < W / 2 else -24), y + (24 if y < H / 2 else -24)) for x, y in corners], fill=255)
band = ImageChops.subtract(band, inner)
light = im.convert("L").point(lambda v: 255 if v > 150 else 0)
target = ImageStat.Stat(im, ImageChops.multiply(band, light)).mean
current = ImageStat.Stat(paper).mean
paper = Image.merge("RGB", [c.point(lambda v, k=t / m: min(255, round(v * k))) for c, t, m in zip(paper.split(), target, current)])
paper.paste(im, (0, 0), keep)

out = src.with_name(src.stem + "-clean.jpg")
paper.save(out, quality=88)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
