// Rank the visible portion against what can fit on screen, so tall slides
// remain playable on short windows. Near ties retain the current player.
export function chooseVisiblePlayer(rects, viewport, current = -1) {
  const scores = rects.map(r => {
    const width = Math.max(0, Math.min(r.right, viewport.width) - Math.max(0, r.left));
    const height = Math.max(0, Math.min(r.bottom, viewport.height) - Math.max(0, r.top));
    const available = Math.min(r.width, viewport.width) * Math.min(r.height, viewport.height);
    return available > 0 ? width * height / available : 0;
  });
  let best = -1;
  const distance = i => Math.abs((rects[i].top + rects[i].bottom) / 2 - viewport.height / 2);
  scores.forEach((score, i) => {
    if (score < 0.2) return;
    if (best < 0 || score > scores[best] || (score === scores[best] && distance(i) < distance(best))) best = i;
  });
  // On mobile several slides can be fully visible: favor the centered one,
  // instead of retaining a fully visible previous slide indefinitely.
  if (best >= 0 && scores[current] >= 0.2 && scores[best] - scores[current] < 0.05 &&
      distance(current) - distance(best) < 32) return current;
  return best;
}

export function coordinateVisibility(players, container) {
  let active = -1, frame = 0;
  function update() {
    frame = 0;
    const next = document.hidden ? -1 : chooseVisiblePlayer(
      players.map(p => p.stage.closest('details:not([open])')
        ? { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
        : p.stage.getBoundingClientRect()),
      { width: window.innerWidth, height: window.innerHeight }, active
    );
    // Pause the old section before resuming another, including fast jumps.
    players.forEach((p, i) => { if (i !== next) p.setActive(false); });
    if (next >= 0) players[next].setActive(true);
    active = next;
  }
  function refresh() { if (!frame) frame = requestAnimationFrame(update); }
  function visibilityChanged() {
    // Hidden documents may not get another animation frame.
    cancelAnimationFrame(frame); frame = 0; update();
  }
  window.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  document.addEventListener('visibilitychange', visibilityChanged);
  container?.addEventListener('toggle', refresh, true);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
  if (container) observer?.observe(container);
  if (document.body) observer?.observe(document.body);
  players.forEach(p => observer?.observe(p.stage));
  update();
  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('scroll', refresh);
    window.removeEventListener('resize', refresh);
    document.removeEventListener('visibilitychange', visibilityChanged);
    container?.removeEventListener('toggle', refresh, true);
    players.forEach(p => p.setActive(false));
  };
}
