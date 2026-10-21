// The radiolarian draft: colour treatments (photograph and page together) and a font choice. Same treatments and fonts as the hurricane draft.
(function () {
  const page = document.querySelector(".radiolarian-draft");
  if (!page) return;

  // dark = the page colour, which shows through the photograph's black; light = the photograph's white
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

  const looks = page.querySelector(".r-looks");
  looks.innerHTML = LOOKS.map((l) =>
    `<button type="button" data-key="${l.key}" title="${l.label}" aria-label="${l.label}" style="background:linear-gradient(135deg, ${l.dark} 50%, ${l.light} 50%)"></button>`).join("");
  function setLook(key) {
    const look = LOOKS.find((l) => l.key === key) || LOOKS[0];
    page.style.setProperty("--image-ink", look.light);   // the photograph's white; its black is the page
    const light = lum(look.dark) > 0.5;                 // a pale page (the inverse looks)
    page.style.setProperty("--page", look.dark);
    page.style.setProperty("--ink", light ? "#1b1714" : look.key === "original" ? "#ffffff" : look.light);
    page.style.setProperty("--panel-bg", light ? "rgba(250,248,244,.92)" : "rgba(12,10,12,.86)");
    page.style.setProperty("--panel-fg", light ? "#1b1714" : "#f4f1ea");
    looks.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === look.key));
    try { localStorage.setItem("radiolarian-look", look.key); } catch (_) {}
  }
  looks.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLook(b.dataset.key); });

  // fonts for "NON PLUS" and the line under the menu, fetched from Google Fonts when chosen
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
  const select = page.querySelector(".r-font select");
  select.innerHTML = FONTS.map(([label], i) => `<option value="${i}">${label}</option>`).join("");
  const loaded = new Set();
  function setFont(i) {
    const [, family] = FONTS[i] || FONTS[0];
    if (family && !loaded.has(family)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
      document.head.appendChild(link);
      loaded.add(family);
    }
    page.style.setProperty("--font", family ? `"${family}"` : '"EB Garamond"');
    if (document.fonts) document.fonts.ready.then(fit);   // a new font changes the text's size
    select.value = String(i);
    try { localStorage.setItem("radiolarian-font", String(i)); } catch (_) {}
  }
  select.addEventListener("change", () => setFont(+select.value));

  // fit the specimen to the window. What matters is the bulb: big, wholly on the page in the
  // bottom-right corner, its open end facing left. The turn is fixed; the stem runs up and to the
  // right and leaves the page wherever it does.
  const specimen = page.querySelector(".specimen");
  const TURN = 135;   // degrees: stem up and to the right, the open end facing down and to the left
  // turned 135°, the bulb (fringe included) reaches this far from its centre, as fractions of the
  // image's width (worked out from the image: tools/radiolarian.py)
  const REACH = { right: 0.244, down: 0.207, size: 0.455 };
  function fit() {
    const W = page.clientWidth, H = page.clientHeight;
    const margin = 0.03 * Math.min(W, H), gap = 0.03 * H;
    let w = (Math.min(W, H) - 2 * margin) / REACH.size;   // as big as the page allows, the whole bulb showing
    // never over the text: if the bulb would reach under NON PLUS or the links, keep it below them
    const pr = page.getBoundingClientRect();
    const boxes = [...page.querySelectorAll(".r-title, .r-nav")].map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    for (const r of boxes) {
      const textRight = r.right - pr.left, textBottom = r.bottom - pr.top;
      const bulbLeft = W - margin - REACH.size * w, bulbTop = H - margin - REACH.size * w;
      if (bulbLeft < textRight + gap && bulbTop < textBottom + gap) {
        w = Math.min(w, Math.max(0, H - margin - textBottom - gap) / REACH.size);
      }
    }
    specimen.style.setProperty("--w", `${w}px`);
    specimen.style.setProperty("--cx", `${W - margin - REACH.right * w}px`);
    specimen.style.setProperty("--cy", `${H - margin - REACH.down * w}px`);
    specimen.style.setProperty("--rot", `${TURN}deg`);
  }
  fit();
  addEventListener("resize", fit);

  // in the "middle" layout, the block (NON PLUS, the line, the links) can be dragged up and down
  const block = page.querySelector(".r-block");
  let blockY = 0.33;   // its centre, as a fraction of the window's height (default: a third of the way down)
  try { const v = parseFloat(localStorage.getItem("radiolarian-block-y")); if (v >= 0 && v <= 1) blockY = v; } catch (_) {}
  const placeBlock = () => { block.style.top = page.dataset.layout === "middle" ? `${blockY * 100}%` : ""; fit(); };
  let dragY = null;
  block.addEventListener("pointerdown", (e) => {
    if (page.dataset.layout !== "middle") return;
    dragY = { id: e.pointerId, start: e.clientY, from: blockY, moved: false };
    block.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  block.addEventListener("pointermove", (e) => {
    if (!dragY || e.pointerId !== dragY.id) return;
    const H = page.clientHeight, half = block.offsetHeight / 2;
    const y = dragY.from * H + (e.clientY - dragY.start);
    blockY = Math.min(H - half, Math.max(half, y)) / H;
    dragY.moved = dragY.moved || Math.abs(e.clientY - dragY.start) > 3;
    placeBlock();
  });
  const endDrag = () => {
    if (!dragY) return;
    try { localStorage.setItem("radiolarian-block-y", String(blockY)); } catch (_) {}
    dragY = null;
  };
  block.addEventListener("pointerup", endDrag);
  block.addEventListener("pointercancel", endDrag);
  block.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });   // placeholder links

  // two layouts to compare
  const layouts = page.querySelector(".r-layout");
  function setLayout(name) {
    if (!["corners", "middle"].includes(name)) name = "middle";
    page.dataset.layout = name;
    placeBlock();
    layouts.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.layout === name));
    try { localStorage.setItem("radiolarian-layout", name); } catch (_) {}
  }
  layouts.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLayout(b.dataset.layout); });
  let savedLayout = null;
  try { savedLayout = localStorage.getItem("radiolarian-layout"); } catch (_) {}
  setLayout(savedLayout || "middle");

  let saved = {};
  try { saved = { look: localStorage.getItem("radiolarian-look"), font: localStorage.getItem("radiolarian-font") }; } catch (_) {}
  setLook(saved.look || "original");
  setFont(saved.font ? +saved.font : 0);

})();
