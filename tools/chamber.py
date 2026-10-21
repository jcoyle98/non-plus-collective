#!/usr/bin/env python3
"""Make the cloud-chamber draft's images: image 30 in the image gallery, "Cloud Chamber Photo of
Heavy Nucleus" by James A. Earl (CC BY 3.0), from Wikimedia Commons.

    python3 tools/chamber.py

The white margin with the "He" and "Heavy" labels is cropped away, and the photograph is enlarged
and lightly sharpened. Two versions are written:
    static/images/cloud-chamber-30-wide.jpg   turned on its side: the two plates split it into three columns
    static/images/cloud-chamber-30-tall.jpg   upright, for tall windows: three rows
Needs Pillow. The source is downloaded into tools/source/ (not published).
"""
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "https://upload.wikimedia.org/wikipedia/commons/7/7d/Cloud_Chamber_Photo_of_Heavy_Nucleus.jpg"
SOURCE = ROOT / "tools" / "source" / "cloud-chamber-30.jpg"
CROP = (128, 108, 1530, 1921)   # inside the white margin, past the tips of the label arrows

if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "nonpluscollective (https://nonplusmagazine.com)"})
    SOURCE.write_bytes(urllib.request.urlopen(req, timeout=120).read())

photo = Image.open(SOURCE).convert("L").crop(CROP)


def enlarge(im, long_side):
    im = im.filter(ImageFilter.GaussianBlur(0.5))
    k = long_side / max(im.size)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=3, percent=110, threshold=2))


for name, im in (("wide", photo.rotate(-90, expand=True)), ("tall", photo)):
    out = ROOT / "static" / "images" / f"cloud-chamber-30-{name}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    big = enlarge(im, 3840)
    big.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{out.relative_to(ROOT)}: {big.width} x {big.height}, {out.stat().st_size / 1e6:.1f} MB")
