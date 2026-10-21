#!/usr/bin/env python3
"""Make the hurricane draft's image: Hurricane Gracie on a U.S. Navy radar scope (September 1959),
from Wikimedia Commons (public domain), enlarged to 4K width and lightly sharpened.

    python3 tools/hurricane.py      # writes static/images/hurricane-gracie-4k.jpg

Needs Pillow (pip install pillow). The source is downloaded into tools/source/ (not published).
"""
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Hurricane_Gracie_on_radar_scope_in_September_1959.jpg"
SOURCE = ROOT / "tools" / "source" / "hurricane-gracie-1959.jpg"
OUT = ROOT / "static" / "images" / "hurricane-gracie-4k.jpg"
WIDTH = 3840

if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "nonpluscollective (https://nonplusmagazine.com)"})
    SOURCE.write_bytes(urllib.request.urlopen(req, timeout=60).read())

im = Image.open(SOURCE).convert("L")                       # it's a black-and-white photograph
im = im.filter(ImageFilter.GaussianBlur(0.6))               # soften the scan's grain a touch before enlarging
im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
im = im.filter(ImageFilter.UnsharpMask(radius=3, percent=90, threshold=3))  # then sharpen the enlarged edges
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "JPEG", quality=84, optimize=True, progressive=True)
print(f"{OUT.relative_to(ROOT)}: {im.width} x {im.height}, {OUT.stat().st_size / 1e6:.1f} MB")
