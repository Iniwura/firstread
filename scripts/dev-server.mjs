#!/usr/bin/env node
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { URL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handlers = {
  events: (await import(pathToFileURL(path.join(root, 'api/events.js')))).default,
  research: (await import(pathToFileURL(path.join(root, 'api/research.js')))).default,
  ai: (await import(pathToFileURL(path.join(root, 'api/ai.js')))).default,
  crosscheck: (await import(pathToFileURL(path.join(root, 'api/crosscheck.js')))).default,
};
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function responseFor(res) {
  return {
    status(code) { res.statusCode = code; return this; },
    json(body) { res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).split('/')[0];
      const body = req.method === 'POST' ? await new Promise((resolve) => { let raw = ''; req.on('data', (chunk) => { raw += chunk; }); req.on('end', () => resolve(raw)); }) : undefined;
      const query = Object.fromEntries(url.searchParams.entries());
      return await handlers[name]({ method: req.method, query, body }, responseFor(res));
    }
    const requested = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.resolve(root, `.${requested}`);
    if (!filePath.startsWith(root)) { res.statusCode = 403; return res.end('forbidden'); }
    const content = await readFile(filePath);
    res.setHeader('content-type', mime[path.extname(filePath)] || 'application/octet-stream');
    res.end(content);
  } catch (error) { res.statusCode = error.code === 'ENOENT' ? 404 : 500; res.end(error.message); }
});
const port = Number(process.env.FIRSTREAD_PORT || 4174);
server.listen(port, '127.0.0.1', () => console.log(`FIRSTREAD local server listening on http://127.0.0.1:${port}`));
