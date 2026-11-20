/* Pausable clock scoped to this exported iframe. DeckWerk's renderer is unmodified.
   Freeze pending JS delays, CSS/Web Animations and media together; resume remaining delays. */
(() => {
  if (!new URLSearchParams(location.search).has('controlled')) return;
  const realNow = performance.now.bind(performance);
  const native = { timeout: window.setTimeout.bind(window), clear: window.clearTimeout.bind(window), raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window), play: HTMLMediaElement.prototype.play, pause: HTMLMediaElement.prototype.pause };
  let paused = true, time = realNow(), epoch = realNow(), serial = 0;
  const timers = new Map(), frames = new Map(), media = new Set(), animations = new Set();
  const now = () => paused ? time : time + realNow() - epoch;
  performance.now = now;
  function arm(id, entry) {
    entry.nativeId = native.timeout(() => {
      if (!timers.has(id) || paused) return;
      timers.delete(id); entry.callback(...entry.args);
    }, Math.max(0, entry.due - now()));
  }
  window.setTimeout = (callback, delay = 0, ...args) => {
    if (typeof callback !== 'function') throw new TypeError('The embedded player requires function timers.');
    const id = ++serial, entry = { callback, args, due: now() + Math.max(0, Number(delay) || 0) };
    timers.set(id, entry); if (!paused) arm(id, entry); return id;
  };
  window.clearTimeout = id => { const e = timers.get(id); if (e) { native.clear(e.nativeId); timers.delete(id); } };
  function armFrame(id, callback) {
    const e = frames.get(id); e.nativeId = native.raf(() => {
      if (paused || !frames.has(id)) return;
      frames.delete(id); callback(now());
    });
  }
  window.requestAnimationFrame = callback => {
    const id = ++serial; frames.set(id, { callback }); if (!paused) armFrame(id, callback); return id;
  };
  window.cancelAnimationFrame = id => { const e = frames.get(id); if (e) { native.caf(e.nativeId); frames.delete(id); } };
  HTMLMediaElement.prototype.play = function () {
    if (paused) { media.add(this); return Promise.resolve(); }
    return native.play.call(this);
  };
  HTMLMediaElement.prototype.pause = function () { media.delete(this); return native.pause.call(this); };
  function freezeAnimations() {
    if (!paused) return;
    for (const a of document.getAnimations()) if (a.playState === 'running' || a.pending) { a.pause(); animations.add(a); }
  }
  new MutationObserver(freezeAnimations).observe(document.documentElement, { subtree: true, attributes: true, childList: true });
  const nativeAnimate = Element.prototype.animate;
  Element.prototype.animate = function (...args) {
    const animation = nativeAnimate.apply(this, args);
    if (paused) { animation.pause(); animations.add(animation); }
    return animation;
  };
  document.addEventListener('animationstart', freezeAnimations, true);
  function pause() {
    if (paused) return;
    time = now(); paused = true;
    for (const e of timers.values()) native.clear(e.nativeId);
    for (const e of frames.values()) native.caf(e.nativeId);
    for (const v of document.querySelectorAll('video,audio')) if (!v.paused) { media.add(v); native.pause.call(v); }
    freezeAnimations();
  }
  function resume() {
    if (!paused) return;
    epoch = realNow(); paused = false;
    for (const [id, e] of timers) arm(id, e);
    for (const [id, e] of frames) armFrame(id, e.callback);
    for (const a of animations) if (a.playState === 'paused') a.play();
    animations.clear();
    for (const v of media) if (v.isConnected) native.play.call(v).catch(() => {});
    media.clear();
  }
  window.embedClock = { pause, resume, now, get paused() { return paused; }, nativeTimeout: native.timeout,
    stopMedia() { media.clear(); for (const v of document.querySelectorAll('video,audio')) native.pause.call(v); }, freezeAnimations };
})();
