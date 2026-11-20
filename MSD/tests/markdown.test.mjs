import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describeSections, renderSlides, renderNavigation } from '../js/section-content.js';
import { renderMarkdown, loadMarkdownSections } from '../js/markdown.js';

const path = 'content/example.md';
const section = { title: '', key: 'article', navLabel: 'An article', markdown: path };

test('Markdown-only sections share navigation and have no frame or playback UI', async () => {
  const sections = await loadMarkdownSections(describeSections({ sections: [section] }), async () => '# Hello\n\nText.');
  assert.deepEqual(sections[0].slides, []);
  assert.match(renderNavigation(sections), /href="#article"/);
  const html = renderSlides(sections);
  assert.match(html, /<h2>Hello<\/h2>/);
  assert.match(html, /data-markdown="content\/example.md"/);
  assert.doesNotMatch(html, /iframe|sequence-controls|data-slides/);
});

test('Markdown can also introduce a single slide or a timed sequence', async () => {
  for (const selection of [{ slide: 2 }, { slides: [{ slide: 2, duration: 5 }] }]) {
    const sections = await loadMarkdownSections(describeSections({ sections: [{ ...section, ...selection }] }), async () => '**Introduction**');
    const html = renderSlides(sections);
    assert.match(html, /<strong>Introduction<\/strong>/);
    assert.match(html, /slide-2.html\?controlled=1/);
    assert.ok(html.indexOf('<strong>') < html.indexOf('<iframe'));
  }
});

test('GFM tables, nested lists, links, fenced code and math render together', () => {
  const html = renderMarkdown(String.raw`# Article

Text with **emphasis** and $x_1^2$ and \(\alpha < \beta\).

$$
\begin{aligned}a&=b+c\\d&=e\end{aligned}
$$

\[x+y\]

| Name | Value |
| --- | ---: |
| Curve | $g(\vartheta)$ |

- First
  - Nested

[Figure](figures/example.svg)

[Home](/about) [Section](#article)

![Example](figures/example.svg)

${'`$literal$`'}

~~~tex
$not_math$
~~~
`, path);
  assert.match(html, /<h2>Article<\/h2>/);
  assert.match(html, /<table>/);
  assert.match(html, /<ul>\n<li>Nested/);
  assert.match(html, /class="katex"/);
  assert.equal((html.match(/class="markdown-equation"/g) || []).length, 2);
  assert.match(html, /href="content\/figures\/example.svg"/);
  assert.match(html, /src="content\/figures\/example.svg"/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="#article"/);
  assert.match(html, /<code>\$literal\$<\/code>/);
  assert.match(html, /<code class="language-tex">\$not_math\$/);
  assert.doesNotMatch(html, /katex-error/);
});

test('HTML and executable URLs cannot inject active content', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert%281%29) ![x](data:text/html,bad) [x](&#106;avascript:bad)', path);
  assert.doesNotMatch(html, /<script|<img|href=/);
  assert.match(html, /&lt;script&gt;/);
  const math = renderMarkdown(String.raw`$\href{javascript:alert(1)}{x}$`, path);
  assert.doesNotMatch(math, /href="javascript:/);
});

test('invalid configuration, unreadable files and malformed equations fail clearly', async () => {
  for (const markdown of ['', null, 6, '../notes.md', 'content/../notes.md', '/content/a.md', 'https://example.org/a.md', 'content/a.html']) {
    assert.throws(() => describeSections({ sections: [{ ...section, markdown }] }), /markdown/);
  }
  const sections = describeSections({ sections: [section] });
  assert.throws(() => renderSlides(sections), /Load Markdown/);
  await assert.rejects(loadMarkdownSections(sections, async () => { throw Error('Missing file'); }), /Missing file/);
  assert.throws(() => renderMarkdown('$\\unknowncommand$', path), /content\/example.md/);
});

test('file loads are deduplicated per refresh, but file edits are not cached across refreshes', async () => {
  const sections = describeSections({ sections: [section, { ...section, key: 'other' }, { ...section, key: 'hidden', hidden: true }] });
  let reads = 0;
  const read = async () => { reads++; return `Revision ${reads}`; };
  const first = await loadMarkdownSections(sections, read);
  assert.equal(reads, 1);
  assert.equal(first[0].markdownHtml, first[1].markdownHtml);
  const next = await loadMarkdownSections(sections, read);
  assert.equal(reads, 2);
  assert.match(next[0].markdownHtml, /Revision 2/);
});

test('comments hide multiline Markdown and math while code examples stay literal', () => {
  const html = renderMarkdown('Before <!-- inline hidden --> after.\n\n<!--\n## Hidden heading\n\n| Step | Operation |\n| --- | --- |\n| Render | $g(\\vartheta)$ |\n\n$\\unknowncommand$\n-->\n\nVisible ending.\n\n`<!-- code example -->`\n\n~~~md\n<!-- fenced example -->\n~~~', path);
  assert.match(html, /Before  after\./);
  assert.match(html, /Visible ending\./);
  assert.doesNotMatch(html, /inline hidden|Hidden heading|<table>|unknowncommand/);
  assert.match(html, /&lt;!-- code example --&gt;/);
  assert.match(html, /&lt;!-- fenced example --&gt;/);
});

test('actual section renders the derivation and hides the commented algorithm', async () => {
  const source = await readFile(new URL('../content/sds-limitations.md', import.meta.url), 'utf8');
  const html = renderMarkdown(source, 'content/sds-limitations.md');
  assert.equal((html.match(/class="markdown-equation"/g) || []).length, 6);
  assert.doesNotMatch(html, /<table>|Distillation via SDS|For each optimization iteration/);
  assert.match(html, /Despite its impressive results/);
  assert.match(html, /<blockquote>/);
  assert.doesNotMatch(html, /katex-error/);
});
