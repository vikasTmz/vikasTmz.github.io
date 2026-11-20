// Optional: run with DeckWerk's Electron, after SITE_ROOT=dist npm run serve.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
app.disableHardwareAcceleration();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const url = process.env.TEMPLATE_URL || 'http://127.0.0.1:8765/';
const file = path.resolve(__dirname, '../dist/content/sds-limitations.md');
const original = fs.readFileSync(file, 'utf8');
const errors = [];
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1000,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  w.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  const js = async source => {
    try { return await w.webContents.executeJavaScript(source); }
    catch (error) { throw Error(`${source}\n${error.message}\n${errors.join('\n')}`); }
  };
  const until = async expression => {
    for (let i = 0; i < 100; i++) { if (await js(expression)) return; await wait(100); }
    throw Error('Timeout: ' + expression);
  };
  const article = `document.querySelector('.markdown-content')`;
  await w.loadURL(url);
  await until(`document.querySelector('.slide-sequence')?.dataset.state`);
  await js('document.fonts.ready.then(() => true)');
  assert.equal(await js(`${article}.closest('section').querySelector('iframe')`), null);
  assert.equal(await js(`${article}.querySelectorAll('.markdown-equation').length`), 6);
  assert.equal(await js(`${article}.querySelectorAll('.katex-error').length`), 0);
  assert.equal(await js(`${article}.textContent.includes('Distillation via SDS')`), false);
  assert.equal(await js(`(async () => (await fetch('content/sds-limitations.md')).status)()`), 200);
  // Existing players still respond to the visibility controller and toolbar.
  await js(`document.querySelector('.slide-sequence').scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='playing'`);
  await js(`document.querySelector('.sequence-toggle').click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='paused'`);
  for (const width of [1440, 390]) {
    w.setContentSize(width, 1000);
    await js(`${article}.closest('section').scrollIntoView({block:'start',behavior:'instant'});true`);
    await wait(400);
    assert.equal(await js('document.documentElement.scrollWidth > innerWidth'), false, `No overflow at ${width}px`);
    if (width === 390) {
      assert.equal(await js(`(() => { const e = ${article}.querySelector('.markdown-equation'); e.scrollLeft = 100; const moved = e.scrollLeft > 0; e.scrollLeft = 0; return moved; })()`), true, 'Long equations can be scrolled');
    }
    assert.equal(await js(`document.querySelectorAll('[data-running="true"]').length`), 0, 'Players pause when reading the article');
    const screenshot = await w.webContents.capturePage();
    fs.writeFileSync(`/private/tmp/msd-markdown-${width}.png`, screenshot.toPNG());
    await js(`${article}.querySelector('table')?.scrollIntoView({block:'center',behavior:'instant'});true`);
    await wait(200);
    assert.equal(await js('document.documentElement.scrollWidth > innerWidth'), false);
    fs.writeFileSync(`/private/tmp/msd-markdown-table-${width}.png`, (await w.webContents.capturePage()).toPNG());
  }
  // Only the exported test copy changes. JSON and generated HTML stay identical.
  fs.writeFileSync(file, original + '\n\nMarkdown-only refresh probe.\n');
  await w.loadURL(url);
  await until(`${article}.textContent.includes('Markdown-only refresh probe.')`);
  fs.writeFileSync(file, original);
  await w.loadURL(url);
  await until(`${article} && !${article}.textContent.includes('Markdown-only refresh probe.')`);
  const staticWindow = new BrowserWindow({ show: false, webPreferences: { javascript: false, offscreen: true } });
  await staticWindow.loadURL(url);
  staticWindow.webContents.debugger.attach('1.3');
  const { root } = await staticWindow.webContents.debugger.sendCommand('DOM.getDocument');
  for (const [selector, count] of [['.markdown-content .markdown-equation', 6], ['.markdown-content table', 0]]) {
    const { nodeIds } = await staticWindow.webContents.debugger.sendCommand('DOM.querySelectorAll', { nodeId: root.nodeId, selector });
    assert.equal(nodeIds.length, count);
  }
  staticWindow.webContents.debugger.detach();
  staticWindow.destroy();
  assert.deepEqual(errors, []);
  console.log('PASS: Markdown/LaTeX/table rendering, desktop/mobile layout, slide controls, file-only refresh and no-JavaScript content.');
  w.destroy(); app.exit(0);
}).catch(error => { fs.writeFileSync(file, original); console.error(error); app.exit(1); });
setTimeout(() => { fs.writeFileSync(file, original); app.exit(2); }, 30000);
