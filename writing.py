"""The archive's writing format, the same as Desiring Machines' (desiringmachines.com, ~/web/build.py, whose
formatting functions are copied here unchanged), so a piece can move between the two as it is.

Each piece is a text file in content/archive/, named YYYY-MM-DD-slug.txt:

    Title of the Piece
    author: Name
    link: https://their.site
    <subtitle>optional, italic, under the title</subtitle>

    The text...

Pieces are poems unless the file starts with a <prose> line. Poems keep their line breaks and indentation
(leading spaces indent; a long line wraps with its overflow indented under it); a blank line starts a stanza;
"| text" centres a line; <annotation>...</annotation> sets a note flush right. Prose: a blank line starts a
paragraph (set like a book: justified, first lines indented); \"\"\"...\"\"\" is a block quote and <poem>...</poem>
a passage of verse. Anywhere: *italic*, **bold**, <sanskrit>SLP1</sanskrit> (Devanagari), <epigraph>...</epigraph>.

A file whose name starts with "_" is an example: shown on Humanize 2.0 (a design page) to demonstrate the
format, and left out of everything else.
"""
import html
import re
import unicodedata
from datetime import date
from pathlib import Path


# SLP1 -> Devanagari. Consonants carry an inherent "a"; other vowels after a
# consonant become vowel signs, and a consonant with no vowel gets a virama.
SLP1_VOWELS = {
    "a": ("अ", ""), "A": ("आ", "ा"), "i": ("इ", "ि"), "I": ("ई", "ी"),
    "u": ("उ", "ु"), "U": ("ऊ", "ू"), "f": ("ऋ", "ृ"), "F": ("ॠ", "ॄ"),
    "x": ("ऌ", "ॢ"), "X": ("ॡ", "ॣ"), "e": ("ए", "े"), "E": ("ऐ", "ै"),
    "o": ("ओ", "ो"), "O": ("औ", "ौ"),
}
SLP1_CONSONANTS = dict(zip(
    "kKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL",
    "कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ",
))
SLP1_OTHER = {
    "M": "ं", "H": "ः", "~": "ँ", "'": "ऽ", "||": "॥", "|": "।", "..": "॥", ".": "।",
    **{str(d): chr(0x0966 + d) for d in range(10)},
}
SANSKRIT_RE = re.compile(r"<sanskrit>(.*?)<[/\\]sanskrit>", re.DOTALL)


def slp1_to_devanagari(text):
    out, i = [], 0
    while i < len(text):
        c = text[i]
        if c in SLP1_CONSONANTS:
            out.append(SLP1_CONSONANTS[c])
            nxt = text[i + 1] if i + 1 < len(text) else ""
            if nxt in SLP1_VOWELS:
                out.append(SLP1_VOWELS[nxt][1])
                i += 1
            else:
                out.append("्")
        elif c in SLP1_VOWELS:
            out.append(SLP1_VOWELS[c][0])
        elif c == "." and text[i - 1:i].isdigit() and text[i + 1:i + 2].isdigit():
            out.append(".")  # keep the point in verse numbers like 2.47
        elif text[i:i + 2] in SLP1_OTHER:
            out.append(SLP1_OTHER[text[i:i + 2]])
            i += 1
        else:
            out.append(SLP1_OTHER.get(c, c))
        i += 1
    return "".join(out)


def read_text(path):
    """Read a UTF-8 file, composing accents (e.g. a + combining acute -> á) so
    fonts use their precomposed letters, which are better drawn, and turning
    <sanskrit>SLP1</sanskrit> into Devanagari."""
    text = unicodedata.normalize("NFC", path.read_text(encoding="utf-8"))
    text = SANSKRIT_RE.sub(lambda m: slp1_to_devanagari(m.group(1)), text)
    if "<sanskrit>" in text:
        print(f"  warning: {path.name} has a <sanskrit> tag that is never closed")
    return text


def inline(text):
    """Escape HTML, then turn **words** into bold and *words* into italics."""
    text = re.sub(r"\*\*(\S(?:.*?\S)?)\*\*", r"<strong>\1</strong>", html.escape(text))
    return re.sub(r"\*(\S(?:.*?\S)?)\*", r"<em>\1</em>", text)


def blocks(text):
    """Split text into blocks separated by one or more blank lines."""
    return [b for b in re.split(r"\n\s*\n", text.strip("\n")) if b.strip()]


ANNOTATION_RE = re.compile(r"<(?:right-)?annotation>(.*?)<[/\\](?:right-)?annotation>")


def render_poem(body):
    stanzas = []
    for stanza in blocks(body):
        lines = []
        for line in stanza.rstrip().splitlines():
            # <annotation>...</annotation>: set flush right, level with the line
            notes = "".join(f'<span class="annot">{inline(n.strip())}</span>'
                            for n in ANNOTATION_RE.findall(line))
            line = ANNOTATION_RE.sub("", line).rstrip()
            stripped = line.lstrip(" \t")
            if stripped.startswith("|"):  # "| text" = centered line
                lines.append(f'<span class="line center">{notes}{inline(stripped[1:].strip())}</span>')
                continue
            indent = len(line[: len(line) - len(stripped)].expandtabs(4))
            style = f' style="margin-left:{indent * 0.5:g}em"' if indent else ""
            text = inline(stripped) or "&nbsp;"
            lines.append(f'<span class="line"{style}>{notes}{text}</span>')
        stanzas.append('<p class="stanza">\n' + "\n".join(lines) + "\n</p>")
    return '<div class="poem">\n' + "\n".join(stanzas) + "\n</div>"


def render_paragraphs(text, continues=False):
    """continues=True: the first block carries on a paragraph interrupted by a quote."""
    paragraphs = []
    for i, b in enumerate(blocks(text)):
        b = " ".join(b.split())
        if b.startswith("|"):  # "| text" = centered paragraph
            paragraphs.append(f'<p class="center">{inline(b[1:].strip())}</p>')
        elif i == 0 and continues:
            paragraphs.append(f'<p class="cont">{inline(b)}</p>')
        else:
            paragraphs.append(f"<p>{inline(b)}</p>")
    return "\n".join(paragraphs)


BLOCK_RE = re.compile(r'"""(.*?)"""|<poem>(.*?)<[/\\]poem>', re.DOTALL)


def render_prose(text):
    """Paragraphs, with \"\"\"...\"\"\" as a block quote and <poem>...</poem> as an
    inset passage of verse (same rules as a poem file)."""
    html_parts, pos = [], 0

    def add_paragraphs(chunk, after_block):
        if chunk.strip():
            # Text straight after a quote or poem (no blank line) continues the paragraph
            continues = after_block and not re.match(r"[ \t]*\n[ \t]*\n", chunk)
            html_parts.append(render_paragraphs(chunk, continues))

    for m in BLOCK_RE.finditer(text):
        add_paragraphs(text[pos:m.start()], after_block=pos > 0)
        if m.group(1) is not None:
            html_parts.append(f"<blockquote>\n{render_paragraphs(m.group(1))}\n</blockquote>")
        else:
            html_parts.append(f'<blockquote class="verse">\n{render_poem(m.group(2))}\n</blockquote>')
        pos = m.end()
    rest = text[pos:]
    for marker in ('"""', "<poem>"):
        if marker in rest:
            print(f"  warning: unmatched {marker} (left open)")
    add_paragraphs(rest, after_block=pos > 0)
    return "\n".join(html_parts)


HEADER_KEYS = ("date", "author", "link")
TAG_RE = {k: re.compile(rf"<{k}>(.*?)<[/\\\\]{k}>[ \t]*\n?", re.S) for k in ("subtitle", "epigraph")}
DATE_PREFIX_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-")


def fmt_date(d):
    return f"{d.day} {d.strftime('%B %Y')}"


def parse_piece(path):
    """A piece file: optional <poem> or <prose> line, title line, optional "date:", "author:" and "link:"
    lines, blank line, text."""
    text = read_text(path).strip()
    kind = "poem"
    m = re.match(r"<(poem|prose)>[ \t]*\n", text)
    if m:
        kind = "poem" if m.group(1) == "poem" else "essay"
        text = re.sub(r"\n[ \t]*<[/\\](poem|prose)>$", "", text[m.end():])
    tags = {}
    for k, rx in TAG_RE.items():
        m2 = rx.search(text)
        if m2:
            tags[k] = m2.group(1).strip()
            text = rx.sub("", text, count=1)
    header, _, body = re.split(r"(\n[ \t]*\n)", text + "\n\n", 1)
    title, *meta_lines = header.splitlines()
    meta = {}
    for line in meta_lines:
        key, sep, value = line.partition(":")
        key = key.strip().lower()
        if sep and key in HEADER_KEYS:
            meta[key] = value.strip()
        else:
            print(f"  warning: {path.name}: ignoring header line {line!r}")
    name = path.stem.lstrip("_")
    m = DATE_PREFIX_RE.match(name)
    when = meta.get("date") or (m and m.group(1))
    d = date.fromisoformat(when) if when else None
    return {
        "slug": DATE_PREFIX_RE.sub("", name),
        "title": title.strip(),
        "author": meta.get("author", ""),
        "author_url": meta.get("link", ""),
        "when": d,
        "date": fmt_date(d) if d else "",
        "kind": kind,
        "html": (render_poem if kind == "poem" else render_prose)(body),
        "example": path.name.startswith("_"),
        "subtitle": tags.get("subtitle", ""),
        "epigraph": tags.get("epigraph", ""),
    }


def load_archive(folder):
    """Every piece in the folder, newest first."""
    pieces = [parse_piece(p) for p in sorted(Path(folder).glob("*.txt"))]
    return sorted(pieces, key=lambda p: (p["when"] or date.min), reverse=True)
