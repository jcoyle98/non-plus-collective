// Draft design page: buttons along the bottom choose how the engraving meets
// the page, by setting data-look on <body> (the looks themselves are in
// style.css), switch the printed border on and off, and set how much grain
// covers the background.
(function () {
  const LOOKS = [
    ["ink", "Ink", "Just the lines, in the image colour; the paper is the background"],
    ["negative", "Negative", "A block of the image colour with the lines cut out of it"],
  ];
  const SWITCHES = [
    ["frame", "Frame", "The printed border and the page number", false],
  ];
  const GRAIN_TILES = 4;    // static/images/grain-1.png to grain-4.png (tools/grain.py)
  const GRAIN_MAX = 8;
  const GRAIN_START = 3;
  const group = document.querySelector(".looks");

  function choose(look) {
    document.body.dataset.look = look;
    group.querySelectorAll(".look").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.look === look)));
  }

  LOOKS.forEach(([look, name, title]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "look";
    b.dataset.look = look;
    b.textContent = name;
    b.title = title;
    b.addEventListener("click", () => choose(look));
    group.append(b);
  });

  const divider = document.createElement("span");
  divider.className = "divider";
  divider.setAttribute("aria-hidden", "true");
  group.append(divider);

  // On/off switches, kept as data-frame on <body>
  function set(name, on) {
    document.body.dataset[name] = on ? "on" : "off";
    group.querySelector(`[data-switch="${name}"]`).setAttribute("aria-pressed", String(on));
  }
  SWITCHES.forEach(([name, label, title, on]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "look switch";
    b.dataset.switch = name;
    b.textContent = label;
    b.title = title;
    b.addEventListener("click", () => set(name, document.body.dataset[name] !== "on"));
    group.append(b);
    set(name, on);
  });

  // Grain: each step adds a layer of specks, from the tiles in turn, each shifted
  // by an odd amount so the layers never line up. 0 is none.
  const css = document.querySelector('link[rel="stylesheet"]').href;   // tiles are relative to style.css
  function grain(level) {
    document.body.dataset.grain = level > 0 ? "on" : "off";
    const layers = [];
    for (let i = 0; i < level; i++) {
      const tile = new URL(`images/grain-${(i % GRAIN_TILES) + 1}.png`, css).href;
      layers.push(`url("${tile}") ${(i * 97) % 256}px ${(i * 61) % 256}px / 256px repeat`);  // 512px tiles, crisp on high-density screens
    }
    document.body.style.setProperty("--grain", layers.join(", ") || "none");
  }
  const control = document.createElement("label");
  control.className = "grain-control";
  control.textContent = "Grain";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = GRAIN_MAX;
  slider.value = GRAIN_START;
  slider.addEventListener("input", () => grain(Number(slider.value)));
  control.append(slider);
  group.append(control);
  grain(GRAIN_START);

  choose("ink");
})();
