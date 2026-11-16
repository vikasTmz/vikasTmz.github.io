// Generated presentation code. Author content in layout.json and sections/*.md.
const fs = require('node:fs');
const path = require('node:path');
const { Marked } = require('../assets/vendor/marked.cjs');
const katex = require('../assets/vendor/katex/katex.cjs');
const root = path.resolve(__dirname, '..');
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const local = (file) => {
  if (typeof file !== 'string' || !file) throw Error('Expected a local file path.');
  const resolved = path.resolve(root, file);
  if (!resolved.startsWith(root + path.sep)) throw Error(`Path must be inside this project: ${file}`);
  if (!fs.existsSync(resolved)) throw Error(`File not found: ${file}`);
  return resolved;
};
try {
  const layout = JSON.parse(fs.readFileSync(path.join(root, 'layout.json'), 'utf8'));
  for (const key of ['title', 'author', 'date']) if (typeof layout[key] !== 'string' || !layout[key].trim()) throw Error(`layout.json needs a ${key}.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(layout.date) || !Number.isFinite(Date.parse(layout.date)) || new Date(layout.date).toISOString().slice(0, 10) !== layout.date) throw Error('Use a valid YYYY-MM-DD date.');
  if (!['system', 'light', 'dark'].includes(layout.theme)) throw Error('theme must be system, light, or dark.');
  if (!Number.isFinite(layout.maxWidth) || layout.maxWidth < 320 || layout.maxWidth > 2400) throw Error('maxWidth must be between 320 and 2400.');
  if (!Array.isArray(layout.sections) || !layout.sections.length) throw Error('Add at least one section.');
  const references = require('./references.cjs')(layout.references, local, escape);
  const ids = new Set(['content', 'references', 'references-title']);
  const navigation = [];
  const sectionIds = layout.sections.map(section => {
    const id = section.id || `section-${path.basename(section.file, path.extname(section.file)).replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id) || /^(reference|citation)-\d/.test(id) || ids.has(id)) throw Error(`Invalid or duplicate section ID: ${id}`);
    ids.add(id);
    return id;
  });
  let firstHeading;
  const markdown = new Marked({ gfm: true });
  const math = (display) => ({
    name: display ? 'displayMath' : 'inlineMath',
    level: display ? 'block' : 'inline',
    start(src) { return src.indexOf(display ? '$$' : '$'); },
    tokenizer(src) {
      const match = display ? /^\$\$[ \t]*\n?([\s\S]+?)\n?\$\$(?:[ \t]*\n|$)/.exec(src) : /^\$(?!\$)([^\n$]+?)\$(?!\$)/.exec(src);
      if (match) return { type: this.name || (display ? 'displayMath' : 'inlineMath'), raw: match[0], text: match[1].trim() };
    },
    renderer(token) {
      const html = katex.renderToString(token.text, { displayMode: display, throwOnError: true, trust: false, output: 'htmlAndMathml' });
      return display ? `<div class="math-display">${html}</div>\n` : html;
    }
  });
  markdown.use({ extensions: [math(true), math(false), references.extension, {
    name: 'embed', level: 'block', start(src) { return src.indexOf('{{embed:'); },
    tokenizer(src) { const m = /^\{\{embed:([\w-]+)\}\}[ \t]*(?:\n|$)/.exec(src); if (m) return { type: 'embed', raw: m[0], key: m[1] }; },
    renderer(token) {
      const embed = layout.embeds?.[token.key];
      if (!embed) throw Error(`Unknown embed: ${token.key}`);
      local(embed.src);
      if (!embed.title) throw Error(`Embed ${token.key} needs an accessible title.`);
      const caption = embed.caption ? `<figcaption>${escape(embed.caption)}</figcaption>` : '';
      let content;
      if (embed.type === 'slide') {
        if (!(embed.width > 0 && embed.height > 0)) throw Error(`Embed ${token.key} needs width and height.`);
        content = `<iframe class="slide-frame" src="${escape(embed.src)}" title="${escape(embed.title)}" style="--ratio:${Number(embed.width)}/${Number(embed.height)}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      } else if (embed.type === 'image') content = `<img src="${escape(embed.src)}" alt="${escape(embed.title)}" loading="lazy">`;
      else if (embed.type === 'video') content = `<video src="${escape(embed.src)}" aria-label="${escape(embed.title)}" controls playsinline preload="metadata"></video>`;
      else throw Error(`Unsupported embed type: ${embed.type}`);
      return `<figure class="media">${content}${caption}</figure>\n`;
    }
  }], renderer: {
    heading({ tokens, depth, text }) {
      if (!firstHeading) firstHeading = text.replace(/<[^>]*>/g, '').replace(/[*_`]/g, '');
      let base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
      if (/^(reference|citation)-\d/.test(base)) base = `heading-${base}`;
      let id = base, n = 2;
      while (ids.has(id)) id = `${base}-${n++}`;
      ids.add(id);
      const level = Math.min(depth + 1, 6);
      return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    image({ href, title, text }) {
      if (!/^(https?:|data:)/i.test(href)) local(decodeURIComponent(href.split(/[?#]/)[0]));
      return `<img src="${escape(href)}" alt="${escape(text)}"${title ? ` title="${escape(title)}"` : ''} loading="lazy">`;
    }
  }});
  const sections = layout.sections.map((section, index) => {
    const source = fs.readFileSync(local(section.file), 'utf8');
    firstHeading = null;
    const content = markdown.parse(source);
    const label = section.navLabel || firstHeading || path.basename(section.file, '.md').replace(/^\d+[Xx]?[-_]?/, '').replace(/[-_]/g, ' ');
    navigation.push({ id: sectionIds[index], label });
    return `<section class="post-section" id="${sectionIds[index]}" aria-label="${escape(label)}" tabindex="-1">\n${content}</section>`;
  }).join('\n');
  const bibliography = references.render();
  if (layout.references) navigation.push({ id: 'references', label: layout.references.title || 'References' });
  const nav = `<nav class="pnav" aria-label="Sections"><span class="pnav-track" aria-hidden="true"><span class="pnav-fill"></span></span>${navigation.map(({ id, label }) => `<a href="#${id}" aria-label="${escape(label)}"><span class="pnav-dot" aria-hidden="true"></span><span class="pnav-label">${escape(label)}</span></a>`).join('')}</nav>`;
  const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(layout.date));
  const html = `<!doctype html>
<!-- Generated by scripts/build.cjs. Edit layout.json and sections/*.md. -->
<html lang="en" data-default-theme="${layout.theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(layout.description || layout.title)}">
<title>${escape(layout.title)}</title>
<script src="assets/theme.js"></script>
<script defer src="assets/navigation.js"></script>
<link rel="stylesheet" href="assets/vendor/katex/katex.min.css">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/navigation.css">
</head>
<body>
<a class="skip-link" href="#content">Skip to content</a>
<div class="page" style="--page-width:${layout.maxWidth}px">
<header class="site-header">
<div class="title-row"><h1>${escape(layout.title)}</h1>
<button class="theme-toggle" type="button" aria-label="Switch theme">
<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/></svg>
<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
</button></div>
<p class="byline"><span>${escape(layout.author)}</span><time datetime="${layout.date}">${date}</time></p>
</header>
${nav}
<main id="content">${sections}${bibliography}</main>
</div>
</body>
</html>\n`;
  // Only replace the landing page after every source validates successfully.
  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log(`Built index.html from ${layout.sections.length} Markdown sections.`);
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
