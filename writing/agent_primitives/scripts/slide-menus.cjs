const fs = require('node:fs');
const path = require('node:path');

function slideMenus(layout, root) {
  return Object.entries(layout.embeds || {}).filter(([, embed]) => embed.type === 'slide-menu').map(([key, embed]) => {
    if (!/^[\w-]+$/.test(key)) throw Error(`Invalid slide-menu key: ${key}`);
    if (typeof embed.title !== 'string' || !embed.title.trim()) throw Error(`Slide menu ${key} needs a title.`);
    if (typeof embed.deck !== 'string' || !embed.deck.trim()) throw Error(`Slide menu ${key} needs a deck folder.`);
    const deck = path.resolve(root, embed.deck);
    if (!deck.startsWith(root + path.sep) || !fs.statSync(deck).isDirectory()) throw Error(`Deck must be a folder inside the project: ${embed.deck}`);
    if (!Array.isArray(embed.slides) || !embed.slides.length) throw Error(`Slide menu ${key} needs at least one slide.`);
    const numbers = new Set();
    const slideIds = new Set();
    const slides = embed.slides.map(item => {
      if (!Number.isInteger(item.slide) || item.slide < 1) throw Error(`Slide menu ${key}: slide must be a positive integer.`);
      if (numbers.has(item.slide)) throw Error(`Slide menu ${key}: duplicate slide ${item.slide}.`);
      numbers.add(item.slide);
      if (typeof item.label !== 'string' || !item.label.trim()) throw Error(`Slide ${item.slide} in ${key} needs a button label.`);
      const id = item.id ?? (item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `slide-${item.slide}`);
      if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || slideIds.has(id)) throw Error(`Slide menu ${key}: each slide needs a unique lowercase URL id (letters, digits, and hyphens).`);
      slideIds.add(id);
      if (item.syncVideos !== undefined && typeof item.syncVideos !== 'boolean') throw Error(`Slide ${item.slide}: syncVideos must be true or false.`);
      return { id, number: item.slide, label: item.label, syncVideos: item.syncVideos === true, src: `slides/${key}-${item.slide}.html` };
    });
    return { key, title: embed.title, deck, slides };
  });
}

function canvas(html) {
  const match = /<section\b[^>]*\bdata-canvas="(\d+)x(\d+)"/i.exec(html);
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) throw Error('Exported slide is missing valid canvas dimensions.');
  return { width: Number(match[1]), height: Number(match[2]) };
}

function renderMenu(menu, root, escape, frameId) {
  const slides = menu.slides.map(slide => {
    const file = path.join(root, slide.src);
    if (!fs.existsSync(file)) throw Error(`Slide ${slide.number} (${slide.label}) has not been exported. Run npm run export:slide.`);
    return { ...slide, ...canvas(fs.readFileSync(file, 'utf8')) };
  });
  const first = slides[0];
  const title = slide => `${menu.title}: ${slide.label}`;
  const buttons = slides.map((slide, index) => `<button type="button" class="slide-menu-button" aria-pressed="${index === 0}" aria-controls="${frameId}" data-slide-id="${escape(slide.id)}" data-slide-src="${escape(slide.src)}" data-slide-title="${escape(title(slide))}" data-slide-ratio="${slide.width}/${slide.height}">${escape(slide.label)}</button>`).join('');
  const frameAttributes = `class="slide-frame" title="${escape(title(first))}" style="--ratio:${first.width}/${first.height}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen`;
  return `<div class="slide-menu" data-slide-menu-key="${escape(menu.key)}" role="group" aria-label="${escape(menu.title)}" hidden>${buttons}</div>
<iframe id="${frameId}" ${frameAttributes} hidden></iframe>
<noscript><iframe src="${escape(first.src)}" ${frameAttributes}></iframe><p>${slides.map(slide => `<a href="${escape(slide.src)}">${escape(slide.label)}</a>`).join(' · ')}</p></noscript>`;
}

module.exports = { slideMenus, canvas, renderMenu };
