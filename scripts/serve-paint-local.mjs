import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { dev: { type: 'boolean' }, port: { type: 'string', short: 'p' } } });
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'frontend/out');
const port = Number(values.port || (values.dev ? '3000' : '3008'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port.');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
let app;
let handle;
if (values.dev) {
  const require = createRequire(resolve(root, 'frontend/package.json'));
  app = require('next')({ dev: true, dir: resolve(root, 'frontend'), hostname: '127.0.0.1', port });
  await app.prepare();
  handle = app.getRequestHandler();
}
async function sendFile(req, res, file) {
  const info = await stat(file);
  if (!info.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
  res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store' });
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/mario.sfc') {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
      return await sendFile(req, res, resolve(root, 'mario.sfc'));
    }
    if (handle) return await handle(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let file = resolve(output, `.${pathname}`);
    if (file !== output && !file.startsWith(output + sep)) { res.writeHead(403); return res.end(); }
    const info = await stat(file).catch(() => undefined);
    if (info?.isDirectory()) file = resolve(file, 'index.html');
    else if (!info && !extname(file)) file += '.html';
    await sendFile(req, res, file);
  } catch (error) {
    if (res.headersSent) return res.destroy();
    res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end(error.code === 'ENOENT' ? 'Not found' : 'Unable to serve this file');
  }
});
// The personal ROM is served separately from public/ and never enters an export.
server.listen(port, '127.0.0.1', () => console.log(`Local PixelMap: http://127.0.0.1:${port}/paint/955`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => { server.close(); await app?.close(); process.exit(0); });
}
