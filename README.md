# nonpluscollective

A small static site: Lacan's barred subject, large, on dark purple, plus a directory of sites
and, off the menu, a list of designs to try at `/design`, among them one for trying out colour palettes. No dependencies beyond Python 3.

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
| Sites listed on the directory page (shown alphabetically) | `directory` in `config.json` |
| Menu | `templates/menu.html` |
| The parts every page shares | `templates/base.html` |
| Page content | `templates/home.html`, `templates/directory.html`, `templates/design.html` |
| Palettes on the colour palette design (`/color-palette-design`, from `templates/design.html`) | `palettes` in `config.json` (add `"roles"` to fix which colour is background, text, barred S and headline); behaviour in `static/palette.js` |
| Adding a page | `PAGES` in `build.py` |
| Designs (no menu, reached only by link, listed at `/design`) | `DRAFTS` in `build.py`, with the line `/design` shows for each; the hidden-S draft is `templates/draft-disappearing-s.html` and `static/reveal.js` |
| Humanize (`/humanize`, listed at `/design` and `/designs`) | `templates/draft-humanize.html`, `static/humanize.js`, and styles under `body.humanize` in `static/style.css`: a white italic IM Fell English wordmark over the shared photo deck, changing on mouse movement; Night and blue, 40% photo opacity and 50% shade. |
| Humanize works and directory | The home page lists titles and authors from the archive (`content/archive/`), separated by `//`. Each links to `/humanize/works/<slug>/`; `/humanize/directory/` lists the sites from `config.json`. Both use `templates/humanize-page.html` and the shared `templates/humanize-background.html`, with a still background and 66% shade for reading. The works list, directory link, directory page, and reading text use upright Cardo; the logo uses IM Fell English italic. Background images have a subtle blur and a tiled grain overlay. The directory navigation stays visible while scrolling. Only work pages show the “all works” return link. |
| The newspaper draft (five versions) | `templates/draft-newspaper.html`, `static/newspaper.js`; the designs are at the end of `static/style.css`; its font, for the st and ct ligatures, is `static/fonts/eb-garamond-latin-400-st.woff2` (EB Garamond, all other discretionary ligatures left out); the Proust text is `static/proust/`, made by `tools/proust.py` |
| The whole image gallery (source material, not published) | `tools/source/gallery/<section>/`, copied from the [image gallery](https://github.com/jcoyle98/non-plus-image-gallery); each image's artist, licence and source are in `tools/source/gallery/credits.json`. Credit them wherever an image is used |
| The arterial-engraving draft | `templates/draft-arterial.html`, `static/looks.js` (the image toggles), image 142 from the image gallery in `tools/source/` (not published). Made from it, into `static/images/`: the lines-only masks (`tools/ink_mask.py`), the copy without the border and page number (`tools/unframe.py`) and the background grain tiles (`tools/grain.py`) |
| The hurricane draft | `templates/draft-hurricane.html`, `static/hurricane.js` (the image colour treatments are the `LOOKS` list, the wordmark colours `WORDS`, its fonts `FONTS`), its styles at the end of `static/style.css`; the 4K image is made by `tools/hurricane.py` into `static/images/hurricane-gracie-4k.jpg` |
| The radiolarian draft | `templates/draft-radiolarian.html`, `static/radiolarian.js` (`LOOKS`, `FONTS`), its styles at the end of `static/style.css`; the image (gallery image 91) is made by `tools/radiolarian.py` into `static/images/radiolarian-91-mask.png`, a stencil the page colour shows through, so the background always matches |
| The bubble draft | `templates/draft-bubble.html`, `static/bubble.js`, its styles at the end of `static/style.css`; the stencil (gallery image 23) is made by `tools/bubble.py` |
| The flicker draft | `templates/draft-flicker.html`, `static/flicker.js` (the swapping, and its Pace), the photo loading shared with the one-page draft in `static/photo-deck.js`, with the hurricane draft's options from `static/hurricane.js`; its styles at the end of `static/style.css`. The photos, in two sizes, and their credits (`static/flicker-images.js`) are made by `tools/flicker.py` from `tools/source/gallery/` and the photos listed in its `EXTRAS` |
| The one-page draft | `templates/draft-scroll.html` (its sections and their placeholder text), `static/scroll.js`, its styles at the end of `static/style.css`; the photo changes every `data-step` pixels scrolled (on its `<main>`), from the flicker draft's photos via `static/photo-deck.js` |
| Humanize 3.0 | `templates/draft-humanize-3.html`, `static/humanize-3.js`, its styles at the end of `static/style.css`: one text from the archive, at random, in a black box under 'non plus' |
| Hurricane 2.0 | `templates/draft-hurricane-2.html`, `static/hurricane-2.js`, its styles at the end of `static/style.css`: a black box over the hurricane's eye; Directory and Work open a panel on the left |
| The archive's pieces | `content/archive/`, one text file per piece, named `YYYY-MM-DD-slug.txt`, in exactly Desiring Machines' format (the title; `author:` and `link:` lines; a blank line; the text). Poems keep their lines and indentation, and a long line wraps with its overflow indented; a file starting with a `<prose>` line is prose, set like a book. The format is in `writing.py`, which explains every rule. Files starting with `_` are examples (the example poem and essay), shown only on Humanize 2.0 |
| The one-page draft's Archive | the archive (`content/archive/`, see below). `build.py` lists them in the Archive section and gives each its own page at `draft-scroll/archive/<slug>/` (and under `draft-scroll-lab/`), from `templates/scroll-piece.html`; that page shows the photo that was behind the title when it was tapped (`static/scroll-piece.js`) |
| The Archive draft | `templates/draft-archive.html`: the list of titles and the pieces come from the archive (`content/archive/`, built by `build.py`); it reuses the one-page draft's `static/scroll.js`, photos and Options, and its own styles (`.ar-layout`) at the end of `static/style.css` |
| The one-page draft's Options | `templates/scroll-lab-sheet.html` (the sheet, on both `draft-scroll` and `draft-scroll-lab` and their piece pages), `static/scroll-lab.js` (the options: `OPTIONS`, with the lists `FONTS`, `LOOKS`, `BRIGHT` and `TEXT`), its styles at the end of `static/style.css`. Each option sets a variable or data attribute on the draft's `<main>`; their defaults are in its styles |
| The window the drafts' About, Directory and Featured Writings links open | `templates/panels.html` (its tabs and their text; the Directory tab lists `directory` from `config.json`), `static/panels.js`, its styles at the end of `static/style.css`. A draft gets it by ending its template with `$panels`, giving its links `data-panel="about"`, `"directory"` or `"writings"`, and listing `panels.js` in its scripts in `build.py` |
| The tracks draft | `templates/draft-tracks.html`, `static/tracks.js` (`LOOKS`, `WORDS`, `FONTS`, and `DEFAULT`, where NON PLUS starts), its styles at the end of `static/style.css`; the image (gallery image 25) is made by `tools/tracks.py` |
| The cloud-chamber draft | `templates/draft-chamber.html`, `static/chamber.js` (`LOOKS`, `FONTS`, and the bar colours), its styles at the end of `static/style.css`; the two images (gallery image 30, wide and tall) are made by `tools/chamber.py` |
| Scroll-to-rotate behaviour | `static/rotate.js` (`DEGREES_PER_PIXEL` sets the speed) |
| Site icon (black barred S on its side) | `static/favicon.svg`, plus PNG/ICO copies |
| Text font (EB Garamond, bundled) | `static/fonts/`, `@font-face` at the top of `static/style.css` |
| The barred S itself | `templates/barred-s.svg` (EB Garamond's S plus a diagonal bar) |

## Publishing

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`
(set the repo's **Settings → Pages → Source** to **GitHub Actions**).
