// Newspaper draft: five front-page designs for the same story and engraving.
// The buttons at the start of the bottom row set data-paper on <body> (the
// designs are in style.css); the choice is kept in the address as paper=N,
// alongside the palette, so a link opens on the same version.
//
// The page always fills the window above the panel. The engraving is made as
// tall as that room allows (no wider than half the page; on a phone, it takes
// the top part). The story is a passage of À la recherche du temps perdu,
// starting at a random sentence on every load (static/proust/, made by
// tools/proust.py). It fills the space beside the engraving and, when the
// engraving is too short to reach the bottom, carries on under it across the
// page, down to the copyright bar; it is laid out again whenever the window's
// size changes, the last sentence cut off with "…" where the space runs out.
// Past the end of a chunk the passage carries on into the next.
(function () {
  const VERSIONS = [
    ["1", "Broadsheet", "Double rules, two justified columns, the engraving in a ruled box"],
    ["2", "Tabloid", "A band of colour, a huge headline in capitals over a heavy rule"],
    ["3", "Gazette", "Spaced capitals, three narrow columns with rules between"],
    ["4", "Modern", "A bar of colour, a very large headline, the engraving to the window's edge"],
    ["5", "Halftone", "The engraving in halftone dots, under heavy and thin rules"],
  ];
  const group = document.querySelector(".looks");

  function choose(v) {
    document.body.dataset.paper = v;
    group.querySelectorAll(".look[data-paper]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.paper === v)));
    const q = new URLSearchParams(location.hash.slice(1));
    q.set("paper", v);
    history.replaceState(null, "", `#${q}`);
  }

  const divider = document.createElement("span");
  divider.className = "divider";
  divider.setAttribute("aria-hidden", "true");
  group.prepend(divider);
  VERSIONS.slice().reverse().forEach(([v, name, title]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "look";
    b.dataset.paper = v;
    b.textContent = `${v} ${name}`;
    b.title = title;
    b.addEventListener("click", () => choose(v));
    group.prepend(b);
  });

  const asked = new URLSearchParams(location.hash.slice(1)).get("paper");
  choose(VERSIONS.some(([v]) => v === asked) ? asked : "1");

  // ---- The story: Proust, filling the page ----

  const PROUST = new URL("proust/", document.currentScript.src);
  const story = document.querySelector(".story");
  const front = document.querySelector(".front");
  const photo = document.querySelector(".photo");
  const art = photo.querySelector(".art");
  const beside = story.querySelector(".body");          // the text beside the engraving
  const below = document.querySelector(".below");        // and under it, full width, when it is short
  const footer = document.querySelector(".copyright");
  const panel = document.querySelector(".palette-panel");
  const RATIO = 965 / 1600;   // the engraving's width over its height
  const GAP = 16;             // between the page and the panel
  const MIN_BELOW = 80;       // the least room under the engraving worth filling, in pixels
  const passage = [];         // the sentences from the random start onwards: { text, opens }
  let books, next = null, loading = null;   // next: the chunk to load after those in the passage

  async function load({ book, chunk }) {
    const paragraphs = await (await fetch(new URL(`${books[book].id}-${String(chunk).padStart(2, "0")}.json`, PROUST))).json();
    // The chunk after this one, carrying on into the next book, and back to the start after the last
    next = chunk < books[book].chunks ? { book, chunk: chunk + 1 } : { book: (book + 1) % books.length, chunk: 1 };
    return paragraphs.flatMap((sentences) => sentences.map((text, i) => ({ text, opens: i === 0 })));
  }

  function more() {   // load the next chunk onto the passage, once at a time
    loading = loading || load(next).then((items) => { passage.push(...items); loading = null; });
    return loading;
  }

  function place(box, opens, text) {   // a span of text, in a new paragraph if it opens one
    let p = box.lastElementChild;
    if (!p || opens) {
      p = document.createElement("p");
      box.append(p);
    }
    const span = document.createElement("span");
    span.textContent = (p.childNodes.length ? " " : "") + text;
    p.append(span);
    return span;
  }

  function unplace(span) {
    const p = span.parentNode;
    span.remove();
    if (!p.childNodes.length) p.remove();
  }

  // Size the engraving to the room in the window: as tall as the page allows above
  // the copyright bar, no wider than half the page (on a phone, the top part)
  function layout(stacked) {
    const bottom = innerHeight - panel.offsetHeight - GAP;   // the page's bottom edge, in the window
    const footing = footer.offsetHeight + parseFloat(getComputedStyle(footer).marginTop);
    const tall = Math.max(240, bottom - footing - front.getBoundingClientRect().top);
    const frame = photo.offsetHeight - art.offsetHeight;   // any border and padding round the engraving
    const artH = stacked
      ? Math.min(tall * 0.45 - frame, (front.clientWidth - frame) / RATIO)
      : Math.min(tall - frame, (front.clientWidth / 2 - frame) / RATIO);
    front.style.setProperty("--art-h", `${Math.floor(artH)}px`);
    return bottom;
  }

  let fitting = false, again = false;
  async function fit() {
    if (!books) return;
    if (fitting) { again = true; return; }   // fit again once this one is done
    fitting = true;
    const stacked = matchMedia("(max-width: 720px)").matches;
    beside.replaceChildren();
    below.replaceChildren();
    below.hidden = true;
    const bottom = layout(stacked);
    const pageFits = () => footer.getBoundingClientRect().bottom <= bottom;
    // The text fills the space beside the engraving, then (if there is room under it) the space below
    const boxes = [{ box: beside, fits: () => pageFits() && (stacked || story.getBoundingClientRect().bottom <= photo.getBoundingClientRect().bottom) }];
    if (!stacked && bottom - footer.getBoundingClientRect().bottom >= MIN_BELOW) boxes.push({ box: below, fits: pageFits });

    let i = 0, carry = null;   // carry: the rest of a sentence cut at the end of a box
    for (const [n, { box, fits }] of boxes.entries()) {
      box.hidden = false;
      const last = n === boxes.length - 1;
      // Whole sentences while they fit (the cap only guards against a layout that never grows)...
      while (i < 3000) {
        if (i + 20 > passage.length) await more();
        const text = carry ?? passage[i].text;
        const span = place(box, !carry && passage[i].opens, text);
        if (!fits()) { unplace(span); break; }
        carry = null;
        i++;
      }
      // ...then as many words of the next as fit, found by halving; the rest goes on in the next box
      const words = (carry ?? passage[i].text).split(" ");
      const opens = !carry && passage[i].opens;
      const end = last ? "…" : "";
      let lo = 0, hi = words.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const span = place(box, opens, words.slice(0, mid).join(" ") + end);
        const ok = fits();
        unplace(span);
        if (ok) lo = mid; else hi = mid - 1;
      }
      if (lo) {
        place(box, opens, words.slice(0, lo).join(" ") + end);
        carry = words.slice(lo).join(" ");
      }
      if (!box.childNodes.length) box.hidden = box === below;
    }
    fitting = false;
    if (again) { again = false; fit(); }
  }

  async function start() {
    books = await (await fetch(new URL("index.json", PROUST))).json();
    // A random chunk of a random book, weighted by length, and a random sentence in it
    let pick = Math.floor(Math.random() * books.reduce((n, b) => n + b.chunks, 0));
    let book = 0;
    while (pick >= books[book].chunks) pick -= books[book++].chunks;
    const items = await load({ book, chunk: pick + 1 });
    const from = Math.floor(Math.random() * items.length);
    passage.push({ text: `…${items[from].text}`, opens: true }, ...items.slice(from + 1));
    await fit();
    addEventListener("resize", () => fit());
    new ResizeObserver(() => fit()).observe(panel);   // e.g. "Adjust colours" opened
    document.fonts.ready.then(fit);
  }

  group.addEventListener("click", (e) => { if (e.target.closest(".look")) fit(); });   // a new version lays the story out anew
  start();
})();
