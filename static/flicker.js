// The flicker draft: every mouse move, key press and click (on a phone, every scroll
// and swipe) swaps the photo for the next one, at once; "Pace" can slow it down.
// The photos come from the shared deck in static/photo-deck.js. The rest of the
// page (colours, "non plus", the box, the options) is the hurricane draft's,
// from static/hurricane.js.
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

  if (!window.FLICKER_IMAGES || !window.PhotoDeck) return;
  const img = page.querySelector(".storm");
  const status = page.querySelector(".f-status output");
  const hold = page.querySelector(".f-freeze input");

  let shown = false;
  const deck = PhotoDeck(img.dataset.base, { onProgress: report, onReady: () => { if (!shown) swap(); } });

  function swap() {
    const next = deck.next();
    if (!next) return;
    shown = true;
    img.src = next.src;
    img.alt = next.photo.credit;
    report();
  }

  function report() {
    status.textContent = deck.loaded < deck.total ? `${deck.loaded} of ${deck.total} photos loaded` : `${deck.total} photos`;
  }

  // "Pace": a new photo on every movement (as at first; one per 10 ms at most, since
  // screens show one picture a frame), or at most so many photos a second
  const paceRange = page.querySelector(".f-pace input"), paceOut = page.querySelector(".f-pace output");
  const EVERY = +paceRange.max;   // the top of the slider: every movement
  let gap = 10;
  function setPace(v) {
    v = Math.max(1, Math.min(EVERY, Math.round(+v)));
    gap = v === EVERY ? 10 : 1000 / v;
    paceRange.value = v;
    paceOut.textContent = v === EVERY ? "every movement" : `${v} a second`;
    try { localStorage.setItem("flicker-pace-2", String(v)); } catch (_) {}
  }
  paceRange.addEventListener("input", () => setPace(paceRange.value));
  let savedPace = null;
  try { savedPace = localStorage.getItem("flicker-pace-2"); } catch (_) {}
  setPace(savedPace === null ? EVERY : savedPace);

  let lastSwap = -Infinity;
  function change() {
    if (hold.checked) return;
    const now = performance.now();
    if (now - lastSwap < gap) return;
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
