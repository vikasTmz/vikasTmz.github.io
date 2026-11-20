// Run with DeckWerk's Electron while serving dist/. Uses real exports and delays one image.
const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict');
const fs=require('node:fs');
app.disableHardwareAcceleration();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
  const url=process.env.TEMPLATE_URL||'http://127.0.0.1:8767/';
  const w=new BrowserWindow({show:false,width:1440,height:600,webPreferences:{offscreen:true,backgroundThrottling:false,partition:'deferred-'+Date.now()}});
  const js=s=>w.webContents.executeJavaScript(s),requests=[];let held=null,delayImage=true,failImage=false;
  w.webContents.session.webRequest.onBeforeRequest({urls:[new URL('*',url).href]},(details,callback)=>{
    requests.push(details.url);
    if(details.url.endsWith('target-parameters-lossless.webp')){
      if(failImage){failImage=false;callback({cancel:true});return;}
      if(delayImage){delayImage=false;held=callback;return;}
    }
    callback({});
  });
  const until=async expression=>{for(let i=0;i<150;i++){if(await js(expression))return;await wait(100);}throw Error('Timeout: '+expression+'\n'+await js(`JSON.stringify([...document.querySelectorAll('.slide-sequence,.slide-single')].map(p=>({state:p.dataset.state,active:p.dataset.active,src:p.querySelector('iframe').getAttribute('src')})))`));};
  const p=`document.querySelector('#intro .slide-sequence')`,stage=`${p}.querySelector('.slide-stage')`;
  await w.loadURL(url);await wait(600);
  assert.equal(await js(`document.querySelectorAll('iframe[src]').length`),0,'No frames loaded while reading text above the slides');
  assert.equal(requests.some(u=>/\/slides\/(slide-\d+\.html|player\.(css|js)|assets\/)/.test(u)),false,'No heavy slide requests before visibility');
  const height=await js(`${stage}.getBoundingClientRect().height`);
  await js(`${stage}.scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`${p}.dataset.state==='loading'`);
  for(let i=0;i<100&&!held;i++)await wait(100);assert.ok(held,'Image request intercepted');
  await until(`!!${p}.querySelector('iframe').contentWindow.embedClock`);
  assert.equal(await js(`${p}.querySelector('[data-slide-status]').hidden`),false);
  assert.equal(await js(`${stage}.getAttribute('aria-busy')`),'true');
  assert.equal(await js(`${p}.querySelector('iframe').contentWindow.embedClock.paused`),true);
  await wait(400);assert.equal(await js(`+${p}.dataset.elapsed`),0,'Loading never consumes section time');
  assert.equal(await js(`${stage}.getBoundingClientRect().height`),height,'No layout shift');
  assert.equal(await js(`document.querySelectorAll('iframe[src]').length`),1,'Only active frame starts loading');
  fs.writeFileSync('/private/tmp/msd-loading-state.png',(await w.webContents.capturePage()).resize({width:1000}).toPNG());
  await js(`scrollTo({top:0,behavior:'instant'});true`);await until(`${p}.dataset.active==='false'`);
  held({});held=null;
  await until(`${p}.dataset.state==='suspended'`);
  assert.equal(await js(`+${p}.dataset.elapsed`),0,'Finishing offscreen does not start playback');
  const loads=()=>requests.filter(u=>/\/slides\/slide-2\.html/.test(u)).length;
  const before=loads();await js(`${stage}.scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`${p}.dataset.running==='true'`);await wait(300);
  assert.equal(await js(`${p}.querySelector('[data-slide-status]').hidden`),true);
  await js(`${p}.querySelector('.sequence-toggle').click();true`);await until(`${p}.dataset.state==='paused'`);
  const elapsed=await js(`+${p}.dataset.elapsed`);
  await js(`scrollTo({top:0,behavior:'instant'});true`);await wait(150);
  await js(`${stage}.scrollIntoView({block:'center',behavior:'instant'});true`);await wait(250);
  assert.equal(await js(`${p}.dataset.state`),'paused');assert.equal(await js(`+${p}.dataset.elapsed`),elapsed);assert.equal(loads(),before,'Scroll-back reuses the frame');
  // Simulated bfcache lifecycle must reconnect, not reload the retained iframe.
  await js(`dispatchEvent(new Event('pagehide'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));true`);
  await until(`${p}.dataset.state==='paused'`);await wait(200);
  assert.equal(loads(),before,'Restoring the page preserves the loaded frame');
  assert.equal(await js(`+${p}.dataset.elapsed`),elapsed);
  // A genuine network failure surfaces Retry; retry reloads the same slide.
  await w.webContents.session.clearCache();failImage=true;
  await js(`${p}.querySelector('.sequence-restart').click();true`);await until(`${p}.dataset.state==='error'`);
  assert.equal(await js(`${p}.querySelector('[data-slide-retry]').hidden`),false);
  await js(`${p}.querySelector('[data-slide-retry]').click();true`);await until(`${p}.dataset.running==='true'`);
  // Isolated fixtures exercise sequence advancement and untimed video loading.
  await js(`dispatchEvent(new Event('pagehide'));true`);
  await js(`(async()=>{const {describeSections,renderSlides}=await import('./js/section-content.js');const {initSectionPlayers}=await import('./js/section-player.js');const c=document.querySelector('#slide-sections');c.innerHTML=renderSlides(describeSections({sections:[{key:'short',title:'',summary:'Sequence',slides:[{slide:2,duration:.4},{slide:3,duration:.4}]},{key:'video',title:'',summary:'Video',slide:5}]}));window.destroyFixture=initSectionPlayers(c);document.querySelector('#short .slide-stage').scrollIntoView({block:'center',behavior:'instant'});})()`);
  await until(`document.querySelector('#short .slide-sequence').dataset.state==='ended'`);
  assert.equal(await js(`document.querySelector('#short .slide-sequence').dataset.slideIndex`),'1');
  await js(`document.querySelector('#short .sequence-restart').click();true`);
  await until(`document.querySelector('#short .slide-sequence').dataset.slideIndex==='0'`);
  await js(`document.querySelector('#video .slide-stage').scrollIntoView({block:'center',behavior:'instant'});true`);
  await until(`document.querySelector('#video .slide-single').dataset.running==='true'`);
  assert.ok(await js(`document.querySelector('#video iframe').contentDocument.querySelector('video').readyState>=3`));
  assert.equal(await js(`document.querySelector('#video').querySelector('.sequence-controls')`),null);
  await until(`document.querySelector('#video iframe').contentDocument.querySelector('video').currentTime>0`);
  // Simulated hidden-tab event: the controller must pause all clocks.
  await js(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));true`);
  assert.equal(await js(`document.querySelectorAll('[data-running="true"]').length`),0);
  await js(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));true`);
  await until(`document.querySelector('#video .slide-single').dataset.running==='true'`);
  w.setContentSize(390,800);await wait(250);
  await js(`document.querySelector('#video .slide-stage').scrollIntoView({block:'center',behavior:'instant'});true`);await wait(200);
  assert.equal(await js('document.documentElement.scrollWidth>innerWidth'),false);
  assert.ok(await js(`document.querySelectorAll('[data-running="true"]').length<=1`));
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await js(`getComputedStyle(document.querySelector('.slide-spinner')).animationName`),'none');
  w.webContents.debugger.detach();await js('window.destroyFixture();true');w.destroy();
  console.log('PASS: no offscreen downloads; delayed-image loading state; frozen clocks; offscreen completion; scroll reuse; manual pause; failure/retry; advance/replay; video; mobile; reduced motion; simulated hidden-tab pause.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
