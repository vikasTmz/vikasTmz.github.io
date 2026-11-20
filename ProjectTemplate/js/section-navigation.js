export function initSectionNavigation(nav, content) {
  if (!nav || !content) return () => {};
  const entries = [...nav.querySelectorAll('a[href^="#"]')].map(link => {
    let section;
    try { section = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { /* Invalid fragment. */ }
    return { link, section };
  }).filter(({ section }) => section && content.contains(section));
  if (!entries.length) return () => {};
  const fill = nav.querySelector('.pnav-fill');
  let frame = 0;
  const handlers = [];
  function update() {
    frame = 0;
    const anchor = Math.min(160, innerHeight * 0.25);
    let current = 0;
    entries.forEach(({ section }, index) => { if (section.getBoundingClientRect().top <= anchor) current = index; });
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    if (maximum > 0 && scrollY >= maximum - 2) current = entries.length - 1;
    if (fill) fill.style.height = `${maximum > 0 ? Math.min(100, Math.max(0, scrollY / maximum * 100)) : 0}%`;
    entries.forEach(({ link }, index) => {
      link.classList.toggle('is-read', index < current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    // Preserve 38px rows; use flowing links when the rail cannot fit.
    nav.classList.toggle('pnav-short', entries.length * 38 + 48 > innerHeight);
    // Very long labels should wrap in flow, rather than overlap other chips.
    nav.classList.remove('pnav-wide-labels');
    if (innerWidth >= 1100 && [...nav.querySelectorAll('.pnav-label')].some(label => label.getBoundingClientRect().height > 38)) {
      nav.classList.add('pnav-wide-labels');
    }
  }
  function refresh() { if (!frame) frame = requestAnimationFrame(update); }
  entries.forEach(({ link, section }) => {
    const handler = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      section.focus({ preventScroll: true });
    };
    link.addEventListener('click', handler);
    handlers.push([link, handler]);
  });
  const events = ['scroll', 'resize', 'pageshow', 'hashchange', 'load'];
  events.forEach(type => addEventListener(type, refresh, { passive: true }));
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
  observer?.observe(content);
  observer?.observe(document.body);
  refresh();
  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();
    events.forEach(type => removeEventListener(type, refresh));
    handlers.forEach(([link, handler]) => link.removeEventListener('click', handler));
  };
}
