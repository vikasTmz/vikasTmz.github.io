// Export all configured slide menus without modifying their DeckWerk decks.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { slideMenus, canvas } = require('./slide-menus.cjs');

const root = path.resolve(__dirname, '..');
const staged = [];
const urlPath = value => value.split(path.sep).map(part => encodeURIComponent(part)).join('/');

try {
  const layout = JSON.parse(fs.readFileSync(path.join(root, 'layout.json'), 'utf8'));
  const menus = slideMenus(layout, root);
  if (!menus.length) throw Error('No slide-menu embeds configured in layout.json.');
  const candidates = process.env.SLIDE_AGENT ? [process.env.SLIDE_AGENT] : [
    ...(process.env.PATH || '').split(path.delimiter).map(dir => path.join(dir, 'slide-agent')),
    path.join(os.homedir(), 'Downloads/deckwerk/bin/slide-agent')
  ];
  const cli = candidates.find(file => {
    try { fs.accessSync(file, fs.constants.X_OK); return fs.statSync(file).isFile(); }
    catch { return false; }
  });
  if (!cli) throw Error('DeckWerk CLI not found. Set SLIDE_AGENT to the full path of deckwerk/bin/slide-agent (see README.md).');

  // Validate every export before replacing any existing slide files.
  for (const menu of menus) for (const slide of menu.slides) {
    console.log(`Exporting ${slide.label}: slide ${slide.number} from ${path.relative(root, menu.deck)}…`);
    const result = spawnSync(cli, ['inspect', menu.deck, '--html', '--slide', String(slide.number)], {
      cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error(result.stderr?.trim() || `DeckWerk exited with status ${result.status}.`);
    if (result.stderr?.trim()) console.error(result.stderr.trim());
    let html = result.stdout;
    const sections = html.match(/<section\b[^>]*\bdata-slide-id=/gi) || [];
    if (!/^\s*<!doctype html>/i.test(html) || sections.length !== 1
        || !/<base\b[^>]*>/i.test(html) || !/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
      throw Error(`Unexpected export for ${slide.label} (slide ${slide.number}); existing slides kept.`);
    }
    canvas(html);
    if (slide.syncVideos) html = html.replace(/<section\b(?=[^>]*\bdata-slide-id=)/i, '<section data-sync-videos="true"');
    const output = path.join(root, slide.src);
    const base = urlPath(path.relative(path.dirname(output), menu.deck)) + '/';
    const wrapper = urlPath(path.relative(menu.deck, path.join(root, 'slides/embed.js')));
    html = html.replace(/<base\b[^>]*>/i, `<base href="${base}">`);
    html = html.replace(/<\/head>/i, `<style>
html, body { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:transparent; }
section.slide { position:absolute; transform-origin:top left; box-shadow:none; margin:0; }
</style>
</head>`);
    html = html.replace(/<\/body>/i, `<script src="${wrapper}"></script>\n</body>`);
    staged.push({ output, temporary: `${output}.${process.pid}.tmp`, html });
  }
  for (const item of staged) {
    fs.mkdirSync(path.dirname(item.output), { recursive: true });
    fs.writeFileSync(item.temporary, item.html);
  }
  for (const item of staged) fs.renameSync(item.temporary, item.output);
  console.log(`Exported ${staged.length} slides. Rebuilding the webpage…`);
  const build = spawnSync(process.execPath, [path.join(__dirname, 'build.cjs')], { cwd: root, stdio: 'inherit' });
  if (build.error) throw build.error;
  if (build.status !== 0) throw Error('Slides were exported, but the page build failed. Fix the reported content error and run npm run build.');
  console.log('Slide menus updated. Refresh your browser.');
} catch (error) {
  console.error(`Export failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const item of staged) if (fs.existsSync(item.temporary)) fs.unlinkSync(item.temporary);
}
