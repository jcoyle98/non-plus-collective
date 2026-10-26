// Humanize 2.0: the screens (home, About, Directory, Archive, Contact) are stacked one below the other and
// can't be scrolled by hand. A click glides the stack to the screen it names, down or up depending on where
// that screen sits, taking longer the further it goes; the photographs flicker past while it moves.
// "non plus" goes from the middle of the home screen to the top of the others, and leads back home.
(function () {
  const page = document.querySelector("main.hz");
  if (!page) return;
  const rail = page.querySelector(".hz-rail");
  const windowEl = page.querySelector(".hz-window");
  const screens = [...page.querySelectorAll(".hz-screen")];
  // each screen's name, as in the address (#about). Deliberately not an id: the browser would jump to an
  // element with that id on back and forward, before the glide, and the glide would stutter
  const names = screens.map((s) => s.dataset.screen);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const photo = page.querySelector(".humanize-photo");
  const deck = window.PhotoDeck && window.FLICKER_IMAGES && photo ? window.PhotoDeck(photo.dataset.base) : null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let at = 0, flicker = null;

  function swap() {
    const next = deck && deck.next();
    if (next) photo.src = next.src;
  }

  function go(name, { animate = true, record = true } = {}) {
    const to = Math.max(0, names.indexOf(name));
    const distance = Math.abs(to - at);
    // the further it goes, the longer it takes, as if scrolled
    // so fast over so much space that nothing passing can be read: About ~0.8s, Contact ~1.4s
    const ms = !animate || reduce.matches ? 0 : distance === 0 ? 0 : 600 + 200 * distance;
    page.style.setProperty("--hz-ms", `${ms}ms`);
    page.style.setProperty("--hz-at", to);
    page.dataset.at = names[to];
    // only the screen in view can be reached by keyboard, and nothing is hidden behind it
    screens.forEach((s, i) => { s.inert = i !== to; s.setAttribute("aria-hidden", String(i !== to)); });
    screens[to].scrollTop = 0;   // a work always opens at its top
    at = to;

    clearInterval(flicker);
    if (ms > 0) {
      swap();
      const started = performance.now();
      flicker = setInterval(() => {
        if (performance.now() - started > ms - 60) { clearInterval(flicker); return; }
        swap();
      }, 70);
    } else if (animate) swap();

    if (record) {
      const url = to === 0 ? location.pathname : `#${names[to]}`;
      history.pushState({ hz: names[to] }, "", url);
    }
  }

  page.addEventListener("click", (e) => {
    const link = e.target.closest("[data-go]");
    if (link) { e.preventDefault(); go(link.dataset.go); return; }
    if (!e.target.closest("a")) swap();   // clicking anywhere else changes the photograph
  });
  addEventListener("popstate", () => go(location.hash.slice(1) || "home", { record: false }));

  // nothing scrolls by hand: wheel, keys and touch don't move it, and if the browser ever scrolls the
  // window (to show something focused, say) it is put straight back
  windowEl.addEventListener("scroll", () => { windowEl.scrollTop = 0; windowEl.scrollLeft = 0; });
  // ...except inside the screen in view when its content doesn't fit (a long work, or any screen zoomed in):
  // that screen scrolls by itself
  const inWork = (e) => {
    const el = screens[at];
    if (el.scrollHeight <= el.clientHeight + 1) return false;
    return e.type === "keydown" || (e.target instanceof Node && el.contains(e.target));
  };
  addEventListener("wheel", (e) => { if (!inWork(e)) e.preventDefault(); }, { passive: false });
  addEventListener("touchmove", (e) => { if (!inWork(e)) e.preventDefault(); }, { passive: false });
  addEventListener("keydown", (e) => {
    if (["PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End", " "].includes(e.key) && !e.target.closest("input, textarea, select")) {
      if (inWork(e)) {
        // scroll the work itself, not the stack
        const el = screens[at], step = el.clientHeight * 0.85;
        const by = { ArrowDown: 60, ArrowUp: -60, PageDown: step, " ": step, PageUp: -step, Home: -1e9, End: 1e9 }[e.key];
        el.scrollBy({ top: by, behavior: "smooth" });
      }
      e.preventDefault();
    }
  });

  // tapping "non plus" on the home screen steps through the colour schemes of the other drafts: the
  // photographs' two colours (dark, light), the page behind them (bg), the text, and the hover colour (accent)
  const SCHEMES = [
    { name: "night and blue", dark: "#0c0513", light: "#6da7d0", bg: "#180826", accent: "#6da7d0" },
    { name: "teal and lilac", dark: "#274a49", light: "#e0c9e3", accent: "#e0c9e3" },
    { name: "navy and bone", dark: "#3d4e78", light: "#d0ccbd", accent: "#d0ccbd" },
    { name: "oxblood and rose", dark: "#722b35", light: "#cfa98d", accent: "#cfa98d" },
    { name: "umber and gold", dark: "#100d12", light: "#e8c273", accent: "#e8c273" },
    { name: "moss and sage", dark: "#1e1d19", light: "#abac88", accent: "#abac88" },
    { name: "original", dark: "#000000", light: "#ffffff", accent: "#9a9a9a" },
    { name: "inverse, grey", dark: "#f4f2ee", light: "#8c8c8c", text: "#141214", accent: "#6b6b6b", shade: "rgba(244, 242, 238, .35)" },
    { name: "inverse, warm grey", dark: "#f3efe6", light: "#a39b8c", text: "#1b1714", accent: "#7d7465", shade: "rgba(243, 239, 230, .35)" },
    { name: "red and gold", dark: "#a43434", light: "#e1b867", accent: "#e1b867" },
    { name: "violet and mint", dark: "#43396a", light: "#8ec6ab", accent: "#8ec6ab" },
  ];
  const hexes = (h) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3));
  const funcs = ["feFuncR", "feFuncG", "feFuncB"].map((f) => document.querySelector(`#humanize-night-blue ${f}`));
  let scheme = 0;
  function setScheme(k) {
    scheme = (k + SCHEMES.length) % SCHEMES.length;
    const s = SCHEMES[scheme], d = hexes(s.dark), l = hexes(s.light);
    funcs.forEach((f, i) => f && f.setAttribute("tableValues", `${d[i]} ${l[i]}`));
    const body = document.body.style;
    body.setProperty("--hz-bg", s.bg || s.dark);
    body.setProperty("--hz-text", s.text || "#ffffff");
    body.setProperty("--hz-accent", s.accent);
    body.setProperty("--hz-shade", s.shade || "rgba(10, 9, 10, .5)");
    // the photograph is a filtered image: nudge it so the browser repaints with the new colours
    photo.style.filter = "none"; void photo.offsetWidth; photo.style.filter = "";
    // remembered in this browser, so it's the same on the next visit, or coming back from another site
    try { localStorage.setItem("humanize-2-scheme", s.name); } catch (_) {}
  }
  // press and hold anywhere that isn't a link or text: a column of circles, one per scheme in its two
  // colours, no words, opening where the press is. A quick tap on "non plus" steps to the next scheme.
  const list = document.createElement("div");
  list.className = "hz-schemes";
  list.hidden = true;
  list.setAttribute("role", "group");
  list.setAttribute("aria-label", "Colours");
  list.innerHTML = SCHEMES.map((s, i) =>
    `<button type="button" data-k="${i}" aria-label="${s.name}" style="background:linear-gradient(135deg, ${s.bg || s.dark} 50%, ${s.light} 50%)"></button>`).join("");
  page.appendChild(list);
  function openList(x, y) {
    list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.k === scheme)));
    list.hidden = false;
    const w = list.offsetWidth, h = list.offsetHeight;
    let left = x + 18;
    if (left + w > innerWidth - 12) left = x - 18 - w;   // to the left of the press if there's no room on the right
    list.style.left = `${Math.max(12, left)}px`;
    list.style.top = `${Math.min(Math.max(12, y - h / 2), innerHeight - h - 12)}px`;
  }
  const closeList = () => { list.hidden = true; };
  list.addEventListener("click", (e) => {
    e.stopPropagation();
    const b = e.target.closest("button");
    if (b) { setScheme(+b.dataset.k); closeList(); }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeList(); });

  // is the point over actual letters (not just inside a paragraph's box)?
  function overText(x, y) {
    let node, offset;
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return false;
      node = p.offsetNode; offset = p.offset;
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (!r) return false;
      node = r.startContainer; offset = r.startOffset;
    }
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.data.trim()) return false;
    const range = document.createRange();
    for (const o of [offset - 1, offset]) {
      if (o < 0 || o >= node.length) continue;
      range.setStart(node, o);
      range.setEnd(node, o + 1);
      for (const r of range.getClientRects()) {
        if (x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2) return true;
      }
    }
    return false;
  }

  let hold = null, held = false, start = null;
  addEventListener("pointerdown", (e) => {
    held = false;
    clearTimeout(hold);
    if (e.button > 0 || list.contains(e.target)) return;
    if (!list.hidden) { closeList(); held = true; return; }   // a click outside closes it, and does nothing else
    if (e.target.closest("a, button, input, select, textarea, label") || overText(e.clientX, e.clientY)) return;
    start = { x: e.clientX, y: e.clientY };
    hold = setTimeout(() => { held = true; openList(start.x, start.y); }, 450);
  });
  addEventListener("pointermove", (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) clearTimeout(hold);   // moving isn't holding
  });
  const release = () => { clearTimeout(hold); start = null; };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  addEventListener("contextmenu", (e) => { if (held || start) e.preventDefault(); });   // a long press on a phone
  // the click that ends a hold (or closes the circles) does nothing else
  document.addEventListener("click", (e) => {
    if (held && !list.contains(e.target)) { e.stopPropagation(); e.preventDefault(); held = false; }
  }, true);

  const schemer = page.querySelector(".hz-schemer");
  schemer.addEventListener("click", (e) => { e.stopPropagation(); setScheme(scheme + 1); });
  schemer.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setScheme(scheme + 1); } });

  // start in the scheme chosen last time (by name, so it survives changes to the list); else night and blue
  let remembered = null;
  try { remembered = localStorage.getItem("humanize-2-scheme"); } catch (_) {}
  const known = SCHEMES.findIndex((s) => s.name === remembered);
  if (known > 0) setScheme(known);

  // arrive at the screen the address names (e.g. back from a work, at #archive) without gliding
  go(location.hash.slice(1) || "home", { animate: false, record: false });
  history.replaceState({ hz: names[at] }, "", at === 0 ? location.pathname : `#${names[at]}`);
})();
