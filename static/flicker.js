// The flicker draft: every mouse move, key press or click (on a phone, every
// scroll or swipe) swaps the photo for the next one, at once. The photos come
// from static/flicker-images.js (made by tools/flicker.py). They load in the
// background in a shuffled order, and a few are always decoded ahead, so a swap
// never waits on the network; until more have loaded it cycles through the
// ones it has. The rest of the page (colours, "non plus", the box, the options)
// is the hurricane draft's, from static/hurricane.js.
(function () {
  const page = document.querySelector(".flicker-draft");
  if (!page) return;

  // where the links go: top, middle (stacked down an edge) or bottom; left, centre, right or spread across
  const places = page.querySelector(".f-place");
  function place(p) {
    if (!places.querySelector(`[data-place="${p}"]`)) p = "top-left";
    page.dataset.links = p;
    places.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.place === p)));
    try { localStorage.setItem("flicker-links-place", p); } catch (_) {}
  }
  places.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) place(b.dataset.place); });
  let savedPlace = null;
  try { savedPlace = localStorage.getItem("flicker-links-place"); } catch (_) {}
  place(savedPlace || "top-left");

  if (!window.FLICKER_IMAGES) return;
  const img = page.querySelector(".storm");
  const status = page.querySelector(".f-status output");
  const hold = page.querySelector(".f-freeze input");

  // phones get the 800 px set, everything else the 1400 px one
  const dir = img.dataset.base + (Math.max(screen.width, screen.height) <= 900 ? "s/" : "l/");
  const list = FLICKER_IMAGES.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  let shown = null;   // the photo on screen: { im, k }

  // load every photo, a few at a time
  const loaded = new Set();   // positions in list
  let toLoad = 0;
  function loadNext() {
    if (toLoad >= list.length) return;
    const k = toLoad++;
    const im = new Image();
    im.onload = () => { loaded.add(k); report(); fill(); loadNext(); };
    im.onerror = loadNext;
    im.src = dir + list[k].f;
  }
  for (let n = 0; n < 6; n++) loadNext();

  // keep a few loaded photos decoded and ready, in order
  const AHEAD = 8;
  const ready = [];
  let cursor = -1, decoding = 0;
  // the next loaded photo after the cursor that isn't already waiting or on screen
  const waiting = new Set();
  function nextLoaded() {
    for (let step = 1; step <= list.length; step++) {
      const k = (cursor + step) % list.length;
      if (loaded.has(k) && !waiting.has(k) && !(shown && shown.k === k)) { cursor = k; return k; }
    }
    return -1;
  }
  function fill() {
    while (ready.length + decoding < AHEAD) {
      const k = nextLoaded();
      if (k < 0) return;
      const im = new Image();
      im.src = dir + list[k].f;
      decoding++;
      waiting.add(k);
      im.decode().catch(() => {}).then(() => { decoding--; ready.push({ im, k }); if (!shown) swap(); });
    }
  }

  function swap() {
    // a decoded photo if one is ready; if events outrun decoding, the next loaded one anyway
    let next = ready.shift();
    if (!next) {
      const k = nextLoaded();
      if (k >= 0) { const im = new Image(); im.src = dir + list[k].f; next = { im, k }; }
    }
    fill();
    if (!next) return;
    waiting.delete(next.k);
    shown = next;
    img.src = next.im.src;
    const photo = list[next.k];
    img.alt = photo.credit;
    report();
  }

  function report() {
    status.textContent = loaded.size < list.length ? `${loaded.size} of ${list.length} photos loaded` : `${list.length} photos`;
  }

  // swap at once on each event, but no more than once per 10 ms: screens show at most
  // one picture per frame, so more would only load photos nobody sees
  let lastSwap = -Infinity;
  function change() {
    if (hold.checked) return;
    const now = performance.now();
    if (now - lastSwap < 10) return;
    lastSwap = now;
    swap();
  }
  addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") change(); });
  // clicks and keys in the options panel, or in the window the links open, don't change the photo
  const inPanel = (e) => e.target.closest && e.target.closest(".h-controls, .np-window");
  addEventListener("pointerdown", (e) => { if (!inPanel(e)) change(); });
  addEventListener("keydown", (e) => { if (!inPanel(e)) change(); });
  addEventListener("wheel", change, { passive: true });
  addEventListener("touchmove", change, { passive: true });
  addEventListener("scroll", change, { passive: true });

  report();
})();
