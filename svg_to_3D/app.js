'use strict';

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadMarkdown(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const fragment = DOMPurify.sanitize(marked.parse(await response.text()), {
    USE_PROFILES: { html: true }, RETURN_DOM_FRAGMENT: true,
  });
  // Resolve links/images relative to their Markdown file, including on GitHub Pages.
  fragment.querySelectorAll('[href], [src]').forEach(node => {
    ['href', 'src'].forEach(attribute => {
      const value = node.getAttribute(attribute);
      if (value && !value.startsWith('#')) node.setAttribute(attribute, new URL(value, new URL(path, document.baseURI)).href);
    });
  });
  return fragment;
}

function inlineTitle(text) {
  return DOMPurify.sanitize(marked.parseInline(String(text)), {
    ALLOWED_TAGS: ['em', 'i', 'strong', 'b', 'u', 's', 'del', 'code', 'sub', 'sup', 'mark', 'br', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    RETURN_DOM_FRAGMENT: true,
  });
}

function takeHeading(fragment, tag, fallback) {
  const heading = document.createElement(tag);
  const first = fragment.firstElementChild;
  if (first && /^H[1-6]$/.test(first.tagName)) {
    heading.append(...first.childNodes); first.remove();
  } else heading.textContent = fallback || '';
  return heading;
}

function setPageMetadata(page) {
  if (page.documentTitle) document.title = page.documentTitle;
  if (page.description) document.querySelector('meta[name="description"]').content = page.description;
  document.getElementById('brand-name').textContent = page.brand?.name || '';
  document.getElementById('brand-note').textContent = page.brand?.note || '';
  document.querySelector('.brand').setAttribute('aria-label', `${page.brand?.name || 'Home'}, back to top`);
  document.getElementById('footer-text').textContent = page.footer || '';
}

async function renderPageSections(page, examples) {
  if (!Array.isArray(page.sections)) throw new Error('page.json needs a sections array.');
  const sections = page.sections.filter(section => section.enabled !== false);
  const ids = new Set();
  sections.forEach(section => {
    if (!section.id || ids.has(section.id) || document.getElementById(section.id) || examples.some(example => example.id === section.id)) throw new Error('Every page section needs a unique id distinct from viewer/control IDs.');
    ids.add(section.id);
    if (section.type === 'viewer' && typeof section.scene !== 'string') throw new Error(`Viewer section ${section.id} needs a scene ID.`);
    if (!['hero', 'viewer', 'viewers', 'note', 'text'].includes(section.type)) throw new Error(`Unknown section type: ${section.type}`);
  });
  const markdown = await Promise.all(sections.map(section => ['viewer', 'viewers'].includes(section.type) ? null : loadMarkdown(section.content)));
  const container = document.getElementById('page-sections');
  const orderedExamples = [], usedScenes = new Set();
  sections.forEach((item, index) => {
    const section = document.createElement(item.type === 'hero' ? 'header' : 'section');
    section.id = item.id;
    if (['viewer', 'viewers'].includes(item.type)) {
      section.className = 'viewer-section';
      const sceneReferences = item.type === 'viewer' ? [item.scene] : item.scenes;
      const selected = sceneReferences ? sceneReferences.map(id => {
        const example = examples.find(example => example.sceneId === id);
        if (!example) throw new Error(`Unknown scene id: ${id}`);
        return example;
      }) : examples;
      selected.forEach(example => {
        if (usedScenes.has(example.sceneId)) throw new Error(`Scene appears in more than one viewer section: ${example.sceneId}`);
        usedScenes.add(example.sceneId);
        orderedExamples.push({ ...example, swapViewers: item.swapViewers === true, container: section });
      });
      section.hidden = !selected.length;
    } else {
      const fragment = markdown[index];
      const heading = takeHeading(fragment, item.type === 'hero' ? 'h1' : 'h2', item.title);
      heading.id = `${item.id}-title`;
      section.setAttribute('aria-labelledby', heading.id);
      const title = document.createElement('div');
      if (item.eyebrow) {
        const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = item.eyebrow;
        title.append(eyebrow);
      }
      title.append(heading);
      const body = document.createElement('div'); body.className = 'markdown-body'; body.append(fragment);
      body.querySelectorAll('table').forEach(table => {
        const scroll = document.createElement('div'); scroll.className = 'markdown-table'; table.replaceWith(scroll); scroll.append(table);
      });
      if (item.type === 'hero') {
        section.className = 'hero';
        body.classList.add('hero-description');
        section.append(title);
        if (item.byline !== false && (page.author || page.date)) {
          const byline = document.createElement('div'); byline.className = 'byline';
          if (page.author) { const author = document.createElement('span'); author.textContent = page.author; byline.append(author); }
          if (page.author && page.date) { const dot = document.createElement('span'); dot.className = 'dot'; dot.setAttribute('aria-hidden', 'true'); byline.append(dot); }
          if (page.date) { const date = document.createElement('span'); date.className = 'date'; date.textContent = page.date; byline.append(date); }
          section.append(byline);
        }
        section.append(body);
      } else {
        section.className = item.type === 'note' ? 'article-note' : 'text-section';
        section.append(title, body);
      }
    }
    container.append(section);
  });
  return orderedExamples;
}

async function initializePage() {
  const filenameStem = path => decodeURIComponent(new URL(path, document.baseURI).pathname.split('/').pop()).replace(/\.[^.]+$/, '');
  const readableName = value => value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  const formatDuration = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '';
  const [page, SCENES] = await Promise.all([loadJSON('page.json'), loadJSON('scenes.json')]);
  if (!Array.isArray(SCENES)) throw new Error('scenes.json must contain an array.');
  const sceneIds = new Set();
  const EXAMPLES = SCENES.map((scene, index) => {
    const stem = filenameStem(scene.svg);
    let sceneId = scene.id || stem, ordinal = 2;
    while (sceneIds.has(sceneId)) {
      if (scene.id) throw new Error(`Duplicate scene id: ${scene.id}`);
      sceneId = `${stem}-${ordinal++}`;
    }
    sceneIds.add(sceneId);
    return {
      id: index === 0 ? 'side-by-side' : `example-${String(index + 1).padStart(2, '0')}`,
      sceneId,
      title: scene.title ?? readableName(stem),
      svgSource: scene.svgSource ?? '',
      videoTitle: scene.videoTitle ?? 'Video viewer',
      prompt: scene.prompt,
      wandLabel: scene.wandLabel ?? 'Generate 3D',
      aside: scene.aside ?? '',
      numbering: scene.numbering ?? true,
      svg: { svg: scene.svg, layerDirectory: scene.layers, name: readableName(stem) },
      videos: (scene.videos || []).map(video => {
        const item = typeof video === 'string' ? { src: video } : video;
        return { title: readableName(filenameStem(item.src)), subtitle: '', duration: '', rate: 1, ...item };
      }),
    };
  });
  const layerCatalogs = new Map();
  function getLayerCatalog(directory) {
    const url = `${directory.replace(/\/$/, '')}/layers.json`;
    if (!layerCatalogs.has(url)) layerCatalogs.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error('Layer index unavailable. Run python3 prepare_viewer_assets.py and publish layers.json.');
      return response.json();
    }));
    return layerCatalogs.get(url);
  }
  // Small shared metadata index; this never loads a video or a layer SVG.
  const mediaMetadata = fetch('assets/viewer-media.json').then(response => response.ok ? response.json() : {}).catch(() => ({}));
  const variantInfo = key => ({
    key,
    name: ({ artwork: 'Artwork', _withCPs: 'Controls' })[key] || readableName(key.replace(/^_with/, '')),
    description: '',
    icon: ({ artwork: 'i-scene', _withCPs: 'i-controls' })[key] || 'i-layers',
  });
  const $ = id => document.getElementById(id);
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('theme-toggle').setAttribute('aria-pressed', String(dark));
    $('theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]').content = dark ? '#161c19' : '#fffefa';
  }
  $('theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('svg-scenes-theme', theme); } catch (_) { }
    syncTheme();
  });
  syncTheme();

  // Each viewer keeps its own selection, fetch cancellation, and media state.
  function createSVGViewer(root, prefix, config) {
    const $ = id => root.querySelector(`#${prefix}${id}`);
    let layers = [], layerIDs = [], variants = [];
    let mode = 'svg', variant = 0, normalized = true, layerIndex = 0;
    $('view-layers').disabled = true;
    $('view-layers').title = 'Loading layer index…';
    let svgController = null, svgGeneration = 0, activeBlobURL = null, pendingBlobURL = null, pendingImage = null, layerTimer;
    let zoom = 1;
    const zoomControls = document.createElement('div');
    zoomControls.className = 'svg-zoom glass';
    zoomControls.setAttribute('role', 'group');
    zoomControls.setAttribute('aria-label', 'SVG zoom');
    zoomControls.innerHTML = `<button id="${prefix}zoom-in" type="button" aria-label="Zoom in" title="Zoom in">${icon('i-zoom-in')}</button><button id="${prefix}zoom-out" type="button" aria-label="Zoom out" title="Zoom out">${icon('i-zoom-out')}</button>`;
    $('svg-stage').append(zoomControls);
    function applyZoom() {
      const stage = $('svg-stage'), mount = $('svg-mount');
      // Scale around the canvas center, including when the mount has unequal margins.
      mount.style.transformOrigin = `${stage.clientWidth / 2 - mount.offsetLeft}px ${stage.clientHeight / 2 - mount.offsetTop}px`;
      mount.style.transform = `scale(${zoom})`;
      stage.dataset.zoom = zoom;
      $('zoom-in').disabled = zoom >= 4;
      $('zoom-out').disabled = zoom <= .5;
      zoomControls.title = `Zoom: ${Math.round(zoom * 100)}%`;
    }
    $('zoom-in').addEventListener('click', () => { zoom = Math.min(4, zoom * 1.25); applyZoom(); });
    $('zoom-out').addEventListener('click', () => { zoom = Math.max(.5, zoom / 1.25); applyZoom(); });
    const zoomObserver = new ResizeObserver(applyZoom);
    zoomObserver.observe($('svg-stage'));
    applyZoom();


    function availableFiles(index = variant) { return layers[layerIndex]?.files[variants[index]?.key] || {}; }
    function fitSelection() {
      if (!variants.length || !layers.length) return;
      if (!Object.keys(availableFiles()).length) variant = variants.findIndex((_, index) => Object.keys(availableFiles(index)).length);
      const files = availableFiles();
      if (!files[normalized ? 'canonical' : 'default']) normalized = Boolean(files.canonical);
    }
    function layerPath() {
      const file = availableFiles()[normalized ? 'canonical' : 'default'];
      return new URL(encodeURIComponent(file), new URL(`${config.layerDirectory.replace(/\/$/, '')}/`, document.baseURI)).href;
    }
    function updateViewerControls() {
      const layered = mode === 'layers';
      fitSelection();
      $('svg-stage').dataset.mode = mode;
      $('layer-rail').hidden = !layered;
      $('variant-panel').hidden = !layered;
      $('view-svg').setAttribute('aria-pressed', String(!layered));
      $('view-layers').setAttribute('aria-pressed', String(layered));
      $('layer-slider').max = Math.max(0, layerIDs.length - 1);
      $('layer-slider').value = layerIndex;
      $('layer-slider').setAttribute('aria-valuetext', layerIDs.length ? `Layer ${layerIDs[layerIndex]}, ${layerIndex + 1} of ${layerIDs.length}` : 'No layers available');
      $('layer-current').textContent = layerIDs.length ? `${String(layerIndex + 1).padStart(2, '0')} / ${layerIDs.length}` : '—';
      $('layer-current').title = layerIDs.length ? `Layer ID: ${layerIDs[layerIndex]}` : '';
      $('layer-first').textContent = layerIDs[0] ?? '—';
      $('layer-limit').textContent = layerIDs.at(-1) ?? '—';
      $('previous-layer').disabled = layerIndex === 0;
      $('next-layer').disabled = layerIndex === layerIDs.length - 1;
      $('stage-badge').textContent = layered ? `Layer ${String(layerIDs[layerIndex]).padStart(2, '0')} · ${layerIndex + 1} of ${layerIDs.length}` : 'Full composite';
      $('svg-description').replaceChildren();
      const title = document.createElement('strong'); title.textContent = config.name;
      $('svg-description').append(title, document.createTextNode(layered ? ` · Layer ${layerIDs[layerIndex]} · ${variants[variant].description || variants[variant].name}` : ' · Full composite'));
      $('svg-hint').textContent = layered ? 'Drag the slider or use ↑ / ↓ to explore' : 'Switch to layers to look closer';
      root.querySelectorAll('.variant-button').forEach((button, index) => {
        button.setAttribute('aria-pressed', String(index === variant));
        button.disabled = !Object.keys(availableFiles(index)).length;
      });
      $('scene-coordinates').disabled = !availableFiles().default;
      $('fitted-coordinates').disabled = !availableFiles().canonical;
      $('scene-coordinates').setAttribute('aria-pressed', String(!normalized));
      $('fitted-coordinates').setAttribute('aria-pressed', String(normalized));
    }
    async function loadSVG(path) {
      const generation = ++svgGeneration;
      if (svgController) svgController.abort();
      if (pendingImage) { pendingImage.onload = pendingImage.onerror = null; pendingImage.src = ''; pendingImage = null; }
      if (pendingBlobURL) { URL.revokeObjectURL(pendingBlobURL); pendingBlobURL = null; }
      const controller = svgController = new AbortController();
      $('svg-status').classList.remove('error');
      $('svg-status').textContent = 'Loading artwork…';
      $('svg-status').hidden = false;
      $('svg-mount').setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok) throw new Error(`Artwork returned ${response.status}`);
        const text = await response.text();
        if (generation !== svgGeneration) return;
        const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
        if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'svg') throw new Error('The file is not a valid SVG.');
        const url = pendingBlobURL = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
        const image = pendingImage = new Image();
        image.className = 'svg-artwork';
        image.alt = mode === 'svg' ? `${config.name}, full SVG scene` : `${config.name}, layer ${layerIDs[layerIndex]}, ${variants[variant].description || variants[variant].name}`;
        await new Promise((resolve, reject) => {
          controller.signal.addEventListener('abort', () => reject(new DOMException('SVG load cancelled', 'AbortError')), { once: true });
          image.onload = resolve; image.onerror = () => reject(new Error('Could not render SVG')); image.src = url;
        });
        if (generation !== svgGeneration) { URL.revokeObjectURL(url); return; }
        $('svg-mount').replaceChildren(image);
        if (activeBlobURL) URL.revokeObjectURL(activeBlobURL);
        activeBlobURL = url; pendingBlobURL = null; pendingImage = null;
        $('svg-status').hidden = true;
      } catch (error) {
        if (error.name === 'AbortError' || generation !== svgGeneration) return;
        $('svg-mount').replaceChildren();
        if (activeBlobURL) { URL.revokeObjectURL(activeBlobURL); activeBlobURL = null; }
        if (pendingBlobURL) { URL.revokeObjectURL(pendingBlobURL); pendingBlobURL = null; }
        $('svg-status').classList.add('error');
        $('svg-status').textContent = mode === 'layers' ? 'This layer is unavailable. Try another layer or variant.' : 'The artwork could not be loaded. Please try again.';
      } finally {
        if (generation === svgGeneration) $('svg-mount').setAttribute('aria-busy', 'false');
      }
    }
    function showViewer() { clearTimeout(layerTimer); updateViewerControls(); applyZoom(); return loadSVG(mode === 'svg' ? config.svg : layerPath()); }
    function setLayer(index, debounce = false) {
      const next = Math.max(0, Math.min(layerIDs.length - 1, index));
      if (next === layerIndex) return;
      layerIndex = next; updateViewerControls(); clearTimeout(layerTimer);
      if (debounce) layerTimer = setTimeout(showViewer, 90); else showViewer();
    }
    $('view-svg').addEventListener('click', () => { mode = 'svg'; showViewer(); });
    $('view-layers').addEventListener('click', () => { if (!layerIDs.length) return; mode = 'layers'; showViewer(); });
    $('layer-slider').addEventListener('input', event => setLayer(Number(event.target.value), true));
    $('layer-slider').addEventListener('change', showViewer);
    $('previous-layer').addEventListener('click', () => setLayer(layerIndex - 1));
    $('next-layer').addEventListener('click', () => setLayer(layerIndex + 1));
    $('svg-stage').addEventListener('keydown', event => {
      if (mode !== 'layers' || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || event.target === $('layer-slider')) return;
      event.preventDefault();
      setLayer(event.key === 'Home' ? 0 : event.key === 'End' ? layerIDs.length - 1 : layerIndex + (event.key === 'ArrowUp' ? -1 : 1));
    });
    let lastWheel = 0;
    $('svg-stage').addEventListener('wheel', event => {
      if (mode !== 'layers' || Math.abs(event.deltaY) < Math.abs(event.deltaX) || event.ctrlKey || Math.abs(event.deltaY) < 4) return;
      const next = layerIndex + Math.sign(event.deltaY);
      if (next < 0 || next >= layerIDs.length) return; // Let the page scroll at either end.
      event.preventDefault();
      if (performance.now() - lastWheel > 180) { lastWheel = performance.now(); setLayer(next, true); }
    }, { passive: false });
    function buildVariants() {
      $('variant-options').replaceChildren();
      variants.forEach((item, index) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'variant-button';
        button.innerHTML = `${icon(item.icon)}<span><b></b><small></small></span>`;
        button.querySelector('b').textContent = item.name; button.querySelector('small').textContent = item.description;
        button.setAttribute('aria-label', item.name); button.title = item.description ? `${item.name} · ${item.description}` : item.name;
        button.addEventListener('click', () => { variant = index; showViewer(); });
        $('variant-options').append(button);
      });
    }
    async function initializeLayers() {
      try {
        const catalog = await getLayerCatalog(config.layerDirectory);
        const sets = catalog.sets || {};
        const stem = filenameStem(config.svg);
        const set = sets[stem] || (Object.keys(sets).length === 1 ? Object.values(sets)[0] : null);
        if (!set) throw new Error(`No matching layers for ${stem}. Check the layer directory and regenerate layers.json.`);
        layers = set.layers.filter(layer => Object.values(layer.files).some(files => Object.keys(files).length)).sort((a, b) => a.id - b.id);
        layerIDs = layers.map(layer => layer.id);
        variants = set.variants.filter(key => layers.some(layer => layer.files[key])).map(variantInfo);
        buildVariants();
        $('view-layers').disabled = !layers.length;
        $('view-layers').title = layers.length ? 'View individual layers' : 'No layers found in this directory.';
        updateViewerControls();
      } catch (error) {
        $('view-layers').disabled = true;
        $('view-layers').title = error.message;
        console.warn(error.message);
      }
    }
    if (root.closest('.comparison')) {
      [['scene-coordinates', 'i-default-space'], ['fitted-coordinates', 'i-canonical-space']].forEach(([id, symbol]) => {
        const button = $(id), label = button.textContent.trim();
        button.setAttribute('aria-label', label); button.title = label;
        button.innerHTML = icon(symbol);
      });
    }
    $('scene-coordinates').addEventListener('click', () => { normalized = false; showViewer(); });
    $('fitted-coordinates').addEventListener('click', () => { normalized = true; showViewer(); });
    $('scene-name').textContent = config.name;
    const ready = showViewer();
    initializeLayers();
    window.addEventListener('pagehide', () => {
      clearTimeout(layerTimer);
      zoomObserver.disconnect();
      if (svgController) svgController.abort();
      if (activeBlobURL) URL.revokeObjectURL(activeBlobURL);
      if (pendingBlobURL) URL.revokeObjectURL(pendingBlobURL);
    });
    return { ready, showComposite() { mode = 'svg'; return showViewer(); } };
  }

  function createVideoViewer(root, prefix, videos) {
    const $ = id => root.querySelector(`#${prefix}${id}`);
    let activeVideo = 0, hoveredPreview = null, started = false, menuBuilt = false;
    let generating = false, magicTimer = null, magicButton = null;
    const frame = root.querySelector('.video-frame');
    const heading = root.querySelector('.video-heading');
    mediaMetadata.then(metadata => {
      videos.forEach(item => {
        const data = metadata[item.src] || {};
        if (!item.poster && data.poster) item.poster = data.poster;
        if (!item.duration && data.seconds !== undefined) item.duration = formatDuration(data.seconds);
      });
      root.querySelectorAll('.video-card').forEach((card, index) => {
        const item = videos[index];
        if (item.poster) { card.querySelector('img').src = item.poster; card.querySelector('img').hidden = false; }
        card.querySelector('.thumbnail-duration').textContent = item.duration;
      });
    });
    function releaseMagic() {
      clearTimeout(magicTimer); magicTimer = null; generating = false;
      frame.classList.remove('is-generating'); frame.removeAttribute('aria-busy');
      if (magicButton) { magicButton.disabled = !videos.length; magicButton.removeAttribute('aria-busy'); magicButton = null; }
    }
    function stopPreview() {
      if (!hoveredPreview) return;
      hoveredPreview.pause(); hoveredPreview.classList.remove('is-playing');
      hoveredPreview.removeAttribute('src'); hoveredPreview.load(); hoveredPreview = null;
    }
    function startPreview(video, item) {
      if (!started || reducedMotion.matches) return;
      stopPreview(); hoveredPreview = video;
      video.src = item.src; video.playbackRate = item.rate || 1;
      video.play().then(() => { if (hoveredPreview === video) video.classList.add('is-playing'); }).catch(() => { });
    }
    function selectVideo(index, play = false) {
      const item = videos[index]; if (!item) return;
      activeVideo = index; stopPreview();
      $('main-video').controls = true;
      const player = $('main-video'); player.pause(); player.poster = item.poster || '';
      $('video-error').hidden = true;
      $('video-poster').hidden = Boolean(root.closest('.comparison')) || !item.poster;
      $('video-poster-image').hidden = !item.poster;
      if (item.poster) $('video-poster-image').src = item.poster; else $('video-poster-image').removeAttribute('src');
      $('play-video').setAttribute('aria-label', `Play ${item.title}`);
      player.src = item.src; player.load(); player.playbackRate = item.rate || 1;
      $('video-title').textContent = item.title;
      $('video-detail').textContent = [item.subtitle, item.duration].filter(Boolean).join(' · ');
      $('main-video').setAttribute('aria-label', `${item.title}, result video`);
      root.querySelectorAll('.video-card').forEach((card, i) => card.setAttribute('aria-pressed', String(i === index)));
      if (play) player.play().catch(() => {
        releaseMagic();
        // Native/poster playback remains available if delayed autoplay is blocked.
        frame.dataset.state = 'paused';
        $('video-idle').hidden = true;
      });
    }
    function buildMenu() {
      if (menuBuilt) return;
      menuBuilt = true;
      videos.forEach((item, index) => {
        const card = document.createElement('button'); card.type = 'button'; card.className = 'video-card';
        card.setAttribute('aria-label', `Play ${item.title}`);
        card.setAttribute('aria-pressed', String(index === activeVideo));
        card.innerHTML = `<div class="video-thumbnail"><img loading="lazy" alt=""><video muted playsinline loop preload="none" aria-hidden="true"></video><span class="thumbnail-play">${icon('i-play')}</span><span class="thumbnail-duration"></span></div><div class="card-copy"><span><b></b><small></small></span><span class="card-index"></span></div>`;
        const poster = card.querySelector('img'); poster.hidden = !item.poster; if (item.poster) poster.src = item.poster;
        card.querySelector('.thumbnail-duration').textContent = item.duration;
        card.querySelector('b').textContent = item.title; card.querySelector('small').textContent = item.subtitle;
        card.querySelector('.card-index').textContent = String(index + 1).padStart(2, '0');
        const preview = card.querySelector('video'); preview.muted = true;
        card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') startPreview(preview, item); });
        card.addEventListener('pointerleave', () => { if (hoveredPreview === preview) stopPreview(); });
        card.addEventListener('focus', () => startPreview(preview, item));
        card.addEventListener('blur', () => { if (hoveredPreview === preview) stopPreview(); });
        card.addEventListener('click', () => selectVideo(index, true));
        $('video-menu').append(card);
      });
    }
    function playFirst(button = null) {
      if (generating || !videos.length) return;
      generating = true; magicButton = button;
      $('main-video').pause(); stopPreview();
      heading.hidden = true; $('video-menu').hidden = true;
      $('video-error').hidden = true;
      frame.dataset.state = 'generating'; frame.setAttribute('aria-busy', 'true');
      if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
      frame.classList.add('is-generating');
      // Start the CSS effect now so its two-second fade and this timer agree.
      void getComputedStyle(frame).animationName;
      magicTimer = setTimeout(() => {
        magicTimer = null;
        frame.classList.remove('is-generating');
        frame.dataset.state = 'loading';
        selectVideo(0, true);
      }, 2000);
    }
    function loadFirstPaused() {
      if (!videos.length) return;
      // Swapped examples begin with the video; only this clip is loaded.
      started = true;
      $('main-video').preload = 'auto';
      buildMenu();
      heading.hidden = false; $('video-menu').hidden = false;
      $('video-idle').hidden = true;
      frame.dataset.state = 'paused';
      selectVideo(0);
    }
    $('play-video').addEventListener('click', () => {
      if (!$('main-video').hasAttribute('src')) playFirst($('play-video')); else $('main-video').play().catch(() => { });
    });
    $('video-poster-image').addEventListener('error', () => { $('video-poster').hidden = true; });
    $('main-video').addEventListener('playing', () => {
      releaseMagic(); started = true; buildMenu();
      frame.dataset.state = 'playing'; heading.hidden = false;
      $('video-idle').hidden = true; $('video-menu').hidden = false;
      $('video-poster').hidden = true;
      // Only the video the visitor is using should keep playing.
      document.querySelectorAll('.main-video').forEach(player => {
        if (player !== $('main-video')) player.pause();
      });
    });
    $('main-video').addEventListener('pause', () => { if (started && !generating) frame.dataset.state = 'paused'; });
    $('main-video').addEventListener('timeupdate', () => { if ($('main-video').currentTime > 0) $('video-poster').hidden = true; });
    $('main-video').addEventListener('loadedmetadata', () => {
      const item = videos[activeVideo];
      $('main-video').playbackRate = item.rate || 1;
      if (!item.duration) item.duration = formatDuration($('main-video').duration);
      $('video-detail').textContent = [item.subtitle, item.duration].filter(Boolean).join(' · ');
      const card = root.querySelectorAll('.video-card')[activeVideo];
      if (card) card.querySelector('.thumbnail-duration').textContent = item.duration;
    });
    $('main-video').addEventListener('error', () => { releaseMagic(); $('video-idle').hidden = true; $('video-error').textContent = 'This video could not be played. Try another preview, or use an MP4 with a supported codec.'; $('video-error').hidden = false; $('video-poster').hidden = true; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        $('main-video').pause(); stopPreview(); releaseMagic();
        heading.hidden = !started; $('video-menu').hidden = !started;
        frame.dataset.state = started ? 'paused' : 'idle';
      }
    });
    window.addEventListener('pagehide', () => { stopPreview(); releaseMagic(); });
    $('main-video').preload = 'none';
    $('main-video').controls = false;
    $('main-video').removeAttribute('poster');
    $('video-menu').hidden = true;
    $('video-poster-image').hidden = true;
    $('video-poster').hidden = Boolean(root.closest('.comparison')) || !videos.length;
    $('play-video').disabled = !videos.length;
    $('video-title').textContent = videos[0]?.title || 'Video result';
    $('video-detail').textContent = '';
    heading.hidden = true; frame.dataset.state = 'idle';
    return { playFirst, loadFirstPaused };
  }

  // Clone the inert templates, prefixing IDs to keep every viewer independent.
  function cloneViewer(element, prefix) {
    const clone = element.cloneNode(true);
    const elements = [clone, ...clone.querySelectorAll('*')];
    const ids = new Map();
    elements.forEach(node => {
      if (node.id) { ids.set(node.id, prefix + node.id); node.id = prefix + node.id; }
    });
    elements.forEach(node => {
      ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls'].forEach(attribute => {
        if (!node.hasAttribute(attribute)) return;
        node.setAttribute(attribute, node.getAttribute(attribute).split(/\s+/).map(id => ids.get(id) || id).join(' '));
      });
    });
    return clone;
  }
  setPageMetadata(page);
  const orderedExamples = await renderPageSections(page, EXAMPLES);
  const comparisonTemplate = $('comparison-template').content.querySelector('.comparison');
  const svgTemplate = $('svg-viewer-template').content.querySelector('.viewer');
  const videoTemplate = $('video-viewer-template').content.querySelector('.video-frame');
  const menuTemplate = $('video-viewer-template').content.querySelector('.video-menu');
  const pendingExamples = new Map();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      pendingExamples.get(entry.target)?.();
      pendingExamples.delete(entry.target);
    });
  }, { rootMargin: '200px' }) : null;

  orderedExamples.forEach((example, index) => {
    const prefix = index === 0 ? 'side-' : `${example.id}-`;
    const section = cloneViewer(comparisonTemplate, index === 0 ? '' : `${example.id}-`);
    section.id = example.id;
    section.classList.toggle('is-swapped', example.swapViewers);
    const heading = section.querySelector('h2');
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(index + 1).padStart(2, '0');
    number.hidden = example.numbering === false;
    // Keep formatted text inside one flex item so emphasis wraps naturally.
    const titleText = document.createElement('span');
    titleText.className = 'scene-title';
    titleText.append(inlineTitle(example.title));
    heading.replaceChildren(number, titleText);
    section.querySelector('.aside').textContent = example.aside;
    section.querySelector('.comparison-video > h3').replaceChildren(inlineTitle(example.videoTitle));
    example.container.append(section);
    const svgPanel = section.querySelector('.comparison-svg');
    const videoPanel = section.querySelector('.comparison-video');
    const svgViewer = cloneViewer(svgTemplate, prefix);
    svgPanel.append(svgViewer);
    if (example.svgSource) {
      try {
        const url = new URL(example.svgSource, document.baseURI);
        if (['http:', 'https:'].includes(url.protocol)) {
          const source = document.createElement('p'); source.className = 'svg-source';
          const link = document.createElement('a');
          link.href = url.href; link.textContent = 'SVG source ↗';
          link.target = '_blank'; link.rel = 'noopener noreferrer';
          source.append(link); svgPanel.append(source);
        }
      } catch (_) {
        // An unset or invalid source must not prevent the viewer from loading.
      }
    }
    const videoFrame = cloneViewer(videoTemplate, prefix);
    videoFrame.append(videoFrame.querySelector('.video-heading'));
    videoFrame.querySelector('video').preload = 'none';
    const prompt = example.prompt ?? (example.swapViewers ? 'What does this look like as an SVG?' : 'What does this SVG look like in 3D?');
    videoFrame.querySelector('.video-idle p').textContent = prompt;
    videoPanel.append(videoFrame, cloneViewer(menuTemplate, prefix));
    const playButton = section.querySelector('.comparison-play');
    if (example.swapViewers) {
      // Keep keyboard/reading order aligned with the visual order.
      section.querySelector('.comparison-grid').replaceChildren(videoPanel, playButton, svgPanel);
    }
    playButton.setAttribute('aria-controls', `${prefix}${example.swapViewers ? 'svg-stage' : 'main-video'}`);
    playButton.title = example.swapViewers && example.wandLabel === 'Generate 3D' ? 'View SVG' : example.wandLabel;
    playButton.setAttribute('aria-label', `${playButton.title} for ${titleText.textContent}`);
    playButton.disabled = !example.swapViewers && !example.videos.length;
    let videoViewer = null, svgViewerInstance = null, revealTimer = null, revealing = false;
    const svgIdle = document.createElement('div');
    if (example.swapViewers) {
      svgViewer.dataset.reveal = 'waiting';
      svgIdle.className = 'svg-idle';
      const question = document.createElement('p'); question.textContent = prompt;
      svgIdle.append(question); svgViewer.querySelector('.svg-stage').append(svgIdle);
    }
    function initialize() {
      if (videoViewer) return;
      videoViewer = createVideoViewer(videoPanel, prefix, example.videos);
      if (example.swapViewers) videoViewer.loadFirstPaused();
      else svgViewerInstance = createSVGViewer(svgPanel, prefix, example.svg);
    }
    function finishReveal() {
      clearTimeout(revealTimer); revealTimer = null; revealing = false;
      svgViewer.classList.remove('is-generating'); svgViewer.removeAttribute('aria-busy');
      svgViewer.dataset.reveal = svgViewerInstance ? 'ready' : 'waiting';
      playButton.disabled = false; playButton.removeAttribute('aria-busy');
    }
    function revealSVG() {
      if (revealing) return;
      revealing = true; playButton.disabled = true; playButton.setAttribute('aria-busy', 'true');
      svgViewer.dataset.reveal = 'generating'; svgViewer.setAttribute('aria-busy', 'true');
      svgViewer.classList.add('is-generating');
      void getComputedStyle(svgViewer).animationName;
      revealTimer = setTimeout(async () => {
        revealTimer = null;
        svgViewer.classList.remove('is-generating'); svgViewer.dataset.reveal = 'loading';
        svgIdle.hidden = true;
        try {
          if (svgViewerInstance) await svgViewerInstance.showComposite();
          else {
            svgViewerInstance = createSVGViewer(svgPanel, prefix, example.svg);
            await svgViewerInstance.ready;
          }
        } finally { finishReveal(); }
      }, 2000);
    }
    playButton.addEventListener('click', () => {
      initialize();
      if (example.swapViewers) revealSVG();
      else videoViewer.playFirst(playButton);
    });
    if (example.swapViewers) {
      // Cancel a pending reveal when the visitor leaves the page/tab.
      document.addEventListener('visibilitychange', () => { if (document.hidden && revealTimer !== null) finishReveal(); });
      window.addEventListener('pagehide', finishReveal);
    }
    if (observer) { pendingExamples.set(section, initialize); observer.observe(section); }
    else initialize();
  });
  const firstViewer = document.querySelector('.comparison');
  const skip = document.querySelector('.skip-link');
  skip.href = `#${firstViewer?.id || 'page-sections'}`;
  skip.textContent = firstViewer ? 'Skip to interactive viewer' : 'Skip to page content';
  $('page-status').hidden = true;
}

initializePage().catch(error => {
  console.error(error);
  const status = document.getElementById('page-status');
  status.hidden = false;
  status.textContent = 'The page content could not be loaded. Please try refreshing the page.';
  status.classList.add('error');
});
