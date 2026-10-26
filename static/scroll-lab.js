// The lab version of the one-page draft: an Options sheet, made for a phone, for
// trying the photo's colour treatment, opacity and veils, how often it changes,
// "non plus" (font, colour, size, italic, capitals), the links (colour, size) and
// the text (fonts, size, colour). Each option sets a variable on the page's <main>
// (see the one-page draft's styles in style.css). Choices are kept on this device;
// Reset goes back to the draft as it is.
(function () {
  const page = document.querySelector(".scroll-draft");
  const sheet = document.querySelector(".sl-sheet");
  if (!page || !sheet) return;
  const body = sheet.querySelector(".sl-body");
  const openButton = document.querySelector(".sl-open");

  // [name shown, Google Fonts family ("" = the site's own EB Garamond)]
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
  // the hurricane draft's treatments: dark = what the photo's black becomes, light = what its white becomes
  const LOOKS = [
    ["original", "Original", "#000000", "#ffffff"], ["mono", "Black and white", "#000000", "#ffffff"],
    ["inverse", "Inverse, grey", "#f4f2ee", "#8c8c8c"], ["inverse-warm", "Inverse, warm grey", "#f3efe6", "#a39b8c"],
    ["red-gold", "Red and gold", "#a43434", "#e1b867"], ["violet-mint", "Violet and mint", "#43396a", "#8ec6ab"],
    ["night-blue", "Night and blue", "#180826", "#6da7d0"], ["teal-lilac", "Teal and lilac", "#274a49", "#e0c9e3"],
    ["navy-bone", "Navy and bone", "#3d4e78", "#d0ccbd"], ["oxblood-rose", "Oxblood and rose", "#722b35", "#cfa98d"],
    ["umber-gold", "Umber and gold", "#100d12", "#e8c273"], ["moss-sage", "Moss and sage", "#1e1d19", "#abac88"],
  ];
  const BRIGHT = [
    ["cyan", "#00e5ff"], ["red", "#ff3b3b"], ["purple", "#a259ff"], ["yellow", "#ffcc33"], ["green", "#3ddc84"],
    ["pink", "#ff5fa2"], ["blue", "#3d7bff"], ["gold", "#e1b867"], ["mint", "#8ec6ab"], ["rose", "#cfa98d"],
    ["paper", "#f2ede2"], ["white", "#ffffff"], ["black", "#141214"],
  ];
  const TEXT = [
    ["paper", "#f2ede2"], ["white", "#ffffff"], ["bone", "#d0ccbd"], ["warm grey", "#a39b8c"], ["gold", "#e1b867"],
    ["cyan", "#00e5ff"], ["mint", "#8ec6ab"], ["rose", "#cfa98d"], ["lilac", "#e0c9e3"], ["black", "#141214"],
  ];

  // fonts with no italic: asking Google Fonts for one would fail to load them at all
  const NO_ITALIC = new Set(["Gloock", "Abril Fatface", "Cinzel", "Manrope", "Space Grotesk", "Syne", "Unbounded", "Oswald",
    "Bebas Neue", "Anton", "Syncopate", "Major Mono Display", "UnifrakturMaguntia"]);

  const set = (name, value) => page.style.setProperty(name, value);
  const loadedFonts = new Set();
  function font(i) {
    const [, family] = FONTS[i] || FONTS[0];
    if (family && !loadedFonts.has(family)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${NO_ITALIC.has(family) ? "" : ":ital@0;1"}&display=swap`;
      document.head.appendChild(link);
      loadedFonts.add(family);
    }
    return family ? `"${family}"` : '"EB Garamond"';
  }

  // the colour treatments as SVG filters: greyscale, then black -> dark and white -> light
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  document.querySelector(".sl-filters defs").innerHTML = LOOKS.filter(([key]) => key !== "original").map(([key, , dark, light]) => {
    const [d, w] = [hex(dark), hex(light)];
    const t = (i) => `tableValues="${d[i].toFixed(3)} ${w[i].toFixed(3)}"`;
    return `<filter id="sl-${key}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="table" ${t(0)}/><feFuncG type="table" ${t(1)}/><feFuncB type="table" ${t(2)}/></feComponentTransfer>
    </filter>`;
  }).join("");

  // every option: how it is shown, its default (the draft as it is), and what it changes
  const OPTIONS = [
    { group: "Photo" },
    { key: "hold", type: "check", label: "Hold this photo", def: false, apply: (v) => { page.dataset.hold = v ? "on" : "off"; } },
    { key: "look", type: "swatches", label: "Colour", def: "original",
      choices: LOOKS.map(([key, name, dark, light]) => [key, name, `linear-gradient(135deg, ${dark} 50%, ${light} 50%)`]),
      apply: (v) => {
        const look = LOOKS.find(([key]) => key === v) || LOOKS[0];
        set("--sd-photo-filter", look[0] === "original" ? "none" : `url(#sl-${look[0]})`);
        set("--sd-ground", look[0] === "original" ? "#0e0d0e" : look[2]);
      } },
    { key: "photoOpacity", type: "range", label: "Photo opacity", min: 0, max: 100, def: 100, unit: "%", apply: (v) => set("--sd-photo-opacity", v / 100) },
    { key: "veilHero", type: "range", label: "Shade on the opening screen", min: 0, max: 90, def: 25, unit: "%", apply: (v) => set("--sd-veil-hero", v / 100) },
    { key: "veilText", type: "range", label: "Shade behind the text", min: 0, max: 95, def: 62, unit: "%", apply: (v) => set("--sd-veil-text", v / 100) },
    { key: "mouse", type: "check", label: "Moving the mouse changes the photo (computers)", def: true, apply: (v) => { page.dataset.mouse = v ? "on" : "off"; } },
    { key: "step", type: "range", label: "New photo every", min: 40, max: 800, step: 20, def: 200, unit: " px of scrolling", apply: (v) => { page.dataset.step = v; } },
    { group: "non plus" },
    { key: "wordFont", type: "font", label: "Font", def: 0, apply: (v) => set("--sd-word-font", font(v)) },
    { key: "word", type: "swatches", label: "Colour (also the underline under the links)", def: "#00e5ff",
      choices: BRIGHT.map(([name, c]) => [c, name, c]), apply: (v) => set("--sd-word", v) },
    { key: "wordScale", type: "range", label: "Size", min: 40, max: 160, def: 100, unit: "%", apply: (v) => set("--sd-word-scale", v / 100) },
    { key: "wordStyle", type: "segments", label: "Style", def: "italic", choices: [["italic", "Italic"], ["normal", "Upright"]], apply: (v) => set("--sd-word-style", v) },
    { key: "wordCase", type: "segments", label: "Letters", def: "uppercase", choices: [["uppercase", "NON PLUS"], ["none", "non plus"], ["capitalize", "Non Plus"]], apply: (v) => set("--sd-word-case", v) },
    { group: "Links" },
    { key: "link", type: "swatches", label: "Colour", def: "",
      choices: [["", "same as the text", "linear-gradient(135deg, #f2ede2 50%, #141214 50%)"], ...BRIGHT.map(([name, c]) => [c, name, c])],
      apply: (v) => (v ? set("--sd-link", v) : page.style.removeProperty("--sd-link")) },
    { key: "linkScale", type: "range", label: "Size", min: 70, max: 150, def: 100, unit: "%", apply: (v) => set("--sd-link-scale", v / 100) },
    { group: "Text" },
    { key: "headFont", type: "font", label: "Headings font", def: 0, apply: (v) => set("--sd-head-font", font(v)) },
    { key: "textFont", type: "font", label: "Text font (also the links)", def: 0, apply: (v) => set("--sd-text-font", font(v)) },
    { key: "textScale", type: "range", label: "Size", min: 80, max: 140, def: 100, unit: "%", apply: (v) => set("--sd-text-scale", v / 100) },
    { key: "fg", type: "swatches", label: "Colour", def: "#f2ede2", choices: TEXT.map(([name, c]) => [c, name, c]), apply: (v) => set("--sd-fg", v) },
  ];

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("scroll-lab")) || {}; } catch (_) {}
  const values = {};
  function save() { try { localStorage.setItem("scroll-lab", JSON.stringify(values)); } catch (_) {} }

  // build the sheet
  const controls = {};
  OPTIONS.forEach((o) => {
    if (o.group) { const h = document.createElement("h3"); h.textContent = o.group; body.append(h); return; }
    const row = document.createElement("div");
    row.className = `sl-row sl-${o.type}`;
    const id = `sl-${o.key}`;
    if (o.type === "check") {
      row.innerHTML = `<label><input type="checkbox" id="${id}"> ${o.label}</label>`;
      row.querySelector("input").addEventListener("change", (e) => update(o, e.target.checked));
    } else if (o.type === "range") {
      row.innerHTML = `<label for="${id}">${o.label}</label><output></output><input type="range" id="${id}" min="${o.min}" max="${o.max}" step="${o.step || 1}">`;
      row.querySelector("input").addEventListener("input", (e) => update(o, +e.target.value));
    } else if (o.type === "font") {
      row.innerHTML = `<label for="${id}">${o.label}</label><select id="${id}">${FONTS.map(([name], i) => `<option value="${i}">${name}</option>`).join("")}</select>`;
      row.querySelector("select").addEventListener("change", (e) => update(o, +e.target.value));
    } else {
      row.innerHTML = `<span class="sl-label">${o.label}</span><div class="sl-choices" role="group" aria-label="${o.label}"></div>`;
      const box = row.querySelector(".sl-choices");
      o.choices.forEach(([value, name, paint]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.value = value;
        if (o.type === "swatches") { b.title = name; b.setAttribute("aria-label", name); b.style.background = paint; }
        else b.textContent = name;
        b.addEventListener("click", () => update(o, value));
        box.append(b);
      });
    }
    controls[o.key] = row;
    body.append(row);
  });

  function show(o, v) {
    const row = controls[o.key];
    if (o.type === "check") row.querySelector("input").checked = v;
    else if (o.type === "range") { row.querySelector("input").value = v; row.querySelector("output").textContent = `${v}${o.unit}`; }
    else if (o.type === "font") row.querySelector("select").value = String(v);
    else row.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === String(v))));
  }
  function update(o, v, keep = true) {
    values[o.key] = v;
    o.apply(v);
    show(o, v);
    if (keep) save();
  }
  function applyAll(from) {
    OPTIONS.forEach((o) => { if (!o.group) update(o, o.key in from ? from[o.key] : o.def, false); });
    save();
  }
  applyAll(saved);

  // open and close the sheet
  function open(yes) {
    sheet.hidden = !yes;
    openButton.hidden = yes;
    document.documentElement.classList.toggle("sl-sheet-open", yes);   // moves "non plus" up, clear of the sheet
    openButton.setAttribute("aria-expanded", String(yes));
    if (yes) sheet.querySelector(".sl-done").focus({ preventScroll: true });
    else openButton.focus({ preventScroll: true });
  }
  openButton.addEventListener("click", () => open(true));
  sheet.querySelector(".sl-done").addEventListener("click", () => open(false));
  sheet.querySelector(".sl-reset").addEventListener("click", () => applyAll({}));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) open(false); });
})();
