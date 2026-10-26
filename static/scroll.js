// The one-page draft: About, Directory and Featured Writings are sections of one
// long page that scrolls over a still photo, and every stretch of scrolling
// (data-step pixels on the page, 200 by default) swaps the photo for the next
// one from the shared deck (static/photo-deck.js), at most a few times a second.
// The links along the top glide down to their section and mark the one you're
// reading; the veil over the photo darkens once the opening screen has scrolled away.
(function () {
  const page = document.querySelector(".scroll-draft");
  if (!page) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  // links to a section on this page: glide there (the sections leave room for the bar, see style.css)
  page.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href") === "#top" ? location.pathname : link.getAttribute("href"));
  });

  // the veil: light over the opening screen, darker after it
  new IntersectionObserver(([entry]) => {
    page.classList.toggle("past-hero", !entry.isIntersecting);
  }, { rootMargin: "-64px 0px 0px 0px" }).observe(page.querySelector(".sd-hero"));

  // the section crossing the middle of the screen is the one being read
  const links = [...page.querySelectorAll(".sd-nav a")];
  const sections = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
  const visible = new Map();
  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
    const current = sections.find((s) => visible.get(s.id));
    links.forEach((a) => {
      if (current && a.getAttribute("href") === "#" + current.id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => watcher.observe(s));

  // the photo: the next one every `step` pixels scrolled, and no more often than every MIN_MS
  const photo = page.querySelector(".sd-photo");
  if (window.PhotoDeck && window.FLICKER_IMAGES) {
    const deck = PhotoDeck(photo.dataset.base);
    const step = +page.dataset.step || 200;
    const MIN_MS = 160;
    let lastY = scrollY, travelled = 0, lastSwap = -Infinity;
    addEventListener("scroll", () => {
      travelled += Math.abs(scrollY - lastY);
      lastY = scrollY;
      const now = performance.now();
      if (travelled < step || now - lastSwap < MIN_MS) return;
      const next = deck.next();
      if (!next) return;
      travelled = 0;
      lastSwap = now;
      photo.src = next.src;
    }, { passive: true });
  }

  // opened at an address like …/#directory: go straight there
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    document.getElementById(location.hash.slice(1)).scrollIntoView({ block: "start" });
  }
})();
