// Run with DeckWerk's Electron while serving dist/; optional TEMPLATE_URL.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
app.disableHardwareAcceleration();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1000,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  const js = source => w.webContents.executeJavaScript(source);
  const until = async source => {
    for (let i = 0; i < 100; i++) { if (await js(source)) return; await wait(100); }
    console.log(await js(`JSON.stringify({hidden:document.hidden,players:[...document.querySelectorAll('.slide-sequence')].map(p=>({id:p.closest('section').id,state:p.dataset.state,open:p.closest('details')?.open,rect:p.getBoundingClientRect().toJSON(),frameReady:p.querySelector('iframe').contentDocument?.readyState,clock:!!p.querySelector('iframe').contentWindow.embedClock}))})`));
    throw Error('Timeout: ' + source);
  };
  const url = process.env.TEMPLATE_URL || 'http://127.0.0.1:8767/';
  await w.loadURL(url);
  await until(`document.querySelector('#intro .slide-sequence')?.dataset.state`);
  await wait(500);
  for (const width of [1440, 390]) {
    w.setContentSize(width, 1000);
    await wait(300);
    const result = await js(`(() => [...document.querySelectorAll('#slide-sections > section')].map(s => {
      const d=s.querySelector('details'), summary=d?.querySelector('summary');
      if (!summary) throw Error('Missing disclosure: '+s.id);
      d.open=true; const before=d.getBoundingClientRect().height;
      summary.click(); const after=d.getBoundingClientRect().height;
      const closed=!d.open; summary.click();
      return {id:s.id,closed,before,after,reopened:d.open};
    }))()`);
    for (const s of result) { assert.ok(s.closed && s.reopened, s.id); assert.ok(s.after < s.before, s.id); }
    assert.equal(await js('document.documentElement.scrollWidth > innerWidth'), false);
  }
  w.setContentSize(1440,1000);
  await wait(300);
  const player = `document.querySelector('#intro .slide-sequence')`;
  const details = `document.querySelector('#intro details')`;
  await js(`${player}.scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`${player}.dataset.running==='true'`);
  await wait(400);
  await js(`${details}.querySelector('summary').click();true`);
  await until(`${player}.dataset.running==='false'`);
  await until(`${player}.querySelector('iframe').contentWindow.embedClock.paused`);
  const time = await js(`+${player}.dataset.elapsed`);
  const nativeTime = await js(`${player}.querySelector('iframe').contentWindow.embedClock.now()`);
  await wait(500);
  assert.equal(await js(`+${player}.dataset.elapsed`),time);
  assert.equal(await js(`${player}.querySelector('iframe').contentWindow.embedClock.now()`),nativeTime);
  await js(`${details}.querySelector('summary').click();true`);
  await wait(100);
  await js(`${player}.scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`${player}.dataset.running==='true'`);
  assert.ok(await js(`+${player}.dataset.elapsed >= ${time}`));
  await js(`${player}.querySelector('.sequence-toggle').click();${details}.open=false;true`);
  await wait(100);
  await js(`${details}.open=true;${player}.scrollIntoView({block:'center',behavior:'instant'});true`);
  await wait(300);
  assert.equal(await js(`${player}.dataset.state`),'paused');
  // Native keyboard interaction remains available.
  await js(`${details}.querySelector('summary').focus();true`);
  w.webContents.focus();
  w.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  w.webContents.sendInputEvent({type:'char',keyCode:'\r'});
  w.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await until(`!${details}.open`);
  // Static HTML also contains real disclosures without JavaScript.
  const n = new BrowserWindow({show:false,webPreferences:{javascript:false,offscreen:true}});
  await n.loadURL(url);n.webContents.debugger.attach('1.3');
  const {root}=await n.webContents.debugger.sendCommand('DOM.getDocument');
  const {nodeIds}=await n.webContents.debugger.sendCommand('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'#slide-sections > section > details[open]'});
  assert.equal(nodeIds.length,await js(`document.querySelectorAll('#slide-sections > section').length`));
  const frames=await n.webContents.debugger.sendCommand('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'#slide-sections iframe[src]'});
  assert.equal(frames.nodeIds.length,0,'No-JavaScript mode does not fetch unplayable frames');
  const links=await n.webContents.debugger.sendCommand('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'#slide-sections noscript a[href]'});
  assert.ok(links.nodeIds.length>0,'No-JavaScript mode retains direct slide links');
  n.webContents.debugger.detach();n.destroy();w.destroy();
  console.log('PASS: desktop/mobile disclosures, empty notes, Markdown, keyboard, no-JS output, paused clocks, resume and manual pause.');app.exit(0);
}).catch(error=>{console.error(error);app.exit(1)});
