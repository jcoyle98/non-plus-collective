// Hurricane 2.0: "non plus" in white with the menu (Work, Directory) beneath it, level with the middle of
// the page, across from the hurricane's eye.
// The menu opens a panel on the left, over the hurricane: the Directory (About, the people, Contact), or
// the Work list, whose titles open the pieces in the same panel. The box stays where it is throughout.
(function () {
  const page = document.querySelector("main.eye");
  if (!page) return;
  // a phone (decided in the page's first line, by its browser rather than the window's size)
  const isPhone = document.documentElement.classList.contains("phone");
  const photo = page.querySelector(".eye-photo");
  const box = page.querySelector(".eye-boxes");
  const panel = page.querySelector(".eye-panel");
  const sections = [...panel.querySelectorAll("[data-panel]")];
  const EYE = { x: 0.652, y: 0.659 };   // the eye's centre, as a fraction of the photograph

  // a click anywhere, or moving or scrolling over the background, changes the photograph (the hurricane first, then
  // Humanize's photographs): at most one new photograph every SWAP_MS
  const SWAP_MS = 120;
  const deck = window.PhotoDeck && window.FLICKER_IMAGES ? window.PhotoDeck(photo.dataset.base) : null;
  let lastSwap = -Infinity;
  function swap() {
    const now = performance.now();
    if (now - lastSwap < SWAP_MS) return;
    const next = deck && deck.next();
    if (!next) return;
    photo.src = next.src;
    lastSwap = now;
  }
  // a click or tap anywhere; moving the mouse, scrolling or swiping over the background (not over the panel)
  addEventListener("pointerdown", swap, { passive: true });
  const overBackground = (e) => !(e.target instanceof Element && e.target.closest(".eye-panel"));
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && overBackground(e)) swap(); }, { passive: true });
  addEventListener("wheel", (e) => { if (overBackground(e)) swap(); }, { passive: true });
  addEventListener("touchmove", (e) => { if (overBackground(e)) swap(); }, { passive: true });

  // keep the box over the eye (a little above its centre), wherever the photograph's cropping puts it
  // the panel fits what it shows, so its right edge moves: the > arrow follows it
  function edges() {
    if (!panel.hidden) page.style.setProperty("--panel-right", `${panel.getBoundingClientRect().right}px`);
  }
  addEventListener("resize", edges);

  function place() {
    const W = innerWidth, H = innerHeight;
    if (!hurricane.w) return;
    const nw = hurricane.w, nh = hurricane.h;
    const s = Math.max(W / nw, H / nh), dw = nw * s, dh = nh * s;   // object-fit: cover, centred
    const x = (W - dw) / 2 + EYE.x * dw + W * 0.08, y = H / 2;   // right of the eye, level with the middle of the page
    const r = box.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - r.width / 2), W - r.width - 8);
    box.style.left = `${left}px`;
    box.style.top = `${Math.min(Math.max(8, y - r.height / 2), H - r.height - 8)}px`;
    box.style.visibility = "visible";
    fitPanel(left);
  }

  // the panel fills the space between the left edge of the screen and "non plus", with an even margin each
  // side, and sits in the middle of it up and down.
  // On phones it is the sheet along the bottom instead (the stylesheet's).
  const narrow = { matches: isPhone };
  function fitPanel(titleLeft) {
    if (narrow.matches) {
      ["left", "width"].forEach((p) => panel.style.removeProperty(p));
      ["--panel-left", "--panel-width"].forEach((p) => page.style.removeProperty(p));
    } else {
      // filling most of that space: just a margin each side
      const gap = Math.max(20, titleLeft * 0.05);
      const width = Math.max(240, titleLeft - 2 * gap);
      const left = Math.max(8, (titleLeft - width) / 2);
      panel.style.left = `${left}px`;
      panel.style.width = `${width}px`;
      page.style.setProperty("--panel-left", `${left}px`);
      page.style.setProperty("--panel-width", `${width}px`);
    }
    edges();
  }
  // measured once, against the hurricane: the box stays put when the photograph changes
  const hurricane = { w: 0, h: 0 };
  const measure = () => { hurricane.w = photo.naturalWidth; hurricane.h = photo.naturalHeight; place(); };
  if (photo.complete) measure(); else photo.addEventListener("load", measure, { once: true });
  addEventListener("resize", place);
  document.fonts && document.fonts.ready.then(place);

  // open one panel (or none); the address follows (#directory, #work, #w-<work>), so back and forward work
  // the works, newest first. The site opens on the newest, in the "flow": a work with < and > for another,
  // at random. "Work" in the menu opens the list of every work, by title.
  const works = sections.filter((s) => s.dataset.panel.startsWith("w-")).map((s) => s.dataset.panel);
  // the site opens on the newest featured piece (several works as one); < and > then go through the works at
  // random, and "non plus" brings the featured piece back. It is never in the Work list or the shuffle.
  const featured = sections.filter((s) => s.dataset.panel.startsWith("f-")).map((s) => s.dataset.panel);
  const flow = [...featured, ...works];
  let opened = false;
  function open(name, record = true) {
    if (name === "featured") name = flow[0] || "";   // "Featured" (phones' first screen): the newest featured piece
    const known = sections.some((s) => s.dataset.panel === name);
    name = known ? name : "";
    sections.forEach((s) => { s.hidden = s.dataset.panel !== name; });
    panel.hidden = !name;
    panel.scrollTop = 0;
    page.dataset.open = name;
    // a phone shows its first screen ("non plus", Featured) only until something is first opened; after that,
    // closing a panel leaves "non plus" with Work and Directory at the top
    if (name) opened = true;
    page.toggleAttribute("data-intro", isPhone && !name && !opened);
    page.querySelectorAll(".eye-menu a").forEach((a) => {
      const on = name === a.dataset.open;   // "Work" is lit only for the list, not in the flow
      a.toggleAttribute("aria-current", on);
    });
    if (record) history.pushState(null, "", name ? `#${name}` : location.pathname);
    place();   // and the panel is fitted beside the title
  }
  // < and >: another work, chosen at random (never the one showing)
  function step() {
    const others = works.filter((w) => w !== page.dataset.open);   // works only: the featured piece is reached through "non plus"
    if (others.length) open(others[Math.floor(Math.random() * others.length)]);
  }
  page.addEventListener("click", (e) => {
    if (!e.target.closest(".eye-step")) return;
    e.preventDefault();
    step();
  });
  // on a phone, a tap anywhere in the lower half of the screen does the same (left half <, right half >),
  // except on anything that does something of its own: a link, a button, a player or an embed. (A tap only:
  // a swipe to scroll the text is not a click.)
  const phoneSized = { matches: isPhone };
  page.addEventListener("click", (e) => {
    if (!phoneSized.matches || !/^[wf]-/.test(page.dataset.open)) return;
    if (e.clientY < innerHeight / 2) return;
    if (e.target.closest("a, button, iframe, video, audio, input, select, textarea, label, [role=button], .bc-card, .eye-boxes")) return;
    if (String(getSelection()).length) return;   // not when choosing text to copy
    step();
  });
  page.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-open]");   // only links that open something (the page itself carries data-open too)
    if (!a) return;
    e.preventDefault();
    const name = a.dataset.open;
    // clicking what's already open closes it (Work, while a work is showing)
    const showing = page.dataset.open, isOpen = name === showing;
    open(isOpen && a.closest(".eye-menu") ? "" : name);
  });
  addEventListener("popstate", () => open(location.hash.slice(1), false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && page.dataset.open) open(""); });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";


  // every visit (and every reload) starts in the flow, on the newest featured piece (or else the newest work),
  // whatever the address says
  const start = isPhone ? "" : flow[0] || "";   // a phone starts on its first screen
  open(start, false);
  history.replaceState(null, "", start ? `#${start}` : location.pathname);

  // "non plus" is a link to the colours: each click steps to the next scheme (the photograph's two colours,
  // the ground behind them, and the authors' gradient)
  const SCHEMES = [   // the dark ones from the other drafts (white text stays readable on all of them)
    { dark: "#0c0513", light: "#6da7d0", bg: "#180826" },   // night and blue
    { dark: "#274a49", light: "#e0c9e3", accent: "#609c98" }, // teal and lilac
    { dark: "#3d4e78", light: "#d0ccbd", accent: "#7e94c5" }, // navy and bone
    { dark: "#722b35", light: "#cfa98d", accent: "#c86f7c" }, // oxblood and rose
    { dark: "#100d12", light: "#e8c273" },                  // umber and gold
    { dark: "#1e1d19", light: "#abac88" },                  // moss and sage
    { dark: "#000000", light: "#ffffff", accent: "#9b9b9b", hover: "#9a9a9a" }, // original
    { dark: "#a43434", light: "#e1b867", accent: "#d87979" }, // red and gold
    { dark: "#43396a", light: "#8ec6ab", accent: "#a397d0" }, // violet and mint
  ];
  const hex = (h) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3));
  const luminance = (h) => {
    const [r, g, b] = hex(h).map(Number).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const readable = (ground) => (contrast("#ffffff", ground) >= contrast("#000000", ground) ? "#ffffff" : "#000000");
  const funcs = ["feFuncR", "feFuncG", "feFuncB"].map((f) => document.querySelector(`#eye-night-blue ${f}`));
  // the authors' colours: a gradient of the scheme's own colour (its light one, the tint of the photograph),
  // palest for the first name in the Directory, deepest for the last. Each author keeps their place in it, so
  // their name, their titles (in the Work list and over their work) and their name at its foot share a shade.
  const members = [...page.querySelectorAll(".eye-people a[data-author]")].map((a) => a.dataset.author);
  const authored = [...page.querySelectorAll("[data-author]")];
  const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => toHex(hex(a).map(Number).map((v, i) => v + (Number(hex(b)[i]) - v) * t));
  function shades(s) {
    const bottom = s.accent || s.light;
    // A visibly coloured light tint at the top, deepening to the background's dominant accent.
    const top = mix(bottom, "#ffffff", 0.45);
    const n = Math.max(members.length - 1, 1);
    return { at: new Map(members.map((m, i) => [m, mix(top, bottom, i / n)])), rest: bottom };
  }
  let scheme = 0;
  function nextScheme() { setScheme(scheme + 1); }
  function setScheme(k) {
    scheme = (k + SCHEMES.length) % SCHEMES.length;
    const s = SCHEMES[scheme], d = hex(s.dark), l = hex(s.light);
    funcs.forEach((f, i) => f && f.setAttribute("tableValues", `${d[i]} ${l[i]}`));
    const ground = s.bg || s.dark;
    document.body.style.background = ground;
    // the panel is the scheme's main colour, its text white or black: whichever reads better on it (a scheme
    // can name its own text colour as "text")
    page.style.setProperty("--panel-bg", ground);
    page.style.setProperty("--scheme-light", s.light);   // the arrows and "close"
    // links light up in the scheme's light colour (or its own "hover", where that would be the text colour)
    document.documentElement.style.setProperty("--hover", s.hover || s.light);
    page.style.setProperty("--panel-bg-80", `rgba(${hex(ground).map((v) => Math.round(v * 255)).join(", ")}, .925)`);   // 92.5%
    page.style.setProperty("--panel-fg", s.text || readable(ground));
    photo.style.filter = "none"; void photo.offsetWidth; photo.style.filter = "";   // repaint with the new colours
    // the authors' shades, from this scheme (anyone not in the Directory takes the deepest)
    const { at, rest } = shades(s);
    authored.forEach((el) => {
      const c = at.get(el.dataset.author) || rest;
      el.style.color = c;
      el.style.setProperty("--c", c);
      el.style.setProperty("--c-hover", mix(c, "#ffffff", .3));
    });
  }
  // every visit opens on a scheme of its own, at random
  setScheme(Math.floor(Math.random() * SCHEMES.length));

  const mark = page.querySelector(".eye-mark");
  // "non plus" also brings back the featured piece (the newest), wherever you are
  function home() {
    nextScheme();
    if (flow[0] && page.dataset.open !== flow[0]) open(flow[0]);
  }
  mark.addEventListener("click", home);
  mark.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); home(); } });
})();
