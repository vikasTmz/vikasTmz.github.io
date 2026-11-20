import test from 'node:test';
import assert from 'node:assert/strict';
import { describeSections, renderNavigation, renderSlides } from '../js/section-content.js';
const a = { key: 'intro', title: '', slide: 3, summary: 'Introduction' };
const b = { key: 'method', title: 'Method', slide: 2 };
test('IDs survive reordering, label edits and slide renumbering', () => {
  const first = describeSections({ sections: [a, b] });
  const moved = describeSections({ sections: [b, { ...a, slide: 8, summary: 'New summary' }] });
  assert.deepEqual(first.map(s => s.id), ['intro', 'method']);
  assert.deepEqual(moved.map(s => s.id), ['method', 'intro']);
});
test('navigation and slides share visibility/order, and include existing static sections', () => {
  const sections = describeSections({ sections: [a, { ...b, hidden: true }, { ...b, disabled: true }] }, [{ id: 'bibtex', label: 'BibTeX', static: true }]);
  assert.deepEqual(sections.map(s => s.id), ['intro', 'bibtex']);
  assert.match(renderNavigation(sections), /href="#bibtex"/);
  assert.doesNotMatch(renderSlides(sections), /id="bibtex"/);
  assert.match(renderSlides(sections), /aria-label="Introduction" tabindex="-1"/);
});
test('labels/notes/IDs are escaped, with explicit nav label taking priority', () => {
  const sections = describeSections({ sections: [{ ...a, id: 'custom"id', navLabel: '<img src=x onerror=alert(1)>', notes: '<script>alert(1)</script>' }] });
  assert.equal(sections[0].label, '<img src=x onerror=alert(1)>');
  assert.doesNotMatch(renderNavigation(sections), /<img/);
  assert.match(renderSlides(sections), /id="custom&quot;id"/);
  assert.match(renderSlides(sections), /&lt;script&gt;/);
});
test('ambiguous duplicate IDs fail rather than silently renumbering', () => {
  assert.throws(() => describeSections({ sections: [a, a] }), /Duplicate/);
  assert.equal(renderNavigation([]), '');
});
test('long labels and large section lists get a no-JavaScript flow fallback', () => {
  const long = describeSections({ sections: [{ ...a, navLabel: 'A long section label that needs enough room to stay completely readable on small screens' }] });
  assert.match(renderNavigation(long), /pnav-long/);
  const many = describeSections({ sections: Array.from({ length: 11 }, (_, i) => ({ ...a, key: `topic-${i}` })) });
  assert.match(renderNavigation(many), /pnav-long/);
});

test('a sequence is one section with ordered slides and individual durations', () => {
  const sections = describeSections({ sections: [{ key: 'models', title: '', slides: [
    { slide: 3, duration: 12 }, { slide: 10, duration: 18 }
  ] }] });
  assert.deepEqual(sections[0].slides, [{ slide: 3, duration: 12 }, { slide: 10, duration: 18 }]);
  const markup = renderSlides(sections);
  assert.equal((markup.match(/<section /g) || []).length, 1);
  assert.equal((markup.match(/class="sequence-segment"/g) || []).length, 2);
  assert.match(markup, /slide-3.html\?controlled=1/);
  assert.match(markup, /Slide 10 · 18s/);
});
test('invalid or ambiguous sequences cannot reach the exporter or player', () => {
  for (const slides of [[], null, [{ slide: 3, duration: 0 }], [{ slide: 3, duration: -1 }],
    [{ slide: 3, duration: '12' }], [{ slide: 3, duration: Infinity }], [{ slide: 0, duration: 12 }]]) {
    assert.throws(() => describeSections({ sections: [{ title: '', slides }] }));
  }
  assert.throws(() => describeSections({ sections: [{ ...a, slides: [{ slide: 3, duration: 12 }] }] }));
});
test('single slides share visibility control without a timer or playback bar', () => {
  const markup = renderSlides(describeSections({ sections: [a] }));
  assert.match(markup, /class="slide-single"/);
  assert.match(markup, /src="slides\/slide-3.html\?controlled=1"/);
  assert.doesNotMatch(markup, /sequence-controls/);
  assert.match(markup, /<noscript>.*href="slides\/slide-3.html"/);
});
test('notes preserve JSON line breaks and paragraphs, with raw HTML escaped', () => {
  const markup = renderSlides(describeSections({ sections: [{ ...a,
    notes: 'First line.\nSecond line.\n\nNext paragraph.\r\n<script>text</script>'
  }] }));
  assert.match(markup, /<p>First line\.<br>Second line\.<\/p>\s*<p>Next paragraph\.<\/p>\s*&lt;script&gt;text&lt;\/script&gt;/);
  assert.match(markup, /<details class="slide-explanation" open>/);
});

test('JSON notes render Markdown inside the same collapsible section', () => {
  const markup = renderSlides(describeSections({ sections: [{ ...a,
    notes: '**Bold**, *italic*, and `code`.\n\n- First\n- Second\n\n[Paper](paper.pdf) and [section](#method).'
  }] }));
  assert.match(markup, /<strong>Bold<\/strong>, <em>italic<\/em>, and <code>code<\/code>/);
  assert.match(markup, /<ul>\s*<li>First<\/li>\s*<li>Second<\/li>/);
  assert.match(markup, /href="paper.pdf"/);
  assert.match(markup, /href="#method"/);
  assert.ok(markup.indexOf('<strong>') > markup.indexOf('</summary>'));
  assert.ok(markup.indexOf('<strong>') < markup.indexOf('</details>'));
});

test('summaries collapse slide content with omitted, empty or whitespace-only notes', () => {
  for (const notes of [undefined, '', ' \n ']) {
    const markup = renderSlides(describeSections({ sections: [{ ...a, notes }] }));
    assert.match(markup, /<details class="slide-explanation" open><summary>/);
    assert.ok(markup.indexOf('<iframe') < markup.indexOf('</details>'));
    assert.doesNotMatch(markup, /explanation-notes|slide-takeaway/);
  }
});

test('Markdown and slides share the summary disclosure without requiring notes', () => {
  const markup = renderSlides(describeSections({ sections: [{ ...a,
    markdown: 'content/example.md', markdownHtml: '<p>Article content</p>'
  }] }));
  const end = markup.indexOf('</details>');
  assert.ok(markup.indexOf('<p>Article content</p>') < end);
  assert.ok(markup.indexOf('<iframe') < end);
});
