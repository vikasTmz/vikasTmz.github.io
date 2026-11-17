// Run with the existing DeckWerk Electron binary while scripts/serve.mjs runs.
// SECTION_PLAYER_URL can point at a built /BRepFacetGen/ page instead.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
app.disableHardwareAcceleration();
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1000, webPreferences: { offscreen: true, backgroundThrottling: false } });
  const js = source => w.webContents.executeJavaScript(source);
  const until = async (source, label) => {
    for (let i = 0; i < 80; i++) { if (await js(source)) return; await wait(100); }
    throw Error('Timed out: ' + label);
  };
  const state = () => js(`Array.from(document.querySelectorAll('.slide-single,.slide-sequence'), r => {
    const f=r.querySelector('iframe'), c=f.contentWindow, d=f.contentDocument;
    return {id:r.closest('section').id, state:r.dataset.state, running:r.dataset.running==='true',
      index:+r.dataset.slideIndex, elapsed:+r.dataset.elapsed, userPlaying:r.dataset.userPlaying,
      paused:c.embedClock?.paused, time:c.embedClock?.now(),
      videos:[...d.querySelectorAll('video')].map(v=>({time:v.currentTime,paused:v.paused,error:v.error?.message}))};
  })`);
  const scroll = async n => {
    await js(`document.querySelectorAll('.slide-single,.slide-sequence')[${n}].scrollIntoView({block:'center',behavior:'instant'});true`);
    await until(`document.querySelectorAll('.slide-single,.slide-sequence')[${n}].dataset.active==='true'`, 'active section '+n);
    await until(`document.querySelectorAll('.slide-single,.slide-sequence')[${n}].dataset.state!=='loading'`, 'ready section '+n);
    await wait(200);
  };
  await w.loadURL(process.env.SECTION_PLAYER_URL || 'http://127.0.0.1:8766/');
  await until(`document.querySelectorAll('.slide-single,.slide-sequence').length>=3`, 'players');
  await scroll(0); await wait(500);
  let s=await state(); assert.equal(s[0].paused,false); assert.equal(s.filter(p=>p.running).length,1);
  assert.ok(s.slice(1).every(p=>!p.running && p.paused!==false));
  console.log('Goal plays; all lower sections start paused.');
  await scroll(1); await wait(700);
  let before=await state(); assert.equal(before[0].paused,true); assert.equal(before[1].paused,false);
  await wait(700); s=await state(); assert.equal(s[0].time,before[0].time); assert.ok(s[1].elapsed>before[1].elapsed+500);
  await scroll(0); before=await state(); await wait(800); s=await state();
  assert.equal(s[1].time,before[1].time); assert.equal(s[1].elapsed,before[1].elapsed);
  assert.ok(s[1].videos.every((v,i)=>v.paused&&Math.abs(v.time-before[1].videos[i].time)<.12));
  await scroll(1); s=await state(); assert.equal(s[1].index,before[1].index); assert.ok(s[1].elapsed>=before[1].elapsed);
  console.log('Scroll pauses/resumes native clocks, videos and slide timers without restarting.');
  // Check an animation and pending native timer inside the actual controlled iframe.
  await js(`(()=>{const c=document.querySelector('.slide-sequence iframe').contentWindow;
    c.__visibilityTimer=false;c.setTimeout(()=>c.__visibilityTimer=true,1600);
    c.__visibilityAnimation=c.document.body.animate([{opacity:1},{opacity:.99}],{duration:10000});return true})()`);
  await scroll(0); await wait(100); const animationTime=await js(`document.querySelector('.slide-sequence iframe').contentWindow.__visibilityAnimation.currentTime`);
  await wait(1700);
  assert.equal(await js(`document.querySelector('.slide-sequence iframe').contentWindow.__visibilityTimer`),false);
  assert.ok(Math.abs((await js(`document.querySelector('.slide-sequence iframe').contentWindow.__visibilityAnimation.currentTime`))-animationTime)<20);
  await scroll(1); await wait(1700);
  assert.equal(await js(`document.querySelector('.slide-sequence iframe').contentWindow.__visibilityTimer`),true);
  await js(`document.querySelector('.slide-sequence iframe').contentWindow.__visibilityAnimation.cancel();document.querySelector('.sequence-toggle').click();true`);
  await scroll(0); await scroll(1); s=await state(); assert.equal(s[1].userPlaying,'false'); assert.equal(s[1].paused,true);
  await js(`document.querySelector('.sequence-toggle').click();true`); await wait(200);
  assert.equal((await state())[1].paused,false);
  console.log('Pending animations freeze; manual pause survives scrolling.');
  // Electron in this environment does not emit visibilitychange on hide.
  // Exercise the browser handler with explicit hidden/visible events.
  await js(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));true`);
  await wait(200);
  before=await state(); assert.ok(before.every(p=>!p.running&&p.paused!==false));
  await wait(700); s=await state(); assert.equal(s[1].elapsed,before[1].elapsed);
  await js(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));true`); await wait(250);
  assert.equal((await state())[1].paused,false);
  console.log('Simulated hidden/visible browser events pause/resume playback.');
  // Mobile fits multiple players: at most one may run, including a middle scroll position.
  w.setContentSize(390,844); await wait(300); await scroll(0);
  for(let i=0;i<4;i++){
    await js(`scrollBy({top:70,behavior:'instant'});true`);await wait(180);
    assert.ok((await state()).filter(p=>p.running).length<=1);
  }
  assert.equal(await js('document.documentElement.scrollWidth>innerWidth'),false);
  await scroll(1);
  // Rapid selection while manually paused must stay paused.
  await js(`document.querySelector('.sequence-toggle').click();document.querySelectorAll('.sequence-segment')[1].click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='paused'`, 'selected paused slide');
  assert.equal((await state())[1].paused,true);
  await js(`document.querySelector('.sequence-restart').click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='playing'`, 'restart');
  assert.equal((await state())[1].index,0);
  // BFCache-style lifecycle: teardown and reinitialization retain manual intent.
  await js(`document.querySelector('.sequence-toggle').click();dispatchEvent(new PageTransitionEvent('pagehide'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));true`);
  await wait(300); s=await state(); assert.equal(s[1].paused,true);assert.equal(s[1].userPlaying,'false');
  await js(`document.querySelector('.sequence-toggle').click();true`);await wait(300);assert.equal((await state())[1].paused,false);
  // Every other destination becomes the sole eligible player.
  for(let i=2;i<s.length;i++){await scroll(i);assert.equal((await state()).filter(p=>p.running).length,1);}
  console.log('Mobile, every section, selection/restart, and reinitialization passed.');
  // Shorten durations only in this test DOM to check automatic completion.
  await scroll(1); await js(`document.querySelector('.sequence-restart').click();true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='playing'`, 'completion setup');
  await js(`dispatchEvent(new PageTransitionEvent('pagehide'));
    const r=document.querySelector('.slide-sequence');
    r.dataset.slides=JSON.stringify(JSON.parse(r.dataset.slides).map(s=>({...s,duration:.4})));
    r.dataset.elapsed='0';dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));true`);
  await until(`document.querySelector('.slide-sequence').dataset.state==='ended'`, 'automatic advance and completion');
  const ended=await state(); assert.equal(ended[1].index,1);assert.equal(ended[1].paused,true);
  await scroll(0); await scroll(1); assert.equal((await state())[1].state,'ended');
  console.log('Automatic advance works; completed sections stay completed on return.');
  w.destroy();app.exit(0);
}).catch(error=>{console.error(error);app.exit(1)});
setTimeout(()=>{console.error('Browser checks timed out');app.exit(2)},65000);
