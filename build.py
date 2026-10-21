#!/usr/bin/env python3
"""Build the site into _site/. No dependencies beyond Python 3.

    python3 build.py           # build once
    python3 build.py --serve   # build, serve at http://localhost:8001,
                               # and rebuild whenever a file changes

Every page shares templates/base.html (head) and templates/menu.html; each page's own
content is a template listed in PAGES below. The barred S is
templates/barred-s.svg; colours are at the top of static/style.css; title,
description, the directory's list of sites and the design page's
palettes are in config.json.
"""

import hashlib
import html
import json
import shutil
import sys
from pathlib import Path
from string import Template

ROOT = Path(__file__).parent
OUT = ROOT / "_site"
PORT = 8001  # not 8000, so it can run alongside other local previews


def static_version():
    """Changes whenever anything in static/ does, so browsers never use a stale copy."""
    h = hashlib.md5()
    for f in sorted((ROOT / "static").rglob("*")):
        if f.is_file():
            h.update(f.read_bytes())
    return h.hexdigest()[:8]


PAGES = [
    # (output folder, menu label, content template, title, scripts)
    ("", "Home", "home.html", None, ["rotate.js"]),
    ("directory", "Directory", "directory.html", "Directory", []),
    # Designs: built like any page but with no menu, and left out of everyone else's,
    # so only a link reaches them; /design lists them all (and /drafts, its old
    # address, forwards there)
    ("design", "Drafts", "drafts.html", "Designs", []),
    ("drafts", "Drafts", "forward.html", "Designs", []),
    ("color-palette-design", "Design", "design.html", "Colour palettes", ["palette.js"]),
    ("draft-disappearing-s", "Design", "draft-disappearing-s.html", "Design (draft)", ["palette.js", "reveal.js"]),
    ("draft-arterial", "Design", "draft-arterial.html", "Design (draft)", ["palette.js", "reveal.js", "looks.js"]),
    ("draft-newspaper", "Design", "draft-newspaper.html", "Design (draft)", ["palette.js", "reveal.js", "looks.js", "newspaper.js"]),
    ("draft-hurricane", "Design", "draft-hurricane.html", "Design (draft)", ["hurricane.js"]),
    ("draft-radiolarian", "Design", "draft-radiolarian.html", "Design (draft)", ["radiolarian.js"]),
    ("draft-chamber", "Design", "draft-chamber.html", "Design (draft)", ["chamber.js"]),
]
DRAFTS = {   # each design, and what it tries, as listed on /design
    "color-palette-design": "The site's own design, for trying the colour palettes: pick one, or choose which colour plays which part.",
    "draft-disappearing-s": "The barred S hidden in the background colour: hover to see it, click to draw the bar and open the directory.",
    "draft-arterial": "Image 142's arterial engraving in place of the S, as ink or a negative, with a frame switch and a grain slider.",
    "draft-newspaper": "Newspaper layouts: the title and a random passage of Proust, in French, filling the window beside the engraving, in five versions to compare.",
    "draft-hurricane": "Hurricane Gracie on a 1959 Navy radar scope, full-screen at 4K, in black and white, inverted, or washed in the palettes; a menu top left (directory, featured writings), and 'non plus' coming out of the eye, draggable, with a choice of colours and fonts.",
    "draft-radiolarian": "Image 91, a radiolarian, on a diagonal: the stem from the top-right corner down to the body, its open end facing left, on a page of its own black; two layouts to compare: NON PLUS top left with 'Directory' and 'Featured Writings' stacked lower left, or NON PLUS in the middle with a short line and the links under it; the same colour treatments and fonts.",
    "draft-chamber": "Image 30, a cloud chamber, its labels removed, turned so the chamber's two plates split the window into three columns (rows on tall windows), under a bar of links (About, Directory, Featured Writings, Events, Contact) in the image's dark colour; NON PLUS floats over it, draggable, in its own colour; colour treatments, bar colours and fonts.",
}
HIDDEN = {"design", "drafts", *DRAFTS}   # pages with no menu, left out of the menu


def render(template, **values):
    return Template((ROOT / "templates" / template).read_text(encoding="utf-8")).substitute(values)


def build():
    config = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "static", OUT / "static")
    shutil.copy(ROOT / "static" / "favicon.ico", OUT / "favicon.ico")  # browsers look for it at the root
    version = static_version()
    barred_s = (ROOT / "templates" / "barred-s.svg").read_text(encoding="utf-8")
    sites = "\n".join(
        f'<li><a href="https://{html.escape(site)}">{html.escape(site)}</a></li>' for site in sorted(config["directory"], key=str.lower)  # alphabetical, whatever order config.json uses
    )
    palettes = json.dumps(config["palettes"])
    drafts = "\n".join(
        f'<li><a href="../{folder}/">{folder}</a><p>{html.escape(about)}</p></li>' for folder, about in DRAFTS.items()
    )
    for folder, label, template, title, scripts in PAGES:
        root = "../" * (folder.count("/") + 1) if folder else "./"  # relative links work under any base path
        nav = "\n".join(
            f'<a href="{root}{f + "/" if f else ""}"' + (' aria-current="page"' if f == folder else "") + f">{l}</a>"
            for f, l, *_ in PAGES
            if f not in HIDDEN
        )
        page = render(
            "base.html",
            page_title=html.escape(f"{title} · {config['site_title']}" if title else config["site_title"]),
            description=html.escape(config["description"]),
            static_version=version,
            root=root,
            page=label.lower(),
            menu="" if folder in HIDDEN else render("menu.html", nav=nav),
            content=render(template, root=root, barred_s=barred_s, sites=sites, palettes=palettes, drafts=drafts),
            scripts="\n".join(f'<script src="{root}static/{js}?v={version}"></script>' for js in scripts),
        )
        (OUT / folder).mkdir(parents=True, exist_ok=True)
        (OUT / folder / "index.html").write_text(page, encoding="utf-8")
    (OUT / ".nojekyll").touch()
    print("Built _site/")


def snapshot():
    watched = [ROOT / "config.json", ROOT / "build.py"]
    for folder in ("templates", "static"):
        watched += (ROOT / folder).rglob("*")
    return {p: p.stat().st_mtime for p in watched if p.is_file()}


def serve():
    import functools
    import http.server
    import os
    import threading
    import time

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(("localhost", PORT), functools.partial(Quiet, directory=str(OUT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Serving at http://localhost:{PORT}  (Ctrl-C to stop)")
    last = snapshot()
    try:
        while True:
            time.sleep(1)
            current = snapshot()
            if current != last:
                if current.get(ROOT / "build.py") != last.get(ROOT / "build.py"):
                    print("build.py changed; restarting")
                    server.server_close()
                    os.execv(sys.executable, [sys.executable, *sys.argv])
                last = current
                try:
                    build()
                except Exception as e:
                    print(f"  build failed: {e}")
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    build()
    if "--serve" in sys.argv:
        serve()
