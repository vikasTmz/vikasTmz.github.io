(() => {
  const controllers = [];
  document.querySelectorAll('.slide-menu').forEach(menu => {
    const buttons = [...menu.querySelectorAll('button[data-slide-src]')];
    if (!buttons.length) return;
    const frame = document.getElementById(buttons[0].getAttribute('aria-controls'));
    const key = menu.dataset.slideMenuKey;
    if (!frame || !key) return;
    let selected = null;
    const select = button => {
      if (selected === button) return;
      // Reuse one iframe: navigating unloads the old slide and its media.
      // Hidden examples never load or continue playing in the background.
      frame.title = button.dataset.slideTitle;
      frame.style.setProperty('--ratio', button.dataset.slideRatio);
      frame.src = button.dataset.slideSrc;
      frame.hidden = false;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      selected = button;
    };
    controllers.push({ key, buttons, select });
    const choose = button => {
      const url = new URL(window.location.href);
      if (url.searchParams.get(key) !== button.dataset.slideId) {
        url.searchParams.set(key, button.dataset.slideId);
        try { window.history.pushState(window.history.state, '', url.href); }
        catch {
          // Some file:// browser policies restrict History API changes.
          // A normal navigation still restores the selected slide on load.
          window.location.assign(url.href);
          return;
        }
      }
      restore();
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => choose(button));
      button.addEventListener('keydown', event => {
        const next = { ArrowRight: (index + 1) % buttons.length, ArrowLeft: (index + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key];
        if (next === undefined || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        buttons[next].focus();
        choose(buttons[next]);
      });
    });
    menu.hidden = false;
  });
  function restore() {
    const params = new URL(window.location.href).searchParams;
    controllers.forEach(({ key, buttons, select }) => {
      select(buttons.find(button => button.dataset.slideId === params.get(key)) || buttons[0]);
    });
  }
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
})();
