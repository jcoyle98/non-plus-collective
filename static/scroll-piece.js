// A featured piece's own page (templates/scroll-piece.html), made from
// content/featured.json. It shows the photo that was behind the one-page draft
// when its title was tapped: the link carries it as ?photo=NNN.jpg (see
// scroll.js). The photo stays put here; with no photo given, it shows the
// hurricane, as the draft does at first.
(function () {
  const photo = document.querySelector(".sd-reading .sd-photo");
  if (!photo) return;
  const name = new URLSearchParams(location.search).get("photo");
  const size = Math.max(screen.width, screen.height) <= 900 ? "s/" : "l/";   // as in photo-deck.js
  const file = /^\d{3}\.jpg$/.test(name || "") ? name : "004.jpg";
  photo.src = photo.dataset.base + size + file;
  const entry = (window.FLICKER_IMAGES || []).find((p) => p.f === file);
  if (entry) photo.alt = entry.credit;
})();
