// Primeiro incremento: sem cache de respostas privadas. Instalação PWA requer rede.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
