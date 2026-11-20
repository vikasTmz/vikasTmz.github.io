#!/usr/bin/env node
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { describeSections, renderNavigation, renderSlides, escapeHtml } from '../js/section-content.js';
import { loadMarkdownSections } from '../js/markdown.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function renderSections() {
  const config = JSON.parse(await readFile(resolve(root, 'slide-sections.json'), 'utf8'));
  let html = await readFile(resolve(root, 'index.html'), 'utf8');
  // Read existing static article sections; their text remains authored in HTML.
  const staticSections = [...html.matchAll(/<section\b([^>]*\bdata-section-nav\b[^>]*)>([\s\S]*?)<\/section>/g)].map(([, attrs, body]) => {
    const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
    const heading = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/.exec(body)?.[1];
    if (!id || !heading) throw Error('Static navigation sections need an id and heading.');
    const decode = text => text.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, x => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[x]).trim();
    return { id, label: decode(heading), static: true };
  });
  const sections = await loadMarkdownSections(describeSections(config, staticSections), async path => {
    const file = await realpath(resolve(root, path));
    if (!file.startsWith(resolve(root, 'content') + '/')) throw Error(`Markdown must stay inside content/: ${path}`);
    return readFile(file, 'utf8');
  });
  const replace = (name, content) => {
    const pattern = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
    if (!pattern.test(html)) throw Error(`Missing ${name} template markers.`);
    html = html.replace(pattern, () => `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`);
  };
  replace('section-navigation', renderNavigation(sections));
  replace('slide-sections', `<div id="slide-sections" data-config="${escapeHtml(JSON.stringify(config))}">\n${renderSlides(sections)}\n</div>`);
  await writeFile(resolve(root, 'index.html'), html);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await renderSections();
  console.log('Rendered article sections and navigation from slide-sections.json.');
}
