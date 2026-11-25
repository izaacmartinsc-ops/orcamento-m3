// Guarda o app no aparelho para funcionar sem internet.
// Ao mudar qualquer arquivo do app (menos precos.json), aumente a VERSAO.
const VERSAO = 'm3-orcamento-v7';
const ARQUIVOS = ['./', 'index.html', 'jspdf.umd.min.js', 'header.jpg', 'foto.jpg', 'precos.json', 'curvas.json',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // nuvem da equipe (Apps Script do Google): sempre direto na internet, nunca da cópia guardada
  if (/(^|\.)(script\.google\.com|googleusercontent\.com)$/.test(url.hostname)) return;
  // precos.json: tenta a internet primeiro (preço novo), senão usa a cópia guardada
  if (url.pathname.endsWith('/precos.json') || url.pathname.endsWith('/curvas.json')) {
    const nome = url.pathname.endsWith('/curvas.json') ? 'curvas.json' : 'precos.json';
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(k => k.put(nome, c)); return r; })
      .catch(() => caches.match(nome)));
    return;
  }
  // demais arquivos (e as fontes do Google): usa a cópia guardada e atualiza em segundo plano
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => {
    const rede = fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
      return r;
    }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
    return hit || rede;
  }));
});
