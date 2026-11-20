// Optional: run with the Electron binary from an installed DeckWerk checkout.
// Start npm run serve first; override TEMPLATE_URL when using another port.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
app.disableHardwareAcceleration();
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1000,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  const js = source => w.webContents.executeJavaScript(source);
  const until = async expression => {
    for (let i = 0; i < 100; i++) { if (await js(expression)) return; await wait(100); }
    throw Error('Timeout: ' + expression);
  };
  await w.loadURL(process.env.TEMPLATE_URL || 'http://127.0.0.1:8765/');
  await until(`document.querySelector('.slide-single')?.dataset.state`);
  await js(`document.querySelector('.slide-single').scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`document.querySelector('.slide-single').dataset.state==='playing'`);
  assert.equal(await js(`document.querySelector('.slide-single iframe').contentWindow.embedClock.paused`),false);
  assert.equal(await js(`document.querySelector('.slide-sequence').dataset.running`),'false');
  await wait(2500);
  assert.equal(await js(`document.querySelector('.slide-single iframe').contentDocument.querySelectorAll('.katex-error').length`),0);
  if (process.env.TEMPLATE_SCREENSHOTS) fs.writeFileSync(process.env.TEMPLATE_SCREENSHOTS+'-desktop.png',(await w.webContents.capturePage()).toPNG());
  await js(`document.querySelector('.slide-sequence').scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='playing'`);
  assert.equal(await js(`document.querySelector('.slide-single iframe').contentWindow.embedClock.paused`),true);
  await until(`document.querySelector('.slide-sequence iframe').contentDocument.querySelector('.katex')`);
  await js(`document.querySelector('.sequence-toggle').click();true`);await wait(150);
  const frozen = await js(`document.querySelector('.slide-sequence iframe').contentWindow.embedClock.now()`);
  await wait(400);
  assert.equal(await js(`document.querySelector('.slide-sequence iframe').contentWindow.embedClock.now()`),frozen);
  await js(`document.querySelectorAll('.sequence-segment')[1].click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='paused'`);
  assert.equal(await js(`document.querySelector('.slide-sequence iframe').contentWindow.embedClock.paused`),true);
  await js(`document.querySelector('.sequence-restart').click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='playing'`);
  assert.equal(await js(`document.querySelector('.slide-sequence').dataset.slideIndex`),'0');
  for(const width of [1440,1100,1099,390]){
    w.setContentSize(width,1000);await wait(200);
    await js(`document.querySelector('.slide-single').scrollIntoView({block:'center',behavior:'instant'});true`);
    await wait(200);
    assert.equal(await js(`document.documentElement.scrollWidth>innerWidth`),false,'No page overflow at '+width+'px');
    assert.ok(await js(`document.querySelectorAll('[data-running="true"]').length<=1`));
  }
  assert.ok(await js(`document.querySelector('details').open`));
  await js(`document.querySelector('details summary').click();true`);
  assert.equal(await js(`document.querySelector('details').open`),false);
  await js(`document.querySelector('details summary').click();true`);
  if (process.env.TEMPLATE_SCREENSHOTS) fs.writeFileSync(process.env.TEMPLATE_SCREENSHOTS+'-mobile.png',(await w.webContents.capturePage()).toPNG());
  assert.equal(await js(`(async()=> (await fetch('favicon.ico')).status)()`),200);
  console.log('PASS: native exports, LaTeX, visibility pause/resume, manual pause, selection/restart, responsive layout and collapsible notes.');
  w.destroy(); app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
setTimeout(() => app.exit(2),30000);
