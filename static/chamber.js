// The cloud-chamber draft: the photograph, split in three by the chamber's plates, under a bar of
// links; NON PLUS floats over it, draggable, in its own colour. Colour treatments, bar colours, fonts.
(function () {
  const page = document.querySelector(".chamber-draft");
  if (!page) return;
  const img = page.querySelector(".chamber");

  // colour treatments: dark = what the photograph's black becomes, light = what its white becomes
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
  const luminance = (h) => {
    const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  page.querySelector(".c-filters defs").innerHTML = LOOKS.filter((l) => l.key !== "original").map((l) => {
    const [d, w] = [hex(l.dark), hex(l.light)];
    const t = (i) => `tableValues="${d[i].toFixed(3)} ${w[i].toFixed(3)}"`;
    return `<filter id="cf-${l.key}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="table" ${t(0)}/><feFuncG type="table" ${t(1)}/><feFuncB type="table" ${t(2)}/></feComponentTransfer>
    </filter>`;
  }).join("");

  // the bar across the top: white, the image's colours (its white as the bar, its black as the text), or black
  let current = LOOKS[0], bar = "white";
  const bars = page.querySelector(".c-bars");
  function paintBar() {
    // the links take one of the image's two colours, whichever reads better on the bar; if neither
    // reads well enough (contrast under 4.5:1), plain black or white
    const bg = bar === "black" ? "#000000" : bar === "image" ? current.light : "#ffffff";
    let fg = [current.dark, current.light].sort((a, b) => contrast(b, bg) - contrast(a, bg))[0];
    if (contrast(fg, bg) < 4.5) fg = contrast("#000000", bg) >= contrast("#ffffff", bg) ? "#000000" : "#ffffff";
    page.style.setProperty("--bar-bg", bg);
    page.style.setProperty("--bar-fg", fg);
    bars.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.bar === bar));
  }
  function setBar(name) {
    bar = ["white", "image", "black"].includes(name) ? name : "white";
    paintBar();
    try { localStorage.setItem("chamber-bar", bar); } catch (_) {}
  }
  bars.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setBar(b.dataset.bar); });

  const looks = page.querySelector(".c-looks");
  looks.innerHTML = LOOKS.map((l) =>
    `<button type="button" data-key="${l.key}" title="${l.label}" aria-label="${l.label}" style="background:linear-gradient(135deg, ${l.dark} 50%, ${l.light} 50%)"></button>`).join("");
  function setLook(key) {
    const look = LOOKS.find((l) => l.key === key) || LOOKS[0];
    img.style.filter = look.key === "original" ? "none" : `url(#cf-${look.key})`;
    current = look;
    paintBar();
    looks.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === look.key));
    try { localStorage.setItem("chamber-look", look.key); } catch (_) {}
  }
  looks.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLook(b.dataset.key); });

  // fonts, fetched from Google Fonts when chosen
  const FONTS = [
    ["EB Garamond (the site's font)", ""], ["Cormorant Garamond", "Cormorant Garamond"], ["Libre Caslon Text", "Libre Caslon Text"],
    ["Libre Baskerville", "Libre Baskerville"], ["Crimson Pro", "Crimson Pro"], ["Spectral", "Spectral"], ["Newsreader", "Newsreader"],
    ["Lora", "Lora"], ["Source Serif 4", "Source Serif 4"], ["Old Standard TT", "Old Standard TT"], ["IM Fell English", "IM Fell English"],
    ["Instrument Serif", "Instrument Serif"], ["Playfair Display", "Playfair Display"], ["Bodoni Moda", "Bodoni Moda"],
    ["DM Serif Display", "DM Serif Display"], ["Fraunces", "Fraunces"], ["Gloock", "Gloock"], ["Abril Fatface", "Abril Fatface"],
    ["Cinzel", "Cinzel"], ["Inter", "Inter"], ["Work Sans", "Work Sans"], ["Manrope", "Manrope"], ["Archivo", "Archivo"],
    ["Space Grotesk", "Space Grotesk"], ["Syne", "Syne"], ["Unbounded", "Unbounded"], ["Oswald", "Oswald"], ["Bebas Neue", "Bebas Neue"],
    ["Anton", "Anton"], ["Syncopate", "Syncopate"], ["IBM Plex Mono", "IBM Plex Mono"], ["JetBrains Mono", "JetBrains Mono"],
    ["Space Mono", "Space Mono"], ["Courier Prime", "Courier Prime"], ["Major Mono Display", "Major Mono Display"],
    ["UnifrakturMaguntia", "UnifrakturMaguntia"],
  ];
  // these have no italic of their own; the browser slants them instead
  const NO_ITALIC = new Set(["Gloock", "Abril Fatface", "Cinzel", "Manrope", "Space Grotesk", "Syne", "Unbounded",
    "Oswald", "Bebas Neue", "Anton", "Syncopate", "Major Mono Display", "UnifrakturMaguntia"]);
  const select = page.querySelector(".c-font select");
  select.innerHTML = FONTS.map(([label], i) => `<option value="${i}">${label}</option>`).join("");
  const loaded = new Set();
  function setFont(i) {
    const [, family] = FONTS[i] || FONTS[0];
    if (family && !loaded.has(family)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      const italic = !NO_ITALIC.has(family);   // fetch the real italic where the font has one
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${italic ? ":ital@0;1" : ""}&display=swap`;
      document.head.appendChild(link);
      loaded.add(family);
    }
    page.style.setProperty("--font", family ? `"${family}"` : '"EB Garamond"');
    if (document.fonts && typeof placeTitle === "function") document.fonts.ready.then(() => placeTitle());
    select.value = String(i);
    try { localStorage.setItem("chamber-font", String(i)); } catch (_) {}
  }
  select.addEventListener("change", () => setFont(+select.value));

  page.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });   // placeholder links

  // "Non Plus": its own colour, and drag and drop. Its position is kept as fractions of the window.
  const WORDS = [
    // bright ones (as on the hurricane draft)
    ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"], ["yellow", "#ffcc33"],
    ["green", "#3ddc84"], ["pink", "#ff5fa2"], ["blue", "#3d7bff"], ["white", "#f4f1ea"], ["black", "#141214"],
    // the palettes we've been using
    ["gold", "#e1b867"], ["brick red", "#a43434"], ["mint", "#8ec6ab"], ["violet", "#43396a"],
    ["sky blue", "#6da7d0"], ["lilac", "#e0c9e3"], ["teal", "#274a49"], ["site cyan", "#00f0ff"],
    ["deep maroon", "#6e0a0a"], ["night", "#180826"],
  ];
  const words = page.querySelector(".c-words");
  words.innerHTML = WORDS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="${name}" style="background:${c}"></button>`).join("");
  function setWord(c) {
    page.style.setProperty("--word", c);
    words.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
    try { localStorage.setItem("chamber-word", c); } catch (_) {}
  }
  words.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setWord(b.dataset.colour); });

  const title = page.querySelector(".c-title");
  const readout = page.querySelector(".c-pos output");
  const DEFAULT_POS = { x: 0.05, y: 0.2 };
  let pos = { ...DEFAULT_POS };
  try { const p = JSON.parse(localStorage.getItem("chamber-title-pos")); if (p) pos = p; } catch (_) {}
  function placeTitle() {
    const W = page.clientWidth, H = page.clientHeight, r = title.getBoundingClientRect();
    const x = Math.min(Math.max(0, pos.x * W), W - r.width), y = Math.min(Math.max(0, pos.y * H), H - r.height);
    title.style.transform = `translate(${x}px, ${y}px)`;
    title.style.visibility = "visible";
    readout.textContent = `x ${pos.x.toFixed(3)}, y ${pos.y.toFixed(3)}`;
  }
  let drag = null;
  title.addEventListener("pointerdown", (e) => {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(title.style.transform) || [0, 0, 0];
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: +m[1], y: +m[2] };
    title.setPointerCapture(e.pointerId);
    title.classList.add("dragging");
    e.preventDefault();
  });
  title.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    pos = { x: (drag.x + e.clientX - drag.sx) / page.clientWidth, y: (drag.y + e.clientY - drag.sy) / page.clientHeight };
    placeTitle();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    title.classList.remove("dragging");
    try { localStorage.setItem("chamber-title-pos", JSON.stringify(pos)); } catch (_) {}
  };
  title.addEventListener("pointerup", drop);
  title.addEventListener("pointercancel", drop);
  page.querySelector(".c-pos button").addEventListener("click", () => {
    pos = { ...DEFAULT_POS };
    try { localStorage.removeItem("chamber-title-pos"); } catch (_) {}
    placeTitle();
  });
  addEventListener("resize", placeTitle);

  // "Hide options" / "Show options" in the bar
  const toggle = page.querySelector(".c-toggle");
  function showOptions(show) {
    page.classList.toggle("options-hidden", !show);
    toggle.textContent = show ? "Hide options" : "Show options";
    toggle.setAttribute("aria-pressed", String(!show));
    try { localStorage.setItem("chamber-options", show ? "shown" : "hidden"); } catch (_) {}
  }
  toggle.addEventListener("click", (e) => { e.preventDefault(); showOptions(page.classList.contains("options-hidden")); });
  let savedOptions = null;
  try { savedOptions = localStorage.getItem("chamber-options"); } catch (_) {}
  showOptions(savedOptions !== "hidden");

  // the links' own colour; auto = whichever image colour reads best on the bar
  (function () {
    const COLOURS = [
    ["white", "#ffffff"], ["black", "#141214"], ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"],
    ["yellow", "#ffcc33"], ["green", "#3ddc84"], ["pink", "#ff5fa2"], ["blue", "#3d7bff"],
    ["gold", "#e1b867"], ["brick red", "#a43434"], ["mint", "#8ec6ab"], ["violet", "#43396a"], ["sky blue", "#6da7d0"],
    ["lilac", "#e0c9e3"], ["teal", "#274a49"], ["site cyan", "#00f0ff"], ["deep maroon", "#6e0a0a"], ["night", "#180826"],
  ];
    const row = page.querySelector(".c-linkcolours");
    row.innerHTML = `<button type="button" class="auto" data-colour="">auto</button>` +
      COLOURS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="${name}" style="background:${c}"></button>`).join("");
    function set(c) {
      if (c) page.style.setProperty("--links", c); else page.style.removeProperty("--links");
      row.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
      try { localStorage.setItem("chamber-links", c); } catch (_) {}
    }
    row.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set(b.dataset.colour); });
    let saved = "";
    try { saved = localStorage.getItem("chamber-links") || ""; } catch (_) {}
    set(saved);
  })();

  let saved = {};
  try { saved = { look: localStorage.getItem("chamber-look"), font: localStorage.getItem("chamber-font"), bar: localStorage.getItem("chamber-bar") }; } catch (_) {}
  // a box around the title: none, an outline or filled, in any of these colours
  const BOX_COLOURS = [
    ["white", "#ffffff"], ["black", "#141214"], ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"],
    ["yellow", "#ffcc33"], ["green", "#3ddc84"], ["pink", "#ff5fa2"], ["blue", "#3d7bff"],
    ["gold", "#e1b867"], ["brick red", "#a43434"], ["mint", "#8ec6ab"], ["violet", "#43396a"], ["sky blue", "#6da7d0"],
    ["lilac", "#e0c9e3"], ["teal", "#274a49"], ["site cyan", "#00f0ff"], ["deep maroon", "#6e0a0a"], ["night", "#180826"],
  ];
  const boxes = page.querySelector(".c-boxes");
  const boxColours = page.querySelector(".c-boxcolours");
  boxColours.innerHTML = BOX_COLOURS.map(([name, c]) => `<button type="button" data-colour="${c}" title="${name}" aria-label="Box ${name}" style="background:${c}"></button>`).join("");
  function setBox(name) {
    if (!["none", "outline", "filled"].includes(name)) name = "none";
    page.dataset.box = name;
    boxes.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.box === name));
    try { localStorage.setItem("chamber-box", name); } catch (_) {}
    placeTitle();   // the box changes the title's size
  }
  function setBoxColour(c) {
    page.style.setProperty("--box-colour", c);
    boxColours.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.colour === c));
    try { localStorage.setItem("chamber-box-colour", c); } catch (_) {}
  }
  boxes.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setBox(b.dataset.box); });
  boxColours.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setBoxColour(b.dataset.colour); });
  let savedBox = null, savedBoxColour = null;
  try { savedBox = localStorage.getItem("chamber-box"); savedBoxColour = localStorage.getItem("chamber-box-colour"); } catch (_) {}
  setBoxColour(savedBoxColour || BOX_COLOURS[0][1]);
  setBox(savedBox || "none");

  // italic title on or off
  const italicBox = page.querySelector("#c-italic");
  function setItalic(on) {
    page.style.setProperty("--title-style", on ? "italic" : "normal");
    italicBox.checked = on;
    try { localStorage.setItem("chamber-italic", on ? "1" : "0"); } catch (_) {}
    if (document.fonts) document.fonts.ready.then(() => placeTitle());
  }
  italicBox.addEventListener("change", () => setItalic(italicBox.checked));
  let savedItalic = null;
  try { savedItalic = localStorage.getItem("chamber-italic"); } catch (_) {}
  setItalic(savedItalic === "1");

  let savedWord = null;
  try { savedWord = localStorage.getItem("chamber-word"); } catch (_) {}
  setWord(savedWord || WORDS[0][1]);
  setBar(saved.bar || "white");
  setLook(saved.look || "original");
  setFont(saved.font ? +saved.font : 0);
  placeTitle();
})();
