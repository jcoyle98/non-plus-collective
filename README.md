# nonpluscollective

A small static site: Lacan's barred subject, large, on dark purple, plus a directory of sites
and a design page for trying out colour palettes. No dependencies beyond Python 3.

## Preview locally

```
python3 build.py --serve
```

Open http://localhost:8001.
The page rebuilds when you save a file; refresh to see it.

## Edit

| What | Where |
|---|---|
| Colours | top of `static/style.css` (`--mauve`, `--bright`) |
| Size of the barred S | `.barred-s` in `static/style.css` |
| Title, description | `config.json` |
| Sites listed on the directory page | `directory` in `config.json` |
| Menu | `templates/menu.html` |
| The parts every page shares | `templates/base.html` |
| Page content | `templates/home.html`, `templates/directory.html`, `templates/design.html` |
| Palettes on the design page | `palettes` in `config.json`; behaviour in `static/palette.js` |
| Adding a page | `PAGES` in `build.py` |
| Draft pages (no menu, reached only by link) | `DRAFTS` in `build.py`; the hidden-S draft is `templates/draft-disappearing-s.html` and `static/reveal.js` |
| Scroll-to-rotate behaviour | `static/rotate.js` (`DEGREES_PER_PIXEL` sets the speed) |
| Site icon (black barred S on its side) | `static/favicon.svg`, plus PNG/ICO copies |
| Text font (EB Garamond, bundled) | `static/fonts/`, `@font-face` at the top of `static/style.css` |
| The barred S itself | `templates/barred-s.svg` (EB Garamond's S plus a diagonal bar) |

## Publishing

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`
(set the repo's **Settings → Pages → Source** to **GitHub Actions**).
