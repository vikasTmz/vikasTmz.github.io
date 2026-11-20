#!/usr/bin/env node
// Local static preview with byte ranges for DeckWerk's trimmed videos.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', process.env.SITE_ROOT || '.');
const port = Number(process.env.PORT || 8765);
const types = { '.md':'text/markdown; charset=utf-8', '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.ico':'image/x-icon', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.mp4':'video/mp4', '.webm':'video/webm', '.woff2':'font/woff2', '.ttf':'font/ttf' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    if (!['/index.html', '/slide-sections.json', '/favicon.ico', '/favicon.svg'].includes(path) && !/^\/(css|logos|js|slides|content)\//.test(path)) { res.writeHead(404).end(); return; }
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    const info = await stat(file); if (!info.isFile()) throw Error('Not a file');
    const size = info.size; let start = 0, end = size - 1, code = 200;
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m || (!m[1] && !m[2])) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      end = m[1] && m[2] ? Math.min(size - 1, Number(m[2])) : size - 1;
      if (start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      code = 206;
    }
    res.writeHead(code, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-store', 'Content-Length':end-start+1, ...(code===206 ? { 'Content-Range':`bytes ${start}-${end}/${size}` } : {}) });
    if (req.method === 'HEAD') res.end(); else createReadStream(file, { start, end }).pipe(res);
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/`));
