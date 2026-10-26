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
    ("designs", "Drafts", "drafts.html", "Designs", []),
    ("drafts", "Drafts", "forward.html", "Designs", []),
    ("color-palette-design", "Design", "design.html", "Colour palettes", ["palette.js"]),
    ("draft-disappearing-s", "Design", "draft-disappearing-s.html", "Design (draft)", ["palette.js", "reveal.js"]),
    ("draft-arterial", "Design", "draft-arterial.html", "Design (draft)", ["palette.js", "reveal.js", "looks.js"]),
    ("draft-newspaper", "Design", "draft-newspaper.html", "Design (draft)", ["palette.js", "reveal.js", "looks.js", "newspaper.js"]),
    ("draft-hurricane", "Design", "draft-hurricane.html", "Design (draft)", ["hurricane.js", "panels.js"]),
    ("draft-radiolarian", "Design", "draft-radiolarian.html", "Design (draft)", ["radiolarian.js", "panels.js"]),
    ("draft-chamber", "Design", "draft-chamber.html", "Design (draft)", ["chamber.js", "panels.js"]),
    ("draft-tracks", "Design", "draft-tracks.html", "Design (draft)", ["tracks.js", "panels.js"]),
    ("draft-bubble", "Design", "draft-bubble.html", "Design (draft)", ["bubble.js", "panels.js"]),
    ("draft-flicker", "Design", "draft-flicker.html", "Design (draft)", ["flicker-images.js", "photo-deck.js", "hurricane.js", "flicker.js", "panels.js"]),
    ("draft-scroll", "Design", "draft-scroll-lab.html", "Design (draft)", ["flicker-images.js", "photo-deck.js", "scroll.js", "scroll-lab.js"]),
    ("draft-scroll-lab", "Design", "draft-scroll-lab.html", "Design (draft)", ["flicker-images.js", "photo-deck.js", "scroll.js", "scroll-lab.js"]),
    ("draft-archive", "Design", "draft-archive.html", "Design (draft)", ["flicker-images.js", "photo-deck.js", "scroll.js", "scroll-lab.js"]),
    ("humanize", "Humanize", "draft-humanize.html", "Humanize", ["flicker-images.js", "photo-deck.js", "humanize.js"]),
    ("scroll-static-final", "Design", "scroll-static-final.html", None, ["flicker-images.js", "photo-deck.js", "scroll.js"]),
]
# The final version of draft-archive: the settings chosen in its Options, fixed (and no Options).
# The photo in the "Night and blue" treatment (the filter is in templates/scroll-static-final.html)
# at 35%, no shade on the opening screen and 50% behind the text, a new photo every 200px of
# scrolling (data-step), IM Fell English throughout, every text colour white, "non plus" lower case.
FINAL_SETTINGS = (
    "--sd-photo-filter: url(#ssf-night-blue); --sd-ground: #180826; --sd-photo-opacity: .35; "
    "--sd-veil-hero: 0; --sd-veil-text: .5; "
    "--sd-word-font: 'IM Fell English'; --sd-head-font: 'IM Fell English'; --sd-text-font: 'IM Fell English'; "
    "--sd-fg: #ffffff; --sd-dim: #ffffff; --sd-word: #ffffff; --sd-link: #ffffff; --sd-word-case: none"
)
DRAFTS = {   # each design, and what it tries, as listed on /design
    "humanize": "The white IM Fell English wordmark over blue-toned images that change as you move the mouse.",
    "color-palette-design": "The site's own design, for trying the colour palettes: pick one, or choose which colour plays which part.",
    "draft-disappearing-s": "The barred S hidden in the background colour: hover to see it, click to draw the bar and open the directory.",
    "draft-arterial": "Image 142's arterial engraving in place of the S, as ink or a negative, with a frame switch and a grain slider.",
    "draft-newspaper": "Newspaper layouts: the title and a random passage of Proust, in French, filling the window beside the engraving, in five versions to compare.",
    "draft-hurricane": "Hurricane Gracie on a 1959 Navy radar scope, full-screen at 4K, in black and white, inverted, or washed in the palettes; About, Directory and Featured Writings across the top in the colour of 'non plus', with a switch to hide the options, and 'non plus' coming out of the eye, draggable, with a choice of colours and fonts.",
    "draft-radiolarian": "Image 91, a radiolarian, on a diagonal: the stem from the top-right corner down to the body, its open end facing left, on a page of its own black; two layouts to compare: NON PLUS top left with the links stacked lower left, or NON PLUS in the middle with a short line and the links spread across its width; a switch to hide the options; the same colour treatments and fonts.",
    "draft-chamber": "Image 30, a cloud chamber, its labels removed, turned so the chamber's two plates split the window into three columns (rows on tall windows), under a bar of links (About, Directory, Featured Writings, and a switch to hide the options) in the image's dark colour; NON PLUS floats over it, draggable, in its own colour; colour treatments, bar colours and fonts.",
    "draft-tracks": "Image 25, bubble-chamber tracks, its border cut away and its uneven exposure evened, filling the window; About, Directory, Featured Writings top left; NON PLUS to drag, with its own colour, font, italics and an optional box; the same colour treatments.",
    "draft-bubble": "Image 23, a round bubble chamber from 1955, as a stencil centred on a page of its own colour, so its surround always matches; links top left; NON PLUS to drag, with its own colour, font, italics and an optional box; the same colour treatments.",
    "draft-flicker": "The hurricane draft's page and options, but the photo changes on every mouse move, key press or click (on a phone, every scroll or swipe), cycling through all 155 photos, with a Pace slider to slow it down: the whole image gallery plus the two in this repo; a switch to hold one, and ten places to try for the links (top, middle or bottom; left, centre, right or spread).",
    "draft-scroll": "For phones first, and on a computer too: the Archive (placeholder pieces for now), the Directory and Contact as sections of one long page that scrolls over a still photo; the photo changes every 200 px or so of scrolling, and on every movement of a mouse; the links glide to each section and mark the one being read: along the top on a phone, and on a computer in a column down the left that never scrolls, with the page scrolling on the right. An Options button opens a sheet (a column down the right on a computer) for the layout, the photo, 'non plus', the links and the text; choices are kept on your device, and Reset goes back to the draft.",
    "draft-scroll-lab": "The same as draft-scroll (it had the Options sheet first), kept so its address still works; the two share their saved choices.",
    "draft-archive": "The Archive as the whole site: on a computer, 'Archive' and the titles of the pieces in a column down the left that never scrolls; on the right the page opens on 'non plus', then the Directory (with a link to it above 'Archive'), then every piece in full, one after another, and a title glides down to its piece, marked with an asterisk while it's being read. editors@nonplusmagazine.com stays at the bottom centre of the screen. The photo changes as you scroll and move the mouse, and the one-page draft's Options are here too.",
    "scroll-static-final": "The final version of draft-archive, with its settings fixed: the photo in the Night and blue treatment at 35%, no shade on the opening screen and 50% behind the text, a new photo every 200px of scrolling (and on mouse movement); IM Fell English throughout, all text white, 'non plus' in lower case. No Options.",
}
HIDDEN = {"design", "designs", "drafts", *DRAFTS}   # pages with no menu, left out of the menu


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
    panels = render("panels.html", sites=sites)   # the window the drafts' links open
    drafts = "\n".join(
        f'<li><a href="../{folder}/">{folder}</a><p>{html.escape(about)}</p></li>' for folder, about in DRAFTS.items()
    )
    archive = json.loads((ROOT / "content" / "archive.json").read_text(encoding="utf-8"))["pieces"]
    humanize_works = "\n".join(
        f'<li><a href="works/{html.escape(p["slug"], quote=True)}/">'
        f'{html.escape(p["title"])} - {html.escape(p["author"])}</a></li>'
        for p in archive
    )
    archive_list = "\n".join(   # the one-page draft's Archive section: each title links to the piece's own page
        f'<li class="sd-entry"><a class="sd-entry-link" href="archive/{p["slug"]}/">'
        f'<span class="sd-title">{html.escape(p["title"])}</span>'
        f'<span class="sd-meta">{html.escape(p["author"])} · {html.escape(p["date"])}</span></a></li>'
        for p in archive
    )

    archive_index = "\n".join(   # the archive draft's list of titles, each linking down to its piece
        f'<a href="#piece-{p["slug"]}">{html.escape(p["title"])}</a>' for p in archive
    )
    archive_pieces = "\n".join(   # ...and the pieces themselves, one after another
        f'<article class="sd-section ar-piece" id="piece-{p["slug"]}" aria-labelledby="h-{p["slug"]}">\n'
        f'<h2 id="h-{p["slug"]}">{html.escape(p["title"])}</h2>\n'
        f'<p class="sd-byline">{html.escape(p["author"])} · {html.escape(p["date"])}</p>\n'
        f'<div class="sd-text">\n' + "\n".join(f"<p>{html.escape(par)}</p>" for par in p["text"]) + "\n</div>\n</article>"
        for p in archive
    )

    def write(folder, label, title, content, scripts):
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
            menu="" if folder in HIDDEN or "/" in folder else render("menu.html", nav=nav),
            content=content(root),
            scripts="\n".join(f'<script src="{root}static/{js}?v={version}"></script>' for js in scripts),
        )
        (OUT / folder).mkdir(parents=True, exist_ok=True)
        (OUT / folder / "index.html").write_text(page, encoding="utf-8")

    for folder, label, template, title, scripts in PAGES:
        write(folder, label, title, lambda root, template=template: render(
            template, root=root, barred_s=barred_s, sites=sites, palettes=palettes, drafts=drafts, panels=panels, archive=archive_list, archive_index=archive_index, archive_pieces=archive_pieces,
            scroll_page=render("draft-scroll.html", root=root, sites=sites, archive=archive_list),   # the lab version wraps the one-page draft
            lab_sheet=render("scroll-lab-sheet.html"),
            archive_page=render("archive-page.html", root=root, sites=sites, archive_index=archive_index, archive_pieces=archive_pieces, main_attrs=""),
            archive_page_final=render("archive-page.html", root=root, sites=sites, archive_index=archive_index, archive_pieces=archive_pieces,
                                      main_attrs=f' style="{FINAL_SETTINGS}"'),
            humanize_background=render("humanize-background.html", root=root), humanize_works=humanize_works,
        ), scripts)

    # Humanize has its own directory and a permanent reading page for every work.
    write("humanize/directory", "Humanize", "Directory", lambda root: render(
        "humanize-page.html", root=root, humanize_background=render("humanize-background.html", root=root),
        title="directory", byline="", body=f'<ul class="humanize-directory">{sites}</ul>',
        directory_current=' aria-current="page"', back_link="",
    ), [])
    for p in archive:
        write(f"humanize/works/{p['slug']}", "Humanize", p["title"], lambda root, p=p: render(
            "humanize-page.html", root=root, humanize_background=render("humanize-background.html", root=root),
            title=html.escape(p["title"]),
            byline=f'<p class="humanize-byline">{html.escape(p["author"])} · {html.escape(p["date"])}</p>',
            body="\n".join(f'<p>{html.escape(par)}</p>' for par in p["text"]), directory_current="",
            back_link=f'<p class="humanize-back"><a href="{root}humanize/#humanize-works-heading">all works</a></p>',
        ), [])

    # each Archive piece's own page, under both addresses of the one-page draft (both have the Options sheet)
    for draft, lab in (("draft-scroll", True), ("draft-scroll-lab", True)):
        for p in archive:
            body = "\n".join(f"<p>{html.escape(par)}</p>" for par in p["text"])
            write(f"{draft}/archive/{p['slug']}", "Design", f"{p['title']} (draft)", lambda root, p=p, body=body, lab=lab: render(
                "scroll-piece.html", root=root, title=html.escape(p["title"]), author=html.escape(p["author"]),
                date=html.escape(p["date"]), body=body, lab_sheet=render("scroll-lab-sheet.html") if lab else "",
            ), ["flicker-images.js", "scroll-piece.js"] + (["scroll-lab.js"] if lab else []))

    (OUT / ".nojekyll").touch()
    print("Built _site/")


def snapshot():
    watched = [ROOT / "config.json", ROOT / "build.py"]
    for folder in ("templates", "static", "content"):
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
