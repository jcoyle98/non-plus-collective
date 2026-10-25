#!/usr/bin/env python3
"""Make the image sets for the flicker draft (templates/draft-flicker.html).

Every photo from the image gallery (tools/source/gallery/, credits in its
credits.json) plus the photos in EXTRAS, each in two sizes:

    static/images/flicker/l/NNN.jpg   1400 px on the long side, for big screens
    static/images/flicker/s/NNN.jpg    800 px, for phones

and static/flicker-images.js, the list the page cycles through, with each
image's credit. Requires Pillow. Run from the repo root:

    python3 tools/flicker.py
"""

import json
import shutil
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / "tools" / "source" / "gallery"
OUT = ROOT / "static" / "images" / "flicker"
SIZES = {"l": (1400, 72), "s": (800, 65)}   # folder: (long side in px, JPEG quality)

# Photos in this repo that aren't in the gallery: (file, credit line)
EXTRAS = [
    ("static/images/720823156_18561111739067497_8469273870620942780_n.jpg", "Open-pit mine. Source and licence not recorded."),
    ("static/images/834437431_18596077765064071_3630667906937843086_n.jpg", "Refinery. Source and licence not recorded."),
]


def credit(img):
    licence = img["licence"]
    by = f"{img['artist']}, {licence}" if img.get("artist") else licence
    return f"{img['title']}. {by}"


def main():
    catalog = json.loads((GALLERY / "credits.json").read_text(encoding="utf-8"))
    photos = [(GALLERY / img["file"], credit(img), img.get("source", "")) for img in catalog["images"]]
    photos += [(ROOT / f, text, "") for f, text in EXTRAS]

    if OUT.exists():
        shutil.rmtree(OUT)
    for folder in SIZES:
        (OUT / folder).mkdir(parents=True)

    entries = []
    for n, (path, text, source) in enumerate(photos, 1):
        im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        name = f"{n:03d}.jpg"
        for folder, (long_side, quality) in SIZES.items():
            copy = im.copy()
            copy.thumbnail((long_side, long_side), Image.LANCZOS)
            copy.save(OUT / folder / name, "JPEG", quality=quality, optimize=True, progressive=True)
        entries.append({"f": name, "credit": text, "source": source})

    js = ("// Made by tools/flicker.py: the photos the flicker draft cycles through, with their credits.\n"
          f"window.FLICKER_IMAGES = {json.dumps(entries, ensure_ascii=False, indent=0)};\n")
    (ROOT / "static" / "flicker-images.js").write_text(js, encoding="utf-8")
    print(f"{len(entries)} photos into {OUT.relative_to(ROOT)}/{{{','.join(SIZES)}}}")


if __name__ == "__main__":
    main()
