#!/usr/bin/env node
// Use DeckWerk's official web exporter; never read or edit the source deck.json.
import { renderSections } from './render-sections.mjs';
import { describeSections } from '../js/section-content.js';
import { spawn } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import { readFile, writeFile, mkdir, mkdtemp, cp, rm, rename } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), watchMode = args.includes('--watch');
const arg = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const checkout = resolve(arg('--deckwerk') || process.env.DECKWERK_SOURCE || join(homedir(), 'Downloads/deckwerk'));
const sourceOverride = arg('--source') || process.env.DECKWERK_PROJECT;
const deckSource = config => {
  const value = sourceOverride || config.deck || 'Presentation';
  if (typeof value !== 'string' || !value.trim()) throw Error('The deck field must be a nonempty folder path.');
  return resolve(root, value);
};
const configPath = join(root, 'slide-sections.json');
if (!existsSync(join(checkout, 'scripts/export-deck.mts'))) throw Error('Set DECKWERK_SOURCE or pass --deckwerk /path/to/deckwerk (with npm dependencies installed).');
function run(command, argv) {
  return new Promise((yes, no) => {
    const child = spawn(command, argv, { cwd: checkout, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', no);
    child.on('close', code => code === 0 ? yes(stdout) : no(Error(`${command} failed (${code})\n${stderr}\n${stdout}`)));
  });
}
async function sync() {
  const scratch = await mkdtemp(join(tmpdir(), 'project-slides-'));
  const stage = join(root, '.slides-staging'), output = join(root, 'slides'), previous = join(root, '.slides-previous');
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const source = deckSource(config);
    const numbers = [...new Set(describeSections(config).flatMap(s => s.slides.map(item => item.slide)))];
    if (!numbers.length) { await renderSections(); console.log('No enabled slide sections to export.'); return; }
    // Resolve rail positions through the supported CLI, preserving configured order.
    const ids = [];
    for (const number of numbers) {
      const selection = await run(join(checkout, 'bin/slide-agent'), ['inspect', source, '--slide', String(number), '--html-body']);
      const matches = [...selection.matchAll(/<section\b[^>]*data-slide-id="([^"]+)"/g)];
      if (matches.length !== 1) throw Error(`Expected one DeckWerk slide at rail position ${number}.`);
      ids.push(matches[0][1]);
    }
    console.log(`Exporting DeckWerk slides ${numbers.join(', ')}…`);
    await run('npm', ['run', 'export', '--', source, scratch, '--quality', 'original', '--no-thumbnail']);
    const html = await readFile(join(scratch, 'index.html'), 'utf8');
    const match = /window\.__DECK__\s*=\s*([\s\S]*?);\s*<\/script>/.exec(html);
    if (!match) throw Error('DeckWerk export format changed: missing embedded playback data.');
    const exported = JSON.parse(match[1]);
    exported.slides = ids.map(id => {
      const slide = exported.slides.find(s => s.id === id);
      if (!slide) throw Error(`Slide ${id} is missing from the export. Unhide the selected slide in DeckWerk.`);
      return { ...slide, notes: '', comments: [] };
    });
    // Keep the exact exported objects/timelines; omit private presenter notes from the public embed.
    // Retain the native presentation title; no project-specific constants.
    const assets = new Set();
    const collect = v => {
      if (typeof v === 'string') for (const m of v.matchAll(/assets\/[A-Za-z0-9_.%/() -]+/g)) assets.add(m[0]);
      else if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect(exported);
    const theme = await readFile(join(scratch, 'theme.css'), 'utf8');
    for (const m of theme.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) if (!/^(data:|https?:)/.test(m[1])) assets.add(m[1].replace(/^\.\//, ''));
    await rm(stage, { recursive: true, force: true });
    await mkdir(stage, { recursive: true });
    for (const name of ['player.js', 'player.css', 'theme.css']) await cp(join(scratch, name), join(stage, name));
    await cp(join(checkout, 'LICENSE'), join(stage, 'DeckWerk-LICENSE.txt'));
    if (existsSync(join(scratch, 'code-highlight.js'))) await cp(join(scratch, 'code-highlight.js'), join(stage, 'code-highlight.js'));
    for (const asset of assets) {
      const path = resolve(scratch, asset);
      if (!path.startsWith(scratch + '/')) throw Error(`Unsafe exported asset path: ${asset}`);
      await mkdir(dirname(join(stage, asset)), { recursive: true });
      await cp(path, join(stage, asset));
    }
    await cp(join(root, 'web/slides/embed.js'), join(stage, 'embed.js'));
    await cp(join(root, 'web/slides/clock.js'), join(stage, 'clock.js'));
    for (let i = 0; i < numbers.length; i++) {
      // Each section gets its own native slide, with shared assets and no website toolbar.
      const deck = { ...exported, slides: [exported.slides[i]] };
      const data = JSON.stringify(deck).replace(/</g, '\\u003c');
      let page = html.replace(match[0], () => `window.__DECK__ = ${data};</script>`);
      page = page.replace('<script src="./player.js"></script>', '<script src="./clock.js"></script>\n    <script src="./player.js"></script>\n    <script src="./embed.js"></script>');
      await writeFile(join(stage, `slide-${numbers[i]}.html`), page);
      if (i === 0) await writeFile(join(stage, 'index.html'), page);
    }
    const { w, h } = exported.canvas;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) throw Error('Invalid exported slide canvas.');
    // Match the native deck canvas, including future size edits in DeckWerk.
    await writeFile(join(stage, 'canvas.css'), `/* Generated by sync-slides.mjs from the DeckWerk canvas. */\n:root { --slide-aspect-ratio: ${w} / ${h}; }\n`);
    const manifest = { source: relative(root, source).startsWith('..') ? basename(source) : relative(root, source), canvas: { w, h }, slideNumbers: numbers, slideIds: ids, exportedAt: new Date().toISOString(), assets: assets.size };
    await writeFile(join(stage, 'export.json'), JSON.stringify(manifest, null, 2) + '\n');
    // Failed exports leave the working embed intact.
    await rm(previous, { recursive: true, force: true });
    if (existsSync(output)) await rename(output, previous);
    try { await rename(stage, output); }
    catch (error) { if (existsSync(previous)) await rename(previous, output); throw error; }
    await rm(previous, { recursive: true, force: true });
    await renderSections();
    console.log(`Updated slides/ (${assets.size} assets). Source project unchanged.`);
  } finally { await rm(scratch, { recursive: true, force: true }); await rm(stage, { recursive: true, force: true }); }
}
let busy = false, again = false, timer;
async function update() {
  if (busy) { again = true; return; }
  busy = true;
  try { await sync(); } catch (e) { console.error(e.message); if (!watchMode) process.exitCode = 1; }
  finally { busy = false; if (again) { again = false; void update(); } }
}
await update();
if (watchMode) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  let watchedSource = deckSource(config);
  let sourceWatcher;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 800); };
  const watchSource = () => {
    sourceWatcher?.close();
    sourceWatcher = watch(watchedSource, { recursive: true }, (_event, filename) => {
      if (!filename || /(^|\/)(deck\.json|theme\.css)$/.test(filename) || filename.startsWith('assets/')) schedule();
    });
  };
  watchSource();
  console.log('Watching DeckWerk saves. Refresh the website after each completed export. Ctrl+C to stop.');
  // Watch the directory so editors that save JSON by atomic rename work too.
  watch(root, (_event, filename) => {
    if (filename !== 'slide-sections.json') return;
    void readFile(configPath, 'utf8').then(text => {
      const next = deckSource(JSON.parse(text));
      if (next !== watchedSource) { watchedSource = next; watchSource(); }
      schedule();
    }).catch(error => console.error(error.message));
  });
}
