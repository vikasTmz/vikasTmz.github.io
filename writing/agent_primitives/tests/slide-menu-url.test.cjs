const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(href, keys = ['geometry-slide'], denyHistory = false) {
  const events = {}, pushes = [], navigations = [];
  const menus = keys.map((key, index) => {
    const frame = { loads: [], hidden: true, style: { setProperty(name, value) { this[name] = value; } }, set src(value) { this.loads.push(value); } };
    const buttons = ['t-rex', 'lion', 'hatchback'].map((id, i) => ({
      attrs: { 'aria-controls': `frame-${index}`, 'aria-pressed': String(i === 0) },
      dataset: { slideId: id, slideSrc: `${key}-${id}.html`, slideTitle: id, slideRatio: '16/9' },
      events: {},
      getAttribute(name) { return this.attrs[name]; },
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, callback) { this.events[name] = callback; },
      focus() { this.focused = true; }
    }));
    return { frame, buttons, dataset: { slideMenuKey: key }, hidden: true, querySelectorAll: () => buttons };
  });
  const location = { href, assign(value) { navigations.push(value); this.href = value; } };
  const history = { state: { preserved: true }, pushState(state, _, value) {
    if (denyHistory) throw new Error('History unavailable');
    pushes.push({ state, href: value }); location.href = value;
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/slide-menu.js'), 'utf8'), {
    URL,
    document: { querySelectorAll: () => menus, getElementById: id => menus[Number(id.split('-')[1])].frame },
    window: { location, history, addEventListener(name, callback) { events[name] = callback; } }
  });
  return { menus, events, location, pushes, navigations };
}

test('a direct URL loads only its selected slide and preserves anchors and query parameters', () => {
  const env = setup('https://example.org/blog/?campaign=notes&geometry-slide=lion#introduction');
  const menu = env.menus[0];
  assert.deepEqual(menu.frame.loads, ['geometry-slide-lion.html']);
  assert.equal(menu.buttons[1].attrs['aria-pressed'], 'true');
  assert.equal(menu.frame.hidden, false);
  assert.equal(env.pushes.length, 0);
  menu.buttons[2].events.click();
  const url = new URL(env.location.href);
  assert.equal(url.searchParams.get('geometry-slide'), 'hatchback');
  assert.equal(url.searchParams.get('campaign'), 'notes');
  assert.equal(url.hash, '#introduction');
  assert.deepEqual(env.pushes[0].state, { preserved: true });
  menu.buttons[2].events.click();
  assert.equal(env.pushes.length, 1);
  assert.equal(menu.frame.loads.length, 2);
});

test('history navigation and missing or unknown URL values restore the right selection', () => {
  const env = setup('https://example.org/?geometry-slide=lion');
  env.location.href = 'https://example.org/'; env.events.popstate();
  assert.equal(env.menus[0].frame.loads.at(-1), 'geometry-slide-t-rex.html');
  env.location.href = 'https://example.org/?geometry-slide=hatchback'; env.events.popstate();
  assert.equal(env.menus[0].frame.loads.at(-1), 'geometry-slide-hatchback.html');
  env.location.href = 'https://example.org/?geometry-slide=unknown'; env.events.pageshow();
  assert.equal(env.menus[0].frame.loads.at(-1), 'geometry-slide-t-rex.html');
  assert.equal(env.pushes.length, 0);
});

test('keyboard selection updates the URL and independent menus keep their selections', () => {
  const env = setup('https://example.org/?other=lion', ['geometry-slide', 'other']);
  const event = { key: 'End', preventDefault() { this.prevented = true; } };
  env.menus[0].buttons[0].events.keydown(event);
  assert(event.prevented);
  assert(env.menus[0].buttons[2].focused);
  assert.equal(new URL(env.location.href).searchParams.get('geometry-slide'), 'hatchback');
  assert.equal(new URL(env.location.href).searchParams.get('other'), 'lion');
  assert.deepEqual(env.menus[1].frame.loads, ['other-lion.html']);
});

test('local-file URLs restore selections and have a navigation fallback for restricted history', () => {
  const env = setup('file:///project/index.html?geometry-slide=lion#introduction', ['geometry-slide'], true);
  assert.deepEqual(env.menus[0].frame.loads, ['geometry-slide-lion.html']);
  env.menus[0].buttons[2].events.click();
  assert.equal(env.navigations[0], 'file:///project/index.html?geometry-slide=hatchback#introduction');
});
