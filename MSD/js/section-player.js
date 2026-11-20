// Website pacing is separate from the native DeckWerk timeline.
import { coordinateVisibility } from './section-visibility.js';
const CHANNEL = 'deckwerk-section-player';
export function initSectionPlayers(container) {
  const players = [...(container?.querySelectorAll('.slide-sequence, .slide-single') || [])].map(initPlayer);
  const destroyVisibility = coordinateVisibility(players, container);
  return () => { destroyVisibility(); players.forEach(player => player.destroy()); };
}
function initPlayer(root) {
  const sequence = root.classList.contains('slide-sequence');
  const slides = JSON.parse(root.dataset.slides);
  const stage = root.querySelector('.slide-stage');
  const controls = root.querySelector('.sequence-controls');
  const toggle = root.querySelector('.sequence-toggle');
  const restart = root.querySelector('.sequence-restart');
  const segments = [...root.querySelectorAll('.sequence-segment')];
  const position = root.querySelector('.sequence-position');
  const status = root.querySelector('[data-slide-status]');
  const statusText = root.querySelector('[data-slide-status-text]');
  const retry = root.querySelector('[data-slide-retry]');
  let frame = stage.querySelector('iframe'), index = Number(root.dataset.slideIndex) || 0, elapsed = Number(root.dataset.elapsed) || 0, last = 0;
  let ready = false, running = false, userPlaying = root.dataset.userPlaying !== 'false', ended = root.dataset.state === 'ended', visible = false;
  let animationFrame = 0, loadTimeout = 0, disposed = false;
  // Reconnect to a retained frame on bfcache restore instead of navigating it again.
  let started = frame.hasAttribute('src'), failed = false, slow = false;
  const send = action => { if (started) frame.contentWindow?.postMessage({ channel: CHANNEL, action }, location.origin); };
  function paint() {
    root.dataset.slideIndex = String(index);
    root.dataset.elapsed = String(elapsed);
    root.dataset.userPlaying = String(userPlaying);
    root.dataset.state = ended ? 'ended' : failed ? 'error' : !started ? 'idle' : !ready ? 'loading' : !userPlaying ? 'paused' : running ? 'playing' : 'suspended';
    root.dataset.paused = String(!userPlaying);
    root.dataset.running = String(running);
    stage.dataset.ready = String(ready);
    stage.setAttribute('aria-busy', String(started && !ready && !failed));
    frame.tabIndex = ready ? 0 : -1;
    status.hidden = !started || ready;
    status.dataset.failed = String(failed);
    const message = failed ? 'This slide could not load.' : slow ? 'Still loading this slide…' : 'Loading slide…';
    if (statusText.textContent !== message) statusText.textContent = message;
    retry.hidden = !failed && !slow;
    if (!sequence) return;
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
    if (!started && visible && !document.hidden && !disposed) {
      started = true;
      // Application visibility controls loading; avoid a second browser lazy-load gate.
      frame.loading = 'eager';
      frame.src = frame.dataset.src;
    }
    if (started && !ready && !failed && !slow && !loadTimeout && !disposed) {
      loadTimeout = setTimeout(() => {
        loadTimeout = 0;
        if (ready || disposed || failed) return;
        slow = true; paint();
      }, 20000);
    }
    const shouldRun = ready && visible && !document.hidden && userPlaying && !ended && !disposed;
    if (shouldRun && !running) {
      running = true; last = performance.now(); send('resume');
      if (sequence) animationFrame = requestAnimationFrame(tick);
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
    started = false; failed = false; slow = false;
    frame.removeEventListener('load', onLoad);
    const replacement = frame.cloneNode(false);
    replacement.removeAttribute('src');
    replacement.dataset.src = `slides/slide-${slides[index].slide}.html?controlled=1`;
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
  function retrySlide() { select(index); }
  function onMessage(event) {
    if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.channel !== CHANNEL) return;
    if (!started) return;
    if (event.data.type === 'ready') { ready = true; failed = false; slow = false; clearTimeout(loadTimeout); loadTimeout = 0; reconcile(); }
    if (event.data.type === 'error') { failed = true; clearTimeout(loadTimeout); loadTimeout = 0; stop(); paint(); }
    if (event.data.type === 'request') {
      if (event.data.action === 'toggle') togglePlayback();
      if (sequence && event.data.action === 'next') select(Math.min(slides.length - 1, index + 1));
      if (sequence && event.data.action === 'previous') select(Math.max(0, index - 1));
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
  if (controls) controls.hidden = false;
  toggle?.addEventListener('click', togglePlayback);
  restart?.addEventListener('click', restartSection);
  retry.addEventListener('click', retrySlide);
  controls?.addEventListener('click', onClick);
  controls?.addEventListener('keydown', onKey);
  window.addEventListener('message', onMessage);
  waitForFrame(); paint();
  return { stage, setActive(active) {
    if (visible === active) return;
    visible = active; root.dataset.active = String(active); reconcile();
  }, destroy() {
    disposed = true; stop(); paint(); clearTimeout(loadTimeout);
    frame.removeEventListener('load', onLoad);
    toggle?.removeEventListener('click', togglePlayback);
    restart?.removeEventListener('click', restartSection);
    retry.removeEventListener('click', retrySlide);
    controls?.removeEventListener('click', onClick);
    controls?.removeEventListener('keydown', onKey);
    window.removeEventListener('message', onMessage);
  } };
}
