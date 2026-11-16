// Build-time BibTeX support using the same bundled Citation.js as LiftingSVG.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

module.exports = function createReferences(config, local, escape) {
  const entries = new Map(), cited = new Map();
  let Cite;
  if (config) {
    const context = { window: {}, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout,
      console: { log() {}, warn() {}, error() {}, info() {}, debug() {} } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/vendor/citation.min.js'), 'utf8'), context);
    Cite = context.window.BibliographyCite;
    const input = fs.readFileSync(local(config.bibliography), 'utf8').replace(/^\s*%[^\n]*(?:\n|$)/gm, '');
    for (const { _graph, ...entry } of new Cite(input, { forceType: '@biblatex/text' }).data) {
      const key = String(entry['citation-key'] || entry.id);
      if (entries.has(key)) throw Error(`Duplicate bibliography key: ${key}`);
      entries.set(key, entry);
    }
  }
  const extension = {
    name: 'citation', level: 'inline',
    start(source) { return source.search(/\[@|\\cite\{/); },
    tokenizer(source) {
      const match = /^(?:\[(@[^\]\n]+)\]|\\cite\{([^}\n]+)\})/.exec(source);
      if (!match) return;
      const keys = (match[1] || match[2]).split(/[;,]/).map(key => key.trim().replace(/^@/, ''));
      if (keys.every(key => /^[A-Za-z0-9_][A-Za-z0-9_:.+/-]*$/.test(key))) return { type: 'citation', raw: match[0], keys };
    },
    renderer(token) {
      const links = token.keys.map(key => {
        if (!entries.has(key)) throw Error(`Missing bibliography entry: ${key}. Add it to ${config?.bibliography || 'references.bib'}.`);
        if (!cited.has(key)) cited.set(key, { number: cited.size + 1, occurrences: [] });
        const item = cited.get(key);
        const id = `citation-${item.number}-${item.occurrences.length + 1}`;
        item.occurrences.push(id);
        return `<a class="citation" id="${id}" href="#reference-${item.number}" role="doc-biblioref" aria-label="Reference ${item.number}: ${escape(entries.get(key).title || key)}">${item.number}</a>`;
      });
      return `<span class="citation-group">[${links.join(', ')}]</span>`;
    }
  };
  return { extension, render() {
    if (!config) return '';
    const items = [...cited].map(([key, item]) => {
      const entry = entries.get(key);
      let text = escape(new Cite([entry]).format('bibliography', { format: 'text', template: 'apa', lang: 'en-US' }).trim());
      const source = entry.DOI ? `https://doi.org/${entry.DOI}` : entry.URL;
      if (source && /^https?:\/\//i.test(source)) {
        const url = escape(source);
        const link = `<a href="${url}">${text.includes(url) ? url : 'Source'}</a>`;
        text = text.includes(url) ? text.replace(url, link) : `${text} ${link}`;
      }
      const backs = item.occurrences.map((id, index) => `<a href="#${id}" aria-label="Return to citation ${index + 1} of reference ${item.number}">↩${item.occurrences.length > 1 ? index + 1 : ''}</a>`).join(' ');
      return `<li id="reference-${item.number}" tabindex="-1"><div>${text}</div><span class="reference-backlinks">${backs}</span></li>`;
    });
    return `<section class="post-section references-section" id="references" aria-labelledby="references-title" tabindex="-1">
<h2 id="references-title">${escape(config.title || 'References')}</h2>
${items.length ? `<ol class="reference-list">${items.join('\n')}</ol>` : '<p class="references-status">No references cited yet.</p>'}
<p class="references-download"><a href="${escape(config.bibliography)}" download>Download BibTeX</a></p>
</section>`;
  }};
};
