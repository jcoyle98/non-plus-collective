#!/usr/bin/env python3
"""Split À la recherche du temps perdu into sentences for the newspaper draft.

    python3 tools/proust.py [folder]

reads the fourteen Project Gutenberg files of the novel (in French, public
domain) from folder as <id>.txt, downloading any that are missing, and writes
static/proust/: index.json, listing the books, and <id>-NN.json chunks, each a
list of paragraphs and each paragraph a list of sentences. The page loads one
chunk at a time, so it never fetches the whole novel. Gutenberg's header and
footer, title pages and headings are left out; _italics_ lose their underscores,
"--" becomes a dash and straight apostrophes curly ones, as in most of the volumes.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

BOOKS = [   # Gutenberg id, title (each in the novel's order)
    (2650, "Du côté de chez Swann"),
    (2998, "À l’ombre des jeunes filles en fleurs"),
    (2999, "À l’ombre des jeunes filles en fleurs"),
    (3000, "À l’ombre des jeunes filles en fleurs"),
    (8946, "Le Côté de Guermantes"),
    (12999, "Le Côté de Guermantes"),
    (13743, "Le Côté de Guermantes"),
    (15288, "Sodome et Gomorrhe"),
    (15075, "Sodome et Gomorrhe"),
    (60720, "La Prisonnière"),
    (64427, "Albertine disparue"),
    (64428, "Albertine disparue"),
    (74090, "Le Temps retrouvé"),
    (74091, "Le Temps retrouvé"),
]
CHUNK = 60_000   # characters of text per chunk file, roughly
LONG = 300       # the book's prose starts and ends with paragraphs at least this long

# Words that end in a full stop without ending the sentence ("M. Swann", "Mme de")
ABBREVIATIONS = {"M", "MM", "Mme", "Mmes", "Mlle", "Mlles", "Dr", "St", "Ste", "Mgr", "etc", "cf", "p", "t", "vol", "chap", "J.-C"}

OUT = Path(__file__).parent.parent / "static" / "proust"


def text_of(book_id, folder):
    path = folder / f"{book_id}.txt"
    if not path.exists():
        url = f"https://www.gutenberg.org/ebooks/{book_id}.txt.utf-8"
        print(f"Downloading {url}")
        path.write_bytes(urllib.request.urlopen(url).read())
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    start = re.search(r"\*\*\* START OF TH.*?\*\*\*", text).end()
    end = re.search(r"\*\*\* END OF TH", text).start()
    return text[start:end]


def paragraphs_of(text):
    paragraphs = [" ".join(p.split()).replace("_", "").replace("--", "—").replace("'", "’") for p in re.split(r"\n\s*\n", text)]
    paragraphs = [p for p in paragraphs if p]
    long = [i for i, p in enumerate(paragraphs) if len(p) >= LONG]
    paragraphs = paragraphs[long[0]:long[-1] + 1]
    # Headings have no lower-case letters, or are short and end without punctuation
    return [p for p in paragraphs if re.search(r"[a-zà-ÿ]", p) and (len(p) >= 60 or re.search(r"[.!?…»:;]$", p))]


def sentences_of(paragraph):
    sentences, start = [], 0
    # A sentence ends at . ! ? or …, maybe followed by » or ), then a space before a capital, « or —
    for m in re.finditer(r"[.!?…][»)]?(?=\s+[«—A-ZÀ-Ý])", paragraph):
        word = re.search(r"(\S+)$", paragraph[start:m.start()])
        word = word.group(1).lstrip("«(—") if word else ""
        if m.group().startswith(".") and (word in ABBREVIATIONS or re.fullmatch(r"[A-ZÀ-Ý]", word)):
            continue   # "M. Swann", or an initial
        sentences.append(paragraph[start:m.end()].strip())
        start = m.end()
    rest = paragraph[start:].strip()
    if rest:
        sentences.append(rest)
    return sentences


def main():
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "source" / "proust"
    folder.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.json"):
        old.unlink()
    index = []
    for book_id, title in BOOKS:
        chunks, chunk, size = [], [], 0
        for paragraph in paragraphs_of(text_of(book_id, folder)):
            chunk.append(sentences_of(paragraph))
            size += len(paragraph)
            if size >= CHUNK:
                chunks.append(chunk)
                chunk, size = [], 0
        if chunk:
            chunks.append(chunk)
        for n, c in enumerate(chunks, 1):
            (OUT / f"{book_id}-{n:02}.json").write_text(json.dumps(c, ensure_ascii=False), encoding="utf-8")
        index.append({"id": book_id, "title": title, "chunks": len(chunks)})
        print(f"{book_id} {title}: {len(chunks)} chunks, {sum(len(p) for c in chunks for p in c)} sentences")
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
