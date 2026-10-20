// Draft design pages: the barred S is hidden until you hover over it (see
// style.css); the engraving on the other draft is always showing. Clicking
// either draws the S's bar, if there is one, then opens the directory over a
// shadowed page; click outside the directory, or press Escape, to close it
// and take the bar away again.
(function () {
  const button = document.querySelector(".reveal");
  const dialog = document.querySelector(".directory-dialog");
  const drawBar = button.querySelector(".bar") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BAR_MS = drawBar ? 400 : 0;  // matches the CSS transition

  button.addEventListener("click", () => {
    if (button.classList.contains("open")) return;
    button.classList.add("open");
    setTimeout(() => dialog.showModal(), BAR_MS);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();   // a click on the shadow, not the list
  });
  dialog.addEventListener("close", () => button.classList.remove("open"));
})();
