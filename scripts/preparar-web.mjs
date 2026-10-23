import fs from 'node:fs';
const caminho = 'dist/index.html';
let html = fs.readFileSync(caminho, 'utf8').replace('<html lang="en">', '<html lang="pt-BR">');
html = html.replace(
  '</head>',
  '<meta name="theme-color" content="#092D25"><meta name="description" content="Cabenna. Um lugar para suas ideias, tarefas e listas."><link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/icon-192.png"><style>html,body,#root{height:100%;margin:0}*{box-sizing:border-box}input:focus-visible,textarea:focus-visible,[role=button]:focus-visible,button:focus-visible{outline:3px solid #7EAE92;outline-offset:3px}body{background:#FAF8F3} @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style></head>',
);
html = html.replace(
  '</body>',
  `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}</script></body>`,
);
fs.writeFileSync(caminho, html);
for (const arquivo of fs.readdirSync('dist', { recursive: true })) {
  if (/\.(js|html)$/.test(arquivo)) {
    const texto = fs.readFileSync('dist/' + arquivo, 'utf8');
    if (/sb_secret_[A-Za-z0-9_-]+/.test(texto) || /SUPABASE_SERVICE_ROLE_KEY/.test(texto))
      throw new Error('Possível segredo no build.');
  }
}
console.log('Web preparada: idioma, PWA e conferência de segredos.');
