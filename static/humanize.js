// Cycle the shared photo deck on mouse movement, as in the archive draft.
(function () {
  const page = document.querySelector(".humanize-canvas");
  const photo = page && page.querySelector(".humanize-photo");
  if (!photo || !window.PhotoDeck || !window.FLICKER_IMAGES) return;
  const deck = window.PhotoDeck(photo.dataset.base);
  let lastSwap = -Infinity;

  addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const now = performance.now();
    if (now - lastSwap < 10) return;
    const next = deck.next();
    if (!next) return;
    photo.src = next.src;
    photo.dataset.credit = next.photo.credit;
    photo.dataset.source = next.photo.source;
    lastSwap = now;
  }, { passive: true });
})();
