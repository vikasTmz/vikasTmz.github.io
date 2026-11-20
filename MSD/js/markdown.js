import { Marked, Renderer } from './vendor/marked.js';
import katex from './vendor/katex.js';

const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Only this explicitly public directory is readable through section configuration.
export function validateMarkdownPath(path) {
  if (typeof path !== 'string' || !/^content\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.md$/.test(path)) {
    throw Error('markdown must name a .md file inside content/ (letters, numbers, hyphens and underscores).');
  }
  return path;
}

function mathExtension(name, level, pattern, start) {
  return {
    name, level,
    start: source => source.search(start),
    tokenizer(source) {
      const match = pattern.exec(source);
      if (match) return { type: name, raw: match[0], text: match[1] ?? match[2], display: level === 'block' };
    },
    renderer(token) {
      const html = katex.renderToString(token.text.trim(), {
        displayMode: token.display, throwOnError: true, trust: false,
        strict: 'ignore', maxExpand: 1000, maxSize: 20
      });
      return token.display ? `<div class="markdown-equation" tabindex="0" role="region" aria-label="Equation">${html}</div>\n` : html;
    }
  };
}

const extensions = [
  mathExtension('displayMath', 'block', /^ {0,3}(?:\$\$([^]+?)\$\$|\\\[([^]+?)\\\])[ \t]*(?:\n|$)/, /(?:\$\$|\\\[)/),
  mathExtension('inlineMath', 'inline', /^(?:\$(?!\$)([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d)|\\\(([^\n]+?)\\\))/, /(?:\$|\\\()/)
];

// Resolve links/images relative to their Markdown file, including when hosted
// below /MSD/. Raw HTML is escaped, and executable URL schemes are rejected.
function contentUrl(value, source, image = false) {
  const href = value.trim();
  if (/[\u0000-\u0020\\]|&(?:#\w+|\w+);/.test(href)) return null;
  if (href.startsWith('#')) return image ? null : href;
  const base = new URL(source, 'https://markdown.invalid/');
  let url;
  try { url = new URL(href, base); } catch { return null; }
  if (!['https:', 'http:', ...(image ? [] : ['mailto:'])].includes(url.protocol)) return null;
  if (url.origin !== base.origin) return url.href;
  if (href.startsWith('/')) return `${url.pathname}${url.search}${url.hash}`;
  return `${url.pathname.slice(1)}${url.search}${url.hash}`;
}

export function renderMarkdown(source, path) {
  validateMarkdownPath(path);
  return parseMarkdown(source, path);
}

// JSON notes live beside index.html, so their relative links use the site root.
// Preserve explicit single newlines as line breaks, as plain-text notes did.
export function renderNotes(source) {
  return parseMarkdown(source, 'slide-sections.json', true);
}

function parseMarkdown(source, path, breaks = false) {
  const parser = new Marked({ gfm: true, breaks, extensions, renderer: {
    // Marked recognizes comments before parsing their contents, so Markdown,
    // tables and LaTeX inside a comment stay inactive. Code tokens stay literal.
    html({ text }) { return escape(text.replace(/<!--[\s\S]*?-->/g, '')); },
    heading({ tokens, depth }) {
      const level = Math.min(depth + 1, 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const url = contentUrl(href, path);
      return url ? `<a href="${escape(url)}"${title ? ` title="${escape(title)}"` : ''}>${text}</a>` : text;
    },
    image({ href, title, text }) {
      const url = contentUrl(href, path, true);
      return url ? `<img src="${escape(url)}" alt="${escape(text)}"${title ? ` title="${escape(title)}"` : ''} loading="lazy">` : escape(text);
    },
    table(token) {
      return `<div class="markdown-table" tabindex="0" role="region" aria-label="Table">${Renderer.prototype.table.call(this, token)}</div>\n`;
    }
  } });
  try { return parser.parse(source); }
  catch (error) { throw Error(`${path}: ${error.message}`); }
}

export async function loadMarkdownSections(sections, readText) {
  const files = new Map();
  return Promise.all(sections.map(async section => {
    if (!section.markdown || section.static) return section;
    if (!files.has(section.markdown)) files.set(section.markdown, Promise.resolve().then(() => readText(section.markdown)));
    return { ...section, markdownHtml: renderMarkdown(await files.get(section.markdown), section.markdown) };
  }));
}
