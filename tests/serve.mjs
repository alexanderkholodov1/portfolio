// Local static test harness with the plan's route precedence. This is not the
// Firebase emulator and does not prove actual Hosting header/rewrite behavior.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const types = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
async function existing(file) {
  try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); return await stat(file).then((s) => s.isFile() ? file : null); }
  catch { return null; }
}
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.'))) { response.writeHead(400).end(); return; }
    if (/^\/galaxy(?:\/|$)/.test(pathname)) {response.writeHead(302,{Location:/^\/galaxy\/screen(?:\/|$)/.test(pathname)?'/little-galaxy/screen':'/little-galaxy/'}).end();return;}
    let file = await existing(path.join(root, pathname));
    if (!file) file = await existing(path.join(root, `${pathname}.html`));
    if (!file) {
      if (/^\/little-galaxy(?:\/|$)/.test(pathname)) file = path.join(root, pathname.replace(/\/$/,'')==='/little-galaxy/admin'?'little-galaxy/admin.html':'little-galaxy/index.html');
      else file = path.join(root, '404.html');
    }
    // Both fallbacks model explicit content rewrites in the approved config.
    // This harness supplies no evidence about Hosting HTTP status or caching.
    response.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(await readFile(file));
  } catch { response.writeHead(500).end('Local fixture failed'); }
});
server.listen(4173, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
