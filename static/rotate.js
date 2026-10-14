// Scrolling turns the barred S: up = clockwise, down = counter-clockwise.
// Works with a mouse wheel, a trackpad, a touch screen, and the arrow keys.
(function () {
  const s = document.querySelector(".barred-s");
  if (!s) return;
  const DEGREES_PER_PIXEL = 0.25;
  let angle = 0;
  let queued = false;

  function turn(scrollDown) {        // scrollDown > 0 means "scrolled down"
    angle -= scrollDown * DEGREES_PER_PIXEL;
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        s.style.transform = `rotate(${angle}deg)`;
        queued = false;
      });
    }
  }

  // Mouse wheel and trackpad (Firefox may report lines instead of pixels)
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    turn(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
  }, { passive: false });

  // Touch: a finger moving up is a scroll down, as on any page
  let lastY = null;
  window.addEventListener("touchstart", (e) => { lastY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    const y = e.touches[0].clientY;
    if (lastY !== null) turn(lastY - y);
    lastY = y;
  }, { passive: true });
  window.addEventListener("touchend", () => { lastY = null; });

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.target.closest("a, summary, button")) return;  // let the menu use Enter and Space
    const step = { ArrowDown: 40, ArrowUp: -40, PageDown: 200, PageUp: -200, " ": 200 }[e.key];
    if (step !== undefined) { e.preventDefault(); turn(step); }
  });
})();
