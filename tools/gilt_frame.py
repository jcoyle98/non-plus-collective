#!/usr/bin/env python3
"""Draw static/images/gilt-frame.svg: a gilt picture frame for CSS border-image (9-slice).

The image is 300 x 300 with slices of 100: each corner is a 100 x 100 mitred moulding with a
carved acanthus scroll on it; each side's middle 100 x 100 is the moulding's profile with a row
of beads, which the browser repeats ("round") along the side, so the beads stay round however
long the side. The profile, from the outer edge (0) to the sight edge (100):

    0-4 dark edge · 4-18 outer roll · 18-22 shadow · 22-58 gilded hollow · 58-62 crease
    62-74 raised bead · 74-86 flat · 86-94 beading · 94-100 lip, falling into the dark

Run from the repo root:  python3 tools/gilt_frame.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "static" / "images" / "gilt-frame.svg"

# (depth from the outer edge, colour): the moulding's light and shade across its width
PROFILE = [
    (0, "#2c1d04"), (4, "#5a3d0a"), (8, "#c9971f"), (11, "#fbe39a"), (14, "#d6a42a"), (18, "#6b4a0c"),
    (21, "#3a2705"), (23, "#8a6418"), (28, "#f6d77e"), (32, "#fff1bf"), (38, "#e2b444"), (50, "#b5841f"),
    (57, "#7a5612"), (60, "#3d2a06"), (63, "#9a6f1a"), (67, "#f3cf6c"), (71, "#b0801c"), (74, "#4a3208"),
    (76, "#a77a1e"), (84, "#8e661a"), (86, "#3d2a06"), (94, "#5a3d0a"), (96, "#f0cc6a"), (98, "#7a5612"),
    (100, "#140d02"),
]


def gradient(gid, x1, y1, x2, y2):
    stops = "".join(f'<stop offset="{d / 100:.2f}" stop-color="{c}"/>' for d, c in PROFILE)
    return f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stops}</linearGradient>'


def beads():
    """A row of small gilt beads along each side, 10 to every 100 units, at depth 90."""
    out = []
    for i in range(30):
        c = 5 + i * 10
        if 90 < c < 210:   # only between the mitres, so the rows meet at the corners and stop there
            out.append(f'<circle cx="{c}" cy="90" r="3.3"/><circle cx="{c}" cy="210" r="3.3"/>')
            out.append(f'<circle cx="90" cy="{c}" r="3.3"/><circle cx="210" cy="{c}" r="3.3"/>')
    return "".join(out)


# a carved acanthus scroll for the top-left corner (the others are its mirror images); it must stay
# inside the 100 x 100 corner, or the browser repeats the overspill along the sides
ORNAMENT = """
<g class="orn" fill="url(#gold)" stroke="#3a2705" stroke-width="1.1" stroke-linejoin="round" transform="translate(-2 -2) scale(1.06)">
  <!-- the scrolls that run along the top and down the side -->
  <path d="M30 26 C44 10 70 8 86 16 C96 22 94 36 84 36 C76 36 74 28 80 26 C74 22 60 22 48 30 Z"/>
  <path d="M26 30 C10 44 8 70 16 86 C22 96 36 94 36 84 C36 76 28 74 26 80 C22 74 22 60 30 48 Z"/>
  <!-- leaves of the palmette, opening toward the picture -->
  <path d="M34 34 C46 30 62 38 70 54 C58 52 46 46 34 34 Z"/>
  <path d="M34 34 C30 46 38 62 54 70 C52 58 46 46 34 34 Z"/>
  <path d="M34 34 C48 42 58 56 62 64 C52 58 42 48 34 34 Z"/>
  <!-- a small shell toward the outer corner -->
  <path d="M30 30 C22 22 14 12 8 8 C14 10 24 16 30 24 C26 16 22 10 20 6 C28 10 32 20 32 28 Z"/>
  <!-- the boss -->
  <circle cx="33" cy="33" r="8" fill="url(#boss)"/>
</g>"""


def main():
    defs = [
        gradient("g-top", 0, 0, 0, 100), gradient("g-bottom", 0, 300, 0, 200),
        gradient("g-left", 0, 0, 100, 0), gradient("g-right", 300, 0, 200, 0),
        '<radialGradient id="gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff1bf"/><stop offset=".35" stop-color="#e8bb4a"/><stop offset=".75" stop-color="#a77a1e"/><stop offset="1" stop-color="#5a3d0a"/></radialGradient>',
        '<radialGradient id="boss" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#f0c95a"/><stop offset="1" stop-color="#6b4a0c"/></radialGradient>',
        '<radialGradient id="bead" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff4c4"/><stop offset=".5" stop-color="#d4a22e"/><stop offset="1" stop-color="#4a3208"/></radialGradient>',
    ]
    sides = (
        '<path d="M0 0 H300 L200 100 H100 Z" fill="url(#g-top)"/>'
        '<path d="M0 300 H300 L200 200 H100 Z" fill="url(#g-bottom)"/>'
        '<path d="M0 0 V300 L100 200 V100 Z" fill="url(#g-left)"/>'
        '<path d="M300 0 V300 L200 200 V100 Z" fill="url(#g-right)"/>'
    )
    corners = "".join(f'<g transform="{t}">{ORNAMENT}</g>' for t in (
        "", "translate(300 0) scale(-1 1)", "translate(0 300) scale(1 -1)", "translate(300 300) scale(-1 -1)"))
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">'
        f'<defs>{"".join(defs)}</defs>{sides}'
        f'<g fill="url(#bead)" stroke="#3a2705" stroke-width=".5">{beads()}</g>'
        f'<rect x="100" y="100" width="100" height="100" fill="#000"/>{corners}</svg>\n'
    )
    OUT.write_text(svg, encoding="utf-8")
    print(f"wrote {OUT.relative_to(OUT.parent.parent.parent)} ({len(svg)} bytes)")


if __name__ == "__main__":
    main()
