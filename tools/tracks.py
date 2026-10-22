#!/usr/bin/env python3
"""Make the tracks draft's image: image 25 in the image gallery, "HD.6D.680" (bubble-chamber tracks),
from the U.S. Department of Energy (public domain), via Wikimedia Commons.

    python3 tools/tracks.py

The white paper border, the dark lip of the frame along the top and the white flecks at the right edge
are cropped away. Its uneven exposure (darker on the left, greyer on the right) is evened out. The outer strip on every side is then eased toward the photograph's own dark tone
(estimated from a band just inside each edge, so nothing flat is painted in), so the image doesn't end in
a hard, uneven line at the edge of the window. Enlarged a little and lightly sharpened.
    static/images/tracks-25.jpg
Needs Pillow and numpy. The source is downloaded into tools/source/ (not published).
"""
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "https://upload.wikimedia.org/wikipedia/commons/c/c6/HD.6D.680_%2812000818023%29.jpg"
SOURCE = ROOT / "tools" / "source" / "hd-25.jpg"
CROP = (64, 74, 3092, 1826)   # inside the border, below the frame's lip, short of the flecks on the right
FEATHER = 0.045               # the share of each side that is eased

if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "nonpluscollective (https://nonplusmagazine.com)"})
    SOURCE.write_bytes(urllib.request.urlopen(req, timeout=120).read())

im = Image.open(SOURCE).convert("L").crop(CROP)
a = np.asarray(im).astype(np.float32)
H, W = a.shape

# the photograph was exposed unevenly: its background runs from near black on the left to dark grey on
# the right. Measure the background across (the median of each column, over the middle of the height, so
# neither the tracks nor the glow at the top count), smooth it, and take the difference away from the
# dark parts only, so the background is one tone across and the white tracks stay as bright as they were
band = a[int(H * .15):int(H * .85)]
level = np.median(band, axis=0)
level = np.convolve(np.pad(level, 150, mode="edge"), np.ones(301) / 301, mode="valid")
a = np.clip(a - (level - level.min())[None, :] * (1 - a / 255), 0, 255)
im = Image.fromarray(a.astype(np.uint8))

# a very blurred copy is the "own tone" each edge eases toward: it keeps the glow at the top and the
# darker and lighter stretches of each side, just without the fine tracks and the ragged edge
soft = np.asarray(im.filter(ImageFilter.GaussianBlur(min(W, H) * 0.06))).astype(np.float32)
f = int(min(W, H) * FEATHER)
yy, xx = np.mgrid[0:H, 0:W]
d = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)     # distance to the nearest edge
t = np.clip(d / f, 0, 1)
w = t * t * (3 - 2 * t)                                                           # smooth ramp, 0 at the edge
out = a * w + np.minimum(a, soft) * (1 - w)                                       # tracks fade out, never brighten
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

img = img.filter(ImageFilter.GaussianBlur(0.4))
k = 3840 / img.width
img = img.resize((3840, round(img.height * k)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=3, percent=100, threshold=2))
dest = ROOT / "static" / "images" / "tracks-25.jpg"
img.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
print(f"{dest.relative_to(ROOT)}: {img.width} x {img.height}, {dest.stat().st_size / 1e6:.1f} MB")
