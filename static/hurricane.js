// The hurricane draft: colour treatments for the photograph, and the barred-S menu.
(function () {
  const page = document.querySelector(".hurricane-draft");
  if (!page) return;
  const img = page.querySelector(".storm");
  // Other drafts reuse this script: data-store keeps their saved settings apart,
  // and data-anchor="window" places "non plus" against the window, not the eye
  const STORE = page.dataset.store || "hurricane";

  // dark = what the photograph's black becomes, light = what its white becomes
  const LOOKS = [
    { key: "original", label: "Original", dark: "#000000", light: "#ffffff" },
    { key: "inverse", label: "Inverse, grey", dark: "#f4f2ee", light: "#8c8c8c" },
    { key: "inverse-warm", label: "Inverse, warm grey", dark: "#f3efe6", light: "#a39b8c" },
    { key: "red-gold", label: "Red and gold", dark: "#a43434", light: "#e1b867" },
    { key: "violet-mint", label: "Violet and mint", dark: "#43396a", light: "#8ec6ab" },
    { key: "night-blue", label: "Night and blue", dark: "#180826", light: "#6da7d0" },
    { key: "teal-lilac", label: "Teal and lilac", dark: "#274a49", light: "#e0c9e3" },
    { key: "navy-bone", label: "Navy and bone", dark: "#3d4e78", light: "#d0ccbd" },
    { key: "oxblood-rose", label: "Oxblood and rose", dark: "#722b35", light: "#cfa98d" },
    { key: "umber-gold", label: "Umber and gold", dark: "#100d12", light: "#e8c273" },
    { key: "moss-sage", label: "Moss and sage", dark: "#1e1d19", light: "#abac88" },
  ];

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

  // one SVG filter per treatment: greyscale, then map black→dark and white→light
  const defs = page.querySelector(".h-filters defs");
  defs.innerHTML = LOOKS.filter((l) => l.key !== "original").map((l) => {
    const [d, w] = [hex(l.dark), hex(l.light)];
    const table = (i) => `tableValues="${d[i].toFixed(3)} ${w[i].toFixed(3)}"`;
    return `<filter id="hf-${l.key}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="table" ${table(0)}/><feFuncG type="table" ${table(1)}/><feFuncB type="table" ${table(2)}/></feComponentTransfer>
    </filter>`;
  }).join("");

  function apply(key) {
    const look = LOOKS.find((l) => l.key === key) || LOOKS[0];
    img.style.filter = look.key === "original" ? "none" : `url(#hf-${look.key})`;
    page.style.background = look.dark;          // what the image fades into (Image opacity)
    // the barred S and the menu take whichever end of the pair stands out from the page's main tone
    const pageIsLight = lum(look.dark) > 0.5;
    page.style.setProperty("--mark", pageIsLight ? "#1b1714" : look.key === "original" ? "#f4f1ea" : look.light);
    page.style.setProperty("--panel-bg", pageIsLight ? "rgba(250,248,244,.92)" : "rgba(12,10,12,.86)");
    page.style.setProperty("--panel-fg", pageIsLight ? "#1b1714" : "#f4f1ea");
    page.dataset.look = look.key;
    bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === look.key));
    try { localStorage.setItem(`${STORE}-look`, look.key); } catch (_) {}
  }

  const bar = page.querySelector(".h-looks");
  bar.innerHTML = LOOKS.map((l) =>
    `<button type="button" data-key="${l.key}" title="${l.label}" aria-label="${l.label}" style="background:linear-gradient(135deg, ${l.dark} 50%, ${l.light} 50%)"></button>`).join("");
  bar.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) apply(b.dataset.key); });
  let saved = null;
  try { saved = localStorage.getItem(`${STORE}-look`); } catch (_) {}
  apply(saved || "original");

  // the colour of "non plus": one colour at a time
  const WORDS = [
    ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"], ["yellow", "#ffcc33"],
    ["green", "#3ddc84"], ["pink", "#ff5fa2"], ["blue", "#3d7bff"], ["white", "#f4f1ea"], ["black", "#141214"],
  ];
  const words = page.querySelector(".h-words");
  words.innerHTML = WORDS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="${name}" style="background:${c}"></button>`).join("");
  function setWord(c) {
    page.style.setProperty("--word", c);
    words.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
    try { localStorage.setItem(`${STORE}-word`, c); } catch (_) {}
  }
  words.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setWord(b.dataset.colour); });
  let savedWord = null;
  try { savedWord = localStorage.getItem(`${STORE}-word`); } catch (_) {}
  setWord(savedWord || WORDS[0][1]);

  // "non plus" comes out of the hurricane's eye: find where the eye lands on screen
  // (the photo is cropped to fill the window, so this depends on the window's shape).
  // It can be dragged; its offset from the eye is kept as a fraction of the photo's
  // on-screen width, so it stays put relative to the storm when the window changes.
  const EYE = { x: 0.652, y: 0.659 };           // the eye's centre, as a fraction of the photograph
  const DEFAULT = { dx: -0.035, dy: -0.02 };    // where the words start, relative to the eye
  const word = page.querySelector(".wordmark");
  const readout = page.querySelector(".h-pos output");
  let offset = { ...DEFAULT };
  try { const o = JSON.parse(localStorage.getItem(`${STORE}-word-pos`)); if (o) offset = o; } catch (_) {}
  let geo = null;
  function measure() {
    const W = page.clientWidth, H = page.clientHeight;
    if (page.dataset.anchor === "window") return { W, H, dw: W, ex: W * 0.5, ey: H * 0.5 };
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw) return null;
    const s = Math.max(W / nw, H / nh);           // object-fit: cover
    const dw = nw * s, dh = nh * s;
    const pos = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
    return { W, H, dw, ex: (W - dw) * pos[0] + EYE.x * dw, ey: (H - dh) * pos[1] + EYE.y * dh };
  }
  function show() {
    if (readout) readout.textContent = `x ${offset.dx >= 0 ? "+" : ""}${offset.dx.toFixed(3)}, y ${offset.dy >= 0 ? "+" : ""}${offset.dy.toFixed(3)}`;
  }
  function placeWord() {
    geo = measure();
    if (!geo) return;
    const r = word.getBoundingClientRect();
    const x = Math.min(Math.max(8, geo.ex + offset.dx * geo.dw), geo.W - r.width - 8);
    const y = Math.min(Math.max(8, geo.ey + offset.dy * geo.dw), geo.H - r.height - 8);
    word.style.transform = `translate(${x}px, ${y}px)`;
    word.style.visibility = "visible";
    show();
  }
  // drag and drop
  let drag = null;
  word.addEventListener("pointerdown", (e) => {
    geo = measure();
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(word.style.transform) || [0, 0, 0];
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: +m[1], y: +m[2] };
    word.setPointerCapture(e.pointerId);
    word.classList.add("dragging");
    e.preventDefault();
  });
  word.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = drag.x + e.clientX - drag.sx, y = drag.y + e.clientY - drag.sy;
    offset = { dx: (x - geo.ex) / geo.dw, dy: (y - geo.ey) / geo.dw };
    word.style.transform = `translate(${x}px, ${y}px)`;
    show();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    word.classList.remove("dragging");
    try { localStorage.setItem(`${STORE}-word-pos`, JSON.stringify(offset)); } catch (_) {}
    placeWord();
  };
  word.addEventListener("pointerup", drop);
  word.addEventListener("pointercancel", drop);
  page.querySelector(".h-pos button").addEventListener("click", () => {
    offset = { ...DEFAULT };
    try { localStorage.removeItem(`${STORE}-word-pos`); } catch (_) {}
    placeWord();
  });
  if (img.complete) placeWord(); else img.addEventListener("load", placeWord);
  addEventListener("resize", placeWord);
  document.fonts && document.fonts.ready.then(placeWord);

  // a box around the title: none, an outline or filled, in any of these colours
  const BOX_COLOURS = [
    // light to dark
    ["white", "#ffffff"], ["paper", "#f4f1ea"], ["cream", "#f3efe6"], ["bone", "#d0ccbd"], ["light grey", "#c8c6c2"],
    ["grey", "#8c8c8c"], ["warm grey", "#a39b8c"], ["sage", "#abac88"], ["dark grey", "#4a4848"], ["charcoal", "#2a2828"],
    ["black", "#141214"], ["true black", "#000000"],
    // bright
    ["cyan", "#00e5ff"], ["site cyan", "#00f0ff"], ["blue", "#3d7bff"], ["purple", "#a259ff"], ["pink", "#ff5fa2"],
    ["magenta", "#e0218a"], ["red", "#ff3b3b"], ["orange", "#ff7a1a"], ["yellow", "#ffcc33"], ["lime", "#b6e33b"], ["green", "#3ddc84"],
    // from the image treatments
    ["gold", "#e1b867"], ["honey", "#e8c273"], ["rose", "#cfa98d"], ["lilac", "#e0c9e3"], ["mint", "#8ec6ab"],
    ["sky blue", "#6da7d0"], ["brick red", "#a43434"], ["oxblood", "#722b35"], ["deep maroon", "#6e0a0a"],
    ["navy", "#3d4e78"], ["violet", "#43396a"], ["teal", "#274a49"], ["moss", "#1e1d19"], ["umber", "#100d12"], ["night", "#180826"],
  ];
  const boxes = page.querySelector(".h-boxes");
  const boxColours = page.querySelector(".h-boxcolours");
  boxColours.innerHTML = BOX_COLOURS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="Box ${name}" style="background:${c}"></button>`).join("");
  function setBox(name) {
    if (!["none", "outline", "filled"].includes(name)) name = "none";
    page.dataset.box = name;
    boxes.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.box === name));
    try { localStorage.setItem(`${STORE}-box`, name); } catch (_) {}
    placeWord();   // the box changes the title's size
  }
  function setBoxColour(c) {
    boxHex = c;
    paintBox();
    boxColours.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
    try { localStorage.setItem(`${STORE}-box-colour`, c); } catch (_) {}
  }
  boxes.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setBox(b.dataset.box); });
  boxColours.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setBoxColour(b.dataset.colour); });
  let savedBox = null, savedBoxColour = null;
  try { savedBox = localStorage.getItem(`${STORE}-box`); savedBoxColour = localStorage.getItem(`${STORE}-box-colour`); } catch (_) {}
  // "Box opacity": the box (outline or fill) fades from solid to clear; the words stay solid
  let boxHex = "#ffffff", boxAlpha = 1;
  function paintBox() {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(boxHex.slice(i, i + 2), 16));
    page.style.setProperty("--box-colour", `rgba(${r}, ${g}, ${b}, ${boxAlpha})`);
  }
  const boxRange = page.querySelector(".h-boxfade input"), boxOut = page.querySelector(".h-boxfade output");
  function setBoxAlpha(v) {
    v = Math.max(0, Math.min(100, Math.round(+v)));
    boxAlpha = v / 100;
    boxRange.value = v;
    boxOut.textContent = `${v}%`;
    paintBox();
    try { localStorage.setItem(`${STORE}-box-opacity`, String(v)); } catch (_) {}
  }
  boxRange.addEventListener("input", () => setBoxAlpha(boxRange.value));
  let savedBoxAlpha = null;
  try { savedBoxAlpha = localStorage.getItem(`${STORE}-box-opacity`); } catch (_) {}
  setBoxAlpha(savedBoxAlpha === null ? 100 : savedBoxAlpha);
  setBoxColour(savedBoxColour || BOX_COLOURS[0][1]);
  setBox(savedBox || "none");

  // the links' own colour; auto = the same as "non plus"
  (function () {
    const COLOURS = [
    ["white", "#ffffff"], ["black", "#141214"], ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"],
    ["yellow", "#ffcc33"], ["green", "#3ddc84"], ["pink", "#ff5fa2"], ["blue", "#3d7bff"],
    ["gold", "#e1b867"], ["brick red", "#a43434"], ["mint", "#8ec6ab"], ["violet", "#43396a"], ["sky blue", "#6da7d0"],
    ["lilac", "#e0c9e3"], ["teal", "#274a49"], ["site cyan", "#00f0ff"], ["deep maroon", "#6e0a0a"], ["night", "#180826"],
  ];
    const row = page.querySelector(".h-linkcolours");
    row.innerHTML = `<button type="button" class="auto" data-colour="">auto</button>` +
      COLOURS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="${name}" style="background:${c}"></button>`).join("");
    function set(c) {
      if (c) page.style.setProperty("--links", c); else page.style.removeProperty("--links");
      row.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
      try { localStorage.setItem(`${STORE}-links`, c); } catch (_) {}
    }
    row.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set(b.dataset.colour); });
    let saved = "";
    try { saved = localStorage.getItem(`${STORE}-links`) || ""; } catch (_) {}
    set(saved);
  })();

  // the font of "non plus": picked from a list, fetched from Google Fonts only when chosen
  // [name shown, Google Fonts family, has a true italic]
  const FONTS = [
    ["EB Garamond (the site's font)", "", true],
    ["Cormorant Garamond", "Cormorant Garamond", true], ["Libre Caslon Text", "Libre Caslon Text", true],
    ["Libre Baskerville", "Libre Baskerville", true], ["Crimson Pro", "Crimson Pro", true],
    ["Spectral", "Spectral", true], ["Newsreader", "Newsreader", true], ["Lora", "Lora", true],
    ["Source Serif 4", "Source Serif 4", true], ["Old Standard TT", "Old Standard TT", true],
    ["IM Fell English", "IM Fell English", true], ["Instrument Serif", "Instrument Serif", true],
    ["Playfair Display", "Playfair Display", true], ["Bodoni Moda", "Bodoni Moda", true],
    ["DM Serif Display", "DM Serif Display", true], ["Fraunces", "Fraunces", true],
    ["Gloock", "Gloock", false], ["Abril Fatface", "Abril Fatface", false], ["Cinzel", "Cinzel", false],
    ["Inter", "Inter", true], ["Work Sans", "Work Sans", true], ["Manrope", "Manrope", false],
    ["Archivo", "Archivo", true], ["Space Grotesk", "Space Grotesk", false], ["Syne", "Syne", false],
    ["Unbounded", "Unbounded", false], ["Oswald", "Oswald", false], ["Bebas Neue", "Bebas Neue", false],
    ["Anton", "Anton", false], ["Syncopate", "Syncopate", false],
    ["IBM Plex Mono", "IBM Plex Mono", true], ["JetBrains Mono", "JetBrains Mono", true],
    ["Space Mono", "Space Mono", true], ["Courier Prime", "Courier Prime", true],
    ["Major Mono Display", "Major Mono Display", false], ["UnifrakturMaguntia", "UnifrakturMaguntia", false],
  ];
  const select = page.querySelector(".h-font select");
  select.innerHTML = FONTS.map(([label, , italic], i) => `<option value="${i}">${label}${italic ? "" : " (no italic)"}</option>`).join("");
  const loaded = new Set();
  async function setFont(i) {
    const [, family, italic] = FONTS[i] || FONTS[0];
    if (family && !loaded.has(family)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${italic ? ":ital@0;1" : ""}&display=swap`;
      document.head.appendChild(link);
      loaded.add(family);
    }
    page.style.setProperty("--word-font", family ? `"${family}"` : '"EB Garamond"');
    select.value = String(i);
    try { localStorage.setItem(`${STORE}-font`, String(i)); } catch (_) {}
    if (family && document.fonts) {
      try { await document.fonts.load(`italic 32px "${family}"`, "NON PLUS"); } catch (_) {}
    }
    placeWord();
  }
  select.addEventListener("change", () => setFont(+select.value));
  let savedFont = null;
  try { savedFont = localStorage.getItem(`${STORE}-font`); } catch (_) {}
  setFont(savedFont ? +savedFont : 0);

  page.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });   // placeholder links

  // "Hide options" / "Show options" in the row along the top
  const toggle = page.querySelector(".h-toggle");
  function showOptions(show) {
    page.classList.toggle("options-hidden", !show);
    toggle.textContent = show ? "Hide options" : "Show options";
    toggle.setAttribute("aria-pressed", String(!show));
    try { localStorage.setItem(`${STORE}-options`, show ? "shown" : "hidden"); } catch (_) {}
  }
  toggle.addEventListener("click", (e) => { e.preventDefault(); showOptions(page.classList.contains("options-hidden")); });
  let savedOptions = null;
  try { savedOptions = localStorage.getItem(`${STORE}-options`); } catch (_) {}
  showOptions(savedOptions !== "hidden");

  // "Image opacity": the image's light colour fades into its dark one (the page behind it), down to nothing
  (function () {
    const target = page.querySelector(".storm");
    const range = page.querySelector(".h-fade input"), out = page.querySelector(".h-fade output");
    function set(v) {
      v = Math.max(0, Math.min(100, Math.round(+v)));
      target.style.opacity = v / 100;
      range.value = v;
      out.textContent = `${v}%`;
      try { localStorage.setItem(`${STORE}-opacity`, String(v)); } catch (_) {}
    }
    range.addEventListener("input", () => set(range.value));
    let saved = null;
    try { saved = localStorage.getItem(`${STORE}-opacity`); } catch (_) {}
    set(saved === null ? 100 : saved);
  })();
})();
