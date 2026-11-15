// Keep native DeckWerk playback and click builds without a website control bar.
(() => {
  function boot() {
    const player = window.__SLIDE_PLAYER__;
    if (player) player.goTo({ slide: 0, step: 0 }, { play: true, morph: false });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
