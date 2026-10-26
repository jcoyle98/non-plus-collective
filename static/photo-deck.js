// A shuffled deck of the photos in static/flicker-images.js (made by
// tools/flicker.py), shared by the flicker and one-page drafts. Every photo loads
// in the background, a few at a time, and a few loaded ones are always decoded
// ahead, so taking the next one never waits on the network; until more have
// loaded it cycles through the ones it has, never the same one twice in a row.
//
//   const deck = PhotoDeck(base, { onProgress, onReady });
//   deck.next()   -> { src, photo } or null if nothing has loaded yet
//   deck.loaded / deck.total
//
// base is the folder holding l/ (1400 px) and s/ (800 px, for phones).
window.PhotoDeck = function (base, { onProgress = () => {}, onReady = () => {} } = {}) {
  const dir = base + (Math.max(screen.width, screen.height) <= 900 ? "s/" : "l/");
  const list = (window.FLICKER_IMAGES || []).slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  let shown = -1;   // position in list of the photo last handed out

  // load every photo, a few at a time
  const loaded = new Set();
  let toLoad = 0;
  function loadNext() {
    if (toLoad >= list.length) return;
    const k = toLoad++;
    const im = new Image();
    im.onload = () => { loaded.add(k); onProgress(); fill(); loadNext(); };
    im.onerror = loadNext;
    im.src = dir + list[k].f;
  }
  for (let n = 0; n < 6; n++) loadNext();

  // keep a few loaded photos decoded and ready, in order
  const AHEAD = 8;
  const ready = [];
  const waiting = new Set();
  let cursor = -1, decoding = 0, first = true;
  function nextLoaded() {
    for (let step = 1; step <= list.length; step++) {
      const k = (cursor + step) % list.length;
      if (loaded.has(k) && !waiting.has(k) && k !== shown) { cursor = k; return k; }
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
      im.decode().catch(() => {}).then(() => {
        decoding--;
        ready.push({ im, k });
        if (first) { first = false; onReady(); }
      });
    }
  }

  return {
    get loaded() { return loaded.size; },
    total: list.length,
    next() {
      // a decoded photo if one is ready; if requests outrun decoding, the next loaded one anyway
      let next = ready.shift();
      if (!next) {
        const k = nextLoaded();
        if (k >= 0) { const im = new Image(); im.src = dir + list[k].f; next = { im, k }; }
      }
      fill();
      if (!next) return null;
      waiting.delete(next.k);
      shown = next.k;
      return { src: next.im.src, photo: list[next.k] };
    },
  };
};
