// Design page: the barred S is the same colour as the background and shows
// when you hover over it (see style.css). Clicking it opens the directory over
// a shadowed page; click outside the directory, or press Escape, to close it.
(function () {
  const button = document.querySelector(".reveal");
  const dialog = document.querySelector(".directory-dialog");

  button.addEventListener("click", () => dialog.showModal());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();   // a click on the shadow, not the list
  });
})();
