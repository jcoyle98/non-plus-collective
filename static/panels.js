// The design drafts' About, Directory and Featured Writings links open a window
// over the page (templates/panels.html) instead of going to another page. The
// window has a tab for each, so you can move between them without closing it.
// Close it with ×, Escape, or a click outside it.
(function () {
  const win = document.querySelector(".np-window");
  if (!win) return;
  const tabs = [...win.querySelectorAll('[role="tab"]')];

  function select(name, focus) {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) tab.focus();
    });
    win.querySelector(".np-body").scrollTop = 0;
  }

  // a link in the page's row of links opens the window at its tab
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-panel]");
    if (!link) return;
    e.preventDefault();
    select(link.dataset.panel);
    if (!win.open) win.showModal();
  });

  win.querySelector(".np-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tab.dataset.tab);
  });
  // left and right arrows move between the tabs
  win.querySelector(".np-tabs").addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    select(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, true);
    e.preventDefault();
  });

  win.querySelector(".np-close").addEventListener("click", () => win.close());
  win.addEventListener("click", (e) => { if (e.target === win) win.close(); });   // a click on the shade around it
})();
