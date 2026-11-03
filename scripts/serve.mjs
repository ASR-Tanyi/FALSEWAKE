import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' };
export function serve(port = Number(process.env.PORT || 4173)) {
  return createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      // Test a GitHub Pages-style project path as well as local root hosting.
      if(path.startsWith('/FALSEWAKE/')) path = path.slice('/FALSEWAKE'.length);
      const file = resolve(root, `.${path.endsWith('/') ? path+'index.html' : path}`);
      if(!file.startsWith(root.endsWith(sep)?root:root+sep)) { res.writeHead(403).end(); return; }
      if(!(await stat(file)).isFile()) throw new Error('Not a file');
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(await readFile(file));
    } catch { res.writeHead(404, { 'Content-Type':'text/plain' }).end('Not found'); }
  }).listen(port, '127.0.0.1', () => console.log(`FALSEWAKE: http://127.0.0.1:${port}`));
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) serve();
