#!/usr/bin/env python3
"""Turn an engraving into an ink mask: a PNG whose opacity is the ink and
whose paper is transparent, so CSS can paint the lines in any colour.

    python3 tools/ink_mask.py tools/source/142-arterial-system.jpg

writes static/images/142-arterial-system-ink.png. PAPER and INK
are the grey levels treated as fully clear and fully opaque.
"""

import sys
from pathlib import Path

from PIL import Image, ImageOps

PAPER = 160   # this light or lighter is paper (clear); catches the stain too
INK = 70      # this dark or darker is solid ink
HEIGHT = 1200

src = Path(sys.argv[1])
grey = ImageOps.grayscale(Image.open(src))
grey = grey.resize((round(grey.width * HEIGHT / grey.height), HEIGHT), Image.LANCZOS)
alpha = grey.point(lambda v: 0 if v >= PAPER else 255 if v <= INK else round(255 * (PAPER - v) / (PAPER - INK)))
mask = Image.new("LA", grey.size, 0)
mask.putalpha(alpha)
out = Path(__file__).parent.parent / "static" / "images" / (src.stem + "-ink.png")
mask.save(out, optimize=True)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
