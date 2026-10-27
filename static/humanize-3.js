// Humanize 3.0: "non plus" at the top and, in a small black box in the middle, one text from the archive,
// a different one each time the page is loaded (never the same as last time, in this browser).
(function () {
  const page = document.querySelector("main.hz3");
  if (!page) return;
  const pieces = [...page.querySelectorAll(".hz3-piece")];
  if (!pieces.length) return;

  let last = null;
  try { last = localStorage.getItem("humanize-3-last"); } catch (_) {}
  const choices = pieces.length > 1 ? pieces.filter((p) => p.dataset.slug !== last) : pieces;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  chosen.hidden = false;
  try { localStorage.setItem("humanize-3-last", chosen.dataset.slug); } catch (_) {}

  // a photograph of its own each visit too
  const photo = page.querySelector(".humanize-photo");
  const list = window.FLICKER_IMAGES || [];
  if (photo && list.length) {
    const dir = photo.dataset.base + (Math.max(screen.width, screen.height) <= 900 ? "s/" : "l/");
    photo.src = dir + list[Math.floor(Math.random() * list.length)].f;
  }
})();
