#!/usr/bin/env node
// Package only public website files. The editable deck and agent notes stay local.
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSections } from './render-sections.mjs';
import { describeSections } from '../js/section-content.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
await renderSections();
const config = JSON.parse(await readFile(join(root, 'slide-sections.json'), 'utf8'));
const selected = [...new Set(describeSections(config).flatMap(s => s.slides.map(item => item.slide)))];
for (const n of selected) {
  try { await stat(join(root, 'slides', `slide-${n}.html`)); }
  catch { throw Error(`Slide ${n} has no export. Run npm run sync -- --deckwerk /path/to/deckwerk first.`); }
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'slide-sections.json', 'favicon.ico', 'favicon.svg', 'css', 'js', 'logos', 'slides']) {
  await cp(join(root, name), join(output, name), { recursive: true });
}
await cp(join(root, 'THIRD_PARTY.md'), join(output, 'THIRD_PARTY.md'));
await writeFile(join(output, '.nojekyll'), '');
console.log('Built dist/ using the existing slide exports. Publish its contents; native deck source is excluded.');
