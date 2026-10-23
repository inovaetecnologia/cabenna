import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const raiz = resolve('dist');
const porta = Number(process.env.CABENNA_PREVIEW_PORT ?? 8081);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let arquivo = resolve(raiz, '.' + pathname);
    if (arquivo !== raiz && !arquivo.startsWith(raiz + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(arquivo)).isDirectory()) arquivo = resolve(arquivo, 'index.html');
    } catch {
      if (extname(arquivo)) {
        res.writeHead(404);
        res.end();
        return;
      }
      arquivo = resolve(raiz, pathname.startsWith('/app/') ? 'app/index.html' : 'index.html');
    }
    const dados = await readFile(arquivo);
    res.writeHead(200, {
      'Content-Type': mime[extname(arquivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(dados);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(porta, '0.0.0.0', () => console.log('Cabenna em http://localhost:' + porta));
