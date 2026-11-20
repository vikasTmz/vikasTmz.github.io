import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseVisiblePlayer } from '../js/section-visibility.js';
const viewport = { width: 1440, height: 900 };
const rect = (top, height = 600) => ({ top, bottom: top + height, left: 200, right: 1240, width: 1040, height });
test('only the most visible player wins, scrolling in either direction', () => {
  assert.equal(chooseVisiblePlayer([rect(100), rect(800)], viewport), 0);
  assert.equal(chooseVisiblePlayer([rect(-450), rect(250)], viewport, 0), 1);
  assert.equal(chooseVisiblePlayer([rect(100), rect(800)], viewport, 1), 0);
});
test('headers, footers and almost invisible slides leave everything paused', () => {
  assert.equal(chooseVisiblePlayer([rect(950), rect(1600)], viewport), -1);
  assert.equal(chooseVisiblePlayer([rect(-590), rect(890)], viewport), -1);
  assert.equal(chooseVisiblePlayer([], viewport), -1);
});
test('a near tie keeps the current section without rapid switching', () => {
  assert.equal(chooseVisiblePlayer([rect(-160), rect(450)], viewport, 0), 0);
  assert.equal(chooseVisiblePlayer([rect(-160), rect(450)], viewport, 1), 1);
});
test('tall slides remain eligible on short screens; zero-sized slides never win', () => {
  assert.equal(chooseVisiblePlayer([rect(-500, 2000)], { width: 1440, height: 300 }), 0);
  assert.equal(chooseVisiblePlayer([rect(0, 0)], viewport), -1);
});
test('mobile visibility accounts for horizontal clipping too', () => {
  assert.equal(chooseVisiblePlayer([
    { top: 50, bottom: 250, left: 16, right: 374, width: 358, height: 200 },
    { top: 50, bottom: 250, left: 400, right: 758, width: 358, height: 200 }
  ], { width: 390, height: 844 }), 0);
});
test('when both slides fully fit, scrolling toward either center transfers playback', () => {
  const mobile = { width: 390, height: 844 };
  assert.equal(chooseVisiblePlayer([rect(300, 200), rect(580, 200)], mobile, 1), 0);
  assert.equal(chooseVisiblePlayer([rect(20, 200), rect(300, 200)], mobile, 0), 1);
});
