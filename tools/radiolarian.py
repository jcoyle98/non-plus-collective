#!/usr/bin/env python3
"""Make the radiolarian draft's image: Anthocyrtium hispidum (image 91 in the image gallery),
photograph by Picturepest, CC BY 2.0, from Wikimedia Commons.

    python3 tools/radiolarian.py      # writes static/images/radiolarian-91-mask.png

The photograph's near-black background is pushed to true black, so that the page around it
(whose colour follows the same colour treatments) meets it without a visible edge.
Needs Pillow. The source is downloaded into tools/source/ (not published).
"""
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "https://upload.wikimedia.org/wikipedia/commons/7/7f/Anthocyrtium_hispidum_Haeckel_-_Radiolarian_%2834986365113%29.jpg"
SOURCE = ROOT / "tools" / "source" / "radiolarian-91.jpg"
HEIGHT = 2800   # the specimen's length; after turning it on its side, the image is this wide

if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "nonpluscollective (https://nonplusmagazine.com)"})
    SOURCE.write_bytes(urllib.request.urlopen(req, timeout=120).read())

im = Image.open(SOURCE).convert("L")
bg = sorted(im.resize((64, 64)).getdata())[200]          # a typical background value
im = im.point(lambda v: 0 if v <= bg + 2 else round((v - bg - 2) * 255 / (255 - bg - 2)))   # background -> black
im = im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)
im = im.rotate(90, expand=True)   # on its side: the body on the right, the spine reaching out to the left

# The page uses this version: the photograph's brightness as a stencil (white, with the brightness as
# transparency). The page shows through where the photograph is black, and the colour treatment's
# light colour fills the rest, so the background is the page itself and can never differ from it.
MASK = ROOT / "static" / "images" / "radiolarian-91-mask.png"
MASK.parent.mkdir(parents=True, exist_ok=True)
Image.merge("LA", (Image.new("L", im.size, 255), im)).save(MASK, optimize=True)
print(f"{MASK.relative_to(ROOT)}: {im.width} x {im.height}, {MASK.stat().st_size / 1e6:.1f} MB (background was {bg})")
