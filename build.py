#!/usr/bin/env python3
"""Build the site into _site/. No dependencies beyond Python 3.

    python3 build.py           # build once
    python3 build.py --serve   # build, serve at http://localhost:8001,
                               # and rebuild whenever a file changes

The page is templates/base.html; the barred S is templates/barred-s.svg;
colours are at the top of static/style.css; title and description are in
config.json.
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


def build():
    config = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "static", OUT / "static")
    page = Template((ROOT / "templates" / "base.html").read_text(encoding="utf-8")).substitute(
        site_title=html.escape(config["site_title"]),
        description=html.escape(config["description"]),
        static_version=static_version(),
        barred_s=(ROOT / "templates" / "barred-s.svg").read_text(encoding="utf-8"),
    )
    (OUT / "index.html").write_text(page, encoding="utf-8")
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
