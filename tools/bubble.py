#!/usr/bin/env python3
"""Make the bubble draft's stencil: image 23 in the image gallery, "Synchrotron background test in 4-inch
bubble chamber", photographed July 27, 1955 (Lawrence Berkeley National Laboratory, U.S. Department of
Energy; public domain), via Wikimedia Commons.

    python3 tools/bubble.py

The photograph is a round chamber on a near-black surround (about 20 of 255, lighter at the edges of the
print). The surround is taken to true black with a soft knee, so it disappears rather than ending in a
line, and the outer strip of the print is faded out entirely. The result is written as a stencil, its
alpha the photograph's brightness, so the page shows it in any pair of colours with the surround always
exactly the page's colour (as with the radiolarian):
    static/images/bubble-23-mask.png
Needs Pillow and numpy. The source is downloaded into tools/source/ (not published).
"""
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = ("https://upload.wikimedia.org/wikipedia/commons/a/a9/Synchrotron_background_test_in_4-inch_bubble_chamber."
              "_Photograph_taken_July_27%2C_1955._Bubble_Chamber-27_-_DPLA_-_b6d5a3ec40b03d8ae7481eb9912553ff.jpg")
SOURCE = ROOT / "tools" / "source" / "bubble-23.jpg"
BLACK, KNEE = 24, 18     # at or below BLACK is surround; the next KNEE levels ease in
EDGE = 0.03              # the share of each side of the print that fades to black
RIM = (1084, 1105, 1062, 1016)   # the chamber's rim: centre x, y and radii, in pixels of the source

if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "nonpluscollective (https://nonplusmagazine.com)"})
    SOURCE.write_bytes(urllib.request.urlopen(req, timeout=120).read())

im = Image.open(SOURCE).convert("L").filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
a = np.asarray(im).astype(np.float32)
H, W = a.shape

t = np.clip((a - BLACK) / KNEE, 0, 1)
ease = t * t * (3 - 2 * t)                                  # 0 in the surround, 1 once clear of it
v = np.clip((a - BLACK) / (255 - BLACK), 0, 1) * 255 * ease

f = int(min(W, H) * EDGE)
yy, xx = np.mgrid[0:H, 0:W]
d = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
e = np.clip(d / f, 0, 1)
v *= e * e * (3 - 2 * e)

# outside the chamber's rim there is only the surround, with a few scratches and specks: fade it all out
cx, cy, rx, ry = RIM
r = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
o = np.clip((1.07 - r) / 0.05, 0, 1)
v *= o * o * (3 - 2 * o)

alpha = Image.fromarray(np.clip(v, 0, 255).astype(np.uint8))
mask = Image.merge("LA", (Image.new("L", alpha.size, 255), alpha))
dest = ROOT / "static" / "images" / "bubble-23-mask.png"
mask.save(dest, optimize=True)
print(f"{dest.relative_to(ROOT)}: {W} x {H}, {dest.stat().st_size / 1e6:.1f} MB")
alpha.save(ROOT / "tools" / "source" / "bubble-23-check.png")
