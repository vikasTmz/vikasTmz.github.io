// Shared by the static build and browser refresh: one ordered section list.
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const slug = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

export function describeSections(config, staticSections = []) {
  if (!Array.isArray(config.sections)) throw Error('Expected a sections array.');
  const sections = config.sections.filter(s => s.hidden !== true && s.disabled !== true).map(s => {
    const sequence = s.slides !== undefined;
    if ((sequence && s.slide !== undefined) || typeof s.title !== 'string' ||
        ['summary', 'notes', 'navLabel', 'key', 'id'].some(k => s[k] !== undefined && typeof s[k] !== 'string')) {
      throw Error('Invalid slide section configuration.');
    }
    const slides = sequence ? s.slides : [{ slide: s.slide, duration: 12 }];
    if (!Array.isArray(slides) || !slides.length || slides.some(item => !item ||
        !Number.isInteger(item.slide) || item.slide < 1 ||
        typeof item.duration !== 'number' || !Number.isFinite(item.duration) || item.duration <= 0)) {
      throw Error('Each slides entry needs a positive slide number and duration in seconds.');
    }
    const id = s.id || slug(s.key || `slide-${slides[0].slide}`);
    if (!id || /[\s#]/.test(id)) throw Error('Section IDs must be nonempty and contain no spaces or #.');
    return { ...s, slides, sequence, id, label: s.navLabel?.trim() || s.title.trim() || s.summary?.trim() || `Slide ${slides[0].slide}` };
  });
  const all = [...sections, ...staticSections];
  if (new Set(all.map(s => s.id)).size !== all.length) throw Error('Duplicate section IDs. Give repeated slides distinct keys.');
  return all;
}

export function renderNavigation(sections) {
  if (!sections.length) return '';
  return `<nav class="pnav${sections.length > 10 || sections.some(s => s.label.length > 48) ? ' pnav-long' : ''}" aria-label="Sections">
<span class="pnav-track" aria-hidden="true"><span class="pnav-fill"></span></span>
${sections.map(s => `<a href="#${escapeHtml(encodeURIComponent(s.id))}" aria-label="${escapeHtml(s.label)}" title="${escapeHtml(s.label)}"><span class="pnav-dot" aria-hidden="true"></span><span class="pnav-label">${escapeHtml(s.label)}</span></a>`).join('\n')}
</nav>`;
}

export function renderSlides(sections) {
  return sections.filter(s => !s.static).map(s => {
    const { title, slides, sequence, summary = '', notes = '', id, label } = s;
    const slide = slides[0].slide;
    // Retain the original heading IDs when migrating existing sections.
    const headingId = s.headingId || `${id}-title`;
    const heading = title.trim() ? `<h2 id="${escapeHtml(headingId)}">${escapeHtml(title)}</h2>` : '';
    const accessible = heading ? `aria-labelledby="${escapeHtml(headingId)}"` : `aria-label="${escapeHtml(label)}"`;
    let explanation = '';
    if (notes.trim()) {
      explanation = `<details class="slide-explanation"><summary${summary.trim() ? '' : ' aria-label="Toggle slide notes"'}>${summary.trim() ? `<span class="explanation-summary">${escapeHtml(summary)}</span>` : ''}</summary><div class="explanation-notes">${escapeHtml(notes)}</div></details>`;
    } else if (summary.trim()) explanation = `<p class="slide-takeaway">${escapeHtml(summary)}</p>`;
    const frame = `<iframe src="slides/slide-${slide}.html${sequence ? '?controlled=1' : ''}" title="${escapeHtml(title || `DeckWerk slide ${slide}`)}" loading="lazy" allow="autoplay"></iframe>`;
    const player = sequence ? `<div class="slide-sequence" data-slides="${escapeHtml(JSON.stringify(slides))}" aria-label="${escapeHtml(label)}">
<div class="sequence-stage">${frame}</div>
<div class="sequence-controls" role="group" aria-label="Section playback" hidden>
<button class="sequence-toggle" type="button" aria-label="Pause section" title="Pause section"><svg class="sequence-pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4v12M14 4v12"/></svg><svg class="sequence-play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 3 11 7-11 7Z"/></svg></button>
<div class="sequence-segments" role="group" aria-label="Slides">${slides.map((item, i) => `<button type="button" class="sequence-segment" data-index="${i}" aria-label="Show slide ${item.slide} (${i + 1} of ${slides.length})" title="Slide ${item.slide} · ${item.duration}s"${i === 0 ? ' aria-current="true"' : ''}><span class="segment-track" aria-hidden="true"><span class="segment-fill"></span></span></button>`).join('')}</div>
<span class="sequence-position" aria-live="polite" aria-atomic="true">1 / ${slides.length}</span>
<button class="sequence-restart" type="button" aria-label="Restart section" title="Restart section"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7a7 7 0 1 1-1 7M4 2v5h5"/></svg></button>
</div><p class="sequence-error" role="status" hidden></p>
<noscript><p>${slides.map(item => `<a href="slides/slide-${item.slide}.html">Slide ${item.slide}</a>`).join(' · ')}</p></noscript>
</div>` : frame;
    return `<section class="slide-section pnav-section" id="${escapeHtml(id)}" ${accessible} tabindex="-1">
${heading}${explanation}
${player}
</section>`;
  }).join('\n');
}
