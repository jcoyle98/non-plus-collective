#!/usr/bin/env python3
"""Make seamless tiles of sparse specks for the page background.

    python3 tools/grain.py

writes static/images/grain-1.png to grain-4.png, each a different scattering;
the grain slider on the page stacks more of them for more grain. Each is a mask: each speck is opaque, everything else
clear, so CSS can paint the specks in the same colour as the engraving's lines.
They imitate the flecks left in the blank paper of image 142's ink mask: mostly
faint single pixels, a few brighter or larger, gathered more thickly in some
places than others. Positions wrap at the edges, so the tile repeats without seams.
"""

from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 512              # the tile, in pixels (shown at 256 CSS pixels)
DENSITY = 0.003         # specks per pixel on average (the paper has 0.002 to 0.014)
CLUMPING = 0.8          # how much thicker some patches are than others
TILES = 4


def tile(rng):
    # Where the specks gather: smooth noise that wraps at the edges
    fy, fx = np.meshgrid(np.fft.fftfreq(SIZE), np.fft.fftfreq(SIZE), indexing="ij")
    smooth = np.exp(-(np.hypot(fy, fx) * SIZE / 4) ** 2)          # only the broadest features
    field = np.real(np.fft.ifft2(smooth * np.exp(2j * np.pi * rng.random((SIZE, SIZE)))))
    field = np.exp(CLUMPING * (field - field.mean()) / field.std())
    field *= DENSITY / field.mean()

    alpha = np.zeros((SIZE, SIZE))
    ys, xs = np.nonzero(rng.random((SIZE, SIZE)) < field)
    for y, x in zip(ys, xs):
        # Mostly faint, now and then bright, like the paper's flecks
        strength = rng.uniform(150, 255) if rng.random() < 0.08 else rng.uniform(70, 140)
        size = rng.choice([1, 2, 3], p=[0.85, 0.12, 0.03])
        for dy in range(size):
            for dx in range(size):
                if dy == dx == 0 or rng.random() < 0.6:                # irregular, not square
                    cy, cx = (y + dy) % SIZE, (x + dx) % SIZE
                    alpha[cy, cx] = max(alpha[cy, cx], strength * rng.uniform(0.6, 1))

    return Image.merge("LA", [Image.new("L", (SIZE, SIZE), 255), Image.fromarray(alpha.astype(np.uint8))]), len(xs)


for n in range(1, TILES + 1):
    image, specks = tile(np.random.default_rng(142 + n))
    out = Path(__file__).parent.parent / "static" / "images" / f"grain-{n}.png"
    image.save(out, optimize=True)
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB, {specks} specks)")
