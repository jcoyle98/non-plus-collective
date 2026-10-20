// Design page: click a palette to recolour the page, or open "Adjust colours"
// to choose which colour plays which part. A palette in config.json can set
// its own starting roles ("roles": {"bg": 1, ...}, numbered from colour-1);
// otherwise they are worked out from the colours. The choice is kept in the address
// (e.g. #p=3&bg=1&text=2&mark=5&head=4), so a combination can be shared as a link.
(function () {
  const palettes = JSON.parse(document.getElementById("palette-data").textContent);
  const ROLES = [["bg", "Background"], ["text", "Text"], ["mark", "Barred S"], ["head", "Headline"]];
  const body = document.body;
  const list = document.querySelector(".palettes");
  const rows = document.querySelector(".role-rows");
  const contrastNote = document.querySelector(".contrast");

  // WCAG relative luminance and contrast ratio
  function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }
  function chroma(hex) {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return Math.max(...c) - Math.min(...c);
  }

  // A sensible starting point for a palette: the most contrasting pair become
  // background and text; the barred S takes the most vivid remaining colour
  // that still stands out; the headline takes the next most contrasting one.
  function defaults(colours) {
    let best = [0, Math.min(1, colours.length - 1)];
    for (let i = 0; i < colours.length; i++)
      for (let j = i + 1; j < colours.length; j++)
        if (contrast(colours[i], colours[j]) > contrast(colours[best[0]], colours[best[1]])) best = [i, j];
    const [bg, text] = best;
    const rest = colours.map((_, i) => i).filter((i) => i !== bg && i !== text);
    const vivid = rest.filter((i) => contrast(colours[i], colours[bg]) >= 3).sort((a, b) => chroma(colours[b]) - chroma(colours[a]));
    const mark = vivid.length ? vivid[0] : text;
    const others = rest.filter((i) => i !== mark).sort((a, b) => contrast(colours[b], colours[bg]) - contrast(colours[a], colours[bg]));
    const head = others.length && contrast(colours[others[0]], colours[bg]) >= 3 ? others[0] : text;
    return { bg, text, mark, head };
  }

  // Where a palette names its own roles, start from those
  function startRoles(p) {
    const palette = palettes[p];
    if (!palette.roles) return defaults(palette.colours);
    const roles = {};
    ROLES.forEach(([role]) => { roles[role] = palette.roles[role] - 1; });
    return roles;
  }

  let state = { p: 1, roles: startRoles(1) };

  function swatch(hex) {
    const span = document.createElement("span");
    span.style.background = hex;
    return span;
  }

  // Palette buttons
  palettes.forEach((palette, p) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette";
    button.setAttribute("aria-label", palette.name === "Site" ? "Current site colours" : `Palette ${palette.name}`);
    const stripes = document.createElement("span");
    stripes.className = "stripes";
    palette.colours.forEach((hex) => stripes.append(swatch(hex)));
    const label = document.createElement("span");
    label.textContent = palette.name;
    button.append(stripes, label);
    button.addEventListener("click", () => {
      state = { p, roles: startRoles(p) };
      apply();
    });
    list.append(button);
  });

  function renderRoles() {
    const colours = palettes[state.p].colours;
    rows.replaceChildren();
    ROLES.forEach(([role, name]) => {
      const row = document.createElement("div");
      row.className = "role";
      const label = document.createElement("span");
      label.className = "role-name";
      label.textContent = name;
      const choices = document.createElement("span");
      choices.className = "choices";
      colours.forEach((hex, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.style.background = hex;
        b.title = `colour-${i + 1} ${hex}`;
        b.setAttribute("aria-label", `${name}: colour-${i + 1} ${hex}`);
        b.setAttribute("aria-pressed", String(state.roles[role] === i));
        b.addEventListener("click", () => {
          state.roles[role] = i;
          apply();
        });
        choices.append(b);
      });
      const value = document.createElement("code");
      value.textContent = `colour-${state.roles[role] + 1} ${colours[state.roles[role]]}`;
      row.append(label, choices, value);
      rows.append(row);
    });
  }

  function apply() {
    const colours = palettes[state.p].colours;
    ROLES.forEach(([role]) => body.style.setProperty(`--${role}`, colours[state.roles[role]]));
    list.querySelectorAll(".palette").forEach((b, p) => b.setAttribute("aria-pressed", String(p === state.p)));
    renderRoles();
    const ratio = contrast(colours[state.roles.text], colours[state.roles.bg]);
    contrastNote.textContent = `Text contrast ${ratio.toFixed(1)} : 1 — ` +
      (ratio >= 7 ? "very easy to read" : ratio >= 4.5 ? "easy to read" : ratio >= 3 ? "fine for large text only" : "hard to read");
    const r = state.roles;
    history.replaceState(null, "", `#p=${palettes[state.p].name}&bg=${r.bg + 1}&text=${r.text + 1}&mark=${r.mark + 1}&head=${r.head + 1}`);
  }

  function fromAddress() {
    const q = new URLSearchParams(location.hash.slice(1));
    const p = palettes.findIndex((palette) => palette.name === q.get("p"));
    if (p < 0) return;
    const roles = startRoles(p);
    ROLES.forEach(([role]) => {
      const i = parseInt(q.get(role), 10) - 1;
      if (i >= 0 && i < palettes[p].colours.length) roles[role] = i;
    });
    state = { p, roles };
  }

  fromAddress();
  apply();
  window.addEventListener("hashchange", () => { fromAddress(); apply(); });
})();
