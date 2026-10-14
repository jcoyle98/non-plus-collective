# nonpluscollective

A small static site: Lacan's barred subject, large, on dark purple, plus a directory of sites. No dependencies beyond Python 3.

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
| Menu and the parts every page shares | `templates/base.html` |
| Home page / directory page content | `templates/home.html`, `templates/directory.html` |
| Adding a page | `PAGES` in `build.py` |
| Scroll-to-rotate behaviour | `static/rotate.js` (`DEGREES_PER_PIXEL` sets the speed) |
| Site icon (black barred S on its side) | `static/favicon.svg`, plus PNG/ICO copies |
| The barred S itself | `templates/barred-s.svg` (EB Garamond's S plus a diagonal bar) |

## Publishing

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`
(set the repo's **Settings → Pages → Source** to **GitHub Actions**).
