import { describeSections, renderNavigation, renderSlides } from './section-content.js';
import { loadMarkdownSections } from './markdown.js';
import { initSectionNavigation } from './section-navigation.js';
import { initSectionPlayers } from './section-player.js';
const content = document.getElementById('article-content');
const container = document.getElementById('slide-sections');
let destroy = initSectionNavigation(document.querySelector('.pnav'), content);
let destroyPlayers = initSectionPlayers(container);

// Keep JSON edits visible on refresh without a media export. The build also
// writes the same markup to index.html for native links and no-JS readers.
async function refreshSections() {
  if (!container || !content) return;
  try {
    const response = await fetch('slide-sections.json', { cache: 'no-cache' });
    if (!response.ok) throw Error(`Slide configuration: HTTP ${response.status}`);
    const config = await response.json();
    const sameConfig = container.dataset.config === JSON.stringify(config);
    if (sameConfig && !config.sections.some(s => s.markdown && !s.hidden && !s.disabled)) return;
    const staticSections = [...content.querySelectorAll('[data-section-nav]')].map(s => ({
      id: s.id, label: s.dataset.navLabel || s.querySelector('h1,h2,h3,h4,h5,h6')?.textContent.trim() || s.id,
      static: true
    }));
    const sections = await loadMarkdownSections(describeSections(config, staticSections), async path => {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
      return response.text();
    });
    // Refresh file-only edits, but preserve players when built content matches.
    const blocks = [...container.querySelectorAll('.markdown-content')];
    if (sameConfig && sections.filter(s => s.markdown).every(s => {
      const expected = document.createElement('div');
      expected.innerHTML = s.markdownHtml;
      return blocks.find(el => el.dataset.markdown === s.markdown)?.innerHTML === expected.innerHTML;
    })) return;
    const disclosureStates = new Map([...container.querySelectorAll('.slide-explanation')]
      .map(details => [details.closest('section').id, details.open]));
    destroy();
    destroyPlayers();
    document.querySelector('.pnav')?.remove();
    content.insertAdjacentHTML('beforebegin', renderNavigation(sections));
    container.innerHTML = renderSlides(sections);
    container.querySelectorAll('.slide-explanation').forEach(details => {
      const id = details.closest('section').id;
      if (disclosureStates.has(id)) details.open = disclosureStates.get(id);
    });
    container.dataset.config = JSON.stringify(config);
    destroy = initSectionNavigation(document.querySelector('.pnav'), content);
    destroyPlayers = initSectionPlayers(container);
    if (location.hash) {
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid URL fragment. */ }
    }
  } catch (error) { console.error('Unable to refresh slide sections:', error); }
}
refreshSections();
addEventListener('pagehide', () => { destroy(); destroyPlayers(); });
addEventListener('pageshow', event => {
  if (event.persisted) {
    destroy();
    destroyPlayers();
    destroy = initSectionNavigation(document.querySelector('.pnav'), content);
    destroyPlayers = initSectionPlayers(container);
    refreshSections();
  }
});
