const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Events {
  constructor() { this.events = new Map(); }
  addEventListener(name, callback) {
    if (!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.events.get(name)?.delete(callback); }
  emit(name) { [...(this.events.get(name) || [])].forEach(callback => callback()); }
}
class Video extends Events {
  constructor(duration, cropped = false) {
    super();
    Object.assign(this, { duration, readyState: 4, seeking: false, paused: true, playbackRate: 1, time: 0, dataset: cropped ? {} : { syncGroup: 'example' } });
    this.box = cropped ? { dataset: { syncGroup: 'example' } } : null;
  }
  closest() { return this.box; }
  get currentTime() { return this.time; }
  set currentTime(value) { this.time = value; this.seeking = true; }
  finishSeek() { this.seeking = false; this.readyState = 4; this.emit('seeked'); }
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}
const flush = () => new Promise(resolve => setImmediate(resolve));
function load(videos, syncAll) {
  const slide = { dataset: { canvas: '1920x1080', syncVideos: String(syncAll) }, style: {}, querySelectorAll: () => [] };
  const document = Object.assign(new Events(), { hidden: false, documentElement: {}, querySelector: () => slide, querySelectorAll: () => videos });
  const reduced = Object.assign(new Events(), { matches: false });
  const context = { document, innerWidth: 960, innerHeight: 540, window: new Events(), matchMedia: () => reduced, ResizeObserver: class { observe() {} }, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../slides/embed.js'), 'utf8'), context);
  return { document, reduced };
}

test('whole-slide sync waits for every clip and normalizes 4s to a 6s cycle', async () => {
  const videos = [new Video(6), new Video(4), new Video(6, true), new Video(6, true)];
  videos[3].readyState = 2;
  const { document, reduced } = load(videos, true);
  await flush();
  assert(videos.every(video => video.paused), 'No clip may start before the slowest loads');
  videos[3].readyState = 4;
  videos[3].emit('canplay');
  await flush();
  assert(videos.every(video => !video.paused));
  assert.deepEqual(videos.map(video => video.playbackRate), [1, 2 / 3, 1, 1]);
  assert(videos.every(video => video.duration / video.playbackRate === 6));

  videos[0].time = 3;
  videos[0].emit('timeupdate');
  assert.deepEqual(videos.map(video => video.currentTime), [3, 2, 3, 3]);
  videos.forEach(video => video.finishSeek());

  videos[2].readyState = 2;
  videos[2].emit('waiting');
  assert(videos.every(video => video.paused), 'Buffering pauses the whole group');
  videos[2].readyState = 4;
  videos[2].emit('canplay');
  assert(videos.every(video => !video.paused));

  videos.forEach(video => { video.time = video.duration; video.readyState = 2; });
  videos[0].emit('ended');
  assert(videos.every(video => video.paused && video.currentTime === 0));
  videos.forEach(video => video.finishSeek());
  await flush();
  assert(videos.every(video => !video.paused), 'The group restarts after every rewind completes');

  document.hidden = true; document.emit('visibilitychange');
  assert(videos.every(video => video.paused));
  document.hidden = false; document.emit('visibilitychange');
  assert(videos.every(video => !video.paused));
  reduced.matches = true; reduced.emit('change');
  assert(videos.every(video => video.paused && video.controls));
});

test('existing native and cropped sync groups retain normal playback rates', async () => {
  const videos = [new Video(6), new Video(6, true)];
  load(videos, false);
  await flush();
  assert.equal(videos[1].dataset.syncGroup, 'example');
  assert(videos.every(video => !video.paused && video.playbackRate === 1));
});
