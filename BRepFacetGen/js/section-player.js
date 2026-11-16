// Website pacing is separate from the native DeckWerk timeline.
const CHANNEL = 'brepfacet-section-player';
export function initSectionPlayers(container) {
  const cleanups = [...(container?.querySelectorAll('.slide-sequence') || [])].map(initPlayer);
  return () => cleanups.forEach(cleanup => cleanup());
}
function initPlayer(root) {
  const slides = JSON.parse(root.dataset.slides);
  const stage = root.querySelector('.sequence-stage');
  const controls = root.querySelector('.sequence-controls');
  const toggle = root.querySelector('.sequence-toggle');
  const restart = root.querySelector('.sequence-restart');
  const segments = [...root.querySelectorAll('.sequence-segment')];
  const position = root.querySelector('.sequence-position');
  const error = root.querySelector('.sequence-error');
  let frame = stage.querySelector('iframe'), index = Number(root.dataset.slideIndex) || 0, elapsed = Number(root.dataset.elapsed) || 0, last = 0;
  let ready = false, running = false, userPlaying = root.dataset.userPlaying !== 'false', ended = root.dataset.state === 'ended', visible = false;
  let animationFrame = 0, loadTimeout = 0, disposed = false;
  const send = action => frame.contentWindow?.postMessage({ channel: CHANNEL, action }, location.origin);
  function paint() {
    root.dataset.slideIndex = String(index);
    root.dataset.elapsed = String(elapsed);
    root.dataset.userPlaying = String(userPlaying);
    root.dataset.state = ended ? 'ended' : !ready ? 'loading' : userPlaying ? 'playing' : 'paused';
    root.dataset.paused = String(!userPlaying);
    const toggleLabel = ended ? 'Replay section' : userPlaying ? 'Pause section' : 'Resume section';
    if (toggle.getAttribute('aria-label') !== toggleLabel) { toggle.setAttribute('aria-label', toggleLabel); toggle.title = toggleLabel; }
    const positionLabel = `${index + 1} / ${slides.length}`;
    if (position.textContent !== positionLabel) position.textContent = positionLabel;
    segments.forEach((segment, i) => {
      if (i === index && !segment.hasAttribute('aria-current')) segment.setAttribute('aria-current', 'true');
      else if (i !== index && segment.hasAttribute('aria-current')) segment.removeAttribute('aria-current');
      const progress = i < index ? 1 : i > index ? 0 : Math.min(1, elapsed / (slides[index].duration * 1000));
      segment.style.setProperty('--segment-progress', progress);
    });
  }
  function stop() {
    if (running) elapsed += performance.now() - last;
    running = false;
    cancelAnimationFrame(animationFrame);
    send('pause');
  }
  function tick(now) {
    if (!running || disposed) return;
    elapsed += now - last;
    last = now;
    if (elapsed >= slides[index].duration * 1000) {
      stop();
      if (index + 1 < slides.length) select(index + 1);
      else { elapsed = slides[index].duration * 1000; ended = true; userPlaying = false; paint(); }
      return;
    }
    paint();
    animationFrame = requestAnimationFrame(tick);
  }
  function reconcile() {
    if (!ready && visible && !loadTimeout && !disposed) {
      loadTimeout = setTimeout(() => {
        loadTimeout = 0;
        if (ready || disposed || !visible) return;
        error.textContent = 'This slide could not load. Use Restart to try again.';
        error.hidden = false;
      }, 15000);
    }
    const shouldRun = ready && visible && !document.hidden && userPlaying && !ended && !disposed;
    if (shouldRun && !running) {
      running = true; last = performance.now(); send('resume');
      animationFrame = requestAnimationFrame(tick);
    } else if (!shouldRun) stop();
    paint();
  }
  function onLoad() { send('connect'); }
  function waitForFrame() {
    clearTimeout(loadTimeout); loadTimeout = 0;
    frame.addEventListener('load', onLoad);
    send('connect'); // Also handles an iframe that loaded before the parent module.
    reconcile();
  }
  function select(next) {
    if (next < 0 || next >= slides.length) return;
    stop();
    index = next; elapsed = 0; ready = false; ended = false;
    error.hidden = true;
    frame.removeEventListener('load', onLoad);
    const replacement = frame.cloneNode(false);
    replacement.src = `slides/slide-${slides[index].slide}.html?controlled=1`;
    replacement.title = `DeckWerk slide ${slides[index].slide}`;
    replacement.loading = 'eager';
    frame.replaceWith(replacement); frame = replacement;
    waitForFrame(); paint();
  }
  function togglePlayback() {
    if (ended) { userPlaying = true; select(0); }
    else { userPlaying = !userPlaying; reconcile(); }
  }
  function restartSection() { userPlaying = true; select(0); }
  function onMessage(event) {
    if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.channel !== CHANNEL) return;
    if (event.data.type === 'ready') { ready = true; clearTimeout(loadTimeout); loadTimeout = 0; error.hidden = true; reconcile(); }
    if (event.data.type === 'request') {
      if (event.data.action === 'toggle') togglePlayback();
      if (event.data.action === 'next') select(Math.min(slides.length - 1, index + 1));
      if (event.data.action === 'previous') select(Math.max(0, index - 1));
      if (event.data.action === 'restart') restartSection();
    }
  }
  function onClick(event) {
    const segment = event.target.closest('.sequence-segment');
    if (segment && root.contains(segment)) select(Number(segment.dataset.index));
  }
  function onKey(event) {
    if (!event.target.closest('.sequence-segment')) return;
    const next = { ArrowLeft: Math.max(0, index - 1), ArrowRight: Math.min(slides.length - 1, index + 1), Home: 0, End: slides.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault(); select(next); segments[next].focus();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2;
    reconcile();
  }, { threshold: [0, 0.2] });
  observer.observe(stage);
  controls.hidden = false;
  toggle.addEventListener('click', togglePlayback);
  restart.addEventListener('click', restartSection);
  controls.addEventListener('click', onClick);
  controls.addEventListener('keydown', onKey);
  window.addEventListener('message', onMessage);
  document.addEventListener('visibilitychange', reconcile);
  waitForFrame(); paint();
  return () => {
    disposed = true; stop(); clearTimeout(loadTimeout); observer.disconnect();
    frame.removeEventListener('load', onLoad);
    toggle.removeEventListener('click', togglePlayback);
    restart.removeEventListener('click', restartSection);
    controls.removeEventListener('click', onClick);
    controls.removeEventListener('keydown', onKey);
    window.removeEventListener('message', onMessage);
    document.removeEventListener('visibilitychange', reconcile);
  };
}
