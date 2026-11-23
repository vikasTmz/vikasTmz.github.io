(() => {
  const nav = document.querySelector('.pnav');
  if (!nav) return;
  const entries = [...nav.querySelectorAll('a')].map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }));
  const fill = nav.querySelector('.pnav-fill');
  let scheduled = false;
  function update() {
    scheduled = false;
    const anchor = Math.min(160, innerHeight * .25);
    let current = 0;
    entries.forEach(({ section }, index) => { if (section.getBoundingClientRect().top <= anchor) current = index; });
    const maximum = document.documentElement.scrollHeight - innerHeight;
    if (maximum > 0 && scrollY >= maximum - 2) current = entries.length - 1;
    fill.style.height = `${maximum > 0 ? Math.min(100, Math.max(0, scrollY / maximum * 100)) : 0}%`;
    entries.forEach(({ link }, index) => {
      link.classList.toggle('is-read', index < current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function refresh() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  // Preserve native fragment/history navigation and move keyboard focus with it.
  document.querySelectorAll('.pnav a, .citation, .reference-backlinks a').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    });
  });
  window.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('pageshow', refresh);
  new ResizeObserver(refresh).observe(document.querySelector('#content'));
  refresh();
})();
