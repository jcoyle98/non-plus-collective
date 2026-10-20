// Draft design page: the barred S is the same colour as the background and
// shows as a plain S when you hover over it (see style.css). Clicking it draws
// the bar, then opens the directory over a shadowed page; click outside the
// directory, or press Escape, to close it and take the bar away again.
(function () {
  const button = document.querySelector(".reveal");
  const dialog = document.querySelector(".directory-dialog");
  const BAR_MS = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400;  // matches the CSS transition

  button.addEventListener("click", () => {
    if (button.classList.contains("barred")) return;
    button.classList.add("barred");
    setTimeout(() => dialog.showModal(), BAR_MS);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();   // a click on the shadow, not the list
  });
  dialog.addEventListener("close", () => button.classList.remove("barred"));
})();
