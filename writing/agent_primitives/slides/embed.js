// Keep the DeckWerk canvas intact while scaling it into a responsive iframe.
(() => {
  const slide = document.querySelector('section.slide');
  const [width, height] = slide.dataset.canvas.split('x').map(Number);
  const resize = () => {
    const scale = Math.min(innerWidth / width, innerHeight / height);
    slide.style.transform = `scale(${scale})`;
    slide.style.left = `${(innerWidth - width * scale) / 2}px`;
    slide.style.top = `${(innerHeight - height * scale) / 2}px`;
  };
  new ResizeObserver(resize).observe(document.documentElement);
  resize();
  const videos = [...document.querySelectorAll('video')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = new Map();
  const groupStates = new Map();
  const syncAll = slide.dataset.syncVideos === 'true';
  videos.forEach(video => {
    video.playsInline = true;
    video.muted = true;
    // Cropped DeckWerk videos carry their sync metadata on the outer box.
    const box = video.closest('[data-element="video"]');
    if (!video.dataset.syncGroup && box?.dataset.syncGroup) video.dataset.syncGroup = box.dataset.syncGroup;
    if (syncAll) video.dataset.syncGroup = 'whole-slide';
    if (video.dataset.syncGroup) {
      const group = groups.get(video.dataset.syncGroup) || [];
      group.push(video);
      groups.set(video.dataset.syncGroup, group);
    }
  });
  const play = video => { video.play().catch(() => { video.controls = true; }); };
  const applyMotion = () => videos.forEach(video => {
    video.controls = reduced.matches;
    const group = groupStates.get(video);
    if (reduced.matches || document.hidden || (group && !group.ready)) video.pause();
    else play(video);
  });
  const waitForVideo = video => new Promise((resolve, reject) => {
    const cleanup = () => ['canplay', 'seeked', 'error'].forEach(event => video.removeEventListener(event, check));
    const check = () => {
      if (video.error) { cleanup(); reject(new Error('A synchronized video could not load.')); }
      else if (video.readyState >= 3 && !video.seeking) { cleanup(); resolve(); }
    };
    ['canplay', 'seeked', 'error'].forEach(event => video.addEventListener(event, check));
    check();
  });
  for (const group of groups.values()) {
    const state = { ready: false, initializing: false, failed: false };
    group.forEach(video => groupStates.set(video, state));
    group.forEach(video => { video.loop = false; video.autoplay = false; video.pause(); });
    const restart = async () => {
      if (state.initializing || state.failed) return;
      state.initializing = true;
      state.ready = false;
      group.forEach(video => video.pause());
      try {
        // Ended media may not become playable again until it is rewound.
        group.forEach(video => { if (video.readyState >= 1 && video.currentTime !== 0) video.currentTime = 0; });
        await Promise.all(group.map(waitForVideo));
        if (syncAll) {
          const cycle = Math.max(...group.map(video => video.duration));
          if (!Number.isFinite(cycle) || cycle <= 0 || group.some(video => !Number.isFinite(video.duration) || video.duration <= 0)) throw new Error('Synchronized videos need finite durations.');
          group.forEach(video => { video.playbackRate = video.duration / cycle; });
        }
        group.forEach(video => { if (video.currentTime !== 0) video.currentTime = 0; });
        await Promise.all(group.map(waitForVideo));
        state.ready = true;
        applyMotion();
      } catch (error) {
        state.failed = true;
        console.error(error.message);
        group.forEach(video => { video.pause(); video.controls = true; });
      } finally { state.initializing = false; }
    };
    group.forEach(video => {
      video.addEventListener('ended', restart);
      video.addEventListener('waiting', () => {
        if (state.initializing || state.failed) return;
        state.ready = false;
        group.forEach(item => item.pause());
      });
      const resumeWhenReady = () => {
        if (state.initializing || state.failed || !group.every(item => item.readyState >= 3 && !item.seeking)) return;
        state.ready = true;
        applyMotion();
      };
      video.addEventListener('canplay', resumeWhenReady);
      video.addEventListener('seeked', resumeWhenReady);
    });
    group[0].addEventListener('timeupdate', () => {
      if (group[0].paused || !state.ready) return;
      group.slice(1).forEach(video => {
        const target = group[0].currentTime * video.playbackRate / group[0].playbackRate;
        if (!video.seeking && Math.abs(video.currentTime - target) > 0.05) video.currentTime = target;
      });
    });
    restart();
  }
  applyMotion();
  reduced.addEventListener('change', applyMotion);
  document.addEventListener('visibilitychange', applyMotion);
  // `inspect --html` represents DeckWerk web elements with poster images.
  // Mount their sandboxed pages and supply the lifecycle messages that the
  // presentation player normally sends, so interactive media works here too.
  const webElements = [...slide.querySelectorAll('[data-element="web"][data-src]')].map(box => {
    const frame = document.createElement('iframe');
    frame.title = box.dataset.title || 'Interactive slide content';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('allow', 'autoplay');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    Object.assign(frame.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      border: '0', display: 'block', background: 'transparent', visibility: 'hidden',
      pointerEvents: box.dataset.interactive === 'false' ? 'none' : 'auto'
    });
    const poster = box.querySelector('img');
    if (poster) poster.style.pointerEvents = 'none';
    let painted = false;
    let held = false;
    let released = false;
    let revealed = false;
    let timeout;
    const notify = () => {
      const active = !document.hidden && !reduced.matches;
      // Sandboxed pages have opaque origins; identify the receiver by its
      // contentWindow and use '*' for delivery, as DeckWerk's bridge does.
      frame.contentWindow?.postMessage({ source: 'deckwerk', event: active ? 'active' : 'inactive', step: 0, steps: 0 }, '*');
    };
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      frame.style.visibility = 'visible';
      poster?.remove();
      box.dataset.webReady = 'true';
    };
    const settle = () => { if (painted && (!held || released)) reveal(); };
    const onMessage = event => {
      if (event.source !== frame.contentWindow || event.data?.source !== 'deckwerk') return;
      if (event.data.action === 'hold-ready') held = true;
      else if (event.data.action === 'ready') released = true;
      settle();
    };
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', () => {
      notify();
      requestAnimationFrame(() => requestAnimationFrame(() => { painted = true; settle(); }));
    });
    box.dataset.webReady = 'false';
    frame.src = new URL(box.dataset.src, document.baseURI).href;
    box.appendChild(frame);
    timeout = setTimeout(reveal, 5000);
    return { frame, notify };
  });
  const applyWebMotion = () => webElements.forEach(({ notify }) => notify());
  reduced.addEventListener('change', applyWebMotion);
  document.addEventListener('visibilitychange', applyWebMotion);
  window.addEventListener('pagehide', () => webElements.forEach(({ frame }) => {
    frame.contentWindow?.postMessage({ source: 'deckwerk', event: 'inactive', step: 0, steps: 0 }, '*');
  }));
})();
