// Export the first slide without modifying the DeckWerk source deck.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'slides/gpt-proxy-geom-1.html');
const temporary = `${output}.${process.pid}.tmp`;

try {
  const candidates = process.env.SLIDE_AGENT ? [process.env.SLIDE_AGENT] : [
    ...(process.env.PATH || '').split(path.delimiter).map(dir => path.join(dir, 'slide-agent')),
    path.join(os.homedir(), 'Downloads/deckwerk/bin/slide-agent')
  ];
  const cli = candidates.find(file => {
    try { fs.accessSync(file, fs.constants.X_OK); return fs.statSync(file).isFile(); }
    catch { return false; }
  });
  if (!cli) throw Error('DeckWerk CLI not found. Set SLIDE_AGENT to the full path of deckwerk/bin/slide-agent (see README.md).');

  console.log('Exporting saved slide 1 from gpt_proxy_geom…');
  const result = spawnSync(cli, ['inspect', path.join(root, 'gpt_proxy_geom'), '--html', '--slide', '1'], {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(result.stderr?.trim() || `DeckWerk exited with status ${result.status}.`);
  if (result.stderr?.trim()) console.error(result.stderr.trim());
  let html = result.stdout;
  // Check the export before replacing the working embed.
  const slides = html.match(/<section\b[^>]*\bdata-slide-id=/gi) || [];
  if (!/^\s*<!doctype html>/i.test(html) || slides.length !== 1 || !/data-canvas="\d+x\d+"/.test(html)
      || !/<base\b[^>]*>/i.test(html) || !/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    throw Error('Unexpected DeckWerk export format; the existing slide has been kept.');
  }
  html = html.replace(/<base\b[^>]*>/i, '<base href="../gpt_proxy_geom/">');
  html = html.replace(/<\/head>/i, `<style>
html, body { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:transparent; }
section.slide { position:absolute; transform-origin:top left; box-shadow:none; margin:0; }
</style>
</head>`);
  html = html.replace(/<\/body>/i, '<script src="../slides/embed.js"></script>\n</body>');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, output);
  console.log('Updated slides/gpt-proxy-geom-1.html. Refresh your browser to see the saved slide changes.');
} catch (error) {
  console.error(`Export failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
}
