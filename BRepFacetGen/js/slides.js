import { describeSections, renderNavigation, renderSlides } from './section-content.js';
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
    if (container.dataset.config === JSON.stringify(config)) return;
    const staticSections = [...content.querySelectorAll('[data-section-nav]')].map(s => ({
      id: s.id, label: s.dataset.navLabel || s.querySelector('h1,h2,h3,h4,h5,h6')?.textContent.trim() || s.id,
      static: true
    }));
    const sections = describeSections(config, staticSections);
    destroy();
    destroyPlayers();
    document.querySelector('.pnav')?.remove();
    content.insertAdjacentHTML('beforebegin', renderNavigation(sections));
    container.innerHTML = renderSlides(sections);
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
