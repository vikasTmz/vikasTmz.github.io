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
  videos.forEach(video => {
    video.playsInline = true;
    video.muted = true;
    if (video.dataset.syncGroup) {
      const group = groups.get(video.dataset.syncGroup) || [];
      group.push(video);
      groups.set(video.dataset.syncGroup, group);
    }
  });
  const play = video => { video.play().catch(() => { video.controls = true; }); };
  const applyMotion = () => videos.forEach(video => {
    video.controls = reduced.matches;
    if (reduced.matches || document.hidden) video.pause();
    else play(video);
  });
  for (const group of groups.values()) {
    group.forEach(video => { video.loop = false; video.autoplay = false; video.pause(); });
    Promise.all(group.map(video => video.readyState >= 3 ? Promise.resolve() : new Promise(resolve => video.addEventListener('canplay', resolve, { once: true })))).then(() => {
      group.forEach(video => { video.currentTime = 0; });
      if (!reduced.matches && !document.hidden) group.forEach(play);
    });
    group.forEach(video => video.addEventListener('ended', () => {
      group.forEach(item => { item.currentTime = 0; });
      if (!reduced.matches && !document.hidden) group.forEach(play);
    }));
    group[0].addEventListener('timeupdate', () => {
      if (group[0].paused) return;
      group.slice(1).forEach(video => {
        if (Math.abs(video.currentTime - group[0].currentTime) > 0.15) video.currentTime = group[0].currentTime;
      });
    });
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
