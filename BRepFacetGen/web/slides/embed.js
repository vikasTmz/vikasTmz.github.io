// The exported DeckWerk objects and renderer remain unchanged. Controlled
// frames accept only parent commands; standalone slides retain native playback.
(() => {
  const controlled = new URLSearchParams(location.search).has('controlled');
  const CHANNEL = 'brepfacet-section-player';
  let ready = false;
  const reply = data => parent.postMessage({ channel: CHANNEL, ...data }, location.origin);
  if (controlled) {
    addEventListener('message', event => {
      if (event.source !== parent || event.origin !== location.origin || event.data?.channel !== CHANNEL) return;
      if (!ready) return;
      if (event.data.action === 'connect') reply({ type: 'ready' });
      if (event.data.action === 'pause') window.embedClock.pause();
      if (event.data.action === 'resume') window.embedClock.resume();
    });
    // Native presentation clicks/keys must not skip builds within a section.
    for (const name of ['mousedown', 'click', 'dblclick']) addEventListener(name, event => {
      if (!event.target.closest('a,input,textarea,select')) event.stopImmediatePropagation();
    }, true);
    addEventListener('keydown', event => {
      if (event.target.closest('input,textarea,select')) return;
      const action = { ' ': 'toggle', ArrowRight: 'next', ArrowLeft: 'previous', Home: 'restart' }[event.key];
      if (action) {
        event.preventDefault(); event.stopImmediatePropagation();
        reply({ type: 'request', action });
      }
    }, true);
  }
  function boot() {
    const player = window.__SLIDE_PLAYER__;
    if (!player) return;
    player.goTo({ slide: 0, step: 0 }, { play: true, morph: false });
    ready = true;
    if (controlled) { window.embedClock.freezeAnimations(); reply({ type: 'ready' }); }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
