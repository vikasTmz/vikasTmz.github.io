(() => {
  const CHANNEL = 'brepfacet-slides', clock = window.embedClock;
  let player, started = clock.now(), suspendedByPage = false;
  const count = slide => 1 + slide.timeline.filter(t => t.trigger.on === 'click').length;
  function status() {
    if (!player) return;
    const cursor = player.getCursor(), slide = window.__DECK__.slides[cursor.slide];
    parent.postMessage({ channel: CHANNEL, type: 'status', slide: cursor.slide, step: cursor.step,
      steps: count(slide), playing: !clock.paused, elapsed: Math.max(0, (clock.now() - started) / 1000) }, location.origin === 'null' ? '*' : location.origin);
  }
  function jump(index) {
    clock.stopMedia();
    player.goTo({ slide: index, step: 0 }, { play: true, morph: false });
    started = clock.now(); clock.freezeAnimations();
  }
  function command(action, value) {
    if (!player) return;
    if (action === 'toggle') clock.paused ? clock.resume() : clock.pause();
    else if (action === 'pause') clock.pause();
    else if (action === 'slide') jump(Math.max(0, Math.min(1, Number(value) || 0)));
    else if (action === 'restart') jump(player.getCursor().slide);
    else if (action === 'next' || action === 'previous') {
      const old = player.getCursor();
      action === 'next' ? player.next() : player.prev();
      if (old.slide !== player.getCursor().slide) started = clock.now();
      clock.freezeAnimations();
    }
    status();
  }
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.channel !== CHANNEL) return;
    command(event.data.action, event.data.value);
  });
  // Navigation is explicit in the website bar, rather than every click on the slide advancing it.
  addEventListener('mousedown', event => { if (!event.target.closest('a,input,button,select,textarea')) event.stopImmediatePropagation(); }, true);
  addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select')) return;
    const action = { ' ': 'toggle', ArrowRight: 'next', ArrowLeft: 'previous', r: 'restart' }[event.key];
    if (action) { event.preventDefault(); event.stopImmediatePropagation(); command(action); }
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { suspendedByPage = !clock.paused; clock.pause(); }
    else if (suspendedByPage) { suspendedByPage = false; clock.resume(); }
    status();
  });
  function boot() {
    player = window.__SLIDE_PLAYER__;
    if (!player || window.__DECK__.slides.length !== 2) throw Error('Expected the two-slide DeckWerk player.');
    window.embedControls = { command, status }; // also useful for local QA
    jump(0); status();
    const tick = () => { status(); clock.nativeTimeout(tick, 250); }; tick();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();
